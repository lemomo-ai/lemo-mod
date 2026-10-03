// 三角尺风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['打草稿', '描图中', '标尺寸', '对比例', '画剖面', '审图中'],
    en: ['Sketching', 'Tracing', 'Dimensioning', 'Checking scale', 'Drawing sections', 'Reviewing'],
  },
}

export default words
