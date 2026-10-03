// 磁带风格给 lemo-pomodoro 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-pomodoro.」）。
// 只放带风格味道的文字；没写的键，lemo-pomodoro 用自己的默认文字。
// 一个番茄差不多是一面磁带的长度：到点是 A 面放完，休息完是翻面
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 到点：横条提示、系统提示和朗读用同一句。不说「这一轮」（和 Claude 的「一轮完成」撞词）
  done: { zh: 'A 面放完了，起来走两步', en: 'Side A is over. Get up and stretch' },
  restDone: { zh: '翻面了，回来接着做', en: 'Tape flipped. Back to it' },
}

export default words
