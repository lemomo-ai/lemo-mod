// 脸谱风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
// 助手是「跟包」：跟着角儿、管行头和杂事的人
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '跟包', en: 'Stagehand' },
  done: { zh: '跟包递上了后台周报', en: 'The stagehand passed up a report' },
}

export default words
