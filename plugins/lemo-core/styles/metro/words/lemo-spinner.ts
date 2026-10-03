// 小火车风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['发车中', '加速中', '报站中', '换乘中', '进站中', '检票中'],
    en: ['Departing', 'Gathering speed', 'Announcing', 'Changing lines', 'Pulling in', 'Minding the gap'],
  },
}

export default words
