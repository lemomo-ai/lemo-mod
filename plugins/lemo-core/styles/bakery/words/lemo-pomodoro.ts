// 面包风格给 lemo-pomodoro 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-pomodoro.」）。
// 只放带风格味道的文字；没写的键，lemo-pomodoro 用自己的默认文字。
// 到点那句不说「这一轮」（和 Claude 的「一轮完成」撞词）
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 到点：横条提示、系统提示和朗读用同一句
  done: { zh: '定时器响了，离开烤炉走两步', en: 'The timer rang. Step away from the oven and stretch' },
  restDone: { zh: '歇够了，回来接着揉面', en: 'Break is over. Back to the dough' },
}

export default words
