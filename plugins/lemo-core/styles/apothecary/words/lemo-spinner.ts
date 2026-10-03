// 葫芦风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
// 抓一服药的手续：抓药、过戥子、碾药、切片、包药、煎药
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['抓药', '称药', '碾药', '切片', '包药', '煎药'],
    en: ['Picking herbs', 'Weighing', 'Grinding', 'Slicing roots', 'Wrapping', 'Simmering'],
  },
}

export default words
