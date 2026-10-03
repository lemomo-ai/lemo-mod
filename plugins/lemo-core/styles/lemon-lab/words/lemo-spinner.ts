// 柠檬风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['观察中', '记录中', '滴定中', '校准中', '做对照', '冒泡中'],
    en: ['Observing', 'Recording', 'Titrating', 'Calibrating', 'Running controls', 'Fizzing'],
  },
}

export default words
