// 葫芦风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
// 助手是铺子里的小伙计
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '小伙计', en: 'Shop hand' },
  done: { zh: '小伙计交了盘点周报', en: 'The shop hand turned in a stock report' },
}

export default words
