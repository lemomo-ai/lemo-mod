// 检查一个风格包：格式、颜色对比度、像素小画、素材文件、文字（和柠檬实验室的键、占位符、长度对照），再单独跑一遍类型检查。
//   bun scripts/check-style.ts <风格 id>
// 有 ✘ 就退出码 1；△ 是提醒，自己看一眼要不要改。
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

type Text = { zh: string | readonly string[]; en: string | readonly string[] }
type Style = {
  id: string
  name: { zh: string; en: string }
  colors: Record<string, string>
  bubbles: readonly string[]
  sprite: { palette: Record<string, string>; frames: readonly (readonly string[])[] } | null
  motif: string
  icon: string | null
  sounds: Record<string, string>
  voices: { zh: readonly string[]; en: readonly string[] }
  words: Record<string, Text>
}

const id = process.argv[2]
if (id === undefined) {
  console.error('usage: bun scripts/check-style.ts <style-id>')
  process.exit(1)
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const core = join(root, 'plugins', 'lemo-core')
const errors: string[] = []
const warns: string[] = []
const bad = (m: string) => errors.push(m)
const warn = (m: string) => warns.push(m)

async function load(sid: string): Promise<Style | undefined> {
  const mod = (await import(join(core, 'styles', sid, 'index.ts'))) as Record<string, unknown>
  return Object.values(mod).find(v => typeof v === 'object' && v !== null && (v as { id?: unknown }).id === sid) as Style | undefined
}

const st = await load(id)
const ref = await load('lemon-lab')
if (st === undefined || ref === undefined) {
  console.error(`✘ styles/${id}/index.ts 没有导出 id 为 "${id}" 的风格`)
  process.exit(1)
}

// ---------- 宽度、颜色 ----------
const wide = (ch: string) => {
  const c = ch.codePointAt(0) ?? 0
  return (c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0x303e) || (c >= 0x3041 && c <= 0x33ff) || (c >= 0x3400 && c <= 0x9fff) ||
    (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xfe30 && c <= 0xfe4f) || (c >= 0xff00 && c <= 0xff60) || (c >= 0xffe0 && c <= 0xffe6) || c >= 0x1f300
}
const width = (s: string) => [...s].reduce((a, ch) => a + (wide(ch) ? 2 : 1), 0)
const HEX = /^#[0-9A-Fa-f]{6}$/
function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255)
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// ---------- 基本信息 ----------
if (!/^[a-z][a-z0-9-]*$/.test(id)) bad(`id 只能用小写字母、数字和 -：${id}`)
if (st.name.zh.trim() === '' || st.name.en.trim() === '') bad('name 的 zh、en 都要写')
if (width(st.name.zh) > 10) warn(`中文名有点长（${width(st.name.zh)} 列）：${st.name.zh}`)
if (st.name.en.length > 22) warn(`英文名有点长：${st.name.en}`)

// ---------- 颜色 ----------
const KEYS = Object.keys(ref.colors)
for (const k of KEYS) if (!HEX.test(st.colors[k] ?? '')) bad(`colors.${k} 要写成 #RRGGBB：${st.colors[k]}`)
for (const k of Object.keys(st.colors)) if (!KEYS.includes(k)) bad(`colors 里多了不认识的键：${k}`)
if (errors.length === 0) {
  const c = st.colors as Record<string, string>
  const need = (what: string, a: string, b: string, min: number, hard: boolean) => {
    const r = contrast(a, b)
    if (r < min) (hard ? bad : warn)(`${what} 对比度 ${r.toFixed(2)}，要 ≥ ${min}`)
  }
  // 终端：这些颜色直接画在终端底色上，深色终端、浅色终端（和浅色主题画的面板底）都要看得清
  const DARK = '#1E2026'
  const LIGHT = ['#FFFFFF', '#EBEBEB']
  for (const k of ['ink', 'pencil', 'red']) {
    need(`${k} 在深色终端上`, c[k]!, DARK, 2.8, true)
    need(`${k} 在深色终端上`, c[k]!, DARK, 3, false)
    for (const l of LIGHT) need(`${k} 在浅色底 ${l} 上`, c[k]!, l, 2.4, true)
  }
  for (const k of ['grid', 'bubble', 'bubbleAccent']) {
    need(`${k} 在深色终端上`, c[k]!, DARK, 2.2, false)
    for (const l of LIGHT) need(`${k} 在浅色底 ${l} 上`, c[k]!, l, 1.5, false)
  }
  // 强调色只做底色：上面的字、竖条在两种底上的可见度
  need('onAccent 写在 accent 上（头部标签、胶囊）', c.onAccent!, c.accent!, 4.5, true)
  need('accent 竖条在深色终端上', c.accent!, DARK, 2.5, true)
  need('accent 竖条在浅色面板 #EBEBEB 上', c.accent!, '#EBEBEB', 1.2, false)
  need('bubbleAccent 竖条（深色主题）在深色终端上', c.bubbleAccent!, DARK, 2.5, true)
  // 桌面：深色字写在浅色卡片、小标签上
  need('inkDark 写在 deskCardFill 上', c.inkDark!, c.deskCardFill!, 4.5, true)
  need('inkDark 写在 chip 上', c.inkDark!, c.chip!, 4.5, true)
  need('onAccent 写在 deskCardFill 上（桌面横条的数值）', c.onAccent!, c.deskCardFill!, 4.5, true)
  need('pencil 写在 deskCardFill 上', c.pencil!, c.deskCardFill!, 2.4, true)
  if (contrast(c.deskCardFill!, '#FFFFFF') > 1.25) warn('deskCardFill 要很浅（桌面卡片底色），现在偏深')
  if (contrast(c.cardFillLight!, '#FFFFFF') > 1.3) warn('cardFillLight 要很浅（桌面上命令回复的卡片底）')
}

// ---------- 点缀、像素小画、图案 ----------
if (st.bubbles.length > 6) bad('bubbles 最多 6 个')
for (const b of st.bubbles) {
  if (width(b) > 4) bad(`bubbles 每个不超过 4 列：「${b}」`)
  if ([...b].some(wide)) bad(`bubbles 里别用中文或 emoji（终端里宽度不准）：「${b}」`)
}
if (st.id !== 'lemon-lab' && st.motif === 'flask') bad('motif 的 flask 是柠檬实验室专用的烧瓶，新风格用 sprite')
if (st.sprite === null) warn('没有像素小画：终端横条左边、面板图标、桌面横条都会空着')
else {
  const { palette, frames } = st.sprite
  for (const [k, v] of Object.entries(palette)) {
    if ([...k].length !== 1 || k === '.') bad(`sprite.palette 的键要是一个字符、不能是「.」：「${k}」`)
    if (!HEX.test(v)) bad(`sprite.palette.${k} 要写成 #RRGGBB：${v}`)
  }
  if (frames.length < 2 || frames.length > 4) bad(`sprite 要 2–4 帧（现在 ${frames.length}）`)
  frames.forEach((f, i) => {
    if (f.length !== 10) bad(`sprite 第 ${i + 1} 帧要正好 10 行（现在 ${f.length}）`)
    f.forEach((row, y) => {
      if (row.length !== 16) bad(`sprite 第 ${i + 1} 帧第 ${y + 1} 行要正好 16 个字符（现在 ${row.length}）`)
      for (const ch of row) if (ch !== '.' && palette[ch] === undefined) bad(`sprite 第 ${i + 1} 帧用了调色板里没有的「${ch}」`)
    })
  })
  const used = new Set(frames.flat().join(''))
  used.delete('.')
  if (used.size < 2) warn('像素小画只用了一种颜色')
  if (frames.length > 1 && frames.every(f => f.join() === frames[0]!.join())) bad('几帧一模一样，动不起来')
  if (st.motif !== 'sprite' && st.id !== 'lemon-lab') warn(`motif 是 ${st.motif}：桌面横条不画图案（有像素小画时一般用 sprite）`)
}

// ---------- 素材文件 ----------
const file = (p: string | null, what: string) => {
  if (p === null) return
  if (!p.startsWith(`assets/${id}/`) && id !== 'plain') bad(`${what} 要放在 assets/${id}/ 下：${p}`)
  if (!existsSync(join(core, p))) bad(`${what} 文件不存在：${p}（先跑 bun scripts/style-assets.ts ${id}）`)
}
file(st.icon, 'icon')
if (st.sprite !== null && st.icon === null) bad(`有像素小画就要有图标：icon: 'assets/${id}/icon.png'`)
const LIMIT: Record<string, number> = { tick: 0.25, done: 1.6, deny: 0.8 }
for (const k of ['tick', 'done', 'deny']) {
  const p = st.sounds[k]
  if (p === undefined) { bad(`sounds.${k} 没写`); continue }
  file(p, `sounds.${k}`)
  const full = join(core, p)
  if (existsSync(full)) {
    const buf = readFileSync(full)
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') bad(`${p} 不是 WAV`)
    else {
      const secs = buf.readUInt32LE(40) / buf.readUInt32LE(28)
      if (secs > LIMIT[k]!) bad(`${p} 有 ${secs.toFixed(2)} 秒，${k} 不要超过 ${LIMIT[k]} 秒`)
    }
  }
}
if (st.id !== 'lemon-lab' && st.id !== 'plain' && !existsSync(join(core, 'styles', id, 'sounds.ts'))) bad(`缺 styles/${id}/sounds.ts（音效的合成参数）`)

// ---------- 朗读声音 ----------
let installed: string[] = []
try {
  installed = execFileSync('say', ['-v', '?'], { encoding: 'utf8' }).split('\n').map(l => l.replace(/\s+[a-z]{2,3}_[A-Za-z0-9]+\s+#.*$/, '').trim()).filter(Boolean)
} catch {
  installed = []
}
for (const lang of ['zh', 'en'] as const) {
  for (const v of st.voices[lang]) if (installed.length > 0 && !installed.includes(v)) warn(`voices.${lang} 里的「${v}」这台机器没装（没装的会跳过）`)
}
if (st.voices.zh.length === 0) warn('voices.zh 是空的：系统默认语音念中文会念不清楚，一般照柠檬实验室写')

// ---------- 文字 ----------
// {style}（风格名，或用户起的名字；{styleZh}、{styleEn} 是指定语言的）可有可无：各风格在哪句话里提自己的名字不一样，不跟柠檬实验室对
const holes = (s: string) => [...s.matchAll(/\{[a-z]+\}/g)].map(m => m[0]).filter(h => h !== '{style}').sort().join(',')
const asList = (v: string | readonly string[]) => (typeof v === 'string' ? [v] : [...v])
for (const k of Object.keys(st.words)) if (ref.words[k] === undefined) bad(`words 里有柠檬实验室没有的键（拼错了？）：${k}`)
for (const [k, r] of Object.entries(ref.words)) {
  const w = st.words[k]
  // 素色是专门不带风格文字的测试风格，缺文字是对的
  if (w === undefined) { if (st.id !== 'plain') bad(`words 缺 ${k}`); continue }
  for (const lang of ['zh', 'en'] as const) {
    const a = w[lang]
    const b = r[lang]
    if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) { bad(`${k}.${lang} 的形状要和柠檬实验室一样（${Array.isArray(b) ? '数组' : '一句话'}）`); continue }
    const la = asList(a)
    const lb = asList(b)
    if (k !== 'lemo-meter.brandSub' && la.some(x => x.trim() === '')) bad(`${k}.${lang} 有空的`)
    if (!Array.isArray(a) && holes(la[0]!) !== holes(lb[0]!)) bad(`${k}.${lang} 的占位符要是 ${holes(lb[0]!) || '（没有）'}，现在是 ${holes(la[0]!) || '（没有）'}`)
    if (!Array.isArray(a)) {
      const wa = width(la[0]!)
      const wb = width(lb[0]!)
      if (wa > Math.max(wb * 1.6, wb + 14)) warn(`${k}.${lang} 比柠檬实验室长很多（${wa} 列 / ${wb} 列）：${la[0]}`)
    }
    // 前后的空格是排版用的（标签两边留白），要照着留
    if (!Array.isArray(a) && /^ /.test(lb[0]!) !== /^ /.test(la[0]!)) bad(`${k}.${lang} 开头的空格要和柠檬实验室一样`)
    if (!Array.isArray(a) && / $/.test(lb[0]!) !== / $/.test(la[0]!)) bad(`${k}.${lang} 结尾的空格要和柠檬实验室一样`)
  }
  const zh = asList(w.zh)
  const en = asList(w.en)
  if (Array.isArray(w.zh) && zh.length !== en.length) bad(`${k} 的中英两份要一样多（${zh.length} / ${en.length}）`)
}
const W = st.words
const one = (k: string, lang: 'zh' | 'en') => {
  const v = W[k]?.[lang]
  return typeof v === 'string' ? v : ''
}
if (W['lemo-journal.head'] && one('lemo-journal.head', 'zh') !== one('lemo-journal.head', 'en')) bad('lemo-journal.head 的 zh、en 要写成一样（日志抬头不跟语言变，本身中英合写）')
for (const k of ['lemo-tone.voicePrompt', 'lemo-tone.voiceOffPrompt']) {
  if (W[k] && one(k, 'zh') !== one(k, 'en')) bad(`${k} 的 zh、en 要写成同一段英文（给模型看的，不跟界面语言变）`)
}
if (W['lemo-tone.voicePrompt'] && !/user'?s language/i.test(one('lemo-tone.voicePrompt', 'en'))) warn("lemo-tone.voicePrompt 里要说清楚用用户的语言回答（in the user's language）")
if (W['lemo-meter.brandSub'] && one('lemo-meter.brandSub', 'en') !== '') bad('lemo-meter.brandSub 的 en 要是空字符串（英文界面品牌名已经是英文）')
if (W['lemo-core.title'] && W['lemo-core.cmdTag']) {
  for (const lang of ['zh', 'en'] as const) if (one('lemo-core.cmdTag', lang) !== ` ${one('lemo-core.title', lang)} `) bad(`lemo-core.cmdTag.${lang} 要是「空格 + 风格名 + 空格」`)
}
for (const lang of ['zh', 'en'] as const) {
  if (W['lemo-core.title'] && one('lemo-core.title', lang) !== '{style}') bad(`lemo-core.title.${lang} 要写成 {style}（显示风格名，用户起了名字就是起的名字）`)
}
// 文字里提到自己的名字要用 {style}，不然用户起了名字这里还是原名。名字也是普通词的（磁带、灯塔）会误报，所以只是提醒
for (const [k, w] of Object.entries(W)) {
  for (const lang of ['zh', 'en'] as const) {
    for (const x of asList(w[lang])) if (x.includes(st.name[lang])) warn(`${k}.${lang} 里写着风格名「${st.name[lang]}」：是在叫自己的名字就换成 {style}，是普通词就不用管`)
  }
}
for (const k of ['lemo-meter.tbandCtx', 'lemo-meter.tbandQuota']) for (const lang of ['zh', 'en'] as const) if (width(one(k, lang)) > 8) bad(`${k}.${lang} 不超过 8 列`)
for (const lang of ['zh', 'en'] as const) if (width(one('lemo-meter.statusBrand', lang)) > 8) bad(`lemo-meter.statusBrand.${lang} 不超过 8 列`)
const ranks = W['lemo-lot.ranks']
if (ranks) for (const lang of ['zh', 'en'] as const) if (asList(ranks[lang]).length !== 6) bad(`lemo-lot.ranks.${lang} 要正好 6 个`)
const stamp = W['lemo-lot.stamp']
if (stamp) {
  const z = asList(stamp.zh)
  const e = asList(stamp.en)
  if (z.length !== 2 || z.some(x => [...x].length !== 2)) bad('lemo-lot.stamp.zh 要两行、每行两个字')
  if (e.length !== 2 || e.some(x => x.length > 5 || x.length === 0)) bad('lemo-lot.stamp.en 要两行、每行 1–5 个字母')
}
const lots = W['lemo-lot.lots']
if (lots) {
  for (const lang of ['zh', 'en'] as const) {
    const list = asList(lots[lang])
    if (list.length < 8) bad(`lemo-lot.lots.${lang} 至少 8 支签`)
    const tiers = new Set<string>()
    list.forEach((l, i) => {
      const parts = l.split('|')
      if (parts.length !== 3 || !/^[0-5]$/.test(parts[0]!) || parts[1]!.trim() === '' || parts[2]!.trim() === '') bad(`lemo-lot.lots.${lang} 第 ${i + 1} 支要写成「签级|签文|解签」，签级 0–5：${l}`)
      tiers.add(parts[0]!)
    })
    if (tiers.size < 4) warn(`lemo-lot.lots.${lang} 的签级太集中，好坏都要有`)
  }
  const zt = asList(lots.zh).map(l => l.split('|')[0])
  const et = asList(lots.en).map(l => l.split('|')[0])
  if (zt.join() !== et.join()) bad('lemo-lot.lots 中英两份要按顺序一一对应（同一支签签级一样）')
}
const spin = W['lemo-spinner.words']
if (spin) for (const lang of ['zh', 'en'] as const) {
  const l = asList(spin[lang])
  if (l.length < 4 || l.length > 8) bad(`lemo-spinner.words.${lang} 要 4–8 个`)
  if (l.some(x => width(x) > 18)) bad(`lemo-spinner.words.${lang} 每个不超过 18 列`)
}
// 风格的文字里别写柠檬实验室的东西
for (const [k, w] of Object.entries(W)) {
  if (st.id === 'lemon-lab') break
  const all = [...asList(w.zh), ...asList(w.en)].join(' ')
  if (/柠檬|Lemo Lab|lemon/i.test(all)) bad(`${k} 里还有柠檬实验室的字样`)
}

// ---------- 类型检查（只查这个风格的文件夹） ----------
try {
  const dir = mkdtempSync(join(tmpdir(), 'lemo-style-'))
  const cfg = join(dir, 'tsconfig.json')
  writeFileSync(cfg, JSON.stringify({
    extends: join(core, '.claude-plugin', 'types', 'tsconfig.json'),
    include: [join(core, 'styles', id, 'index.ts'), join(core, 'types')],
  }))
  const bunx = join(homedir(), '.bun', 'bin', 'bunx')
  execFileSync(existsSync(bunx) ? bunx : 'npx', [...(existsSync(bunx) ? [] : ['-y']), '-p', 'typescript@7.0.2', 'tsc', '-p', cfg], { encoding: 'utf8', stdio: 'pipe' })
} catch (err) {
  const out = `${(err as { stdout?: string }).stdout ?? ''}${(err as { stderr?: string }).stderr ?? ''}`.trim()
  bad(`类型检查没过：\n${out.split('\n').slice(0, 20).join('\n')}`)
}

for (const m of errors) console.log(`✘ ${m}`)
for (const m of warns) console.log(`△ ${m}`)
console.log(errors.length === 0 ? `✔ ${id}：没有错误（${warns.length} 条提醒）` : `✘ ${id}：${errors.length} 个错误，${warns.length} 条提醒`)
process.exit(errors.length === 0 ? 0 : 1)
