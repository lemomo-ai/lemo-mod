// 篝火风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「噼啪」「拨弦」「嘶啦」是这个风格三种音效（assets/campfire/*.wav，按 sounds.ts 合成）的叫法：
// 柴火爆开的几声、火边拨响的一个和弦、一瓢水浇在炭上
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「噼啪」，一轮完成「拨弦」，到点停下「嘶啦」。',
    en: 'A crackle on tool calls, a strum on finish, a hiss when time is up.',
  },
  tick: { zh: '噼啪 · 调工具', en: 'Crackle · tool' },
  done: { zh: '拨弦 · 完成', en: 'Strum · done' },
  deny: { zh: '嘶啦 · 停下', en: 'Hiss · stopped' },
}

export default words
