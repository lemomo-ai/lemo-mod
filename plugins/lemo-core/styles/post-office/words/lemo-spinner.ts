// 邮筒风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['分拣中', '称重中', '贴邮票', '盖邮戳', '封口中', '投递中'],
    en: ['Sorting', 'Weighing', 'Licking stamps', 'Postmarking', 'Sealing', 'Out for delivery'],
  },
}

export default words
