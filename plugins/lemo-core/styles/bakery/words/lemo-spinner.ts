// 面包风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['揉面中', '醒面中', '整形中', '进炉中', '刷蛋液', '撒糖粉'],
    en: ['Kneading', 'Proofing', 'Shaping', 'Baking', 'Egg-washing', 'Dusting sugar'],
  },
}

export default words
