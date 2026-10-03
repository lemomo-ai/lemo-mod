// 小火车风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 助手是巡线员：沿着线路走一遍，交巡检报告
  title: { zh: '巡线员', en: 'Line inspector' },
  done: { zh: '巡线员交了巡检报告', en: 'The line inspector filed a report' },
}

export default words
