// 企鹅风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「冰晶」「风铃」「冰裂」是这个风格三种音效（assets/polar/*.wav，参数在 ../sounds.ts）的叫法：
// 冰晶碰在一起的轻响、风里乱响的一串风铃、冰面裂开
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「冰晶」，一轮完成「风铃」，到点停下「冰裂」。',
    en: 'Ice tinkle on tool calls, wind chimes on finish, cracking ice when time is up.',
  },
  tick: { zh: '冰晶 · 调工具', en: 'Tinkle · tool' },
  done: { zh: '风铃 · 完成', en: 'Wind chimes · done' },
  deny: { zh: '冰裂 · 停下', en: 'Ice crack · stopped' },
}

export default words
