// 邮筒的三个音效：合成参数，bun scripts/style-assets.ts post-office 按它生成 assets/post-office/*.wav
// tick 盖邮戳的「咚」，done 邮差自行车铃的「叮铃」，deny 退信时两下闷响
export default {
  // 盖邮戳「咚」：橡皮戳按在木柜台上，一声短而发木的闷响，带一点纸面的摩擦
  tick: [
    { type: 'triangle', f: 440, f2: 250, a: 0.002, d: 0.05, g: 0.6 },
    { type: 'sine', f: 180, f2: 120, a: 0.002, d: 0.05, g: 0.4 },
    { kind: 'noise', type: 'bandpass', f: 1400, q: 1.2, a: 0.001, d: 0.02, g: 0.35 },
  ],
  // 自行车铃「叮铃」：拇指拨两下，金属铃的几个不成倍数的泛音，两个挨得很近的频率让铃声发颤
  done: [
    { type: 'sine', f: 1760, a: 0.002, d: 0.42, g: 0.4 },
    { type: 'sine', f: 1771, a: 0.002, d: 0.42, g: 0.25 },
    { type: 'sine', f: 2560, a: 0.002, d: 0.26, g: 0.18 },
    { type: 'sine', f: 3740, a: 0.002, d: 0.14, g: 0.08 },
    { kind: 'noise', type: 'highpass', f: 5000, q: 0, a: 0.001, d: 0.012, g: 0.15 },
    { type: 'sine', f: 1760, t: 0.15, a: 0.002, d: 0.62, g: 0.38 },
    { type: 'sine', f: 1771, t: 0.15, a: 0.002, d: 0.62, g: 0.24 },
    { type: 'sine', f: 2560, t: 0.15, a: 0.002, d: 0.34, g: 0.16 },
    { type: 'sine', f: 3740, t: 0.15, a: 0.002, d: 0.18, g: 0.07 },
    { kind: 'noise', type: 'highpass', f: 5000, q: 0, t: 0.15, a: 0.001, d: 0.012, g: 0.13 },
  ],
  // 退信：两下又低又闷的「咚、咚」，像一包信被扔回柜台（比盖邮戳低、长，而且是两下）
  deny: [
    { type: 'sine', f: 200, f2: 90, a: 0.003, d: 0.13, g: 0.7 },
    { type: 'triangle', f: 320, f2: 160, a: 0.003, d: 0.09, g: 0.35 },
    { kind: 'noise', type: 'lowpass', f: 700, q: 0, a: 0.002, d: 0.06, g: 0.4 },
    { type: 'sine', f: 185, f2: 80, t: 0.2, a: 0.003, d: 0.16, g: 0.75 },
    { type: 'triangle', f: 300, f2: 145, t: 0.2, a: 0.003, d: 0.1, g: 0.35 },
    { kind: 'noise', type: 'lowpass', f: 650, q: 0, t: 0.2, a: 0.002, d: 0.07, g: 0.4 },
  ],
}
