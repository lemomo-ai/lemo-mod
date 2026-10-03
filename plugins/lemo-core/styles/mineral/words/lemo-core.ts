// 锦鲤风格给 lemo-core 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-core.」）。
// 只放带风格味道的文字；没写的键，lemo-core 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '{style}', en: '{style}' },
  cmdTag: { zh: ' {style} ', en: ' {style} ' },
}

export default words
