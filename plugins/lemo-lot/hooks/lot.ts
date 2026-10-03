// 签文的数据、工具结果的文字格式、桌面签文卡片的 SVG。这里的函数都不收 $（校验规定 $ 只能传给同一个文件里定义的函数）。

import { pad2 } from './shared/lemo'
import type { Colors, Lang, Style } from './shared/lemo'

/** 给 Claude 加的工具：在 session.start 里注册 draw_lot，名字自动变成 mcp__<插件名>__draw_lot */
export const LOT_TOOL = 'mcp__lemo-lot__draw_lot'

/**
 * 抽签工具关着时（这个会话里中途关掉的，工具还在 Claude 那边）给 Claude 的结果。
 * 给模型看，固定英文；签文卡片认出这一句就画「关着」那一行，不当成没摇出来
 */
export const LOT_OFF = 'The lot tool is turned off in the lemo-mod Safety page, so no lot was drawn. Tell the user in one sentence; they can turn it on with /lemo-mod safety.'

/** 一支签的定义：签级（0 最好，5 最差）、签文、解签 */
export type LotDef = { tier: number; verse: string; hint: string }

/** 从工具结果里解析出来的一支签 */
export type Lot = { no: number; tier: number; rank: string; verse: string; hint: string }

const TIERS = 6
// 认不出签级时当作中间的「中签」
const MID_TIER = 3

/** 风格包和默认文字里的签文是一行一支「签级|签文|解签」，拆开；格式不对的行跳过 */
export function lotDefs(lines: readonly string[]): LotDef[] {
  const out: LotDef[] = []
  for (const line of lines) {
    const [t, verse, hint] = line.split('|').map(x => x.trim())
    const tier = Number(t)
    if (!Number.isInteger(tier) || tier < 0 || tier >= TIERS || !verse || !hint) continue
    out.push({ tier, verse, hint })
  }
  return out
}

// 工具结果就是这几行字：模型读它，界面也从它解析出签文。
// 格式固定（只有内容跟着风格和语言变），parseLot 靠它解析，所以换了风格以后旧的签照样画得出来
export function lotText(no: number, lang: Lang, def: LotDef, rank: string): string {
  return lang === 'zh'
    ? `第 ${pad2(no)} 签 · ${rank}\n签文：${def.verse}\n解签：${def.hint}`
    : `Lot ${pad2(no)} · ${rank}\nVerse: ${def.verse}\nReading: ${def.hint}`
}

/**
 * 认得出的签级名：默认的中英两份，加上当前风格的中英两份。每份第几个就是签级几。
 * 签级只用来选颜色，不写进结果文字，所以要靠签级名反查
 */
export function rankLists(st: Style, defaults: readonly (readonly string[])[]): (readonly string[])[] {
  const w = st.words['lemo-lot.ranks']
  const styled = w === undefined ? [] : [w.zh, w.en].filter((x): x is readonly string[] => Array.isArray(x))
  return [...styled, ...defaults]
}

/** 解析工具结果：中文、英文，默认签文、风格签文都认 */
export function parseLot(text: string, ranks: readonly (readonly string[])[]): Lot | null {
  const m = /(?:第 (\d+) 签|Lot (\d+)) · ([^\n]+)\n(?:签文：|Verse: )(.+)\n(?:解签：|Reading: )(.+)/.exec(text)
  if (m === null) return null
  const no = Number(m[1] ?? m[2])
  const rank = (m[3] ?? '').trim()
  let tier = MID_TIER
  for (const list of ranks) {
    const i = list.indexOf(rank)
    if (i >= 0 && i < TIERS) {
      tier = i
      break
    }
  }
  return { no, tier, rank, verse: (m[4] ?? '').trim(), hint: (m[5] ?? '').trim() }
}

// 工具结果在界面里可能是字符串，也可能是 MCP 的内容块
export function outputText(output: unknown): string {
  if (typeof output === 'string') return output
  if (Array.isArray(output)) return output.map(outputText).join('\n')
  if (output !== null && typeof output === 'object') {
    const o = output as Record<string, unknown>
    if (typeof o.text === 'string') return o.text
    if (o.content !== undefined) return outputText(o.content)
  }
  return ''
}

/**
 * 签的好坏用颜色区分（原来的 TIER_COLOR，改成由风格颜色推出）：
 * 红笔圈出来的最好，深色墨水次之，浅色墨水是中签，铅笔灰的最差
 */
export function tierColor(c: Colors, tier: number): string {
  const ladder = [c.red, c.inkDark, c.inkDark, c.ink, c.pencil, c.pencil]
  return ladder[tier] ?? c.ink
}

// ---------- 桌面签文卡片（SVG） ----------

const FONT = `-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif`
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const cnNum = (n: number) => (n <= 10 ? CN[n] ?? String(n) : n < 20 ? `十${CN[n - 10] ?? ''}` : String(n))

// 卡片底板：方格纸 + 圆角描边，宽度跟着容器走。
// 撑满的底板用 CSS 的 calc()，同时写一个按估计宽度算好的 width 属性，万一桌面把 style 过滤掉也还能画出来。
// 底色用风格的浅色卡片底，格线和描边用强调色调淡（柠檬实验室是淡柠檬色的纸）
function paper(guess: number, h: number, c: Colors): string {
  const full = `x="1" y="1" width="${guess - 2}" height="${h - 2}" style="width:calc(100% - 2px)" rx="14"`
  return `<defs><pattern id="lotgrid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="${c.accent}" stroke-opacity="0.2" stroke-width="0.7"/></pattern></defs>
<rect ${full} fill="${c.cardFillLight}"/><rect ${full} fill="url(#lotgrid)"/><rect ${full} fill="none" stroke="${c.accent}" stroke-opacity="0.45"/>`
}

/** 卡片上跟着风格和语言变的几样字 */
export type LotLabels = { tube: string; reading: string; stamp: readonly string[] }

// 桌面签文卡片：和横条一样铺满宽度。左边一支强调色的竹签，右边一枚红色印章。
// 印章贴右边缘：放进 <svg x="100%" overflow="visible">，用负坐标往左排。
// 外层宽度不在这里给：Svg 不给 width，外面包竖排的 Box（见 register.tsx 的 lotCard）
export function lotSvg(lot: Lot, guess: number, c: Colors, lang: Lang, t: LotLabels): string {
  const H = 128
  const slip = lang === 'zh'
    ? [...`第${cnNum(lot.no)}签`].map((ch, i) => `<text x="34" y="${40 + i * 19}" text-anchor="middle" font-size="15" font-weight="700" fill="${c.onAccent}">${ch}</text>`).join('')
    : `<text x="34" y="52" text-anchor="middle" font-size="10" font-weight="700" fill="${c.onAccent}" letter-spacing="1">LOT</text>
<text x="34" y="78" text-anchor="middle" font-size="18" font-weight="800" fill="${c.onAccent}">${pad2(lot.no)}</text>`
  const s1 = esc(t.stamp[0] ?? '')
  const s2 = esc(t.stamp[1] ?? '')
  const stampSize = lang === 'zh' ? 15 : 12
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${H}" font-family="${FONT}">
${paper(guess, H, c)}
<rect x="16" y="14" width="36" height="100" rx="7" fill="${c.accent}"/>
<rect x="21" y="19" width="26" height="90" rx="5" fill="none" stroke="${c.cardFillLight}" stroke-opacity="0.7"/>
${slip}
<text x="70" y="32" font-size="11" fill="${c.pencil}" letter-spacing="1">${esc(t.tube)}</text>
<text x="70" y="62" font-size="24" font-weight="800" fill="${tierColor(c, lot.tier)}">${esc(lot.rank)}</text>
<text x="70" y="89" font-size="14" fill="${c.inkDark}">${esc(lot.verse)}</text>
<text x="70" y="111" font-size="12" fill="${c.pencil}">${esc(t.reading)}${esc(lot.hint)}</text>
<svg x="100%" y="0" width="1" height="1" overflow="visible">
<g transform="translate(-58 64) rotate(-10)">
<rect x="-26" y="-26" width="52" height="52" rx="6" fill="none" stroke="${c.red}" stroke-width="2.4" opacity="0.85"/>
<text x="0" y="-3" text-anchor="middle" font-size="${stampSize}" font-weight="800" fill="${c.red}" opacity="0.85">${s1}</text>
<text x="0" y="16" text-anchor="middle" font-size="${stampSize}" font-weight="800" fill="${c.red}" opacity="0.85">${s2}</text>
</g>
</svg>
</svg>`
}
