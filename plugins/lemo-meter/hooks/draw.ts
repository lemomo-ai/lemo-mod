// lemo-meter 的画法：终端的刻度尺、走势、像素小画，桌面的 SVG 卡片。
// 这里的函数都不收 $（校验规定 $ 只能传给同一个文件里定义的函数）。
// 颜色一律从风格（lk.c）取：要浅一点、深一点的颜色，用 mix 往卡片底色或深色字那边调，不写死十六进制。

import type { Colors, Style } from './shared/lemo'

/** 胶囊和提示的颜色：红是出错、限时停下，accent 是风格强调色，ink 普通，grey 次要 */
export type Tone = 'red' | 'accent' | 'ink' | 'grey'

/** 一颗胶囊：文字和颜色 */
export type Pill = { text: string; tone: Tone }

// ---------- 颜色 ----------

function rgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (m === null) return null
  const n = parseInt(m[1] ?? '0', 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** 两个颜色按 t 混合（t=0 是 a，t=1 是 b）；认不出的颜色原样返回 a */
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a)
  const y = rgb(b)
  if (x === null || y === null) return a
  const ch = (i: 0 | 1 | 2) => Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0')
  return `#${ch(0)}${ch(1)}${ch(2)}`
}

// 浅一点：往桌面卡片底色那边调；深一点：往桌面卡片上的大字那边调
const pale = (c: Colors, x: string, t: number) => mix(x, c.deskCardFill, t)
const deep = (c: Colors, x: string, t: number) => mix(x, c.deskFigure, t)

// ---------- 终端 ----------

/** 刻度尺：├───●──────┤，返回圆点前后两段 */
export function ruler(value: number | null, inner = 12): { before: string; after: string } {
  const v = Math.max(0, Math.min(100, value ?? 0))
  const pos = Math.round((v / 100) * (inner - 1))
  return { before: '├' + '─'.repeat(pos), after: '─'.repeat(inner - 1 - pos) + '┤' }
}

/** 走势：每个值一格，▁ 到 █ */
export function sparkline(values: readonly number[]): string {
  const bars = '▁▂▃▄▅▆▇█'
  return values.map(v => bars[Math.max(0, Math.min(7, Math.round((v / 100) * 7)))] ?? '▁').join('')
}

// ---------- 像素格（终端 Raster）：每格上下两个像素，用 ▀ ▄ 拼 ----------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64(bytes: Uint8Array): string {
  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    out += (B64[(n >> 18) & 63] ?? '') + (B64[(n >> 12) & 63] ?? '') + (B64[(n >> 6) & 63] ?? '') + (B64[n & 63] ?? '')
  }
  const rest = bytes.length - i
  if (rest > 0) {
    const n = ((bytes[i] ?? 0) << 16) | (rest === 2 ? (bytes[i + 1] ?? 0) << 8 : 0)
    out += (B64[(n >> 18) & 63] ?? '') + (B64[(n >> 12) & 63] ?? '') + (rest === 2 ? (B64[(n >> 6) & 63] ?? '') : '=') + '='
  }
  return out
}

// 终端默认色（透明）
const DEFAULT = 0x01000000

/**
 * 风格的像素小画画成 Raster 的格子：调色板里没有的字符（比如「.」）是透明的。
 * 每格上下两个像素：两个都有色用 ▀（前景上、背景下），只有一个用 ▀ 或 ▄
 */
export function spriteCells(palette: Readonly<Record<string, string>>, frame: readonly string[]): { columns: number; rows: number; cells: string } {
  const color = (ch: string | undefined) => {
    const hex = ch === undefined ? undefined : palette[ch]
    const v = hex === undefined ? null : rgb(hex)
    return v === null ? null : (v[0] << 16) | (v[1] << 8) | v[2]
  }
  const columns = Math.max(1, ...frame.map(r => r.length))
  const rows = Math.max(1, Math.ceil(frame.length / 2))
  const bytes = new Uint8Array(columns * rows * 12)
  const view = new DataView(bytes.buffer)
  for (let r = 0; r < rows; r++) {
    const top = frame[r * 2] ?? ''
    const bottom = frame[r * 2 + 1] ?? ''
    for (let x = 0; x < columns; x++) {
      const t = color(top[x])
      const b = color(bottom[x])
      let cell: [number, number, number]
      if (t === null && b === null) cell = [0x20, DEFAULT, DEFAULT]
      else if (t !== null && b !== null) cell = [0x2580, t, b]
      else if (t !== null) cell = [0x2580, t, DEFAULT]
      else cell = [0x2584, b ?? DEFAULT, DEFAULT]
      const off = (r * columns + x) * 12
      view.setUint32(off, cell[0], true)
      view.setUint32(off + 4, cell[1], true)
      view.setUint32(off + 8, cell[2], true)
    }
  }
  return { columns, rows, cells: base64(bytes) }
}

// ---------- SVG（桌面） ----------

const FONT = `-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif`
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// SVG 里估算文字宽度：中日韩字符按字号算，其他按 0.6 个字号
const textW = (t: string, size: number) => [...t].reduce((n, ch) => n + ((ch.codePointAt(0) ?? 0) > 0x2e80 ? size : size * 0.6), 0)

/** 放得下就原样；放不下就截到放得下，末尾加「…」；连一个字加「…」都放不下时给空串（不画） */
function fitText(t: string, max: number, size: number): string {
  if (textW(t, size) <= max) return t
  let out = ''
  for (const ch of t) {
    if (textW(`${out}${ch}…`, size) > max) break
    out += ch
  }
  return out === '' ? '' : `${out}…`
}

/** 胶囊、提示条的底色和字色，由风格颜色调出来 */
function toneInk(c: Colors, tone: Tone): { bg: string; fg: string } {
  switch (tone) {
    case 'red':
      return { bg: pale(c, c.red, 0.85), fg: deep(c, c.red, 0.25) }
    case 'accent':
      return { bg: pale(c, c.accent, 0.7), fg: deep(c, c.accent, 0.6) }
    case 'ink':
      return { bg: c.chip, fg: c.inkDark }
    default:
      return { bg: pale(c, c.pencil, 0.82), fg: deep(c, c.pencil, 0.45) }
  }
}

// 两种进度条的渐变：上下文用墨水色，额度用强调色。
// id 带上前缀（横条 lmb、面板 lmu）：万一两张 SVG 画进同一个页面，id 撞了会用错另一张的颜色
function gradients(c: Colors, p: string): string {
  return `<linearGradient id="${p}-ink" x1="0" x2="1"><stop offset="0" stop-color="${c.ink}"/><stop offset="1" stop-color="${c.inkDark}"/></linearGradient>
<linearGradient id="${p}-accent" x1="0" x2="1"><stop offset="0" stop-color="${pale(c, c.accent, 0.25)}"/><stop offset="1" stop-color="${c.bubbleAccent}"/></linearGradient>`
}

// 胶囊：右端对齐到 xEnd（在贴右边缘的嵌套 svg 里，xEnd 是负数）
function pill(c: Colors, xEnd: number, y: number, text: string, tone: Tone): { w: number; svg: string } {
  const { bg, fg } = toneInk(c, tone)
  const w = 16 + textW(text, 11.5)
  return {
    w,
    svg: `<rect x="${xEnd - w}" y="${y}" width="${w}" height="20" rx="10" fill="${bg}"/>
<text x="${xEnd - w / 2}" y="${y + 14}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${fg}">${esc(text)}</text>`,
  }
}

// 卡片底板：方格纸 + 圆角描边，宽度跟着容器走
function paper(c: Colors, guess: number, h: number): string {
  const full = `x="1" y="1" width="${guess - 2}" height="${h - 2}" style="width:calc(100% - 2px)" rx="14"`
  return `<defs><pattern id="lm-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="${c.deskCardBorder}" stroke-width="0.7"/></pattern>
<pattern id="lm-dash" width="6" height="1" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="${pale(c, c.grid, 0.65)}"/></pattern></defs>
<rect ${full} fill="${c.deskCardFill}"/><rect ${full} fill="url(#lm-grid)"/><rect ${full} fill="none" stroke="${mix(c.deskCardBorder, c.grid, 0.12)}"/>`
}

// 标题：风格的小图标 + 荧光笔划过的品牌名 + 小字副标题，返回标题右端的 x。
// 烧瓶风格（柠檬实验室）的图标是一片柠檬；不画图案的风格只画一个强调色圆点
function brand(c: Colors, motif: Style['motif'], title: string, subtitle: string): { svg: string; end: number } {
  const w = textW(title, 14) + 4
  const sub = subtitle === '' ? '' : `<text x="${40 + w + 6}" y="25.5" font-size="9" font-weight="600" fill="${c.pencil}" letter-spacing="2">${esc(subtitle)}</text>`
  const end = 40 + w + (subtitle === '' ? 0 : 6 + subtitle.length * 8)
  const mark =
    motif === 'flask'
      ? `<circle r="8" fill="${c.accent}"/><circle r="5.8" fill="${pale(c, c.accent, 0.55)}"/><path d="M0 -5.8V5.8M-5 -2.9L5 2.9M-5 2.9L5 -2.9" stroke="${c.accent}" stroke-width="1.1"/>`
      : `<circle r="6" fill="${c.accent}"/>`
  return {
    end,
    svg: `<g transform="translate(24 21)">${mark}</g>
<rect x="38" y="17" width="${w}" height="10" rx="2" fill="${c.accent}" opacity="0.5"/>
<text x="40" y="26" font-size="14" font-weight="700" fill="${c.deskFigure}" letter-spacing="0.5">${esc(title)}</text>${sub}`,
  }
}

// 烧瓶：柠檬水里冒气泡（SMIL 动画，Svg 不加 isInteractive 时照样动）。放在 (18, 44)，56×52
function flaskSvg(c: Colors): string {
  const glass = 'M22 2 H34 V18 L50 43 Q54 50 46 50 H10 Q2 50 6 43 L22 18 Z'
  const bubble = (x: number, r: number, dur: number, begin: number) =>
    `<circle cx="${x}" cy="47" r="${r}" fill="${c.deskCardFill}" opacity="0.9"><animate attributeName="cy" values="47;31" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.95;0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></circle>`
  return `<defs><clipPath id="lm-glass"><path d="${glass}"/></clipPath></defs>
<g transform="translate(18 44)">
<g clip-path="url(#lm-glass)"><rect x="0" y="30" width="56" height="24" fill="${c.accent}"/><path d="M0 30.5 Q28 27.5 56 30.5" stroke="${pale(c, c.accent, 0.5)}" stroke-width="2.5" fill="none"/>${bubble(20, 2.2, 2.6, 0)}${bubble(28, 1.6, 2.1, 0.8)}${bubble(35, 2.6, 3.1, 1.5)}</g>
<path d="${glass}" fill="none" stroke="${c.grid}" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M19 2 H37" stroke="${c.grid}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M25.5 7 V19 L15 37" stroke="${c.deskCardFill}" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.85"/>
<path d="M40 31 h4 M43 37 h4" stroke="${c.grid}" stroke-width="1" opacity="0.7"/>
</g>`
}

// 像素小画放大画在烧瓶的位置（56×52 的格子里居中），每格 3.5 像素；几帧时每秒换一帧（SMIL，Svg 不加 isInteractive 时照样动）
function spriteSvg(sprite: NonNullable<Style['sprite']>): string {
  const frames = sprite.frames.filter(f => f.length > 0)
  if (frames.length === 0) return ''
  const cols = Math.max(...frames.flatMap(f => f.map(r => r.length)))
  const rows = Math.max(...frames.map(f => f.length))
  const px = Math.min(56 / cols, 52 / rows, 3.5)
  const x0 = 18 + (56 - cols * px) / 2
  const y0 = 44 + (52 - rows * px) / 2
  const n = frames.length
  const keyTimes = frames.map((_, i) => (i / n).toFixed(4)).join(';')
  const groups = frames.map((frame, i) => {
    let rects = ''
    frame.forEach((row, y) => [...row].forEach((ch, x) => {
      const fill = sprite.palette[ch]
      if (fill !== undefined) rects += `<rect x="${(x * px).toFixed(2)}" y="${(y * px).toFixed(2)}" width="${px.toFixed(2)}" height="${px.toFixed(2)}" fill="${fill}"/>`
    }))
    const anim = n > 1
      ? `<animate attributeName="opacity" values="${frames.map((_, j) => (j === i ? 1 : 0)).join(';')}" keyTimes="${keyTimes}" calcMode="discrete" dur="${n}s" repeatCount="indefinite"/>`
      : ''
    return `<g opacity="${i === 0 ? 1 : 0}">${anim}${rects}</g>`
  })
  return `<g transform="translate(${x0.toFixed(2)} ${y0.toFixed(2)})" shape-rendering="crispEdges">${groups.join('')}</g>`
}

// 桌面横条：一张带标题的方格纸卡片，宽度跟着窗口走，右边不留白。以后每个风格的桌面卡片都按这个规则做。
// 左边的标题和图案位置固定；右边的胶囊、数值和花费放进贴右边缘的嵌套 <svg x="100%">；
// 进度条和虚线用 CSS 的 calc() 撑满中间。每个撑开的元素同时写一个按估计宽度算好的 width 属性，
// 万一桌面把 style 过滤掉，也还能按估计宽度画出来。
export type BandData = {
  ctx: number | null
  quota: number | null
  usd: number | null
  /** 右上角最右边的胶囊：消息编号 */
  label: string
  /** 编号左边的胶囊，从右往左排：各 mod 的胶囊（已经带上剩余时间），最后是 git 分支 */
  pills: readonly Pill[]
  /** lemo-core 的提示条：标题右边，带一个闪的小圆点 */
  notice: Pill | null
  brand: string
  brandSub: string
  words: { ctx: string; quota: string; cost: string; pending: string }
}
export type BandFrame = {
  // 写进 SVG 根节点的宽度：'100%' 表示跟着容器走
  width: number | '100%'
  // 估计的像素宽度，给撑开元素的 width 属性兜底
  guess: number
}

export const BAND_H = 106

export function bandSvg(o: BandData, f: BandFrame, c: Colors, motif: Style['motif'], sprite: Style['sprite'] = null): string {
  const H = BAND_H
  const art = motif === 'flask' ? flaskSvg(c) : motif === 'sprite' && sprite !== null ? spriteSvg(sprite) : ''
  // 有图案时标签在图案右边；不画图案的风格标签靠左
  const labelX = art === '' ? 24 : 92
  // 进度条从标签右边开始：至少留 84，英文标签长就按估计宽度再往右
  const trackX = labelX + Math.max(84, Math.ceil(Math.max(textW(o.words.ctx, 12), textW(o.words.quota, 12)) + 18))
  // 进度条右边要留的地方：数值 44 + 间距 24 + 花费栏 70 + 边距 16
  const reserve = trackX + 154
  const trackGuess = Math.max(40, f.guess - reserve)
  const along = (t: number) => `calc(${trackX}px + (100% - ${reserve}px) * ${t})`
  const tickFill = pale(c, c.grid, 0.55)
  const ticks = (y: number) =>
    [0, 0.25, 0.5, 0.75, 1]
      .map(t => `<rect x="${(trackX + t * trackGuess).toFixed(1)}" style="x:${along(t)}" y="${y + 11}" width="1" height="3" fill="${tickFill}"/>`)
      .join('')
  const meter = (y: number, label: string, v: number | null, grad: string) => {
    const t = v === null ? 0 : Math.max(0, Math.min(1, v / 100))
    const bar = t > 0
      ? `<rect x="${trackX}" y="${y}" width="${Math.max(8, t * trackGuess).toFixed(1)}" style="width:max(8px, calc((100% - ${reserve}px) * ${t.toFixed(4)}))" height="8" rx="4" fill="url(#${grad})"/>`
      : ''
    return `<text x="${labelX}" y="${y + 8}" font-size="12" fill="${deep(c, c.pencil, 0.25)}">${esc(label)}</text>
<rect x="${trackX}" y="${y}" width="${trackGuess}" style="width:calc(100% - ${reserve}px)" height="8" rx="4" fill="${c.chip}"/>
${bar}
${ticks(y)}`
  }
  const value = (y: number, v: number | null) =>
    `<text x="-142" y="${y + 8}" font-size="12" font-weight="600" fill="${v === null ? c.pencil : c.deskFigure}">${esc(v === null ? o.words.pending : `${Math.round(v)}%`)}</text>`
  // 右上角的胶囊从右往左排：消息编号、各 mod 的胶囊、git 分支
  const wanted: Pill[] = [{ text: o.label, tone: 'ink' }, ...o.pills]
  let xEnd = -16
  let pills = ''
  for (const p of wanted) {
    const one = pill(c, xEnd, 11, p.text, p.tone)
    pills += one.svg
    xEnd -= one.w + 8
  }
  const head = brand(c, motif, o.brand, o.brandSub)
  // 提示条：标题右边，带一个小圆点，颜色跟着提示的 tone。
  // 长了在右上角的胶囊前面收住（末尾加「…」），不从胶囊底下穿过去；完整的话 App 另外弹出来。
  // 截断按估计的宽度算，实际更窄时再用 clipPath 按真实宽度剪掉
  let notice = ''
  if (o.notice !== null) {
    const { bg, fg } = toneInk(c, o.notice.tone)
    const x = head.end + 14
    // 最左边的胶囊离右边框 -xEnd - 8，和提示条之间再空 10
    const gap = -xEnd - 8 + 10
    const room = f.guess - gap - x
    const text = fitText(o.notice.text, room - 30, 12)
    if (text !== '') {
      const w = 30 + textW(text, 12)
      notice = `<clipPath id="lm-notice"><rect x="${x}" y="0" width="${Math.max(0, room)}" style="width:max(0px, calc(100% - ${gap + x}px))" height="38"/></clipPath>
<g clip-path="url(#lm-notice)"><rect x="${x}" y="10" width="${w}" height="22" rx="11" fill="${bg}"/>
<circle cx="${x + 13}" cy="21" r="3.5" fill="${fg}"><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/></circle>
<text x="${x + 22}" y="25.5" font-size="12" font-weight="700" fill="${fg}">${esc(text)}</text></g>`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f.width}" height="${H}" font-family="${FONT}">
${paper(c, f.guess, H)}
<defs>
${gradients(c, 'lmb')}
</defs>
${head.svg}
${notice}
<rect x="16" y="38" width="${f.guess - 32}" style="width:calc(100% - 32px)" height="1" fill="url(#lm-dash)"/>
${art}
${meter(52, o.words.ctx, o.ctx, 'lmb-ink')}
${meter(76, o.words.quota, o.quota, 'lmb-accent')}
<svg x="100%" y="0" width="1" height="1" overflow="visible">
${pills}
${value(52, o.ctx)}
${value(76, o.quota)}
<text x="-16" y="60" text-anchor="end" font-size="11" fill="${c.pencil}">${esc(o.words.cost)}</text>
<text x="-16" y="84" text-anchor="end" font-size="15" font-weight="700" fill="${o.usd === null ? c.pencil : c.deskFigure}">${o.usd === null ? '—' : '$' + o.usd.toFixed(2)}</text>
</svg>
</svg>`
}

// 面板「用量」卡片的桌面画法：三格数据（上下文、五小时额度、花费）+ 上下文走势，同样铺满宽度。
// 它放在面板的卡片里（卡片自己有底色和边框），所以不画方格纸底板，也不画标题
export type UsageData = { ctx: number | null; quota: number | null; usd: number | null; history: readonly number[] }

// ---------- 桌面统一面板顶上的数据卡（标题、编号胶囊、三格数据、走势），每一页都有 ----------

export const PANE_H = 150

export type PaneData = UsageData & { label: string }
export type PaneWords = { title: string; sub: string; ctx: string; quota: string; cost: string; trend: string; noTrend: string }

export function paneSvg(o: PaneData, guess: number, c: Colors, motif: Style['motif'], w: PaneWords): string {
  const H = PANE_H
  const head = brand(c, motif, w.title, '')
  const no = pill(c, -16, 11, o.label, 'ink')
  const tile = (x: string, label: string, v: string, bar: number | null, grad: string) =>
    `<svg x="${x}" y="46" width="33.3%" height="56" overflow="visible">
<text x="16" y="14" font-size="11" fill="${c.pencil}">${esc(label)}</text>
<text x="16" y="38" font-size="20" font-weight="700" fill="${c.deskFigure}">${esc(v)}</text>
${bar === null ? '' : `<rect x="16" y="46" width="64" height="4" rx="2" fill="${c.chip}"/><rect x="16" y="46" width="${Math.max(3, Math.min(64, (bar / 100) * 64)).toFixed(1)}" height="4" rx="2" fill="url(#${grad})"/>`}
</svg>`
  const vals = o.history.slice(-24)
  let trend = `<text x="16" y="134" font-size="11" fill="${c.pencil}">${esc(w.noTrend)}</text>`
  if (vals.length > 0) {
    const series = vals.length === 1 ? [vals[0] ?? 0, vals[0] ?? 0] : vals
    // 按这段数据自己的最大值缩放，上下文只用了几个百分点时也看得出起伏
    const top = Math.max(10, ...series) * 1.25
    const pts = series.map((v, i) => `${(4 + (i / (series.length - 1)) * 92).toFixed(2)},${(27 - (Math.max(0, v) / top) * 24).toFixed(2)}`).join(' ')
    trend = `<text x="16" y="120" font-size="11" fill="${c.pencil}">${esc(w.trend)}</text>
<svg x="0" y="112" width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
<polyline points="4,27 ${pts} 96,27" fill="${c.chip}" stroke="none"/>
<polyline points="${pts}" fill="none" stroke="${c.inkDark}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
</svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${H}" font-family="${FONT}">
${paper(c, guess, H)}
<defs>
${gradients(c, 'lmp')}
</defs>
${head.svg}
<text x="${head.end + 8}" y="25.5" font-size="11" fill="${c.pencil}">${esc(w.sub)}</text>
<svg x="100%" y="0" width="1" height="1" overflow="visible">${no.svg}</svg>
<rect x="16" y="38" width="${guess - 32}" style="width:calc(100% - 32px)" height="1" fill="url(#lm-dash)"/>
${tile('0', w.ctx, o.ctx === null ? '—' : `${Math.round(o.ctx)}%`, o.ctx, 'lmp-ink')}
${tile('33.3%', w.quota, o.quota === null ? '—' : `${Math.round(o.quota)}%`, o.quota, 'lmp-accent')}
${tile('66.6%', w.cost, o.usd === null ? '—' : '$' + o.usd.toFixed(2), null, 'lmp-ink')}
${trend}
</svg>`
}
