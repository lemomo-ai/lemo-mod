// lemo-pomodoro：番茄钟。
// - 开始：统一面板「常用」页的卡片，或者 /lemo-mod 番茄 25
// - 计时时：横条和状态栏上一个倒计时胶囊（$.lemo.badge，剩余时间由 lemo-core / lemo-meter 按 endsAt 画）
// - 到点：横条提示、「完成」音效、朗读一句，再问接下来做什么——终端弹问题，桌面在横条下面出一行选择
// 只在用户点了「开始」、输入了命令以后才计时，在「安全」页列为「手动触发」（manual），没有开关。
// 响铃、朗读照旧走 $.lemo.play / $.lemo.say：响不响、念不念看 lemo-core 的「声音」「朗读」两个开关（装上时都关着）

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { LemoPomodoroKind, LemoPomodoroTimer } from '../types'
import { STR } from './i18n'
import { HUB, cmdWord, fill, hubWrap, inkOf, mmss, sec, steady, word } from './shared/lemo'

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
const LemoTurnNoRef = { plugin: 'lemo-core', key: 'turnNo' } as const

/**
 * 画东西时要的风格和语言。读 lemo-core 的状态会订阅，lemo-core 一改自动重画；还没写过时用 $.lemo 兜底。
 * 面板（Pane）的 hook 要把 e.props 传进来：面板停在哪（placement）决定正文用什么颜色（见 shared/lemo.tsx 的 inkOf），
 * 面板宽度（bodyColumns）决定卡片说明在哪断行（见 shared/lemo.tsx 的 card）
 */
async function look($: LemoEngine, pane?: { placement: 'dock' | 'inline'; bodyColumns?: number }): Promise<LemoLook> {
  const st = (await $.state.get(LemoStyleRef)).value ?? (await $.lemo.style({}))
  const lang = (await $.state.get(LemoLangRef)).value ?? (await $.lemo.lang({}))
  const theme = (await $.state.get(LemoThemeRef)).value ?? null
  const desk = (await $.state.get(LemoDeskRef)).value ?? null
  return { st, c: st.colors, lang, theme, desk, inline: pane?.placement === 'inline', ...(pane?.bodyColumns === undefined ? {} : { bodyColumns: pane.bodyColumns }) }
}

/** 用户本人发了几条消息（T01、T02…） */
async function seqOf($: LemoEngine): Promise<number> {
  return (await $.state.get(LemoSeqRef)).value ?? 0
}

/** 这一轮回的是第几条消息：提醒、助手交回、斜杠命令开头的一轮是 0（不写号）。lemo-core 还没写过时当作 seq */
async function turnNoOf($: LemoEngine): Promise<number> {
  return (await $.state.get(LemoTurnNoRef)).value ?? (await seqOf($))
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

const FOCUS_MIN = 25
const REST_MIN = 5
// 命令里给的分钟数最多 3 小时（太大的数显示和存储都会失真）
const MAX_MIN = 180
// 胶囊的 id：开始、改、去掉都用它
const BADGE = 'pomodoro'
// 过点多久以内还照常到点（提示、响铃、朗读、问接下来）。mod 重新加载、关掉又打开、电脑睡醒时才会过点；
// 超过这么久就作废，横条上说一句「已过期」，免得突然冒出一条很久以前的提醒（和 lemo-watch 一样）
const LATE_MS = 10 * 60_000

// 计时放在会话状态里：mod 热重载以后还在，卡片读它会订阅，开始、停止时自动重画
const timer = atom({ plugin: 'lemo-pomodoro', key: 'timer' } as const, null as LemoPomodoroTimer | null)
// 桌面上到点后，横条下面等用户选「再来 / 休息 / 先不用」
const choice = atom({ plugin: 'lemo-pomodoro', key: 'choice' } as const, null as LemoPomodoroKind | null)
// lemo-core 每秒加一：卡片上的剩余时间读它走字（只在计时时读，读了就每秒重画）
const CoreFrame = { plugin: 'lemo-core', key: 'frame' } as const

// 这个会话画在哪些界面上（终端、桌面……）。计时器到点时没有 e.surface，靠它决定用哪种方式问。
// 模块变量，热重载后清空；横条一重画就又记上了
const seen = new Set<string>()
// 每秒看一眼到点没有：只在计时时开着
let ticker: Timer | null = null
// 停一次（按「停止」、「全部关闭」）加一。到点那一下先把计时清掉、再等几步才问接下来：
// 这中间停掉的话状态里已经看不到它了，问之前、按回答重新计时之前比一下到点时记下的数，变了就不做
let gen = 0

// 能力清单的一行（类型从 lemo-core 的合约里取）
type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]

// 安全页上的一行：「手动触发」，没有开关（on 总是 false）。不带风格味道（安全页要一眼看懂）
function pomoCaps(): Cap[] {
  return [
    {
      mod: 'lemo-pomodoro',
      id: 'timer',
      kind: 'act',
      manual: true,
      on: false,
      title: { zh: STR.zh.cap.title, en: STR.en.cap.title },
      desc: { zh: fill(STR.zh.cap.desc, { n: FOCUS_MIN }), en: fill(STR.en.cap.desc, { n: FOCUS_MIN }) },
    },
  ]
}

function watch($: EngineInterface) {
  ticker?.cancel()
  ticker = $.clock.every(1000, () => {
    void tick($)
  })
}

function unwatch() {
  ticker?.cancel()
  ticker = null
}

async function startTimer($: EngineInterface, kind: LemoPomodoroKind, minutes: number) {
  const end = (await $.clock.now()) + minutes * 60_000
  await update($, choice, () => null)
  await update($, timer, () => ({ end, kind }))
  // 胶囊中英各给一份，lemo-meter 按当前语言画（计时中途换语言也跟着变）
  await $.lemo.badge({ id: BADGE, text: { zh: STR.zh.badge[kind], en: STR.en.badge[kind] }, tone: 'accent', endsAt: end })
  watch($)
}

async function stopTimer($: EngineInterface) {
  gen += 1
  unwatch()
  await update($, timer, () => null)
  await update($, choice, () => null)
  await $.lemo.badge({ id: BADGE, text: null, tone: 'accent' })
}

async function tick($: EngineInterface) {
  const g = gen
  const t = await read($, timer)
  if (t === null) {
    unwatch()
    return
  }
  const now = await $.clock.now()
  if (now < t.end) return
  // 只认这一次计时：两次检查之间别处刚停止或重新开始了，就不算到点
  let ended = null as LemoPomodoroTimer | null
  await update($, timer, cur => {
    ended = cur !== null && cur.end === t.end ? cur : null
    return ended === null ? cur : null
  })
  if (ended === null) return
  unwatch()
  const kind = ended.kind
  const lk = await look($)
  const S = STR[lk.lang]
  await $.lemo.badge({ id: BADGE, text: null, tone: 'accent' })
  if (now - ended.end > LATE_MS) {
    await $.lemo.notice({ text: S.expired, tone: 'grey', ms: 10_000 })
    return
  }
  if (g !== gen) return
  const text = kind === 'rest' ? word(lk, 'lemo-pomodoro.restDone', S.restDone) : word(lk, 'lemo-pomodoro.done', S.done)
  await $.lemo.notice({ text, tone: 'accent', ms: 10_000 })
  await $.lemo.play({ sound: 'done' })
  await $.lemo.say({ text })
  // 桌面上插件弹的问题回答完以后会一直转圈，要按停止才消失，所以桌面上不弹，
  // 改成输入框上方的横条下面出现一行「接下来？」和三个按钮（放在面板里不显眼）；终端照常弹
  const isDesk = await onDesktop($)
  if (g !== gen) return
  if (isDesk) {
    await update($, choice, () => kind)
  } else {
    // 问题等用户回答，可能很久：放到计时器外面去等
    $.clock.after(0, () => {
      void askNext($, kind, g)
    })
  }
}

// 这个会话画在桌面上吗。热重载后横条还没重画过（seen 是空的），就问引擎这个会话画在哪些界面上
async function onDesktop($: EngineInterface): Promise<boolean> {
  if (seen.size > 0) return seen.has('desktop')
  try {
    return (await $.session.surfaces()).includes('desktop')
  } catch {
    return false
  }
}

// 终端：番茄钟到点，mod 自己弹出一个问题（$.ui.ask），按回答接着计时
// g 是到点时记下的数：问之前、按回答重新计时之前停掉过（「全部关闭」），就不问、不再计时
async function askNext($: EngineInterface, kind: LemoPomodoroKind, g: number) {
  const lk = await look($)
  const a = STR[lk.lang].ask
  const again = fill(a.again, { n: FOCUS_MIN })
  const rest = fill(a.rest, { n: REST_MIN })
  try {
    if (g !== gen) return
    const pick = await $.ui.ask(kind === 'rest' ? a.qRest : a.q, { options: [again, rest, a.stop], header: a.header })
    if (g !== gen) return
    if (pick === again) await startTimer($, 'focus', FOCUS_MIN)
    else if (pick === rest) await startTimer($, 'rest', REST_MIN)
  } catch {
    // 用户按 Esc 关掉了，或者没有界面（claude -p）
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-pomodoro',
      // 会放音效、会朗读：没装 lemo-sound、lemo-voice 时，lemo-core 在「行为」页给出开关
      uses: ['sound', 'speech'],
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: ['main'],
      // 没有 always：到点问接下来做什么，只在用户自己开了番茄钟以后，列在安全页「手动触发」里
      commands: { zh: ['番茄 25'], en: ['focus 25'] },
    })
    // 热重载、恢复会话时计时还在状态里：接着每秒看（watch 会先停掉旧的，热重载后旧的那个已经失效）。
    // 已经过了点的，下一秒的 tick 按过点多久处理：10 分钟以内照常到点，再久就作废
    if ((await read($, timer)) !== null) watch($)
    return next(e)
  })

  // ---------- 安全页：能力清单。只有「手动触发」的一行，没有开关 ----------
  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...pomoCaps()] }
  })

  on('lemo.toggle', async ($, e, next) => (e.mod === 'lemo-pomodoro' ? { value: false } : next(e)))

  // 「全部关闭」：没有开关要关，但正在走的番茄钟一起停掉，按了以后到点不会再弹选择。
  // 停的时候出错也往下传：别的 mod 照样关
  on('lemo.off', async ($, e, next) => {
    // 不管状态里还有没有：到点正在问的那一下也作废
    gen += 1
    try {
      if ((await read($, timer)) !== null || (await read($, choice)) !== null) await stopTimer($)
    } catch {
      // 照样往下传
    }
    return next(e)
  })

  // ---------- 命令：/lemo-mod 番茄 25 ----------
  on('lemo.command', async ($, e, next) => {
    const { word: w, num } = cmdWord(e.args)
    if (w !== '番茄' && w !== 'focus' && w !== 'pomodoro') return next(e)
    // 命令里的词不换界面语言：回复用当前语言
    const lang = await $.lemo.lang({})
    const minutes = num > 0 ? Math.min(num, MAX_MIN) : FOCUS_MIN
    await startTimer($, 'focus', minutes)
    return { value: { text: fill(STR[lang].cmd.start, { n: minutes }) } }
  })

  // ---------- 输入框上方的横条：记下画在哪些界面；桌面上到点后在横条下面出选择 ----------
  // 横条本身是 lemo-meter 画的。这里只在它下面接一行，不改它；谁在外层不一定，lemo-meter 那边也会把这一行接在横条下面
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    seen.add(e.surface)
    const inner = await next(e)
    // 终端不读状态：到点时弹问题，横条上不用加东西，也就不用跟着重画
    if (e.surface !== 'desktop' || e.props.hasSurvey) return inner
    const pending = await read($, choice)
    if (pending === null) return inner
    const lk = await look($)
    const a = STR[lk.lang].ask
    const { Box, Text, Button } = $.ui.resolve(e)
    // 选了就消失：开始新的计时会清掉 choice，「暂不」直接清掉
    const row = (
      <Box key="pomo-choice" flexDirection="row" gap={1} alignItems="center" flexWrap="wrap" paddingX={2}>
        <Text bold {...inkOf(lk, e.surface)}>{pending === 'rest' ? a.qRest : a.q}</Text>
        <Button key="pomo-again" label={fill(a.again, { n: FOCUS_MIN })} variant="primary" onPress={() => startTimer($, 'focus', FOCUS_MIN)} />
        <Button key="pomo-rest" label={fill(a.rest, { n: REST_MIN })} {...sec(e.surface)} onPress={() => startTimer($, 'rest', REST_MIN)} />
        <Button key="pomo-skip" label={a.stop} {...sec(e.surface)} onPress={() => update($, choice, () => null)} />
      </Box>
    )
    // 桌面上横条的 SVG 不给 width、外面包一层竖排 Box 才会横向拉满（单独放只有约 280 像素）。
    // 所以接选择行的这层也是铺满宽度的竖排。但里层是引擎自己的那份时（没装 lemo-meter，没人画横条），
    // 引擎不许它放在带 width 的 Box 里，会拒绝整棵树、只画它自己的（测试里试过），这时外层不给 width
    const bare = inner.type === 'engine'
    return (
      <Box flexDirection="column" {...(bare ? {} : { width: '100%' })} gap={1}>
        {inner}
        {row}
      </Box>
    )
  })

  // ---------- 统一面板「常用」页：番茄钟卡片 ----------
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    if ((await hubTab($, e.surface)) !== 'main') return inner
    const lk = await look($, e.props)
    const S = STR[lk.lang]
    const t = await read($, timer)
    let desc = fill(S.card.desc, { n: FOCUS_MIN })
    if (t !== null) {
      // 倒计时走字：只在计时时读 frame，平时不每秒重画
      await $.state.get(CoreFrame)
      desc = fill(t.kind === 'rest' ? S.card.restLeft : S.card.left, { t: mmss(t.end - (await $.clock.now())) })
    }
    const el = $.ui.resolve(e)
    return hubWrap(el, lk, e.surface, inner, [
      {
        id: 'pomo-main',
        title: word(lk, 'lemo-pomodoro.title', S.title),
        desc,
        buttons:
          t === null ? (
            <Button key="pomo-start" label={fill(S.card.start, { n: FOCUS_MIN })} {...sec(e.surface)} onPress={() => startTimer($, 'focus', FOCUS_MIN)} />
          ) : (
            <Button key="pomo-stop" label={S.card.stop} {...sec(e.surface)} onPress={() => stopTimer($)} />
          ),
      },
    ])
  })
}
