// 所有 lemo mod 共用的代码。只在仓库的 shared/ 里改，然后跑 node scripts/sync-shared.mjs，
// 它会复制到每个 mod 的 hooks/shared/lemo.tsx（插件只能读自己文件夹里的文件，所以每个 mod 带一份副本）。
//
// 这里只放三类东西：lemo-core 状态的引用、文字小工具、统一面板 /lemo-mod 里的卡片怎么画。
// 风格相关的值（颜色、带风格味道的文字）一律从 lemo-core 的 style 读，不写死。
//
// 注意：这个文件里的函数一律不收 $。校验规定 $ 只能传给同一个文件里定义的函数，
// 所以要用 $ 的几个公共函数（look、seqOf、hubTab）放在 shared/lemo-block.tsx，
// 由同步脚本原样插进每个 mod 的 hooks/register.tsx（两行标记之间）。

import type { BoxProps, ButtonProps, ElementConstructor, PluginState, RenderChildren, RenderElement, RenderNode, TextProps } from 'claude-code'

// ---------- lemo-core 的类型（从合约里取，lemo-core 自己和依赖它的 mod 都能用） ----------

export type Core = PluginState['lemo-core']
export type Style = Core['style']
export type Lang = Core['lang']
export type Tab = Core['tab']
export type Theme = Core['theme']
export type ModInfo = Core['mods'][number]
export type Colors = Style['colors']

// ---------- 统一面板的 id ----------

export const HUB = 'lemo-mod'

/**
 * 画东西时要的风格和语言。theme 是 Claude Code 的主题（终端用）；desk 是桌面 App 自己的明暗
 * （lemo-core 读 App 记在本机的设置，读不到是 null，当亮色画）。
 * inline：终端里面板内嵌在输入框上方（Pane 的 placement 是 inline，窄窗口或不是全屏布局时）。
 * 这时面板没有主题画的底，字直接落在终端自己的底色上；停靠在对话旁边（dock）时底色才是主题画的。
 * 只有面板的 hook 会是 true（look($, e.props)），别处都是 false
 */
/** bodyColumns：面板里画的时候是面板正文的宽度（卡片说明按它先断好行），别处没有 */
export type Look = { st: Style; c: Colors; lang: Lang; theme: Theme; desk: Theme; inline: boolean; bodyColumns?: number }

// ---------- 文字 ----------

/** 风格里的文字：先找风格的「mod.键」，找不到用 mod 自己的默认文字 */
export function word(lk: Pick<Look, 'st' | 'lang'>, key: string, fallback: string): string {
  const v = lk.st.words[key]?.[lk.lang]
  if (typeof v === 'string') return v
  return fallback
}

/** 风格里的一组文字（加载词、签文），找不到用默认 */
export function words(lk: Pick<Look, 'st' | 'lang'>, key: string, fallback: readonly string[]): readonly string[] {
  const v = lk.st.words[key]?.[lk.lang]
  if (Array.isArray(v) && v.length > 0) return v as readonly string[]
  return fallback
}

/** 把 {n}、{name} 这类占位符换成值 */
export function fill(text: string, vars: Readonly<Record<string, string | number>>): string {
  return text.replace(/\{(\w+)\}/g, (all, k: string) => (vars[k] === undefined ? all : String(vars[k])))
}

export const pad2 = (n: number) => String(n).padStart(2, '0')
/** 消息编号：T01、T02… */
export const exp = (n: number) => `T${pad2(n)}`
export const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`)

export function fmtDur(ms: number): string {
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${pad2(s % 60)}` : `${s}s`
}

export function hhmm(ms: number): string {
  const d = new Date(ms)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function mdhm(ms: number): string {
  const d = new Date(ms)
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${hhmm(ms)}`
}

export function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`
}

/** 终端里的显示宽度：中日韩字符占两格 */
export function width(text: string): number {
  let n = 0
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0
    const wide =
      (c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0x303e) || (c >= 0x3041 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xfe30 && c <= 0xfe4f) ||
      (c >= 0xff00 && c <= 0xff60) || (c >= 0xffe0 && c <= 0xffe6)
    n += wide ? 2 : 1
  }
  return n
}

/** 压成一行，超过 max 格就截断加省略号 */
export function clip(text: string, max: number): string {
  const one = text.replace(/\s+/g, ' ').trim()
  let out = ''
  for (const ch of one) {
    if (width(out + ch) > max - 1) return out + '…'
    out += ch
  }
  return out
}

/**
 * 终端里中文夹着数字、英文时，挨着中文的空格换成不断行的空格。
 * 终端换行优先在空格处断，「一轮超过 30 秒，……」会断成「一轮超过 30」和「秒，……」；
 * 换掉以后整句按字断。英文句子里的空格不动
 */
export function cjkKeep(text: string): string {
  return text.replace(/(?<=[\u2e80-\u9fff\uff00-\uffef]) | (?=[\u2e80-\u9fff\uff00-\uffef])/g, '\u00a0')
}

// 行首不能出现的标点（句号、逗号、右括号……），行尾不能出现的（左括号、左引号）
const NO_START = new Set([...'。，、；：！？）」』】》〉…—·％,.;:!?)]}%'])
const NO_END = new Set([...'（「『【《〈([{'])
// 不拆开的一段：英文词、数字、路径（~/.claude/x.md）、标识符（draw_lot、.git/HEAD）
const LATIN = /[A-Za-z0-9_~./@#+=*&'"$<>|^`-]/

/**
 * 终端里按显示宽度把一段中文（夹着英文）断成几行：英文词、数字、路径不拆开，
 * 句号、逗号这类标点不放到行首，左括号、左引号不留在行尾。
 * Ink 只在空格处断行，cjkKeep 换成不断行空格后又只能硬断（「Hai / ku」「Cla / ude」、句号落到行首），
 * 所以知道宽度的地方（面板的 bodyColumns）先自己断好，每行单独画
 */
export function wrapCjk(text: string, cols: number): string[] {
  const max = Math.max(4, Math.floor(cols))
  // 切成不能再拆的小段：一个汉字或标点、一串英文数字、一个空格
  const parts: string[] = []
  for (const ch of text) {
    const last = parts.length - 1
    if (LATIN.test(ch) && last >= 0 && LATIN.test(parts[last]?.slice(-1) ?? '')) parts[last] += ch
    else parts.push(ch)
  }
  const lines: string[][] = []
  let cur: string[] = []
  let w = 0
  const flush = () => {
    while (cur.length > 0 && cur[cur.length - 1] === ' ') cur.pop()
    lines.push(cur)
    cur = []
    w = 0
  }
  for (const p of parts) {
    if (p === ' ' && cur.length === 0) continue
    const pw = width(p)
    if (w + pw <= max) {
      cur.push(p)
      w += pw
      continue
    }
    // 放不下。标点不放行首：连着的几个标点（「」，」）和它们前面那个字一起带到下一行
    const carry: string[] = []
    if (NO_START.has(p)) {
      while (cur.length > 1 && NO_START.has(cur[cur.length - 1] ?? '')) carry.unshift(cur.pop() ?? '')
      if (cur.length > 1 && cur[cur.length - 1] !== ' ') carry.unshift(cur.pop() ?? '')
    }
    // 左括号、左引号不留在行尾
    while (cur.length > 1 && NO_END.has(cur[cur.length - 1] ?? '')) carry.unshift(cur.pop() ?? '')
    flush()
    for (const c of carry) {
      cur.push(c)
      w += width(c)
    }
    if (p === ' ') continue
    // 一段英文比整行还长：只能硬断
    let rest = p
    while (w + width(rest) > max && cur.length === 0) {
      let cut = ''
      for (const ch of rest) {
        if (width(cut + ch) > max) break
        cut += ch
      }
      lines.push([cut])
      rest = rest.slice(cut.length)
    }
    cur.push(rest)
    w += width(rest)
  }
  if (cur.length > 0) flush()
  return lines.map(l => l.join('')).filter((l, i, all) => l !== '' || all.length === 1)
}

/** 两种 #RRGGBB 颜色按 t 混合（t=0 是 a，t=1 是 b），调浅、调深风格色用 */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map(i => Number.parseInt(h.slice(i, i + 2), 16))
  const x = p(a)
  const y = p(b)
  if (a.length !== 7 || b.length !== 7 || [...x, ...y].some(Number.isNaN)) return a
  return `#${x.map((v, i) => Math.round(v + ((y[i] ?? v) - v) * t).toString(16).padStart(2, '0')).join('')}`
}

/** 只留最近的若干条，免得会话状态越积越大 */
export const recent = <T,>(map: Readonly<Record<string, T>>, keep = 300): Record<string, T> => Object.fromEntries(Object.entries(map).slice(-keep))

// ---------- 消息来源 ----------

/**
 * 不是用户本人发的消息：后台任务通知、别的会话或 agent、插件发来的。
 * 桌面发来的消息 origin 不是 composer，所以用排除法
 */
export const NOT_PERSON: ReadonlySet<string> = new Set([
  'task-notification', 'peer', 'peer-send-message', 'coordinator', 'scheduled-trigger', 'plugin',
  'observer', 'observer-activity', 'auto-continuation', 'channel', 'projects-relay', 'slack-ping',
])

/**
 * Claude 回复的对号键：lemo-core 记回复编号、lemo-skin 画回复抬头都按它对。
 * 按开头的文字对，因为界面上的文字和对话记录里的可能差一点尾巴
 */
export const replyKey = (text: string) => text.trim().slice(0, 60)

/** lemo-watch 叫醒会话时发的消息以它开头；恢复旧会话重新编号时跳过 */
export const REMIND_MARK = '⏰'

// ---------- 命令：/lemo-mod 后面的词 ----------

/**
 * 把 /lemo-mod 的参数拆成第一个词（小写）、紧跟的数字和剩下的文字。
 * 词和数字之间可以不空格：「提醒30」「focus25」也认（词本身不含数字；整个是数字时就当词）
 */
export function cmdWord(args: string): { word: string; num: number; rest: string } {
  const a = args.trim()
  const m = /^([^\s\d]+|\S+)\s*([\d.]*)\s*([\s\S]*)$/.exec(a)
  return { word: (m?.[1] ?? '').toLowerCase(), num: Number.parseFloat(m?.[2] ?? ''), rest: (m?.[3] ?? '').trim() }
}

// ---------- 统一面板 /lemo-mod ----------
// lemo-core 打开面板（id 是 HUB），画头部和分页。每个 mod 用
//   on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => { ... })
// 拿到同一个面板：先 const inner = await next(e)，再用 hubWrap 把自己的卡片接在后面。
// 当前分页不是自己的就原样 return inner。

// 分页从左到右：常用在最前，安全在最后。终端的 a、b、c… 换页键照这个顺序给
const TAB_ORDER: readonly Tab[] = ['main', 'behave', 'bg', 'game', 'safe']

/** 这个界面上有哪些分页：有 mod 在这一页、这个界面上有卡片才显示；「安全」「行为」两页 lemo-core 自己画，总是显示 */
export function visibleTabs(mods: readonly ModInfo[], surface: string): Tab[] {
  const used = new Set<Tab>(['safe', 'behave'])
  for (const m of mods) {
    if (m.surfaces !== undefined && !m.surfaces.includes(surface)) continue
    for (const t of m.tabs) used.add(t)
  }
  return TAB_ORDER.filter(t => used.has(t))
}

/** 一张卡片：标题、一句说明、标题行右边的按钮、下面的其他内容 */
export type CardSpec = {
  id: string
  /** 在这一页里的位置，小的在上；不写就查下面的 CARD_ORDER，再没有就排在最后 */
  order?: number
  title: string
  desc?: string
  buttons?: RenderChildren
  extra?: RenderChildren
  /** 终端里说明文字能占几列：给了就用 wrapCjk 先断好行（面板的 bodyColumns 减去卡片的缩进，见 cardCols） */
  cols?: number
}

/**
 * 终端面板里一张卡片正文能占几列：面板正文宽减去左右各 2 列留白、竖条和它后面的空格，再留 1 列余量。
 * 不设比实际宽的下限：断出来的行比面板宽，每行末尾会被截掉（wrapCjk 自己最少按 4 列断）
 */
export function cardCols(bodyColumns: number): number {
  return Math.max(4, bodyColumns - 7)
}

/** 终端里先断好行的一段灰字（wrapCjk），每行单独画、不再让 Ink 断 */
export function para(el: Els, text: string, cols: number, key?: string) {
  const { Box, Text } = el
  return (
    <Box key={key} flexDirection="column">
      {wrapCjk(text, cols).map((l, i) => (
        <Text key={`l${i}`} dimColor wrap="truncate">{l}</Text>
      ))}
    </Box>
  )
}

type Els = { Box: ElementConstructor<BoxProps>; Text: ElementConstructor<TextProps> }

/**
 * 模型写的一段字（小结、助手的报告）画成纯文字：去掉控制字符，一行一个 Text，换行照留。
 * 不按 Markdown 画：内容不可信（可能夹着读到的文件里的话），里面的链接不能点。
 * 字色同面板正文（inkOf）：终端停靠时用主题的正文色，配得上主题画的面板底；内嵌时用终端自己的字色；桌面用卡片的深色字。
 * Markdown 不设字色，深色终端配浅色主题时停靠面板上的字和底一样浅，看不见
 */
export function plainLines(el: Els, lk: Look, surface: string, text: string, key: string) {
  const { Box, Text } = el
  const lines = text.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').split('\n')
  return (
    <Box key={key} flexDirection="column">
      {lines.map((l, i) => (
        <Text key={`${key}-${i}`} {...inkOf(lk, surface)}>{l === '' ? ' ' : l}</Text>
      ))}
    </Box>
  )
}

/** 桌面 App 是暗色（lemo-core 读 App 自己记的明暗）。读不到时是 null，当亮色 */
export function deskDark(lk: Pick<Look, 'desk'>): boolean {
  return lk.desk === 'dark'
}

/**
 * 桌面卡片上的深色字：亮色 App 用风格的深色，暗色 App 卡片换成深色底，字用风格的浅色卡片底那个颜色。
 * 暗色下原生按钮和 dimColor 的字是浅的，卡片底跟着变深才看得清
 */
export function deskInk(lk: Pick<Look, 'c' | 'desk'>): string {
  return deskDark(lk) ? lk.c.cardFillLight : lk.c.inkDark
}

/** 桌面卡片：亮色是浅色小卡片（样子冻结，不改）；暗色 App 用风格的深色卡片底 */
export function cardBox(lk: Look): BoxProps {
  if (deskDark(lk)) return { backgroundColor: lk.c.cardFillDark, borderStyle: 'round', borderColor: mix(lk.c.cardFillDark, lk.c.cardFillLight, 0.16), paddingX: 2, paddingY: 1 }
  return { backgroundColor: lk.c.deskCardFill, borderStyle: 'round', borderColor: lk.c.deskCardBorder, paddingX: 2, paddingY: 1 }
}

/**
 * 终端里竖条的颜色（柠檬书脊）：强调色；深色主题用暗一点的那个，免得太刺眼。
 * 用在面板卡片左边（卡片不要框、不要底色，左边一道竖条，卡片之间空一行）
 * 和对话里你发的消息左边
 */
export function spineColor(lk: Look): string {
  return lk.theme === 'dark' ? lk.c.bubbleAccent : lk.c.accent
}

/** 卡片标题：加粗，颜色和面板正文一样（见 inkOf） */
export function cardTitle(el: Els, lk: Look, surface: string, title: string) {
  const { Text } = el
  return <Text bold {...inkOf(lk, surface)}>{title}</Text>
}

/**
 * 画一张卡片。终端：左边一列带底色的空 Box 当竖条（高度跟着卡片拉满），右边是卡片内容；
 * 按钮放在标题那一行右边，说明占满整行（中文说明和按钮挤一行会断得很怪）
 */
export function card(el: Els, lk: Look, surface: string, spec: CardSpec) {
  const { Box, Text } = el
  const isTerm = surface === 'terminal'
  const head = cardTitle(el, lk, surface, spec.title)
  // 说明按面板宽度先断好行（标点不落到行首）：卡片自己给了 cols 就用它，没给就按面板宽度算
  const cols = spec.cols ?? (lk.bodyColumns === undefined ? undefined : cardCols(lk.bodyColumns))
  if (isTerm) {
    return (
      <Box key={spec.id} flexDirection="row" gap={1}>
        <Box width={1} flexShrink={0} backgroundColor={spineColor(lk)} />
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Box flexDirection="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Box flexShrink={1}>{head}</Box>
            {spec.buttons === undefined ? null : <Box flexDirection="row" gap={1} flexShrink={0}>{spec.buttons}</Box>}
          </Box>
          {spec.desc === undefined ? null : cols === undefined ? <Text dimColor>{cjkKeep(spec.desc)}</Text> : para(el, spec.desc, cols)}
          {spec.extra === undefined || spec.extra === null ? null : <Box marginTop={1} flexDirection="column">{spec.extra}</Box>}
        </Box>
      </Box>
    )
  }
  return (
    <Box key={spec.id} flexDirection="column" gap={1} {...cardBox(lk)}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" gap={2}>
        <Box flexDirection="column" flexShrink={1}>
          {head}
          {spec.desc === undefined ? null : <Text dimColor>{spec.desc}</Text>}
        </Box>
        {spec.buttons === undefined ? null : <Box flexDirection="row" gap={1} flexShrink={0}>{spec.buttons}</Box>}
      </Box>
      {spec.extra === undefined ? null : spec.extra}
    </Box>
  )
}

/**
 * 每页卡片的顺序，按卡片 id。同一层的插件谁在外层不一定，卡片不能按挂 hook 的顺序排，
 * 所以在这里统一定。新卡片加在这里；没列的排在最后
 */
export const CARD_ORDER: Readonly<Record<string, number>> = {
  // 常用
  'recap-card': 10, 'sound-main': 20, 'voice-main': 25, 'tone-brief-card': 30, 'watch-remind': 40, 'pomo-main': 50, 'todo-notes': 60, 'meter-usage': 90,
  // 行为
  'core-style': 5, 'core-name': 6, 'core-sound': 8, 'tone-voice-card': 10, 'skin-unfold-card': 30, 'journal-stats': 40, 'guard-timeout': 50, 'core-mods': 90,
  // 后台
  'journal-log': 10, 'meter-branch': 20, 'meter-version': 30, 'journal-classify': 40, 'assistant-main': 50,
  // 安全（lemo-core 按能力清单画，分类的顺序见 lemo-core 的 KIND_ORDER）
  'safe-head': 1,
}

// 面板里那一列的 key，和每张卡片外层的 key（带着顺序号，外层的 mod 靠它重新排）
const HUB_KEY = 'lemo-hub'
const CARD_PREFIX = 'lemo-card:'

/** 终端面板里卡片的数字热键最多到 9；分页按钮用 a–e（lemo-core 给），不在卡片里，不受影响 */
const MAX_KEYS = 9
// 按钮前面那个号码外层 Box 的 key：重新编号时靠它认出来、去掉
const KEY_MARK = 'lemo-hotkey'

const isEl = (x: unknown): x is RenderElement => typeof x === 'object' && x !== null && !Array.isArray(x) && 'type' in x

/** 去掉里层编过的号：按钮上的数字热键、按钮前面画的号码。字母热键是 mod 自己定的，不动 */
function unnumber(node: RenderNode): RenderNode {
  if (!isEl(node)) return node
  if (node.type === 'Button') {
    const { hotkey, ...rest } = node.props
    return hotkey !== undefined && /^\d$/.test(hotkey) ? { ...node, props: rest } : node
  }
  if ((node.type !== 'Box' && node.type !== 'Text') || node.children === undefined) return node
  const kids = node.children.filter(k => !(isEl(k) && k.type === 'Box' && String(k.props?.key ?? '').startsWith(KEY_MARK)))
  return { ...node, children: kids.map(unnumber) }
}

/** 在一行里找第一个按钮，给它热键 n，前面放上号码 mark。找不到返回 null */
function numberRow(node: RenderNode, n: number, mark: RenderElement): RenderNode | null {
  if (!isEl(node) || node.type !== 'Box' || node.children === undefined) return null
  const kids = node.children
  const i = kids.findIndex(k => isEl(k) && k.type === 'Button')
  const btn = kids[i]
  if (isEl(btn) && btn.type === 'Button') {
    const numbered: RenderNode = { ...btn, props: { ...btn.props, hotkey: String(n) } }
    return { ...node, children: [...kids.slice(0, i), mark, numbered, ...kids.slice(i + 1)] }
  }
  for (let j = 0; j < kids.length; j++) {
    const r = numberRow(kids[j] as RenderNode, n, mark)
    if (r !== null) return { ...node, children: [...kids.slice(0, j), r, ...kids.slice(j + 1)] }
  }
  return null
}

/**
 * 给一张卡片编号 n：标题行右边的第一个按钮按 n 就能按，按钮前面画一个暗色的 n。
 * 卡片外层是 hubWrap 包的 Box，里面是 card() 画的卡片：终端卡片是「竖条、内容」两个孩子，内容的第一个孩子是标题行。
 * 标题行没有按钮返回 null（不占号）。
 * 按钮的处理函数记在元素的 press 里，跟着元素走，所以外层改了 props，按下去还是原来那个 mod 处理
 */
function numberCard(wrapper: RenderNode, n: number, mark: RenderElement): RenderNode | null {
  if (!isEl(wrapper) || wrapper.type !== 'Box') return null
  const box = wrapper.children?.[0]
  if (!isEl(box) || box.type !== 'Box') return null
  const kids = box.children ?? []
  const body = kids[kids.length - 1]
  if (!isEl(body) || body.type !== 'Box') return null
  const row = body.children?.[0]
  const r = row === undefined ? null : numberRow(row, n, mark)
  if (r === null) return null
  const newBody = { ...body, children: [r, ...(body.children ?? []).slice(1)] }
  return { ...wrapper, children: [{ ...box, children: [...kids.slice(0, -1), newBody] }, ...(wrapper.children ?? []).slice(1)] }
}

function orderOf(node: RenderNode): number | null {
  if (typeof node !== 'object' || node === null) return null
  const key = (node as { props?: { key?: unknown } }).props?.key
  if (typeof key !== 'string' || !key.startsWith(CARD_PREFIX)) return null
  return Number(key.slice(CARD_PREFIX.length, CARD_PREFIX.length + 4))
}

/**
 * 把自己的卡片加进面板，和里层已有的卡片一起按顺序排（见 CARD_ORDER）。
 * 里层是 lemo-core 的头部，或者别的 mod 已经排好的一列（key 是 lemo-hub）：拆开，头部留在最上面，卡片重排。
 * head 是要放在最上面的东西（桌面上 lemo-meter 的数据卡）。
 * 终端里卡片之间空一行，左右各留 2 格和 lemo-core 的头部对齐，最下面空一行；桌面卡片之间空一点
 */
export function hubWrap(el: Els, lk: Look, surface: string, inner: RenderElement, specs: readonly CardSpec[], head?: RenderElement): RenderElement {
  const { Box, Text } = el
  const isTerm = surface === 'terminal'
  if (specs.length === 0 && head === undefined) return inner
  const isHub = inner.type === 'Box' && (inner as { props?: { key?: unknown } }).props?.key === HUB_KEY
  const base: RenderNode[] = isHub ? [...((inner as { children?: RenderNode[] }).children ?? [])] : [inner]
  const fresh = specs.map(s => {
    const n = Math.max(0, Math.min(9999, Math.round(s.order ?? CARD_ORDER[s.id] ?? 9999)))
    const key = `${CARD_PREFIX}${String(n).padStart(4, '0')}:${s.id}`
    return isTerm ? (
      <Box key={key} flexDirection="column" paddingX={2}>{card(el, lk, surface, s)}</Box>
    ) : (
      <Box key={key} flexDirection="column">{card(el, lk, surface, s)}</Box>
    )
  })
  const all = [...base, ...fresh]
  const tops = all.filter(x => orderOf(x) === null)
  // sort 是稳定的：顺序号相同的照加进来的先后
  const sorted = all.filter(x => orderOf(x) !== null).sort((a, b) => (orderOf(a) ?? 0) - (orderOf(b) ?? 0))
  // 终端里按卡片顺序给卡片编数字热键 1–9（标题行右边的第一个按钮），按钮前面画出号码。
  // 每一层都先去掉里层编的号再重编，最外层那次就是全部卡片排好后的结果。桌面上直接点，不编
  let n = 0
  const cards = !isTerm
    ? sorted
    : sorted.map(x => {
        const clean = unnumber(x)
        if (n >= MAX_KEYS) return clean
        const mark = (
          <Box key={`${KEY_MARK}-${n + 1}`} flexShrink={0}>
            <Text dimColor>{String(n + 1)}</Text>
          </Box>
        )
        const r = numberCard(clean, n + 1, mark)
        if (r === null) return clean
        n += 1
        return r
      })
  return (
    <Box key={HUB_KEY} flexDirection="column" gap={isTerm ? 1 : 2} {...(isTerm ? { paddingBottom: 1 } : {})}>
      {head === undefined ? null : head}
      {tops}
      {cards}
    </Box>
  )
}

// ---------- 面板里的按钮：重画时还是同一个按钮（桌面 App 第一下点击不丢） ----------

type Kept = { look: string; el: RenderElement; run: { fn: ButtonProps['onPress'] } }
/** 每个界面上一次画出来的按钮（按 key）。只复用上一次画里有的，见 steady */
const LAST = new Map<string, Map<string, Kept>>()

/**
 * 面板（Pane）里画按钮用这个，代替 $.ui.resolve(e) 给的 Button，写法不变：
 *   const Button = steady($.ui.resolve(e).Button, e.surface)
 *   <Button key="x" label="…" onPress={…} />
 * 每次画都要先调一次 steady（放在面板 hook 的开头、提前 return 之前），它把这一次记成「上一次画」；
 * 这次没画按钮也要调，不然下一次画会以为按钮一直在。
 *
 * 为什么：桌面 App 里光标在输入框时点面板按钮，按下鼠标那一刻按钮拿到焦点，
 * App 把面板的 isFocused 改成 true，马上再要一次画。引擎每画一次，给新建的每个 Button 一个新 handle，
 * 新画面里没有的旧 handle 就放掉。App 按住鼠标期间不换按钮，松开时发出去的还是按下前那个旧 handle，
 * 引擎已经不认（日志里是「no Button … is held under handle」或「no handler is held under handle」），第一下就丢了；
 * 第二下面板已经有焦点、不再重画，所以能按。
 *
 * 引擎的约定是 handle 跟着画面活（the host holds the handle for the lifetime of the drawing）：
 * 新画面里还是同一个按钮元素，handle 就还在。所以这里把上一次画的按钮记住：同一个界面、同一个 key、
 * 样子（label、variant、hotkey、dimColor……）都没变，就交回那个元素；按下去跑最近一次画时给的 onPress，
 * 不会拿旧状态做事。样子变了就新建一个。
 *
 * 只复用上一次画里有的：切页、按钮消失过一次再出现时，引擎已经放掉了它的 handle，这时新建一个，
 * 不去碰引擎正在放掉的 handle（放掉和重新登记的先后说不准）。
 * 这几种不记，照常新建：没写 key（引擎拿 label 当地址，两个同字的按钮分不清）、label 写成了子节点、
 * 同一次画里这个 key 已经用过（不会把同一个元素放进树里两次）。
 * Input、Select 不用：引擎按它们的 key 也找得到。
 * 终端照原样返回 Button：终端的点击和重画在同一个进程里，画面和 handle 一起换，没有这个问题；
 * 终端的重画还可能被中途取消，那时复用的 handle 可能被引擎一起清掉，所以不在终端上记。
 */
export function steady(Button: ElementConstructor<ButtonProps>, surface: string): ElementConstructor<ButtonProps> {
  if (surface === 'terminal') return Button
  const before = LAST.get(surface) ?? new Map<string, Kept>()
  const now = new Map<string, Kept>()
  LAST.set(surface, now)
  return props => {
    const { onPress, children, ...rest } = props
    const key = rest.key
    const hasKids = Array.isArray(children) ? children.length > 0 : children !== undefined && children !== null
    if (key === undefined || hasKids || now.has(key)) {
      return (
        <Button {...rest} onPress={onPress}>
          {children}
        </Button>
      )
    }
    const look = JSON.stringify(rest)
    const hit = before.get(key)
    if (hit !== undefined && hit.look === look) {
      hit.run.fn = onPress
      now.set(key, hit)
      return hit.el
    }
    const run = { fn: onPress }
    const kept: Kept = { look, el: <Button {...rest} onPress={press => run.fn(press)} />, run }
    now.set(key, kept)
    return kept.el
  }
}

/** 次要按钮：终端里加 dimColor，引擎用主题的灰色画（不加的话用终端默认字色，浅底上看不清） */
export function sec(surface: string): Pick<ButtonProps, 'variant' | 'dimColor'> {
  return surface === 'terminal' ? { variant: 'secondary', dimColor: true } : { variant: 'secondary' }
}

/**
 * 面板（Pane）里的正文颜色。桌面用风格的深色（暗色 App 用浅色）。
 * 终端里看面板停在哪：停靠在对话旁边（dock）时底色是主题画的，用主题的正文色（theme key「text」）；
 * 内嵌在输入框上方（lk.inline）时没有主题的底，和 bareInk 一样不给颜色，用终端自己的前景色。
 * 不然深色终端配浅色主题时标题是黑字落在深底上，浅色终端配深色主题时是白字落在浅底上
 */
export function inkOf(lk: Look, surface: string): Pick<TextProps, 'color'> {
  if (surface !== 'terminal') return { color: deskInk(lk) }
  return lk.inline ? {} : { color: 'text' }
}

/**
 * 直接画在终端底色上的正文（横条、对话里的卡片）：终端里不给颜色，用终端自己的前景色；桌面用风格的深色。
 * 终端的底色不一定和 Claude Code 的主题一致：深色终端配浅色主题时，主题正文色是黑的，画在深底上看不清。
 * 终端自己的前景色总是配得上它的底色
 */
export function bareInk(lk: Look, surface: string): Pick<TextProps, 'color'> {
  return surface === 'terminal' ? {} : { color: deskInk(lk) }
}
