// 三角尺的三个音效：合成参数，bun scripts/style-assets.ts blueprint 按它生成 assets/blueprint/*.wav
// 笃：铅笔在图板上轻点一下。盖章：审图章落在纸上「咚」一下，跟着一声「通过」的叮。擦掉：橡皮来回擦三下，吱吱响
export default {
  // 调工具：笔尖敲纸的一下脆响，加一点木头图板的闷声
  tick: [
    { kind: 'noise', type: 'bandpass', f: 3200, q: 2.5, a: 0.001, d: 0.02, g: 0.6 },
    { type: 'sine', f: 1100, f2: 700, a: 0.001, d: 0.025, g: 0.25 },
    { type: 'sine', f: 320, a: 0.001, d: 0.03, g: 0.2 },
  ],
  // 一轮完成：章身砸下去的低音和纸面的拍击声，然后往上两声「叮—叮」表示通过
  done: [
    { type: 'sine', f: 170, f2: 55, a: 0.002, d: 0.16, g: 0.9 },
    { kind: 'noise', type: 'lowpass', f: 900, a: 0.001, d: 0.07, g: 0.5 },
    { kind: 'noise', type: 'bandpass', f: 2200, q: 1.5, a: 0.001, d: 0.025, g: 0.25 },
    { type: 'triangle', f: 1568, t: 0.14, d: 0.45, g: 0.32 },
    { type: 'sine', f: 2093, t: 0.2, d: 0.5, g: 0.28 },
  ],
  // 拦截：橡皮来回擦三下，每下音高一滑（上、下、上），底下是橡皮磨纸的沙沙声
  deny: [
    { type: 'triangle', f: 1050, f2: 1450, a: 0.012, d: 0.06, g: 0.4 },
    { type: 'sawtooth', f: 1050, f2: 1450, a: 0.012, d: 0.05, g: 0.1 },
    { type: 'triangle', f: 1350, f2: 950, t: 0.09, a: 0.012, d: 0.06, g: 0.4 },
    { type: 'sawtooth', f: 1350, f2: 950, t: 0.09, a: 0.012, d: 0.05, g: 0.1 },
    { type: 'triangle', f: 1100, f2: 1500, t: 0.18, a: 0.012, d: 0.07, g: 0.4 },
    { type: 'sawtooth', f: 1100, f2: 1500, t: 0.18, a: 0.012, d: 0.06, g: 0.1 },
    { kind: 'noise', type: 'bandpass', f: 1800, q: 2, a: 0.03, d: 0.22, g: 0.18 },
  ],
}
