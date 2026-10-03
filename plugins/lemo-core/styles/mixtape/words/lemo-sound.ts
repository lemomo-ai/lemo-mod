// 磁带风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「咔」「倒带」「哔哔」是这个风格三种音效（assets/mixtape/*.wav）的叫法：按键落下、倒带后停住、录音机报警
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试音', en: 'Sound check' },
  desc: {
    zh: '调工具「咔」，一轮完成「倒带」，到点停下「哔哔」。',
    en: 'Clunk on tool calls, rewind on finish, beep-beep when time is up.',
  },
  tick: { zh: '咔 · 调工具', en: 'Clunk · tool' },
  done: { zh: '倒带 · 完成', en: 'Rewind · done' },
  deny: { zh: '哔哔 · 停下', en: 'Beep-beep · stopped' },
}

export default words
