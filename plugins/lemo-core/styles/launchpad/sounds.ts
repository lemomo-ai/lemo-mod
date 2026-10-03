// 火箭的三个音效：合成参数，bun scripts/style-assets.ts launchpad 按它生成 assets/launchpad/*.wav
// 哔：遥测的一声短哔。升空：一股往上冲的呼啸，接两声「到了」的提示音。警报：两个音来回切的中止警报
export default {
  // 调工具：一声很短的遥测「哔」，正弦打底，叠一点方波让它像仪器
  tick: [
    { type: 'sine', f: 1760, a: 0.002, d: 0.06, g: 0.45 },
    { type: 'square', f: 1760, a: 0.002, d: 0.05, g: 0.12 },
  ],
  // 一轮完成：带通噪声从低扫到高（呼啸往上走），底下一股上升的轰鸣，然后「嘀—嘀」两声往上的提示音
  done: [
    { kind: 'noise', type: 'bandpass', f: 250, f2: 3200, q: 1.2, a: 0.2, d: 0.3, g: 1 },
    { type: 'sawtooth', f: 70, f2: 140, a: 0.1, d: 0.35, g: 0.2 },
    { type: 'sine', f: 1319, t: 0.46, d: 0.14, g: 0.4 },
    { type: 'sine', f: 1976, t: 0.58, d: 0.38, g: 0.42 },
  ],
  // 拦截：方波在高低两个音之间来回切四下，像中止警报
  deny: [
    { type: 'square', f: 880, a: 0.01, d: 0.1, g: 0.3 },
    { type: 'square', f: 622, t: 0.13, a: 0.01, d: 0.1, g: 0.3 },
    { type: 'square', f: 880, t: 0.26, a: 0.01, d: 0.1, g: 0.3 },
    { type: 'square', f: 622, t: 0.39, a: 0.01, d: 0.12, g: 0.3 },
  ],
}
