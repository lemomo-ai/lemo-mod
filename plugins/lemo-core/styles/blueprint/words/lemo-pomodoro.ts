// 三角尺风格给 lemo-pomodoro 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-pomodoro.」）。
// 只放带风格味道的文字；没写的键，lemo-pomodoro 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 到点：横条提示、系统提示和朗读用同一句。不说「这一轮」（和 Claude 的「一轮完成」撞词）
  done: { zh: '番茄时间到，放下铅笔，起来走两步', en: 'Focus time is up. Pencils down, go stretch' },
  restDone: { zh: '休息结束，回到图板前', en: 'Break is over. Back to the drawing board' },
}

export default words
