// 小苗风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「滴」「花开」「咔嚓」是这个风格三种音效（assets/greenhouse/*.wav，按 sounds.ts 合成）的叫法：
// 一滴水落进盆里、轻柔的开花铃音、修枝剪合上的一声
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「滴」，一轮完成「花开」，到点停下「咔嚓」。',
    en: 'A drip on tool calls, a bloom chime on finish, a snip when time is up.',
  },
  tick: { zh: '滴 · 调工具', en: 'Drip · tool' },
  done: { zh: '花开 · 完成', en: 'Bloom · done' },
  deny: { zh: '咔嚓 · 停下', en: 'Snip · stopped' },
}

export default words
