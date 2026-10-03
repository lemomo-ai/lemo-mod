// 给一个风格生成素材：面板头部的图标（从像素小画的第一帧放大）和三个音效（按 sounds.ts 里的合成参数）。
//   bun scripts/style-assets.ts <风格 id>
// 读 plugins/lemo-core/styles/<id>/index.ts（风格数据）和 sounds.ts（音效参数），
// 写 plugins/lemo-core/assets/<id>/icon.png、tick.wav、done.wav、deny.wav。
// 柠檬实验室的素材是另外做的，不用这个脚本。
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

/**
 * 一层声音。tone 是振荡器，noise 是滤过的白噪声；几层叠在一起就是一个音效。
 * 最后按柠檬实验室同一种音效的响度统一缩放，层里的 g 只管各层之间谁响谁轻。
 * 时间单位是秒：t 什么时候开始，a 起音多久（音量从几乎 0 指数升到 g），d 再用多久指数降回几乎 0。
 * f2 有值时，频率（noise 是滤波器的频率）在 a+d 里指数滑到 f2。和浏览器 Web Audio 的同名参数一个意思。
 */
export type ToneLayer = { kind?: 'tone'; type?: 'sine' | 'triangle' | 'square' | 'sawtooth'; f: number; f2?: number; t?: number; a?: number; d: number; g: number }
/** q：bandpass 是品质因数（越大越窄）；lowpass、highpass 是共振，单位 dB（Web Audio 的规定） */
export type NoiseLayer = { kind: 'noise'; type?: 'bandpass' | 'lowpass' | 'highpass'; f?: number; f2?: number; q?: number; t?: number; a?: number; d: number; g: number }
export type Layer = ToneLayer | NoiseLayer
/** 三个音效：调工具时（要很短）、一轮正常答完、拦下命令 */
export type SoundSpec = { tick: readonly Layer[]; done: readonly Layer[]; deny: readonly Layer[] }

const RATE = 44100
const LEAD = 0.01

// 每种音效的响度照柠檬实验室的同一种来（最响的 50 毫秒的均方根），新风格不会比它响一截。
// 量的是 assets/lemon-lab/*.wav；峰值最多到 0.95
const LOUD: Record<'tick' | 'done' | 'deny', number> = { tick: 0.056, done: 0.197, deny: 0.15 }

function loudest(x: Float32Array): number {
  const w = Math.floor(RATE * 0.05)
  let best = 0
  for (let k = 0; k + w <= Math.max(w, x.length); k += Math.floor(w / 4)) {
    let sum = 0
    let n = 0
    for (let i = k; i < Math.min(x.length, k + w); i++) { sum += (x[i] ?? 0) ** 2; n++ }
    if (n > 0) best = Math.max(best, Math.sqrt(sum / n))
  }
  return best
}

function render(layers: readonly Layer[], seed: number, kind: 'tick' | 'done' | 'deny'): Float32Array {
  const end = Math.max(...layers.map(l => (l.t ?? 0) + (l.a ?? (l.kind === 'noise' ? 0.002 : 0.004)) + l.d)) + LEAD + 0.03
  const out = new Float32Array(Math.ceil(end * RATE))
  let rnd = seed >>> 0
  const random = () => {
    rnd = (rnd * 1664525 + 1013904223) >>> 0
    return rnd / 4294967296
  }
  for (const l of layers) {
    const a = l.a ?? (l.kind === 'noise' ? 0.002 : 0.004)
    const t0 = LEAD + (l.t ?? 0)
    const len = a + l.d
    const start = Math.floor(t0 * RATE)
    const n = Math.ceil(len * RATE)
    const env = (s: number) => {
      const x = s / RATE
      const lo = 0.0001
      return x < a ? lo * Math.pow(l.g / lo, x / a) : l.g * Math.pow(lo / l.g, Math.min(1, (x - a) / l.d))
    }
    const freq = (f: number, f2: number | undefined, s: number) => (f2 === undefined ? f : f * Math.pow(f2 / f, Math.min(1, s / RATE / len)))
    if (l.kind === 'noise') {
      const type = l.type ?? 'bandpass'
      const q = l.q ?? 1
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0
      let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0
      for (let s = 0; s < n; s++) {
        if (s % 32 === 0) {
          const f = Math.min(RATE / 2 - 100, freq(l.f ?? 1000, l.f2, s))
          const w = (2 * Math.PI * f) / RATE
          const cos = Math.cos(w)
          const qq = type === 'bandpass' ? Math.max(0.0001, q) : Math.pow(10, q / 20)
          const alpha = Math.sin(w) / (2 * qq)
          const a0 = 1 + alpha
          if (type === 'lowpass') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2 }
          else if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2 }
          else { b0 = alpha; b1 = 0; b2 = -alpha }
          b0 /= a0; b1 /= a0; b2 /= a0; a1 = (-2 * cos) / a0; a2 = (1 - alpha) / a0
        }
        const x = random() * 2 - 1
        const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2 = x1; x1 = x; y2 = y1; y1 = y
        const i = start + s
        if (i < out.length) out[i] = (out[i] ?? 0) + y * env(s)
      }
    } else {
      const type = l.type ?? 'sine'
      let phase = 0
      for (let s = 0; s < n; s++) {
        phase += freq(l.f, l.f2, s) / RATE
        const p = phase % 1
        const v = type === 'square' ? (p < 0.5 ? 1 : -1) : type === 'sawtooth' ? 2 * p - 1 : type === 'triangle' ? 1 - 4 * Math.abs(p - 0.5) : Math.sin(2 * Math.PI * p)
        const i = start + s
        if (i < out.length) out[i] = (out[i] ?? 0) + v * env(s)
      }
    }
  }
  // 叠起来可能超过 1：先软限幅，再按柠檬实验室同一种音效的响度缩放（峰值最多 0.95）
  let peak = 0
  for (let i = 0; i < out.length; i++) {
    const v = Math.tanh((out[i] ?? 0) * 1.2)
    out[i] = v
    peak = Math.max(peak, Math.abs(v))
  }
  const rms = loudest(out)
  const k = rms > 0 && peak > 0 ? Math.min(LOUD[kind] / rms, 0.95 / peak) : 1
  for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) * k
  return out
}

function wav(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2))
  const head = Buffer.alloc(44)
  head.write('RIFF', 0)
  head.writeUInt32LE(36 + data.length, 4)
  head.write('WAVE', 8)
  head.write('fmt ', 12)
  head.writeUInt32LE(16, 16)
  head.writeUInt16LE(1, 20)
  head.writeUInt16LE(1, 22)
  head.writeUInt32LE(RATE, 24)
  head.writeUInt32LE(RATE * 2, 28)
  head.writeUInt16LE(2, 32)
  head.writeUInt16LE(16, 34)
  head.write('data', 36)
  head.writeUInt32LE(data.length, 40)
  return Buffer.concat([head, data])
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (const b of buf) c = (CRC[(c ^ b) & 255] ?? 0) ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type: string, body: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32LE(0)
  len.writeUInt32BE(body.length)
  const tb = Buffer.concat([Buffer.from(type, 'ascii'), body])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(tb))
  return Buffer.concat([len, tb, crc])
}

/** 像素小画的一帧放大成 120×120 的透明底 PNG（终端面板头部按 6 列 × 3 行显示，大约是方的） */
export function iconPng(palette: Readonly<Record<string, string>>, frame: readonly string[], size = 120): Buffer {
  const cols = Math.max(...frame.map(r => r.length))
  const rows = frame.length
  const scale = Math.floor(Math.min(size / cols, size / rows))
  const ox = Math.floor((size - cols * scale) / 2)
  const oy = Math.floor((size - rows * scale) / 2)
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const px = Math.floor((x - ox) / scale)
      const py = Math.floor((y - oy) / scale)
      const hex = x >= ox && y >= oy && py < rows && px < cols ? palette[frame[py]?.[px] ?? '.'] : undefined
      if (hex === undefined) continue
      const n = parseInt(hex.slice(1), 16)
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = (n >> 16) & 255
      raw[o + 1] = (n >> 8) & 255
      raw[o + 2] = n & 255
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

if (import.meta.main) {
  const id = process.argv[2]
  if (id === undefined) {
    console.error('usage: bun scripts/style-assets.ts <style-id>')
    process.exit(1)
  }
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const dir = join(root, 'plugins', 'lemo-core', 'styles', id)
  const mod = (await import(join(dir, 'index.ts'))) as Record<string, unknown>
  const style = Object.values(mod).find(v => typeof v === 'object' && v !== null && (v as { id?: unknown }).id === id) as
    | { sprite: { palette: Record<string, string>; frames: string[][] } | null }
    | undefined
  if (style === undefined) {
    console.error(`no style with id "${id}" exported from ${dir}/index.ts`)
    process.exit(1)
  }
  const spec = ((await import(join(dir, 'sounds.ts'))) as { default: SoundSpec }).default
  const out = join(root, 'plugins', 'lemo-core', 'assets', id)
  mkdirSync(out, { recursive: true })
  const seed = [...id].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7)
  for (const name of ['tick', 'done', 'deny'] as const) {
    const layers = spec[name]
    if (!Array.isArray(layers) || layers.length === 0) {
      console.error(`sounds.ts: "${name}" needs at least one layer`)
      process.exit(1)
    }
    const s = render(layers, seed + name.length, name)
    writeFileSync(join(out, `${name}.wav`), wav(s))
    console.log(`${name}.wav  ${(s.length / RATE).toFixed(2)} s`)
  }
  if (style.sprite !== null && style.sprite.frames[0] !== undefined) {
    writeFileSync(join(out, 'icon.png'), iconPng(style.sprite.palette, style.sprite.frames[0]))
    console.log('icon.png  from sprite frame 1')
  } else console.log('no sprite: no icon.png')
}
