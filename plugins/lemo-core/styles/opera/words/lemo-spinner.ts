// 脸谱风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
// 一出戏的顺序：开锣、亮相，唱念做打，走圆场
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['开锣', '亮相', '起唱', '念白', '走圆场', '开打'],
    en: ['Sounding the gong', 'Striking a pose', 'Singing', 'Reciting lines', 'Circling the stage', 'Sparring'],
  },
}

export default words
