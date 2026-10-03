// 泡泡鱼风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['喂食中', '换水中', '巡游中', '吐泡泡', '擦玻璃', '看水温'],
    en: ['Feeding', 'Changing water', 'Cruising', 'Blowing bubbles', 'Wiping the glass', 'Checking the temp'],
  },
}

export default words
