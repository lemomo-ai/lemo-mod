// 脸谱风格给 lemo-pomodoro 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-pomodoro.」）。
// 只放带风格味道的文字；没写的键，lemo-pomodoro 用自己的默认文字。
// 到点：横条提示、系统提示和朗读用同一句（别说「这一轮」，和 Claude 的「一轮完成」撞词）
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  done: { zh: '锣鼓歇了，下台走两步', en: 'The drums rest. Step off and stretch' },
  restDone: { zh: '开锣了，回台上接着唱', en: 'The gong sounds. Back on stage' },
}

export default words
