// 小苗的三个音效：合成参数，bun scripts/style-assets.ts greenhouse 按它生成 assets/greenhouse/*.wav
// 层的写法见 scripts/style-assets.ts：振荡器 { type, f, f2, t, a, d, g }，噪声 { kind: 'noise', type, f, f2, q, t, a, d, g }
export default {
  // 滴：一滴水落进盆里。正弦往上滑（水滴的「噗哩」），再带一点很轻的高音余响
  tick: [
    { type: 'sine', f: 1250, f2: 2500, a: 0.002, d: 0.045, g: 0.6 },
    { type: 'sine', f: 2500, f2: 2800, t: 0.014, a: 0.002, d: 0.03, g: 0.12 },
  ],
  // 花开：软起音的上行分解和弦（D 大调五声），一朵一朵打开，最后一点高处的亮光
  done: [
    { type: 'sine', f: 587.3, a: 0.012, d: 0.5, g: 0.38 },
    { type: 'sine', f: 1174.7, a: 0.012, d: 0.2, g: 0.07 },
    { type: 'sine', f: 880, t: 0.09, a: 0.012, d: 0.5, g: 0.36 },
    { type: 'sine', f: 1760, t: 0.09, a: 0.012, d: 0.2, g: 0.06 },
    { type: 'sine', f: 1174.7, t: 0.18, a: 0.012, d: 0.55, g: 0.34 },
    { type: 'sine', f: 2349.3, t: 0.18, a: 0.012, d: 0.22, g: 0.05 },
    { type: 'sine', f: 1480, t: 0.28, a: 0.015, d: 0.8, g: 0.32 },
    { type: 'sine', f: 2960, t: 0.28, a: 0.015, d: 0.3, g: 0.05 },
    { type: 'sine', f: 2217.5, t: 0.36, a: 0.02, d: 0.45, g: 0.06 },
  ],
  // 咔嚓：修枝剪。「咔」是刀片咬合的短促金属声，「嚓」是剪断的脆响，带一点钢片的余振
  deny: [
    { kind: 'noise', type: 'bandpass', f: 3400, q: 2.5, a: 0.001, d: 0.03, g: 1 },
    { type: 'square', f: 2150, f2: 1800, a: 0.001, d: 0.03, g: 0.12 },
    { kind: 'noise', type: 'highpass', f: 2600, q: 0, t: 0.085, a: 0.001, d: 0.075, g: 0.7 },
    { kind: 'noise', type: 'bandpass', f: 1500, q: 2, t: 0.085, a: 0.001, d: 0.05, g: 0.45 },
    { type: 'sine', f: 230, f2: 140, t: 0.085, a: 0.001, d: 0.07, g: 0.35 },
    { type: 'sine', f: 3380, t: 0.09, a: 0.002, d: 0.16, g: 0.045 },
    { type: 'sine', f: 4710, t: 0.09, a: 0.002, d: 0.12, g: 0.03 },
  ],
}
