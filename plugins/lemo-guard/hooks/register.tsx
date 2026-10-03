// lemo-guard：限时。一轮超过设定的时间就 $.turn.abort，停下这一轮。
// - 不拦强推，也不拦别的工具：拦工具就是替用户做权限决定，和用户自己的权限设置重叠（mod 不替用户做权限决定）；
//   工具说明里也不加话（那是往发给 Claude 的内容里加话）
// - 装上时是「不停」（off），要用户自己打开：安全页上一行（lemo.caps，kind 'act'），「行为」页一张卡片选时长，两处改的是同一个值。
//   选项存 $.store（所有会话共用，换个会话还在）
// - 只算 Claude 自己干活的时间：等用户确认、回答提问时暂停（见 tool.check 和 tool.call）

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { LemoGuardTimeout } from '../types'
import { STR } from './i18n'
import { HUB, fill, hubWrap, sec, steady, word } from './shared/lemo'

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

const TIMEOUTS: readonly LemoGuardTimeout[] = ['off', '30', '120', '300']
// 安全页上按「打开」时用的时限：三档里中间那档。30 秒太急，正常的一轮也会被停；已经选了别的时长就不动它
const ON_PICK: LemoGuardTimeout = '120'
// 安全页上这一行的 id（$.lemo.toggle 按 mod + id 找到它）
const CAP_ID = 'timeout'

// 「超时自动停」选过几次：面板读它只为订阅（一选就重画），选项本身存在 $.store
const picks = atom({ plugin: 'lemo-guard', key: 'picks' } as const, 0)

// 这一轮的超时计时器（每秒走一格）、它盯着的是哪一轮、已经算了多少毫秒
let abortTimer: { cancel: () => void } | null = null
let timerTurn: string | null = null
let spent = 0
// 正在等用户的工具调用（tool_use_id）：有它们在，计时停走。
// 引擎没有「确认框关了」的事件，只知道这条调用什么时候跑完，所以要确认的那条命令自己跑的时间也不算——宁可少算，不会错停
const waiting = new Set<string>()
// 这几个工具本身就是在等用户：提问、确认计划
const ASKS_USER: ReadonlySet<string> = new Set(['AskUserQuestion', 'ExitPlanMode'])

function asTimeout(v: unknown): LemoGuardTimeout {
  return TIMEOUTS.find(t => t === v) ?? 'off'
}

// 存在 $.store 里：所有会话共用，在一个会话里改了，别的会话下一轮也按新的来。没存过（刚装上）是 off
async function storedTimeout($: EngineInterface): Promise<LemoGuardTimeout> {
  try {
    return asTimeout(await $.store.get('timeout'))
  } catch {
    return 'off'
  }
}

// 「行为」页的卡片、安全页的开关、「全部关闭」都走这里，改的是同一个值
async function pickTimeout($: EngineInterface, value: string) {
  const t = asTimeout(value)
  // 关掉就马上不算了：这一轮已经在走的计时也停掉，免得按了「全部关闭」以后这一轮还被停下（先停，存不进去也停了）。
  // 改时长照旧从下一轮起算
  if (t === 'off') stopTimer()
  await $.store.set('timeout', t)
  await update($, picks, n => n + 1)
}

function stopTimer() {
  abortTimer?.cancel()
  abortTimer = null
  timerTurn = null
  spent = 0
  waiting.clear()
}

// 到点了：停掉这一轮，放「停下」音效（响不响看 lemo-core 的声音开关），横条出一条红色提示
async function stopTurn($: EngineInterface, id: string, t: LemoGuardTimeout) {
  if (timerTurn !== id) return
  stopTimer()
  try {
    await $.turn.abort({ turnId: id })
  } catch {
    // 这一轮已经结束了（abort 只认正在跑的那一轮）
    return
  }
  const lk = await look($)
  const S = STR[lk.lang]
  await $.lemo.play({ sound: 'deny' })
  await $.lemo.notice({ text: fill(word(lk, 'lemo-guard.abort', S.abort), { t: S.timeout.opts[t] }), tone: 'red', ms: 6000 })
}

// 安全页上的一行。文字不带风格味道（安全页要一眼看懂）；中英两份都给，安全页按界面语言挑。
// 说明里的时长：开着写现在的，关着写按「打开」以后的（ON_PICK）
async function guardCaps($: EngineInterface) {
  const t = await storedTimeout($)
  const shown = t === 'off' ? ON_PICK : t
  return [
    {
      mod: 'lemo-guard',
      id: CAP_ID,
      kind: 'act' as const,
      title: { zh: STR.zh.cap.title, en: STR.en.cap.title },
      desc: { zh: fill(STR.zh.cap.desc, { t: STR.zh.timeout.opts[shown] }), en: fill(STR.en.cap.desc, { t: STR.en.timeout.opts[shown] }) },
      on: t !== 'off',
    },
  ]
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-guard',
      // 到点停下一轮时会放音效：没装 lemo-sound 时，lemo-core 在「行为」页给出开关
      uses: ['sound'],
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: ['behave'],
      // 没有 always：限时会替用户停下一轮，不是只改画面，列在安全页上，有开关
    })
    return next(e)
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------
  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...(await guardCaps($))] }
  })

  // 「打开」：已经选了时长就照旧，没选过（不停）就设成中间那档；「关掉」设回不停。没有试听
  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-guard') return next(e)
    if (e.id !== CAP_ID || e.on === undefined) return { value: false }
    const cur = await storedTimeout($)
    await pickTimeout($, e.on ? (cur === 'off' ? ON_PICK : cur) : 'off')
    return { value: true }
  })

  on('lemo.off', async ($, e, next) => {
    try {
      await pickTimeout($, 'off')
    } catch {
      // 存不进去也要往下传：别的 mod 的开关照样关
    }
    return next(e)
  })

  // ---------- 超时自动停 ----------
  // 每一轮开始时按 $.store 里的选项计时；子 agent 的一轮没有 turn.start，不管。
  // 每秒走一格，有调用在等用户时不走（见下面两个 hook）
  on('turn.start', async ($, e, next) => {
    stopTimer()
    const t = await storedTimeout($)
    if (t !== 'off') {
      const id = e.turnId
      const limit = Number(t) * 1000
      timerTurn = id
      abortTimer = $.clock.every(1000, () => {
        if (waiting.size === 0) spent += 1000
        if (spent >= limit) void stopTurn($, id, t)
      })
    }
    return next(e)
  })

  // 权限判断要问用户（弹确认框）：这条调用跑完之前计时停走。只看、不改：判断结果原样交回去。
  // 自动模式下「问」交给分类器，几秒就定，也停走，宁可少算
  on('tool.check', async ($, e, next) => {
    const r = await next(e)
    if (r.decision === 'ask' && e.tool_use_id !== undefined && timerTurn !== null) waiting.add(e.tool_use_id)
    return r
  })

  // 每条工具调用跑完，从等用户的名单里去掉；提问、确认计划这两个工具整个都在等用户。
  // 不带 matcher（一个 mod 只能有一个）。只记时间，调用原样往下传
  on('tool.call', async ($, e, next) => {
    const id = e.tool_use_id
    if (id !== undefined && timerTurn !== null && ASKS_USER.has(e.tool)) waiting.add(id)
    try {
      return await next(e)
    } finally {
      if (id !== undefined) waiting.delete(id)
    }
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && e.turnId === timerTurn) stopTimer()
    return next(e)
  })

  // ---------- 统一面板「行为」页：超时自动停 ----------
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    // 手机上没有 Select：这张卡片整个不画（做不了的功能不显示）
    if (e.surface === 'mobile') return inner
    if ((await hubTab($, e.surface)) !== 'behave') return inner
    await read($, picks)
    const cur = await storedTimeout($)
    const lk = await look($, e.props)
    const S = STR[lk.lang]
    const el = $.ui.resolve(e)
    const { Box, Select } = el
    // 终端里画成一排按钮：下拉框的标签和当前值由引擎画、不带颜色（用终端自己的字色），
    // 面板停靠时底是主题画的，深色终端配浅色主题时看不见。按钮的颜色引擎会设好。桌面照旧用下拉框
    const options = e.surface === 'terminal' ? (
      <Box key="guard-pick" flexDirection="row" gap={1} flexWrap="wrap">
        {TIMEOUTS.map(v => (
          <Button
            key={`guard-pick-${v}`}
            label={S.timeout.opts[v]}
            {...(v === cur ? { variant: 'primary' as const } : sec(e.surface))}
            onPress={() => void pickTimeout($, v)}
          />
        ))}
      </Box>
    ) : null
    return hubWrap(el, lk, e.surface, inner, [
      {
        id: 'guard-timeout',
        title: word(lk, 'lemo-guard.timeoutTitle', S.timeout.title),
        desc: S.timeout.desc,
        extra: options ?? (
          <Select
            key="guard-pick"
            label={S.timeout.label}
            options={TIMEOUTS.map(v => ({ value: v, label: S.timeout.opts[v] }))}
            value={cur}
            onSelect={v => void pickTimeout($, v)}
          />
        ),
      },
    ])
  })
}
