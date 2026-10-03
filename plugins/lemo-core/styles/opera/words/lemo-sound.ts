// 脸谱风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 三种音效（assets/opera/*.wav，参数在 ../sounds.ts）按锣鼓经叫：小锣「台」、大锣「仓」，到点停下是梆子「梆梆」
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具小锣「台」，一轮完成锣鼓「仓」，到点停下梆子「梆梆」。',
    en: 'A tap of the small gong on tool calls, a full gong crash on finish, two wood clappers when time is up.',
  },
  tick: { zh: '台 · 调工具', en: 'Tap · tool' },
  done: { zh: '仓 · 完成', en: 'Crash · done' },
  deny: { zh: '梆梆 · 停下', en: 'Clack · stopped' },
}

export default words
