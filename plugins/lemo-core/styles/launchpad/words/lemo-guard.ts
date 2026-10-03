// 火箭风格给 lemo-guard 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-guard.」）。
// 只放带风格味道的文字；没写的键，lemo-guard 用自己的默认文字。
// abort 是限时到点、停下这一轮时横条上的提示，{t} 是「2 分钟」这类时长；timeoutTitle 是「行为」页限时卡片的标题
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  abort: { zh: '超过 {t}，{style}中止了这一轮', en: 'Past {t}, {style} called an abort on this turn' },
  timeoutTitle: { zh: '发射窗口', en: 'Launch window' },
}

export default words
