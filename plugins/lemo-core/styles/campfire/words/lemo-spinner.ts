// 篝火风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['生火中', '添柴中', '扎营中', '守夜中', '看星星', '拨火中'],
    en: ['Kindling', 'Stoking', 'Pitching camp', 'Keeping watch', 'Stargazing', 'Poking embers'],
  },
}

export default words
