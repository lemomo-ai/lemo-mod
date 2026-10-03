// 打字机的三个音效：合成参数，bun scripts/style-assets.ts newsroom 按它生成 assets/newsroom/*.wav
export default {
  // 咔哒：打字机按一个键。字锤打在滚筒上的脆响，滚筒的闷声，键弹回来的一下轻响
  tick: [
    { kind: 'noise', type: 'bandpass', f: 3200, q: 2.5, a: 0.001, d: 0.012, g: 0.7 },
    { kind: 'noise', type: 'bandpass', f: 1400, q: 1.2, t: 0.004, a: 0.001, d: 0.03, g: 0.5 },
    { f: 320, f2: 160, t: 0.003, a: 0.001, d: 0.03, g: 0.25 },
    { kind: 'noise', type: 'highpass', f: 5000, t: 0.045, a: 0.001, d: 0.006, g: 0.2 },
  ],
  // 叮：字车走到头的小铃。一个主音加一个稍微走调的音（铃的颤音），再加一个不成倍数的高泛音
  done: [
    { kind: 'noise', type: 'highpass', f: 6000, a: 0.001, d: 0.01, g: 0.2 },
    { f: 1568, a: 0.002, d: 0.9, g: 0.35 },
    { f: 1576, a: 0.002, d: 0.8, g: 0.15 },
    { f: 4330, a: 0.001, d: 0.25, g: 0.12 },
  ],
  // 退稿章：橡皮章重重盖两下，低沉的「砰、砰」
  deny: [
    { kind: 'noise', type: 'lowpass', f: 700, a: 0.001, d: 0.09, g: 0.8 },
    { f: 150, f2: 60, a: 0.002, d: 0.18, g: 0.6 },
    { kind: 'noise', type: 'bandpass', f: 2200, q: 1, a: 0.001, d: 0.025, g: 0.35 },
    { kind: 'noise', type: 'lowpass', f: 700, t: 0.2, a: 0.001, d: 0.09, g: 0.65 },
    { f: 140, f2: 55, t: 0.2, a: 0.002, d: 0.18, g: 0.5 },
    { kind: 'noise', type: 'bandpass', f: 2200, q: 1, t: 0.2, a: 0.001, d: 0.025, g: 0.3 },
  ],
}
