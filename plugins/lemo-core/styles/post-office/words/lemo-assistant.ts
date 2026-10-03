// 邮筒风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 助手是邮差：把项目跑一遍，带回一封三行的信
  title: { zh: '邮差', en: 'Mail carrier' },
  done: { zh: '邮差带回了一封三行的信', en: 'The mail carrier brought back a note' },
}

export default words
