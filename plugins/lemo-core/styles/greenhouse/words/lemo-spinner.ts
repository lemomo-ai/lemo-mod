// 小苗风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['播种中', '浇水中', '发芽中', '换盆中', '修剪中', '晒太阳'],
    en: ['Sowing', 'Watering', 'Sprouting', 'Repotting', 'Pruning', 'Soaking up sun'],
  },
}

export default words
