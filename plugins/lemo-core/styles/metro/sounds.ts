// 小火车的三个音效：合成参数，bun scripts/style-assets.ts metro 按它生成 assets/metro/*.wav
// tick 刷卡过闸机的「嘀」，done 列车到站的「叮咚」，deny 关门警示的蜂鸣
export default {
  // 闸机「嘀」：一声很短的高音电子提示，正弦为主，带一点方波的电子味
  tick: [
    { type: 'sine', f: 2093, a: 0.002, d: 0.05, g: 0.55 },
    { type: 'square', f: 2093, a: 0.002, d: 0.03, g: 0.05 },
  ],
  // 到站「叮咚」：两个柔和的钟片音，高音 G 落到降 E（大三度往下），各带一点泛音
  done: [
    { type: 'sine', f: 784, a: 0.006, d: 0.5, g: 0.5 },
    { type: 'sine', f: 1568, a: 0.004, d: 0.16, g: 0.1 },
    { type: 'triangle', f: 784, a: 0.006, d: 0.22, g: 0.07 },
    { type: 'sine', f: 622, t: 0.3, a: 0.006, d: 0.68, g: 0.55 },
    { type: 'sine', f: 1244, t: 0.3, a: 0.004, d: 0.2, g: 0.1 },
    { type: 'triangle', f: 622, t: 0.3, a: 0.006, d: 0.28, g: 0.07 },
  ],
  // 关门警示：三下低沉发毛的「嘟」，方波加锯齿波
  deny: [
    { type: 'square', f: 523, a: 0.008, d: 0.08, g: 0.3 },
    { type: 'sawtooth', f: 262, a: 0.008, d: 0.08, g: 0.22 },
    { type: 'square', f: 523, t: 0.12, a: 0.008, d: 0.08, g: 0.3 },
    { type: 'sawtooth', f: 262, t: 0.12, a: 0.008, d: 0.08, g: 0.22 },
    { type: 'square', f: 523, t: 0.24, a: 0.008, d: 0.1, g: 0.3 },
    { type: 'sawtooth', f: 262, t: 0.24, a: 0.008, d: 0.1, g: 0.22 },
  ],
}
