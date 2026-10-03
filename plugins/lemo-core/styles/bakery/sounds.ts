// 面包的三个音效：合成参数，bun scripts/style-assets.ts bakery 按它生成 assets/bakery/*.wav
// 每层是一个振荡器或一段滤过的噪声，参数含义见 scripts/style-assets.ts 的 Layer
export default {
  // 拍面团的一声「噗」：闷闷的低频一下，带一点手掌拍上去的面
  tick: [
    { kind: 'noise', type: 'lowpass', f: 700, q: 0, a: 0.002, d: 0.045, g: 0.9 },
    { f: 160, f2: 90, d: 0.06, g: 0.6 },
    { kind: 'noise', type: 'bandpass', f: 1800, q: 1.2, d: 0.012, g: 0.25 },
  ],
  // 烤箱定时器的「叮」：一声小铃，带铃的泛音和敲击的一下
  done: [
    { kind: 'noise', type: 'highpass', f: 5000, q: 0, d: 0.012, g: 0.3 },
    { f: 1568, a: 0.002, d: 0.95, g: 0.5 },
    { f: 3150, a: 0.002, d: 0.45, g: 0.08 },
    { f: 4328, a: 0.002, d: 0.3, g: 0.1 },
    { f: 784, a: 0.004, d: 0.6, g: 0.08 },
  ],
  // 烤焦了的蜂鸣「哔—哔」：两个相近的方波打出粗糙的拍频，响两下
  deny: [
    { type: 'square', f: 349, a: 0.006, d: 0.17, g: 0.3 },
    { type: 'square', f: 370, a: 0.006, d: 0.17, g: 0.22 },
    { type: 'square', f: 349, t: 0.22, a: 0.006, d: 0.2, g: 0.3 },
    { type: 'square', f: 370, t: 0.22, a: 0.006, d: 0.2, g: 0.22 },
  ],
}
