// 磁带的三个音效：合成参数，bun scripts/style-assets.ts mixtape 按它生成 assets/mixtape/*.wav
// 沿用第一轮提案里用户听过的那一版（「咔」、倒带、「哔哔」）
export default {
  // 咔：随身听的按键按下去，低沉的一声「咔」，尾巴上一点机械的脆响
  tick: [
    { kind: 'noise', type: 'lowpass', f: 900, d: 0.035, g: 0.6 },
    { f: 120, f2: 60, d: 0.07, g: 0.35 },
    { kind: 'noise', type: 'highpass', f: 4000, t: 0.05, d: 0.008, g: 0.25 },
  ],
  // 倒带：带子越转越快的「呜——」，转到头停住，「咔」一声
  done: [
    { type: 'sawtooth', f: 160, f2: 1100, a: 0.05, d: 0.6, g: 0.08 },
    { kind: 'noise', type: 'bandpass', f: 3000, q: 0.7, a: 0.05, d: 0.6, g: 0.05 },
    { kind: 'noise', type: 'lowpass', f: 900, t: 0.7, d: 0.04, g: 0.6 },
    { f: 110, f2: 55, t: 0.7, d: 0.08, g: 0.35 },
  ],
  // 哔哔：录音机报警，两声短促的方波
  deny: [
    { type: 'square', f: 988, d: 0.09, g: 0.1 },
    { type: 'square', f: 988, t: 0.17, d: 0.09, g: 0.1 },
  ],
}
