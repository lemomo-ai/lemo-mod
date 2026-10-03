// 杨枝甘露风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '跑堂', en: 'Shop helper' },
  done: { zh: '跑堂交了周报', en: 'The shop helper brought back its report' },
}

export default words
