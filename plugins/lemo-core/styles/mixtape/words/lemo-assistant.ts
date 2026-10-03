// 磁带风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '录音助理', en: 'Studio assistant' },
  done: { zh: '录音助理交了乐评', en: 'The studio assistant turned in a review' },
}

export default words
