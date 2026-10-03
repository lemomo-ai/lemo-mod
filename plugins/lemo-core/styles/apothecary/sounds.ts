// 葫芦的三个音效：合成参数，bun scripts/style-assets.ts apothecary 按它生成 assets/apothecary/*.wav
// 药斗木抽屉「咔嗒」、铜戥子上的小铃「叮铃」、铁药碾在槽里滚一下「咕隆」
export default {
  // 药斗「咔嗒」：木抽屉拉开一声轻响，紧跟着碰到头的一下
  // 开头一下很短的木头声定住峰值，整体就轻一些（脚本会把峰值统一放到 0.85，每次调工具都响，要轻）
  tick: [
    { kind: 'noise', type: 'highpass', f: 2500, d: 0.004, g: 0.9 },
    { kind: 'noise', type: 'bandpass', f: 1300, q: 2, d: 0.018, g: 0.25 },
    { f: 430, f2: 380, d: 0.04, g: 0.22 },
    { kind: 'noise', type: 'bandpass', f: 2600, q: 3, t: 0.045, d: 0.012, g: 0.18 },
    { f: 620, t: 0.045, d: 0.025, g: 0.1 },
  ],
  // 戥子小铃「叮铃」：铜铃碰两下，第二下高一点
  done: [
    { kind: 'noise', type: 'highpass', f: 5000, d: 0.01, g: 0.12 },
    { f: 2093, a: 0.002, d: 0.7, g: 0.3 },
    { f: 2093 * 2.41, a: 0.002, d: 0.35, g: 0.1 },
    { kind: 'noise', type: 'highpass', f: 5000, t: 0.15, d: 0.01, g: 0.1 },
    { f: 2637, t: 0.15, a: 0.002, d: 0.85, g: 0.28 },
    { f: 2637 * 2.41, t: 0.15, a: 0.002, d: 0.4, g: 0.09 },
  ],
  // 药碾「咕隆」：铁碾轮在槽里滚过去，咯噔几下，最后撞在槽头上「咚」一声。
  // 都放在中低频（笔记本喇叭放不出太低的音）
  deny: [
    { kind: 'noise', type: 'bandpass', f: 520, f2: 340, q: 1.5, a: 0.03, d: 0.3, g: 0.45 },
    { kind: 'noise', type: 'bandpass', f: 430, q: 4, d: 0.04, g: 0.6 },
    { f: 190, d: 0.05, g: 0.3 },
    { kind: 'noise', type: 'bandpass', f: 400, q: 4, t: 0.08, d: 0.04, g: 0.6 },
    { f: 180, t: 0.08, d: 0.05, g: 0.3 },
    { kind: 'noise', type: 'bandpass', f: 370, q: 4, t: 0.16, d: 0.04, g: 0.6 },
    { f: 170, t: 0.16, d: 0.05, g: 0.3 },
    { f: 160, f2: 92, t: 0.26, d: 0.22, g: 0.4 },
    { kind: 'noise', type: 'bandpass', f: 900, q: 2, t: 0.26, d: 0.03, g: 0.4 },
    { f: 640, t: 0.26, d: 0.09, g: 0.12 },
  ],
}
