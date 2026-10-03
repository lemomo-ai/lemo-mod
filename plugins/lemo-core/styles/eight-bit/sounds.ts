// 掌机的三个音效：合成参数，bun scripts/style-assets.ts eight-bit 按它生成 assets/eight-bit/*.wav
// 全用方波，像老掌机的芯片音
export default {
  // 哔：极短的一声高音方波
  tick: [{ type: 'square', f: 1175, a: 0.001, d: 0.03, g: 0.2 }],
  // 金币：吃到金币那种上扬两音，先短后长
  done: [
    { type: 'square', f: 880, a: 0.002, d: 0.07, g: 0.2 },
    { type: 'square', f: 1319, t: 0.075, a: 0.002, d: 0.5, g: 0.2 },
  ],
  // 嗡：低沉的方波，每隔 5 个周期（约 0.045 秒）再起一下，连成一声发毛的「嗡——」。
  // 起点都落在 110 Hz 的整周期上，叠起来不互相抵消；底下垫一层低八度
  deny: [
    { type: 'square', f: 55, a: 0.004, d: 0.4, g: 0.12 },
    { type: 'square', f: 110, a: 0.004, d: 0.12, g: 0.3 },
    { type: 'square', f: 110, t: 0.04545, a: 0.004, d: 0.12, g: 0.3 },
    { type: 'square', f: 110, t: 0.09091, a: 0.004, d: 0.12, g: 0.3 },
    { type: 'square', f: 110, t: 0.13636, a: 0.004, d: 0.12, g: 0.3 },
    { type: 'square', f: 110, t: 0.18182, a: 0.004, d: 0.12, g: 0.3 },
    { type: 'square', f: 110, t: 0.22727, a: 0.004, d: 0.12, g: 0.3 },
    { type: 'square', f: 110, t: 0.27273, a: 0.004, d: 0.12, g: 0.3 },
    { type: 'square', f: 110, t: 0.31818, a: 0.004, d: 0.16, g: 0.3 },
  ],
}
