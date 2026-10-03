// 篝火的三个音效：合成参数，bun scripts/style-assets.ts campfire 按它生成 assets/campfire/*.wav
// 层的写法见 scripts/style-assets.ts：振荡器 { type, f, f2, t, a, d, g }，噪声 { kind: 'noise', type, f, f2, q, t, a, d, g }
// 弦：G 大调和弦五根弦，三角波打底（暖），二倍频只在拨下去那一下亮一亮，再加一点指尖擦弦的噪声
const string = (f: number, t: number, g: number) => [
  { type: 'triangle' as const, f, t, a: 0.003, d: 1, g },
  { type: 'sine' as const, f: f * 2, t, a: 0.003, d: 0.22, g: g * 0.35 },
  { type: 'sine' as const, f: f * 3, t, a: 0.002, d: 0.1, g: g * 0.15 },
  { kind: 'noise' as const, type: 'bandpass' as const, f: 3000, q: 0.8, t, a: 0.001, d: 0.008, g: g * 0.25 },
]

export default {
  // 噼啪：柴火里爆开的两三声，短促的滤波噪声，底下一点木头的闷响
  tick: [
    { kind: 'noise', type: 'bandpass', f: 2400, q: 1.2, a: 0.001, d: 0.012, g: 0.8 },
    { type: 'sine', f: 140, f2: 90, a: 0.002, d: 0.03, g: 0.12 },
    { kind: 'noise', type: 'highpass', f: 3800, q: 0, t: 0.026, a: 0.001, d: 0.007, g: 0.45 },
    { kind: 'noise', type: 'bandpass', f: 1300, q: 1.5, t: 0.048, a: 0.001, d: 0.012, g: 0.5 },
  ],
  // 拨弦：火边拨响一个 G 大调和弦，从低音弦往上扫
  done: [
    ...string(196, 0, 0.26),
    ...string(246.9, 0.03, 0.22),
    ...string(293.7, 0.06, 0.2),
    ...string(392, 0.09, 0.18),
    ...string(493.9, 0.12, 0.16),
  ],
  // 嘶啦：一瓢水浇在炭上。先是水落下的闷响，接着一长声往下沉的嘶嘶，最后炭里爆一下
  deny: [
    { kind: 'noise', type: 'lowpass', f: 700, q: 0, a: 0.003, d: 0.07, g: 0.55 },
    { type: 'sine', f: 160, f2: 90, a: 0.002, d: 0.06, g: 0.25 },
    { kind: 'noise', type: 'highpass', f: 5000, f2: 2600, q: 0, t: 0.02, a: 0.05, d: 0.45, g: 0.7 },
    { kind: 'noise', type: 'highpass', f: 3600, f2: 2400, q: 0, t: 0.12, a: 0.05, d: 0.35, g: 0.3 },
    { kind: 'noise', type: 'bandpass', f: 7000, f2: 4000, q: 1, t: 0.03, a: 0.05, d: 0.35, g: 0.4 },
    { kind: 'noise', type: 'bandpass', f: 1800, q: 4, t: 0.2, a: 0.001, d: 0.01, g: 0.3 },
  ],
}
