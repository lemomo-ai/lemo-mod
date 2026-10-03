// 掌机风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['读档中', '跳跃中', '升级中', '捡金币', '打怪中', '存档中'],
    en: ['Loading', 'Jumping', 'Leveling up', 'Collecting coins', 'Battling the boss', 'Saving'],
  },
}

export default words
