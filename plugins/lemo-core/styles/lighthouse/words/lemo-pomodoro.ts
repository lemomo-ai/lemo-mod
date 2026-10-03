// 灯塔风格给 lemo-pomodoro 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-pomodoro.」）。
// 只放带风格味道的文字；没写的键，lemo-pomodoro 用自己的默认文字。
// 不说「这一轮」（和 Claude 的「一轮完成」撞词）
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 到点：横条提示、系统提示和朗读用同一句
  done: { zh: '番茄时间到，换班了，去外面吹吹海风', en: 'Focus time is up. Change of watch, go get some sea air' },
  restDone: { zh: '休息结束，回灯室接着守', en: 'Break is over. Back to the lamp room' },
}

export default words
