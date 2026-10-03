// 灯塔风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 助手是领航员：把航道摸一遍，交回航道报告
  title: { zh: '领航员', en: 'Harbor pilot' },
  done: { zh: '领航员交回了航道报告', en: 'The harbor pilot sent back a report' },
}

export default words
