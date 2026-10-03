// lemo-watch：定时提醒。N 秒后以插件的名义发一条消息，叫 Claude 汇报进度（$.prompt.submit，asUser）。
// - 计时时横条和状态栏上有一颗「提醒」胶囊（$.lemo.badge，带结束时间，倒计时由画横条的 mod 画），到点或取消时去掉
// - 到点：横条提示、「完成」音效，再发消息。消息开头是 REMIND_MARK（⏰）加空格，
//   lemo-core 恢复旧会话重新编号时靠它跳过（对话记录里分不出消息是谁发的，只能看文字）
// - 统一面板「常用」页一张卡片：30 秒后提醒 / 取消，计时时说明显示剩余时间
// - /lemo-mod 提醒 [秒] / remind [sec]：最少 5 秒，默认 30
// 到点会替用户给 Claude 发消息（kind 'act'），但只在用户点了按钮、输入了命令以后才计时，
// 所以在「安全」页列为「手动触发」（manual），没有开关。装上时什么都不做

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { LemoWatchRemind } from '../types'
import { CAP_STR, STR } from './i18n'
import type { WatchStrings } from './i18n'
import { HUB, REMIND_MARK, cmdWord, fill, hubWrap, mmss, sec, steady, word } from './shared/lemo'
import type { Look } from './shared/lemo'

// ---- lemo-shared BEGIN: 由 scripts/sync-shared.mjs 从 shared/lemo-block.tsx 复制，不要在这里改 ----
// 下面这几个函数要用 $，所以不能放进 shared/lemo.tsx（校验规定 $ 只能传给同一个文件里定义的函数），
// 由 scripts/sync-shared.mjs 原样插进每个 mod 的 hooks/register.tsx。只在 shared/lemo-block.tsx 里改。
// 导入都起了 Lemo 开头的别名，免得和 mod 自己的导入重名。
import type { EngineInterface as LemoEngine } from 'claude-code'
import { visibleTabs as lemoVisibleTabs } from './shared/lemo'
import type { Look as LemoLook, Tab as LemoTabId } from './shared/lemo'

// lemo-core 的状态（校验规定：状态的引用要写在用它的文件里）。读它们会订阅，lemo-core 一改，读过的地方自动重画
const LemoStyleRef = { plugin: 'lemo-core', key: 'style' } as const
const LemoLangRef = { plugin: 'lemo-core', key: 'lang' } as const
const LemoThemeRef = { plugin: 'lemo-core', key: 'theme' } as const
const LemoDeskRef = { plugin: 'lemo-core', key: 'desk' } as const
const LemoTabRef = { plugin: 'lemo-core', key: 'tab' } as const
const LemoModsRef = { plugin: 'lemo-core', key: 'mods' } as const
const LemoSeqRef = { plugin: 'lemo-core', key: 'seq' } as const

/**
 * 画东西时要的风格和语言。读 lemo-core 的状态会订阅，lemo-core 一改自动重画；还没写过时用 $.lemo 兜底。
 * 面板（Pane）的 hook 要把 e.props 传进来：面板停在哪（placement）决定正文用什么颜色（见 shared/lemo.tsx 的 inkOf）
 */
async function look($: LemoEngine, pane?: { placement: 'dock' | 'inline' }): Promise<LemoLook> {
  const st = (await $.state.get(LemoStyleRef)).value ?? (await $.lemo.style({}))
  const lang = (await $.state.get(LemoLangRef)).value ?? (await $.lemo.lang({}))
  const theme = (await $.state.get(LemoThemeRef)).value ?? null
  const desk = (await $.state.get(LemoDeskRef)).value ?? null
  return { st, c: st.colors, lang, theme, desk, inline: pane?.placement === 'inline' }
}

/** 用户本人发了几条消息（T01、T02…） */
async function seqOf($: LemoEngine): Promise<number> {
  return (await $.state.get(LemoSeqRef)).value ?? 0
}

/** 统一面板现在显示哪一页：存的那页在这个界面上没有，就显示第一页 */
async function hubTab($: LemoEngine, surface: string): Promise<LemoTabId> {
  const stored = (await $.state.get(LemoTabRef)).value ?? 'main'
  const mods = (await $.state.get(LemoModsRef)).value
  // 还没有报到表（lemo-core 还没写过，或者测试里用的是假核心）：照存的那页
  if (mods === undefined) return stored
  const shown = lemoVisibleTabs(mods, surface)
  return shown.includes(stored) ? stored : shown[0] ?? 'behave'
}
// ---- lemo-shared END ----

const DEFAULT_SEC = 30
const MIN_SEC = 5
// 封顶一天：再长没有意义，而且计时器最多只能等 24.8 天（2^31 毫秒），超了会立刻触发
const MAX_SEC = 24 * 3600
// 胶囊的 id（lemo-core 按它替换、去掉）
const BADGE = 'watch'
// 过点多久以内还照常发提醒。mod 重新加载、关掉又打开、电脑睡醒时才会过点；
// 超过这么久就作废，横条上说一句「已过期」，免得突然冒出一条很久以前的提醒（和 lemo-pomodoro 一样）
const LATE_MS = 10 * 60_000

// 在等的提醒。放在会话状态里：热重载后还在，面板卡片读它会订阅，一改自动重画
const remind = atom({ plugin: 'lemo-watch', key: 'remind' } as const, null as LemoWatchRemind | null)
// lemo-core 每秒加一的计数。只在计时时读：读了卡片就每秒重画一次（倒计时走字），不计时不重画（桌面上少重画）
const FRAME = { plugin: 'lemo-core', key: 'frame' } as const

// 在等的计时器。热重载时模块变量清零，引擎也会取消旧的计时器，所以 session.start 里按会话状态重新挂上
let timer: Timer | null = null
// 取消一次（按「取消」、「全部关闭」）加一。到点那一下先把提醒清掉、再等几步才发：
// 这中间取消的话状态里已经看不到它了，发之前比一下到点时记下的数，变了就不发
let gen = 0

// 能力清单的一行（类型从 lemo-core 的合约里取）
type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]

// 安全页上的一行：「手动触发」，没有开关（on 总是 false）。不带风格味道（安全页要一眼看懂）
function watchCaps(): Cap[] {
  return [
    {
      mod: 'lemo-watch',
      id: 'remind',
      kind: 'act',
      manual: true,
      on: false,
      title: { zh: CAP_STR.zh.title, en: CAP_STR.en.title },
      desc: { zh: fill(CAP_STR.zh.desc, { n: DEFAULT_SEC }), en: fill(CAP_STR.en.desc, { n: DEFAULT_SEC }) },
    },
  ]
}

/** 一条文字：风格包里有「lemo-watch.键」就用风格的，没有用自己的默认文字 */
function txt(lk: Pick<Look, 'st' | 'lang'>, key: keyof WatchStrings): string {
  return word(lk, `lemo-watch.${key}`, STR[lk.lang][key])
}

/**
 * 挂计时器：每秒拿实际时间和到点时间 at 比一次，到了就发。
 * 不用一次性的 after(ms)：电脑睡眠时那种计时器停走，醒来胶囊已经是 00:00，提醒却还要再等（番茄钟也是每秒比）
 */
function arm($: EngineInterface, at: number) {
  timer?.cancel()
  timer = $.clock.every(1000, () => {
    void checkReminder($, at)
  })
}

async function checkReminder($: EngineInterface, at: number) {
  const now = await $.clock.now()
  if (now < at) return
  timer?.cancel()
  timer = null
  await fireReminder($, at, now - at > LATE_MS)
}

/** 定一个 secs 秒后的提醒；已经有一个在等就换掉 */
async function setReminder($: EngineInterface, secs: number, lk: Look) {
  const at = (await $.clock.now()) + secs * 1000
  await update($, remind, () => ({ at, sec: secs }))
  arm($, at)
  // 胶囊中英各给一份，lemo-meter 按当前语言画（计时中途换语言也跟着变）
  await $.lemo.badge({ id: BADGE, text: { zh: txt({ st: lk.st, lang: 'zh' }, 'badge'), en: txt({ st: lk.st, lang: 'en' }, 'badge') }, tone: 'accent', endsAt: at })
}

async function cancelReminder($: EngineInterface) {
  gen += 1
  timer?.cancel()
  timer = null
  await update($, remind, () => null)
  await $.lemo.badge({ id: BADGE, text: null, tone: 'accent' })
}

/** 到点：发提醒。late 为真（过点超过 10 分钟）时不发，只在横条上说一句已过期 */
async function fireReminder($: EngineInterface, at: number, late: boolean) {
  const g = gen
  // 对一下再清，在同一次写里完成：中途取消了、或者刚换了一个新的提醒，这个就作废，不能把新的也清掉
  let mine: LemoWatchRemind | null = null
  await update($, remind, (cur): LemoWatchRemind | null => {
    if (cur === null || cur.at !== at) return cur
    mine = cur
    return null
  })
  const fired = mine as LemoWatchRemind | null
  if (fired === null) return
  await $.lemo.badge({ id: BADGE, text: null, tone: 'accent' })
  const lk = await look($)
  if (late) {
    await $.lemo.notice({ text: txt(lk, 'expired'), tone: 'grey', ms: 10_000 })
    return
  }
  // asUser：去掉「The lemo-watch plugin sent a message」英文外框，来源仍然记作这个插件（lemo-core 不给它编号）。
  // 插件发的消息要等 Claude 空下来才进对话，一轮干活中间到点也不会打断。
  // 先发再提示：被别的 hook 拦下（drop）或发送出错时，不说「已发出」。
  // 到点以后、发之前取消了（「全部关闭」）：不发
  if (g !== gen) return
  const sent = await $.prompt
    .submit({ text: `${REMIND_MARK} ${fill(txt(lk, 'prompt'), { n: fired.sec })}`, asUser: true })
    .catch(() => null)
  if (sent === null || sent.drop !== undefined) return
  await $.lemo.notice({ text: txt(lk, 'sent'), tone: 'accent' })
  await $.lemo.play({ sound: 'done' })
}

// 热重载取消了旧的计时器，但提醒还在会话状态里：按到点时间重新挂上。
// 已经过了点的（mod 关了一阵又打开），下一秒按过点多久处理：10 分钟以内照常发，再久就作废、说一句已过期
async function resumeReminder($: EngineInterface) {
  const cur = await read($, remind)
  if (cur !== null) arm($, cur.at)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-watch',
      // 会放音效：没装 lemo-sound 时，lemo-core 在「行为」页给出开关
      uses: ['sound'],
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: ['main'],
      commands: { zh: [STR.zh.command], en: [STR.en.command] },
    })
    await resumeReminder($)
    return next(e)
  })

  // ---------- 安全页：能力清单。只有「手动触发」的一行，没有开关 ----------
  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...watchCaps()] }
  })

  on('lemo.toggle', async ($, e, next) => (e.mod === 'lemo-watch' ? { value: false } : next(e)))

  // 「全部关闭」：没有开关要关，但正在等的提醒一起取消，按了以后不会再替你发消息。
  // 取消出错也往下传：别的 mod 照样关
  on('lemo.off', async ($, e, next) => {
    // 不管状态里还有没有：到点正在发的那一下也作废
    gen += 1
    try {
      if ((await read($, remind)) !== null) await cancelReminder($)
    } catch {
      // 照样往下传
    }
    return next(e)
  })

  // /lemo-mod 提醒 [秒] / remind [sec]。不认的词交给里层（别的 mod，最后是 lemo-core）
  on('lemo.command', async ($, e, next) => {
    const { word: w, num } = cmdWord(e.args)
    if (w !== '提醒' && w !== 'remind') return next(e)
    // 命令里的词不换界面语言：回复用当前语言
    const lk = await look($)
    const secs = Math.min(MAX_SEC, Math.max(MIN_SEC, Math.round(num > 0 ? num : DEFAULT_SEC)))
    await setReminder($, secs, lk)
    return { value: { text: fill(txt(lk, 'set'), { n: secs }) } }
  })

  // 统一面板「常用」页：定时提醒卡片
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    if ((await hubTab($, e.surface)) !== 'main') return inner
    const lk = await look($, e.props)
    const cur = await read($, remind)
    if (cur !== null) await $.state.get(FRAME)
    const now = await $.clock.now()
    const el = $.ui.resolve(e)
    return hubWrap(el, lk, e.surface, inner, [
      {
        id: 'watch-remind',
        title: txt(lk, 'title'),
        desc: cur === null ? fill(txt(lk, 'desc'), { n: DEFAULT_SEC }) : fill(txt(lk, 'left'), { t: mmss(cur.at - now) }),
        buttons:
          cur === null ? (
            <Button key="watch-set" label={fill(txt(lk, 'btn'), { n: DEFAULT_SEC })} {...sec(e.surface)} onPress={() => setReminder($, DEFAULT_SEC, lk)} />
          ) : (
            <Button key="watch-cancel" label={txt(lk, 'cancel')} {...sec(e.surface)} onPress={() => cancelReminder($)} />
          ),
      },
    ])
  })
}
