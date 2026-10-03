// 三角尺风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「笃」「盖章」「擦掉」是这个风格三种音效（assets/blueprint/*.wav，参数在 ../sounds.ts）的叫法：
// 铅笔在图板上轻点一下、审图章「通过」落下、橡皮擦吱吱地擦
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「笃」，一轮完成「盖章」，到点停下「擦掉」。',
    en: 'A pencil tap on tool calls, the approval stamp on finish, an eraser squeak when time is up.',
  },
  tick: { zh: '笃 · 调工具', en: 'Tap · tool' },
  done: { zh: '盖章 · 完成', en: 'Stamp · done' },
  deny: { zh: '擦掉 · 停下', en: 'Eraser · stopped' },
}

export default words
