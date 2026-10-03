// 泡泡鱼的三个音效：合成参数，bun scripts/style-assets.ts aquarium 按它生成 assets/aquarium/*.wav
// 层的写法见 scripts/style-assets.ts：振荡器 { type, f, f2, t, a, d, g }，噪声 { kind: 'noise', type, f, f2, q, t, a, d, g }
// 玻璃铃：一个正弦配一个差几赫兹的正弦（拍频，玻璃那种微微的颤），再加两个不成倍数的泛音（玻璃杯的「叮」）
const glass = (f: number, t: number, d: number, g: number) => [
  { type: 'sine' as const, f, t, a: 0.003, d, g },
  { type: 'sine' as const, f: f + 2.2, t, a: 0.003, d, g: g * 0.45 },
  { type: 'sine' as const, f: f * 2.76, t, a: 0.002, d: d * 0.25, g: g * 0.2 },
  { type: 'sine' as const, f: f * 5.4, t, a: 0.001, d: d * 0.1, g: g * 0.08 },
]
// 敲缸：指节敲在玻璃上的闷响，往下沉的低音加一点指节碰撞的噪声，玻璃本身只轻轻嗡一下
const knock = (f: number, t: number) => [
  { type: 'sine' as const, f, f2: f * 0.65, t, a: 0.002, d: 0.09, g: 0.7 },
  { kind: 'noise' as const, type: 'lowpass' as const, f: 900, q: 0, t, a: 0.001, d: 0.025, g: 0.45 },
  { type: 'sine' as const, f: 1450, t, a: 0.001, d: 0.06, g: 0.05 },
  { type: 'sine' as const, f: 2380, t, a: 0.001, d: 0.04, g: 0.03 },
]

export default {
  // 啵：一颗气泡冒上来，低音往上滑（比温室的水滴低、圆），后面跟一颗更小的
  tick: [
    { type: 'sine', f: 360, f2: 900, a: 0.003, d: 0.05, g: 0.6 },
    { kind: 'noise', type: 'lowpass', f: 1200, q: 0, a: 0.001, d: 0.008, g: 0.1 },
    { type: 'sine', f: 560, f2: 1300, t: 0.035, a: 0.002, d: 0.03, g: 0.25 },
  ],
  // 叮铃：两声玻璃铃往上走（B5 → E6），最后高处一点余光
  done: [
    ...glass(987.8, 0, 0.7, 0.3),
    ...glass(1318.5, 0.13, 0.9, 0.3),
    ...glass(1975.5, 0.26, 0.6, 0.12),
  ],
  // 咚咚：敲两下缸壁，第二下低一点
  deny: [
    ...knock(200, 0),
    ...knock(180, 0.16),
  ],
}
