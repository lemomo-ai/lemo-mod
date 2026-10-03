// 磁带风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['走带中', '倒带中', '录音中', '混音中', '调音中', '翻面中'],
    en: ['Rolling tape', 'Rewinding', 'Recording', 'Mixing down', 'Tuning up', 'Flipping sides'],
  },
}

export default words
