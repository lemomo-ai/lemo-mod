// 灯塔风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['守望中', '转灯中', '测风向', '校航向', '引航中', '鸣雾笛'],
    en: ['Keeping watch', 'Turning the lamp', 'Reading the wind', 'Plotting a course', 'Piloting', 'Sounding the horn'],
  },
}

export default words
