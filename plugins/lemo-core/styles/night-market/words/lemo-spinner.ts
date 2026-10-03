// 灯笼风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['吆喝中', '排队中', '翻炒中', '打包中', '找零中', '挂灯笼'],
    en: ['Hawking', 'Queuing', 'Sizzling', 'Bagging up', 'Making change', 'Hanging lanterns'],
  },
}

export default words
