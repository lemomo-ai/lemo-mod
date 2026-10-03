// 杨枝甘露风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['煲糖水', '搓芋圆', '炖奶中', '切芒果', '煮西米', '熬红豆'],
    en: ['Simmering', 'Rolling taro balls', 'Steaming milk', 'Dicing mango', 'Cooking sago', 'Stewing red beans'],
  },
}

export default words
