// 灯笼的三个音效：合成参数，bun scripts/style-assets.ts night-market 按它生成 assets/night-market/*.wav
// 每层是一个振荡器或一段滤过的噪声，参数含义见 scripts/style-assets.ts 的 Layer
export default {
  // 摊头小铃铛的「叮铃」：两下很快的金属小响，带一点铃铛里的沙沙声
  tick: [
    { f: 3300, a: 0.001, d: 0.045, g: 0.35 },
    { f: 4950, a: 0.001, d: 0.03, g: 0.18 },
    { kind: 'noise', type: 'bandpass', f: 7000, q: 4, d: 0.035, g: 0.3 },
    { f: 3600, t: 0.03, a: 0.001, d: 0.045, g: 0.3 },
    { kind: 'noise', type: 'bandpass', f: 7200, q: 4, t: 0.03, d: 0.035, g: 0.22 },
  ],
  // 收摊前的一声「当」：像锣但软一些，低一点的基音往下沉，带几个不成倍数的泛音，起音不硬
  done: [
    { kind: 'noise', type: 'lowpass', f: 800, q: 0, d: 0.03, g: 0.12 },
    { f: 392, f2: 380, a: 0.008, d: 1.0, g: 0.5 },
    { f: 792, f2: 776, a: 0.008, d: 0.7, g: 0.18 },
    { f: 1082, a: 0.006, d: 0.45, g: 0.1 },
    { f: 1595, a: 0.004, d: 0.25, g: 0.05 },
  ],
  // 梆子的「哒哒」：两下木头敲木头，第二下低一点，一听就是「停」
  deny: [
    { kind: 'noise', type: 'bandpass', f: 2400, q: 2, a: 0.001, d: 0.015, g: 0.5 },
    { f: 1240, f2: 1180, a: 0.001, d: 0.05, g: 0.6 },
    { kind: 'noise', type: 'bandpass', f: 2100, q: 2, t: 0.15, a: 0.001, d: 0.015, g: 0.5 },
    { f: 1050, f2: 990, t: 0.15, a: 0.001, d: 0.07, g: 0.6 },
  ],
}
