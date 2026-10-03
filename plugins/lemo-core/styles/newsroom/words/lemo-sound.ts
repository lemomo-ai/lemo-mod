// 打字机风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「咔哒」「叮」「退稿章」是这个风格三种音效（assets/newsroom/*.wav）的叫法：打字机按键、字车到头的铃、盖退稿章
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「咔哒」，一轮完成「叮」，到点停下「退稿章」。',
    en: 'Key clack on tool calls, carriage bell on finish, reject stamp when time is up.',
  },
  tick: { zh: '咔哒 · 调工具', en: 'Clack · tool' },
  done: { zh: '叮 · 完成', en: 'Ding · done' },
  deny: { zh: '退稿章 · 停下', en: 'Stamp · stopped' },
}

export default words
