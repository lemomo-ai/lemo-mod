// 灯笼风格给 lemo-pomodoro 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-pomodoro.」）。
// 只放带风格味道的文字；没写的键，lemo-pomodoro 用自己的默认文字。
// 到点那句不说「这一轮」（和 Claude 的「一轮完成」撞词）
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 到点：横条提示、系统提示和朗读用同一句
  done: { zh: '时间到，离开摊位走两步', en: 'Time is up. Step away from the stall and stretch' },
  restDone: { zh: '歇够了，回来出摊', en: 'Break is over. Back to the stall' },
}

export default words
