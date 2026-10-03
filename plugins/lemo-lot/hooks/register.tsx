// lemo-lot：给 Claude 加一个抽签工具。对 Claude 说「抽支签」，它调用 draw_lot 抽一支，
// 调用行画成签文卡片（终端：圆角框；桌面：铺满宽度的竹签 SVG），结果行不再重复。
// 签文、签级名、签筒名、印章字跟着风格走（柠檬实验室的在风格包 words/lemo-lot.ts），默认是一组中性的签文
//
// 抽签工具是「给 Claude 加工具」，装上时关着。开关存在 $.store 的 tool 键（全局记住），列在「安全」页。
// 关着时开会话不注册这个工具，Claude 看不到它。会话中途打开：马上注册，下一条消息起 Claude 能用。
// 会话中途关掉：引擎没有「取消注册」（$.tool.register 只能注册、同名替换），这个会话里 Claude 还看得到它，
// 调用时不抽签，只回一句「抽签工具关着」；下一个会话起就不注册了。
// 签文卡片的画法（ToolUse / ToolResult / ToolGroup 的 render）只改画面，不用开关

import type { BoxProps, ElementConstructor, EngineInterface, Register, SvgProps, TextProps } from 'claude-code'

import { STR } from './i18n'
import { LOT_OFF, LOT_TOOL, lotDefs, lotSvg, lotText, outputText, parseLot, rankLists, tierColor } from './lot'
import type { Lot, LotDef } from './lot'
import { bareInk, pad2, word, words } from './shared/lemo'
import type { Lang, Look } from './shared/lemo'

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

// lemo-skin 的「展开工具行」开关，存在 lemo-core 里
const UnfoldRef = { plugin: 'lemo-core', key: 'unfold' } as const
// lemo-core 的报到表：看装没装 lemo-skin（折叠行里拿到引擎原样时，要不要把引擎那行留着）
const ModsRef = { plugin: 'lemo-core', key: 'mods' } as const

// 给模型看的工具说明：固定不变（不跟语言、风格变），免得提示缓存失效；也不提风格的名字
const TOOL_NOTE =
  'Lot tube: draws one fortune lot at random. Call it when the user asks to draw a lot or a fortune (「抽签」「抽一支签」「求个签」). ' +
  'The lot is shown to the user as a card, so do not repeat it; add one sentence relating it to their question, in their language.'

// 工具的输入：Claude 可以说想问什么（可以空着）
const TOOL_SCHEMA = {
  type: 'object',
  properties: { wish: { type: 'string', description: 'What the user wants to ask about; may be empty' } },
} as const

// 安全页上这一行的 id
const CAP_ID = 'tool'

// 能力清单的一行（类型从 lemo-core 的合约里取）
type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]

// 桌面代码字体一格大约多少像素，只用来估算 SVG 宽度（万一桌面把 style 过滤掉，按估计宽度画）
const CELL_PX = 7.8

/** 抽签工具开没开：存在 $.store（所有会话共用）。每次现读：别的会话里关掉了，这个会话里的调用也跟着不抽 */
async function toolOn($: EngineInterface): Promise<boolean> {
  try {
    return (await $.store.get('tool')) === true
  } catch {
    return false
  }
}

/**
 * 给 Claude 注册抽签工具，名字是 mcp__lemo-lot__draw_lot，下一条消息起可用。
 * 会话还没开始（还没绑定）时引擎会拒绝：那就等下一个会话开始时再注册
 */
async function registerTool($: EngineInterface) {
  try {
    await $.tool.register({ name: 'draw_lot', description: TOOL_NOTE, inputSchema: TOOL_SCHEMA })
  } catch {
    // 注册不上就只是少一个工具
  }
}

/** 开关：安全页（lemo.toggle）、「全部关闭」（lemo.off）都走这里。打开时马上注册 */
async function setTool($: EngineInterface, v: boolean) {
  await $.store.set('tool', v)
  if (v) await registerTool($)
}

// 安全页上的一行：给 Claude 加什么工具、什么时候生效，说清楚。不带风格味道（安全页要一眼看懂）
async function lotCaps($: EngineInterface): Promise<Cap[]> {
  return [
    {
      mod: 'lemo-lot',
      id: CAP_ID,
      kind: 'tool',
      title: { zh: STR.zh.cap.title, en: STR.en.cap.title },
      desc: { zh: STR.zh.cap.desc, en: STR.en.cap.desc },
      on: await toolOn($),
    },
  ]
}

type Els = { Box: ElementConstructor<BoxProps>; Text: ElementConstructor<TextProps> }

/** 当前风格和语言下的签：风格包写了就用风格的，格式不对或没写就用默认的 */
function currentLots(lk: Look): { defs: LotDef[]; ranks: readonly string[] } {
  const S = STR[lk.lang]
  const styled = lotDefs(words(lk, 'lemo-lot.lots', S.lots))
  const defs = styled.length > 0 ? styled : lotDefs(S.lots)
  const ranks = words(lk, 'lemo-lot.ranks', S.ranks)
  return { defs, ranks }
}

/**
 * 换了界面语言以后，签文卡片画当前语言的那一支：工具结果是抽签那一刻的语言写的，
 * 签文中英两份按顺序一一对应，按编号找回同一支。当前风格里第 no 支的中文或英文和结果对得上才换
 * （换过风格的旧签对不上，照结果原样画）
 */
function localLot(lk: Look, lot: Lot): Lot {
  const listOf = (lang: Lang) => {
    const styled = lotDefs(words({ st: lk.st, lang }, 'lemo-lot.lots', STR[lang].lots))
    return styled.length > 0 ? styled : lotDefs(STR[lang].lots)
  }
  const zh = listOf('zh')[lot.no - 1]
  const en = listOf('en')[lot.no - 1]
  if (zh === undefined || en === undefined || (zh.verse !== lot.verse && en.verse !== lot.verse)) return lot
  const def = lk.lang === 'zh' ? zh : en
  const rank = words(lk, 'lemo-lot.ranks', STR[lk.lang].ranks)[def.tier] ?? lot.rank
  return { ...lot, tier: def.tier, rank, verse: def.verse, hint: def.hint }
}

/** 认得出的签级名（风格的 + 默认的，中英都要：换了语言或风格以后，旧的签也要上对颜色） */
function knownRanks(lk: Look): (readonly string[])[] {
  return rankLists(lk.st, [STR.zh.ranks, STR.en.ranks])
}

// 签文卡片：桌面画成铺满宽度的竹签，终端画成强调色的圆角框
function lotCard(el: Els, svg: ElementConstructor<SvgProps> | null, lk: Look, surface: string, lot: Lot, key: string, guess: number) {
  const { Box, Text } = el
  const S = STR[lk.lang]
  const c = lk.c
  const tube = word(lk, 'lemo-lot.tube', S.tube)
  if (svg !== null) {
    const Svg = svg
    const stamp = words(lk, 'lemo-lot.stamp', S.stamp)
    // 桌面上 Svg 单独放只有约 280 像素，内容挤在一起；放进竖排容器会被横向拉满。
    // 所以 Svg 不给 width，外面包一层竖排的 Box。不加 isInteractive：加了每次重画整个框都会重新加载、闪一下
    return (
      <Box key={key} flexDirection="column" width="100%">
        <Svg source={lotSvg(lot, guess, c, lk.lang, { tube, reading: S.reading, stamp })} alt={`${lot.rank}: ${lot.verse} ${lot.hint}`} height={128} />
      </Box>
    )
  }
  return (
    <Box key={key} flexDirection="column" borderStyle="round" borderColor={c.accent} paddingX={1}>
      <Box flexDirection="row">
        <Text backgroundColor={c.accent} color={c.onAccent} bold>{lk.lang === 'zh' ? ` 第 ${pad2(lot.no)} 签 ` : ` LOT ${pad2(lot.no)} `}</Text>
        <Text color={tierColor(c, lot.tier)} bold>{'  ' + lot.rank}</Text>
        <Text color={c.pencil}>{'   ' + tube}</Text>
      </Box>
      <Text bold {...bareInk(lk, surface)}>{lot.verse}</Text>
      <Text color={c.pencil}>{S.reading + lot.hint}</Text>
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-lot',
      // 会放音效：没装 lemo-sound 时，lemo-core 在「行为」页给出开关
      uses: ['sound'],
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: [],
      // always 只写外观：签文卡片的画法。抽签工具本身在安全页上，有开关
      always: { zh: [STR.zh.always], en: [STR.en.always] },
    })
    // 打开了才给 Claude 这个工具。在 session.start 里注册，下一条消息起可用
    if (await toolOn($)) await registerTool($)
    return next(e)
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------
  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...(await lotCaps($))] }
  })

  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-lot') return next(e)
    if (e.id !== CAP_ID || e.on === undefined) return { value: false }
    await setTool($, e.on)
    return { value: true }
  })

  // 存不进去也要往下传：别的 mod 的开关照样关
  on('lemo.off', async ($, e, next) => {
    try {
      await setTool($, false)
    } catch {
      // 照样往下传
    }
    return next(e)
  })

  // 抽一支：结果文字跟着界面语言走，签文跟着风格走。工具是自己注册的，这里直接给结果，不交给里层。
  // 开关关着（这个会话里关掉的，工具还在 Claude 那边）：不抽签、不响，回一句「关着」给 Claude
  on('tool.call', { tool: 'mcp__lemo-lot__draw_lot' }, async $ => {
    if (!(await toolOn($))) return { result: LOT_OFF }
    const lk = await look($)
    const { defs, ranks } = currentLots(lk)
    const i = Math.floor(Math.random() * defs.length)
    const def = defs[i] ?? lotDefs(STR[lk.lang].lots)[0]!
    const rank = ranks[def.tier] ?? STR[lk.lang].ranks[def.tier] ?? ''
    await $.lemo.play({ sound: 'done', gain: 0.8 })
    return { result: lotText(i + 1, lk.lang, def, rank) }
  })

  // 抽签工具的调用行画成签文卡片，结果行就不再重复
  on('ui.render', { component: 'ToolUse', props: { tool: 'mcp__lemo-lot__draw_lot' } }, async ($, e) => {
    const lk = await look($)
    const S = STR[lk.lang]
    const { Box, Text } = $.ui.resolve(e)
    const out = outputText(e.props.output)
    if (out.startsWith(LOT_OFF)) return <Text color={lk.c.pencil}>{S.off}</Text>
    const lot = parseLot(out, knownRanks(lk))
    if (lot === null) return <Text color={lk.c.pencil}>{e.props.isRunning ? S.shaking : S.failed}</Text>
    const guess = Math.round((e.viewport?.columns ?? 90) * CELL_PX)
    let svg: ElementConstructor<SvgProps> | null = null
    if (e.surface === 'desktop') svg = $.ui.resolve(e).Svg
    return lotCard({ Box, Text }, svg, lk, e.surface, localLot(lk, lot), `lot-${lot.no}`, guess)
  })

  on('ui.render', { component: 'ToolResult', props: { tool: 'mcp__lemo-lot__draw_lot' } }, async ($, e, next) => {
    if (e.props.isErrored) return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  // 抽签藏在折叠行里时（桌面上会和「查找工具」折在一起，标题是桌面自己加的「Used 2 tools ›」），照样画出签文卡片。
  // 和 lemo-skin 的约定（同一层谁在外层不一定，两种顺序都要对）：
  //   - next 拿到引擎原样、装了 lemo-skin：只画签文卡片，不带引擎那行（lemo-skin 在里层时，组里只有抽签就交回
  //     引擎原样；lemo-skin 在外层时，它会把自己的计数行放在这里画的东西上面）
  //   - next 拿到引擎原样、没装 lemo-skin：没人补计数行，丢掉引擎那行的话同一组里别的调用（Read、Bash 那一行）
  //     就从终端上消失了。所以引擎那行留着，签文卡片接在下面
  //   - 拿到别的（lemo-skin 的计数行）：签文卡片接在它下面
  // 展开的折叠行每条调用单独画成 ToolUse，由上面的 hook 画卡片，这里就不再接。「展开工具行」打开时
  // lemo-skin 会改成展开再往下传，但它在里层时这里看到的还是折叠的，所以也读 lemo-core 的开关
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.props.isExpanded) return next(e)
    if ((await $.state.get(UnfoldRef)).value === true) return next(e)
    const lotCalls = e.props.calls.filter(c => c.tool === LOT_TOOL)
    if (lotCalls.length === 0) return next(e)
    const drawn = await next(e)
    const lk = await look($)
    const S = STR[lk.lang]
    const ranks = knownRanks(lk)
    const { Box, Text } = $.ui.resolve(e)
    const guess = Math.round((e.viewport?.columns ?? 90) * CELL_PX)
    let svg: ElementConstructor<SvgProps> | null = null
    if (e.surface === 'desktop') svg = $.ui.resolve(e).Svg
    const cards = lotCalls.map((c, i) => {
      const out = outputText(c.output)
      if (out.startsWith(LOT_OFF)) return <Text key={`lot-${i}`} color={lk.c.pencil}>{S.off}</Text>
      const lot = parseLot(out, ranks)
      // 还在摇、或者没摇出来：折叠行里看不出抽签这一步（lemo-skin 跳过它），在下面补一行
      if (lot === null) return <Text key={`lot-${i}`} color={lk.c.pencil}>{c.isRunning ? S.shaking : S.failed}</Text>
      return lotCard({ Box, Text }, svg, lk, e.surface, localLot(lk, lot), `lot-${i}-${lot.no}`, guess)
    })
    // 引擎原样不许放进带 width 的 Box（会拒绝整棵树），这一层也就不给 width
    if (drawn.type === 'engine') {
      // 报到表还没有（lemo-core 还没写过）时当成没装 lemo-skin：多一行总比丢一行好
      const mods = (await $.state.get(ModsRef)).value ?? []
      if (mods.some(m => m.mod === 'lemo-skin')) return <Box flexDirection="column" gap={1}>{cards}</Box>
    }
    return (
      <Box flexDirection="column" gap={1}>
        {drawn}
        {cards}
      </Box>
    )
  })
}
