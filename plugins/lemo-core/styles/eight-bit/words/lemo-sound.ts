// 掌机风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「哔」「金币」「嗡」是这个风格三种音效（assets/eight-bit/*.wav）的叫法：都是方波芯片音
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音测试', en: 'Sound test' },
  desc: {
    zh: '调工具「哔」，一轮完成「金币」，到点停下「嗡」。',
    en: 'Blip on tool calls, coin on finish, buzz when time is up.',
  },
  tick: { zh: '哔 · 调工具', en: 'Blip · tool' },
  done: { zh: '金币 · 完成', en: 'Coin · done' },
  deny: { zh: '嗡 · 停下', en: 'Buzz · stopped' },
}

export default words
