// lemo-skin：把 Claude Code 自己画的那些行换成风格的样子，并显示消息编号。
// - 你的消息前加编号 T01、T02…（后面带 lemo-journal 贴的标签），Claude 每段回复上面加「回复 T03」抬头
// - 工具行、折叠的工具组：开始时间、动词、对象、状态
// - 耗时行、工具进度行、启动提示、输入框下的提示行、模式标签（终端为主，桌面上能换的才换）
// - 调用 skill 时横条提示，提示音开着时响一声（告诉 Claude「T01 是第几条消息」的那段系统提示词在 lemo-core 里，安全页的开关，默认关）
// - 面板「行为」页：「展开工具行」开关
// - 安全页：「消息样式」一行外观，装上就开，有开关；关了以后上面这些行都照 Claude Code 原样画
//   （「展开工具行」是另一个开关，只在这个会话、只改画面，不列进安全页）
// - 你输入的斜杠命令（/lemo-mod……）不编号：lemo-core 不给它们号，桌面上它们也画成一条「你的消息」，按原文对号会借上别的号
// 编号、回复号、耗时行号都由 lemo-core 记（numbers、replies、turnRows、seq、tags），这里只读不数。

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren } from 'claude-code'

import { STR, plural } from './i18n'
import {
  HUB, NOT_PERSON, REMIND_MARK, bareInk, clip, exp, fill, fmtDur, hhmm, hubWrap, replyKey, sec, spineColor, steady, width, word,
} from './shared/lemo'
import type { Core } from './shared/lemo'

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

// lemo-core 的状态（校验规定：引用写在用它的文件里）。读了就订阅，lemo-core 一改，读过的地方自动重画
const NumbersRef = { plugin: 'lemo-core', key: 'numbers' } as const
const RepliesRef = { plugin: 'lemo-core', key: 'replies' } as const
const TurnRowsRef = { plugin: 'lemo-core', key: 'turnRows' } as const
const TagsRef = { plugin: 'lemo-core', key: 'tags' } as const
const FrameRef = { plugin: 'lemo-core', key: 'frame' } as const

// 「展开工具行」开关：存在 lemo-core 里（lemo-lot 画抽签卡片时也要看它），只记在这个会话里
const UnfoldRef = { plugin: 'lemo-core', key: 'unfold' } as const

async function isUnfolded($: EngineInterface): Promise<boolean> {
  return (await $.state.get(UnfoldRef)).value === true
}

// 别的 lemo mod 给 Claude 加的工具（mcp__lemo-lot__draw_lot……）：由各自的 mod 画，这里不数、不换皮
const LEMO_TOOL = 'mcp__lemo-'

// 「消息样式」开关：外观，装上就开。存进 $.store（键 look，全局记住），开会话时读回来；每处画法都读它，一改全部重画
const lookOn = atom({ plugin: 'lemo-skin', key: 'lookOn' } as const, true)

type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]
type Numbers = Core['numbers']
type TurnRow = Core['turnRows'][string]
type Kept = Awaited<ReturnType<EngineInterface['lemo']['recall']>>
const NO_NUMBERS: Numbers = { ids: {}, texts: {} }

// 对话记录里已经画好的行：编号、标签都齐了就记在这里，下次重画不再读编号表和标签表。
// 读一次就订阅一次：不再读，别的消息加编号、贴标签时就不会带着它一起重画。mod 重载后清空，第一次画时重新读
const userDone = new Map<string, { n: number; tag: string | null }>()
const replyDone = new Map<string, number>()
const turnDone = new Map<string, TurnRow>()
// 耗时行没有记录时（恢复的旧会话），只能在第一次画出来时记下当时的编号
// lemo-core 的 seq 的镜像：画的时候拿来比大小，不订阅。在 session.start、session.append 里更新
let seqNow = 0
// 每次工具调用的开始时间（tool.call 时记下），工具行前面显示
const startedAt = new Map<string, number>()
// 同一句话发过不止一次的旧消息：按画出来的先后记下各条的 requestId（见 findNo）
const dupSeen = new Map<string, readonly string[]>()
// 按 id 问过 lemo-core 存下来的号（$.lemo.recall）的行，没有的也记下：正在写的回复每来一段字都重画，不用每次都问
const recalled = new Map<string, Kept | null>()
// 判过是不是斜杠命令的消息（按 requestId），判过一次就不再问命令表
const cmdRows = new Map<string, boolean>()
// 展开的工具组里的调用（按 tool_use_id）：展开组的输出画在 ToolUse 行里，有输出时这一行交回引擎原样，
// 不然输出就被这一行盖掉了。工具组先画、再画它展开成的各行，所以在工具组的 hook 里记
const unfoldedCalls = new Set<string>()
// Bash 命令、WebFetch 网址整条显示（放不下就换行），不截：自动放行的调用，用户靠这一行事后核对 Claude 跑了什么、访问了哪
const FULL_TARGET: ReadonlySet<string> = new Set(['Bash', 'WebFetch'])

// 斜杠命令的样子：开头是「/名字」，名字里没有别的斜杠（/Users/me/… 这种路径不算），后面是空白或结束
const SLASH = /^\/([A-Za-z][\w:.-]*)(?=\s|$)/


// 先按消息 id 找，再按文字找；桌面上消息的文字和对话记录里的不完全一样，最后按包含关系找。
// 恢复的旧会话里同一句话发过不止一次（lemo-core 按先后记在 dupes 里）：对话记录从上往下画，第几次画到这句话就是第几个号；
// 多出来的（又发了一次、还没登记的新消息）先不编号，登记以后按 id 对上
function findNo(m: Numbers, id: string, text: string): number | undefined {
  const t = text.trim()
  const byId = m.ids[id]
  if (byId !== undefined) return byId
  const same = m.dupes?.[t]
  if (same !== undefined) {
    const seen = dupSeen.get(t) ?? []
    const all = seen.includes(id) ? seen : [...seen, id]
    dupSeen.set(t, all)
    return same[all.indexOf(id)]
  }
  const hit = m.texts[t]
  if (hit !== undefined || t.length < 4) return hit
  const entries = Object.entries(m.texts)
  for (let i = entries.length - 1; i >= 0; i--) {
    const [k, n] = entries[i] ?? ['', 0]
    if (k.length >= 4 && (k.includes(t) || t.includes(k))) return n
  }
  return undefined
}

// 工具行里显示的对象：文件路径、命令、检索词、网址
function target(tool: string, input: unknown): string {
  const o = (input ?? {}) as Record<string, unknown>
  const pick = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '')
  switch (tool) {
    case 'Read':
      return pick('file_path').replace(/^.*\/(?=[^/]+\/[^/]+$)/, '…/')
    case 'Bash':
      return pick('command')
    case 'Grep':
    case 'Glob':
      return pick('pattern')
    case 'WebFetch':
      return pick('url').replace(/^https?:\/\//, '')
    case 'WebSearch':
      return pick('query')
    default:
      return ''
  }
}

// 里层画的是不是引擎原样（{ type: 'engine' }），而不是别的 mod 画的
function isEngineDrawing(x: unknown): boolean {
  return typeof x === 'object' && x !== null && (x as { type?: unknown }).type === 'engine'
}

// 恢复的旧会话：按对话记录里的 id 找 lemo-core 存下来的号，每行只问一次
async function recallOnce($: EngineInterface, id: string): Promise<Kept> {
  const hit = recalled.get(id)
  if (hit !== undefined) return hit
  const k = await $.lemo.recall({ id })
  recalled.set(id, k)
  if (recalled.size > 2000) {
    const oldest = recalled.keys().next().value
    if (oldest !== undefined) recalled.delete(oldest)
  }
  return k
}

/**
 * 这条「你的消息」是不是你输入的斜杠命令（/lemo-mod、/compact……）。lemo-core 不给斜杠命令编号；
 * 桌面上命令也画成一条「你的消息」，按原文对号会借上别的消息的号（出现两条「T14 · /lemo-mod」），
 * 所以认出来就不编号，和终端一样。样子像命令时再拿这个会话能用的命令表核对一遍（「/tmp 下面有什么」不算命令）；
 * 读不到命令表就按样子算
 */
async function isSlashCommand($: EngineInterface, id: string, text: string): Promise<boolean> {
  const name = SLASH.exec(text.trim())?.[1]
  if (name === undefined) return false
  const hit = cmdRows.get(id)
  if (hit !== undefined) return hit
  let yes = true
  try {
    // 插件的命令可能带着插件名（lemo-core:lemo-mod），用户输入的是后半截
    const names = (await $.command.list()).map(c => c.name)
    yes = names.some(n => n === name || n.endsWith(`:${name}`))
  } catch {
    // 读不到命令表
  }
  cmdRows.set(id, yes)
  if (cmdRows.size > 2000) {
    const oldest = cmdRows.keys().next().value
    if (oldest !== undefined) cmdRows.delete(oldest)
  }
  return yes
}

// 安全页上「消息样式」开着吗。读了就订阅：在安全页上一关，画过的行都重画成原样
async function isStyled($: EngineInterface): Promise<boolean> {
  return read($, lookOn)
}

async function toggleUnfold($: EngineInterface) {
  await $.lemo.set({ unfold: !(await isUnfolded($)) })
}

export const register: Register = on => {
  // ---------- 报到 ----------
  on('session.start', async ($, e, next) => {
    // 耗时行、工具进度行、启动提示只有终端有：只在终端会话里列出来。
    // e.surface 是会话开始时画在哪：终端是 terminal，桌面（走 SDK）开始时还没有界面，是 null
    const hasTerminal = e.surface === 'terminal'
    await $.lemo.join({
      mod: 'lemo-skin',
      // 会放音效：没装 lemo-sound 时，lemo-core 在「行为」页给出开关
      uses: ['sound'],
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: ['behave'],
      always: {
        zh: [...STR.zh.always.common, ...(hasTerminal ? STR.zh.always.terminal : [])],
        en: [...STR.en.always.common, ...(hasTerminal ? STR.en.always.terminal : [])],
      },
    })
    // 读回存下来的「消息样式」开关；没存过（或读不到存档）照默认：开
    try {
      const saved = await $.store.get('look')
      if (typeof saved === 'boolean') await update($, lookOn, () => saved)
    } catch {
      // 读不到存档
    }
    const r = await next(e)
    // lemo-core 恢复旧会话的编号也在 session.start 里做，等它做完再读
    seqNow = await seqOf($)
    return r
  })

  // 用户发出一条消息：lemo-core 在这里定号，定完把镜像更新一下（不管谁在外层，next 回来时号都定好了）
  on('session.append', { door: 'prompt' }, async ($, e, next) => {
    const r = await next(e)
    seqNow = await seqOf($)
    return r
  })

  // 记下每次工具调用的开始时间，工具行前面显示。只记时间，不改调用（音效归 lemo-sound）
  on('tool.call', async ($, e, next) => {
    startedAt.set(e.tool_use_id, await $.clock.now())
    // 只留最近的 500 次
    if (startedAt.size > 500) {
      const oldest = startedAt.keys().next().value
      if (oldest !== undefined) startedAt.delete(oldest)
    }
    return next(e)
  })

  // skill 展开（skill.prompt）：调用任何 skill 时响一声、横条提示，内容原样不动。
  // 声音走 $.lemo.play：提示音开关归 lemo-core，装上时是关的，关着就不响
  on('skill.prompt', async ($, e, next) => {
    const r = await next(e)
    // 安全页上关了「消息样式」就不响、不提示
    if (!(await isStyled($))) return r
    const lk = await look($)
    await $.lemo.play({ sound: 'tick', gain: 0.7 })
    await $.lemo.notice({ text: fill(word(lk, 'lemo-skin.skill', STR[lk.lang].skill), { name: e.skill }), tone: 'accent' })
    return r
  })

  // ---------- 统一面板「行为」页：展开工具行 ----------
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    if ((await hubTab($, e.surface)) !== 'behave') return inner
    const lk = await look($, e.props)
    const S = STR[lk.lang]
    const isOn = await isUnfolded($)
    const el = $.ui.resolve(e)
    return hubWrap(el, lk, e.surface, inner, [
      {
        // 卡片的 key 和按钮的 key 不能一样，不然按 key 找按钮会先找到卡片
        id: 'skin-unfold-card',
        title: S.unfold.title,
        desc: S.unfold.desc,
        buttons: <Button key="skin-unfold" label={isOn ? S.unfold.on : S.unfold.off} {...sec(e.surface)} onPress={() => toggleUnfold($)} />,
      },
    ])
  })

  // ---------- 你的消息：前面加编号 ----------
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const o = e.props.origin
    // 插件自己发的消息（比如提醒）挂在「Prompt from … plugin」标签下，这一行不经过这个 hook，换不了皮。
    // isExpanded 只在终端有意义（ctrl+o 展开）；桌面没有 ctrl+o，每条消息都算展开，不能因此跳过
    // 提醒（lemo-watch 发的，⏰ 开头）也不编号：恢复的旧会话、桌面上它的来源不一定是 plugin，
    // 按原文又会对上更早一次提醒的号（挂上旧编号）。终端上插件发的消息本来就不编号
    if ((e.surface === 'terminal' && e.props.isExpanded) || NOT_PERSON.has(o.kind) || e.props.text.trim().startsWith(REMIND_MARK)) return next(e)
    if (!(await isStyled($))) return next(e)
    // 你输入的斜杠命令不编号（见 isSlashCommand）。桌面上按原文对号会借上别的号；终端本来就不编号，两边一样
    if (await isSlashCommand($, e.requestId, e.props.text)) return next(e)
    let hit = userDone.get(e.requestId)
    if (hit === undefined) {
      const m = (await $.state.get(NumbersRef)).value ?? NO_NUMBERS
      // 恢复的旧会话：会话状态里没有它的 id，按 id 找 lemo-core 存下来的号，找不到再按原文对
      const kept = m.ids[e.requestId] === undefined ? (await recallOnce($, e.requestId))?.u : undefined
      const n = kept ?? findNo(m, e.requestId, e.props.text)
      // 记号之前就有的消息（比如恢复的旧会话）对不上就不编号，免得编错
      if (n === undefined) return next(e)
      const tag = ((await $.state.get(TagsRef)).value ?? {})[String(n)] ?? null
      hit = { n, tag }
      // 只记精确对上的：桌面先画消息、后登记编号，这时按包含关系找可能先对上一条更早的相似消息
      // （比如「…只跑这一条」会被标成上一条「…只跑这一条，结果用一句话告诉我」的号），等登记完重画就对了
      const exact = kept !== undefined || m.ids[e.requestId] !== undefined || m.texts[e.props.text.trim()] !== undefined
      // 标签到了，或者已经不是最新一条（分类早做完或失败了，或者根本没装 lemo-journal），以后就不再等
      if (exact && (tag !== null || n < seqNow)) userDone.set(e.requestId, hit)
    }
    const { n, tag } = hit
    const lk = await look($)
    const S = STR[lk.lang]
    const kind = tag === null ? null : S.kinds[tag] ?? tag
    // 桌面保留原生气泡，只在文字前加编号和标签
    if (e.surface !== 'terminal') {
      return next({ ...e, props: { ...e.props, text: `${exp(n)}${kind === null ? '' : ` · ${kind}`} · ${e.props.text}` } })
    }
    const { Box, Text } = $.ui.resolve(e)
    // 编号、标签、竖线不许被挤窄：消息一长，它们会被折成两行（「[排查」和「]」分开）
    // 最左边一列强调色竖条，和面板卡片一样，消息折成几行它就拉多高。
    // 上面空一行：引擎原来画的消息自己带这一行空行，换掉以后没了，上一轮的耗时行（黄底）和这一行的竖条连成一片
    return (
      <Box flexDirection="row" gap={1} marginTop={1}>
        <Box key="skin-spine" width={1} flexShrink={0} backgroundColor={spineColor(lk)} />
        <Box flexDirection="row" gap={1} flexShrink={0}>
          <Text color={lk.c.ink} bold>{exp(n)}</Text>
          {kind === null ? null : <Text color={lk.c.pencil}>{`[${kind}]`}</Text>}
          <Text color={lk.c.grid}>┊</Text>
        </Box>
        <Box flexShrink={1}>
          {/* 这一行直接画在终端底色上（换掉原生画法后没有主题的底色），用终端自己的前景色：深色终端配浅色主题时主题正文色是黑的 */}
          <Text {...bareInk(lk, e.surface)} bold>{e.props.text}</Text>
        </Box>
      </Box>
    )
  })

  // ---------- Claude 的回复：每段回复上面加「回复 T03」小标签，正文还是引擎自己画（保留 Markdown 排版） ----------
  // 每段回复都挂（一轮里被工具调用隔开的每一段，各有一个开头）
  // 桌面上不看 isFirstOfReply：先调了工具的那一轮（比如抽签），工具后面的回复它是 false，标签挂不上。
  // 桌面不画回复开头的圆点，每段回复都是单独一段字，都挂
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if ((!e.props.isFirstOfReply && e.surface === 'terminal') || !(await isStyled($))) return next(e)
    let n = replyDone.get(e.requestId)
    if (n === undefined) {
      const m = (await $.state.get(RepliesRef)).value ?? NO_NUMBERS
      // 恢复的旧会话先按 id 找 lemo-core 存下来的号，再按原文对
      n = m.ids[e.requestId] ?? (await recallOnce($, e.requestId))?.r ?? m.texts[replyKey(e.props.text)]
      if (n !== undefined) replyDone.set(e.requestId, n)
    }
    const lk = await look($)
    const S = STR[lk.lang]
    const label = n === undefined ? word(lk, 'lemo-skin.replyBare', S.replyBare) : fill(word(lk, 'lemo-skin.reply', S.reply), { no: exp(n), n })
    const drawn = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Text backgroundColor={lk.c.accent} color={lk.c.onAccent} bold>{label}</Text>
        </Box>
        {drawn}
      </Box>
    )
  })

  // ---------- 工具进度（只有终端有）：命令跑了几秒后出现的「ctrl+b 放到后台」那一行，换成会转的进度 ----------
  on('ui.render', { component: 'ToolProgress' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.kind !== 'background_hint' || !(await isStyled($))) return next(e)
    const lk = await look($)
    const S = STR[lk.lang]
    // 读 lemo-core 的 frame：每秒重画一次，转圈、走秒
    const f = (await $.state.get(FrameRef)).value ?? 0
    const at = startedAt.get(e.props.tool_use_id)
    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1}>
        <Text color={lk.c.ink}>{f % 2 === 0 ? '◐' : '◑'}</Text>
        <Text color={lk.c.ink} bold>{word(lk, 'lemo-skin.running', S.running)}</Text>
        {at === undefined ? null : <Text color={lk.c.pencil}>{fmtDur(now - at)}</Text>}
        <Text color={lk.c.grid}>{'· ' + S.bgHint}</Text>
      </Box>
    )
  })

  // ---------- 启动提示（只有终端有）：logo 下面那几行灰字，前面加一个小标签 ----------
  on('ui.render', { component: 'InfoNotice' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || !(await isStyled($))) return next(e)
    const lk = await look($)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1}>
        <Text backgroundColor={lk.c.accent} color={lk.c.onAccent}>{` ${word(lk, 'lemo-skin.info', STR[lk.lang].info)} `}</Text>
        <Text color={lk.c.pencil}>{e.props.text}</Text>
        {e.props.command === null || e.props.text.includes(e.props.command) ? null : <Text color={lk.c.ink}>{e.props.command}</Text>}
      </Box>
    )
  })

  // ---------- 模式标签：输入框右下角那几个灰字（focus、memory paused），只加自己的开关 ----------
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (!(await isUnfolded($))) return next(e)
    const lk = await look($)
    return next({ ...e, props: { ...e.props, modes: [...e.props.modes, STR[lk.lang].unfold.mode] } })
  })

  // ---------- 输入框下的提示行：末尾加「风格名 /lemo-mod」 ----------
  // tail 只有终端画（桌面还不画），桌面上原样
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.isWorking || e.props.isDraft || !(await isStyled($))) return next(e)
    const lk = await look($)
    // 风格没有标题（素色）时只写命令，不写成「lemo-mod /lemo-mod」
    const title = word(lk, 'lemo-core.title', '')
    return next({ ...e, props: { ...e.props, tail: title === '' ? '/lemo-mod' : `${title} /lemo-mod` } })
  })

  // ---------- 耗时行（只有终端有）：编号、用时，再加上这一轮几步、几次工具（lemo-core 数的） ----------
  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    if (!(await isStyled($))) return next(e)
    let rec = turnDone.get(e.requestId)
    if (rec === undefined) {
      rec = ((await $.state.get(TurnRowsRef)).value ?? {})[e.requestId]
      if (rec === undefined) {
        // 恢复的旧会话：按耗时行的 id 找 lemo-core 存下来的（--fork-session 另开的一份 id 也不变）
        const t = (await recallOnce($, e.requestId))?.t
        if (t !== undefined) rec = { n: t[0], steps: t[1], tools: t[2] }
      }
      if (rec !== undefined) turnDone.set(e.requestId, rec)
    }
    const lk = await look($)
    const S = STR[lk.lang]
    // 还是没记录的（没存过号的旧会话恢复时）不写编号：按画出来时的编号算，几行旧的会都写成同一个号或 T00。
    // 正在进行的会话里，记录晚一步写进来也没关系：读了 turnRows 就订阅了，写进来以后会重画
    const label = rec === undefined
      ? fill(word(lk, 'lemo-skin.turnDone', S.turnDone), { no: '', n: '' }).replace(/ {2,}/g, ' ')
      : fill(word(lk, 'lemo-skin.turnDone', S.turnDone), { no: exp(rec.n), n: rec.n })
    const stats = rec === undefined ? null : `${fill(plural(S.steps, rec.steps), { n: rec.steps })} · ${fill(plural(S.tools, rec.tools), { n: rec.tools })}`
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row">
        <Text backgroundColor={lk.c.accent} color={lk.c.onAccent} bold>{label}</Text>
        <Text color={lk.c.pencil}>{` · ${fmtDur(e.props.durationMs)}`}</Text>
        {stats === null ? null : <Text color={lk.c.pencil}>{` · ${stats}`}</Text>}
      </Box>
    )
  })

  // ---------- 工具组：连续的读文件、检索、跑命令被折叠成一行（Read 1 file、Ran 1 shell command），这一行也换皮 ----------
  // 面板里打开「展开工具行」后，不再折叠：每条调用单独画成一行（再由下面 ToolUse 的 hook 换皮）。
  // 组里有别的 lemo mod 的工具（mcp__lemo-…，比如抽签）时不数它们，它们的卡片由各自的 mod 画：
  //   - 那个 mod 在外层：它 next(e) 拿到这里画的计数行（没有可数的就是引擎原样），再接上自己的卡片
  //   - 那个 mod 在里层：这里先 next(e) 问它，它画了东西（不是引擎原样）就把计数行放在它画的东西上面
  // 所以那个 mod 拿到引擎原样时，只画自己的卡片，不要把引擎原样也带上（不然在这种顺序下会多一行）
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const unfolded = e.props.isExpanded || (await isUnfolded($))
    if (unfolded) {
      for (const c of e.props.calls) if (c.tool_use_id !== undefined) unfoldedCalls.add(c.tool_use_id)
      while (unfoldedCalls.size > 2000) {
        const oldest = unfoldedCalls.values().next().value
        if (oldest === undefined) break
        unfoldedCalls.delete(oldest)
      }
    }
    if (e.props.isExpanded) return next(e)
    // 「展开工具行」是自己的开关：消息样式关了，打开的展开照样展开
    if (unfolded) return next({ ...e, props: { ...e.props, isExpanded: true } })
    if (!(await isStyled($))) return next(e)
    const calls = e.props.calls
    const own = calls.filter(c => c.tool.startsWith(LEMO_TOOL))
    const rest = calls.filter(c => !c.tool.startsWith(LEMO_TOOL))
    // 「查找工具」只是加载工具的准备动作，有别的调用时不提（桌面会把它和抽签折在一起：「Used 2 tools」）
    const shown = rest.length > 1 || own.length > 0 ? rest.filter(c => c.tool !== 'ToolSearch') : rest
    let others: RenderChildren = null
    if (own.length > 0) {
      const inner = await next(e)
      if (shown.length === 0) return inner
      if (!isEngineDrawing(inner)) others = inner
    }
    const first = shown[0]
    if (first === undefined) return next(e)
    const lk = await look($)
    const S = STR[lk.lang]
    const at = first.tool_use_id === undefined ? undefined : startedAt.get(first.tool_use_id)
    const tally = new Map<string, number>()
    for (const c of shown) {
      const k = c.tool === 'Read' || c.tool === 'Bash' || c.tool === 'ToolSearch' ? c.tool : c.tool === 'Grep' || c.tool === 'Glob' ? 'search' : c.tool
      tally.set(k, (tally.get(k) ?? 0) + 1)
    }
    const what = [...tally]
      .map(([k, n]) => {
        const p = k === 'Read' ? S.group.read : k === 'Bash' ? S.group.bash : k === 'search' ? S.group.search : k === 'ToolSearch' ? S.group.tools : S.group.other
        return fill(plural(p, n), { n, tool: k })
      })
      .join(S.group.sep)
    const [label, tone]: [string, string] = calls.some(c => c.isRunning)
      ? [S.state.running, lk.c.ink]
      : calls.some(c => c.isErrored)
        ? [S.state.error, lk.c.red]
        : [S.state.done, lk.c.pencil]
    const dots = e.surface === 'terminal'
      ? '·'.repeat(Math.max(2, Math.min(30, (e.viewport?.columns ?? 80) - (7 + width(what) + 2 + width(label)) - 8)))
      : '···'
    const { Box, Text } = $.ui.resolve(e)
    // 恢复的旧会话不知道调用时间，就不写时间
    const row = (
      <Box key="row" flexDirection="row">
        <Text color={lk.c.pencil}>{at === undefined ? '' : hhmm(at) + '  '}</Text>
        <Text color={lk.c.ink} bold>{what}</Text>
        <Text color={lk.c.grid}>{' ' + dots}</Text>
        <Text color={tone}>{' ' + label}</Text>
      </Box>
    )
    if (others === null) return row
    return (
      <Box flexDirection="column" gap={1}>
        {row}
        {others}
      </Box>
    )
  })

  // ---------- 单独的工具行：开始时间、动词、对象、状态 ----------
  // 只换这几种工具；别的工具（包括别的 lemo mod 的工具）照引擎原样画，或者交给它自己的 mod
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const tool = String(e.props.tool)
    if (STR.zh.verb[tool] === undefined || !(await isStyled($))) return next(e)
    const id = e.props.tool_use_id
    // 展开的工具组里、已经有输出的行：输出画在这一行里，交回引擎原样
    if (unfoldedCalls.has(id) && e.props.output !== undefined) return next(e)
    const lk = await look($)
    const S = STR[lk.lang]
    const verb = word(lk, `lemo-skin.verb.${tool}`, S.verb[tool] ?? tool)
    const at = startedAt.get(id)
    const raw = target(tool, e.props.input).trim()
    const isFull = FULL_TARGET.has(tool)
    // 整条显示的放不下一行（超过 48 列或者本身有换行）：状态那一行不带它，整条另起一行、自动换行
    const isLong = isFull && (raw.includes('\n') || width(raw) > 48)
    const what = isFull ? (isLong ? '' : raw) : clip(raw, 48)
    const [label, tone]: [string, string] = e.props.isRunning
      ? [S.state.running, lk.c.ink]
      : e.props.isErrored
        ? [S.state.error, lk.c.red]
        : e.props.isInterrupted
          ? [S.state.interrupted, lk.c.pencil]
          : [S.state.done, lk.c.pencil]
    const isTerm = e.surface === 'terminal'
    const dots = isTerm ? '·'.repeat(Math.max(2, Math.min(30, (e.viewport?.columns ?? 80) - (7 + width(verb) + 2 + width(what) + 2 + width(label)) - 8))) : '···'
    const { Box, Text } = $.ui.resolve(e)
    // 路径和命令：桌面上画成浅底的小标签，终端里用方格线的颜色
    const chip = (text: string) =>
      isTerm ? <Text color={lk.c.grid}>{text}</Text> : <Text color={lk.c.inkDark} backgroundColor={lk.c.chip}>{` ${text} `}</Text>
    const row = (
      <Box flexDirection="row" gap={1}>
        <Text color={lk.c.pencil}>{at === undefined ? '' : hhmm(at) + ' '}</Text>
        <Text color={lk.c.ink} bold>{verb}</Text>
        {isLong ? null : chip(what)}
        <Text color={lk.c.grid}>{dots}</Text>
        <Text color={tone}>{label}</Text>
      </Box>
    )
    if (!isLong) return row
    return (
      <Box flexDirection="column">
        {row}
        <Box paddingLeft={isTerm ? 2 : 0}>{chip(raw)}</Box>
      </Box>
    )
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------

  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    const row: Cap = {
      mod: 'lemo-skin',
      id: 'look',
      kind: 'look',
      title: { zh: STR.zh.cap.title, en: STR.en.cap.title },
      desc: { zh: STR.zh.cap.desc, en: STR.en.cap.desc },
      on: await read($, lookOn),
    }
    return { value: [...(r.value ?? []), row] }
  })

  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-skin') return next(e)
    const want = e.on
    if (e.id !== 'look' || want === undefined) return { value: false }
    await update($, lookOn, () => want)
    await $.store.set('look', want)
    return { value: true }
  })

  // 「全部关闭」只关外观以外的；消息样式是外观，调用 skill 时的提示音归 lemo-core 的声音开关，这里没有要关的，往下传
  on('lemo.off', async ($, e, next) => next(e))
}
