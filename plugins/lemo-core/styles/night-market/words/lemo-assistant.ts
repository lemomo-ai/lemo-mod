// 灯笼风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '伙计', en: 'Stall hand' },
  done: { zh: '伙计交了周报', en: 'The stall hand turned in its report' },
}

export default words
