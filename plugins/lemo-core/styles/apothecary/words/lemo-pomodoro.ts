// 葫芦风格给 lemo-pomodoro 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-pomodoro.」）。
// 只放带风格味道的文字；没写的键，lemo-pomodoro 用自己的默认文字。
// 到点：横条提示、系统提示和朗读用同一句（别说「这一轮」，和 Claude 的「一轮完成」撞词）
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  done: { zh: '药煎好了，起来走两步', en: 'The pot is off the fire. Get up and stretch' },
  restDone: { zh: '歇够了，回柜台接着抓药', en: 'Rested. Back behind the counter' },
}

export default words
