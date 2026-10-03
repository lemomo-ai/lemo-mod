// 火箭风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '地面助手', en: 'Ground crew' },
  done: { zh: '地面助手交了发射前检查', en: 'The ground crew filed its pre-launch check' },
}

export default words
