// 望远镜风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '助理观测员', en: 'Night assistant' },
  done: { zh: '助理观测员交了巡天简报', en: 'The night assistant filed a sky survey' },
}

export default words
