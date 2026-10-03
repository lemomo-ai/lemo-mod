// 灯塔风格给 lemo-guard 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-guard.」）。
// 只放带风格味道的文字；没写的键，lemo-guard 用自己的默认文字。
// abort 是限时到点、停下这一轮时横条上的提示，{t} 是「2 分钟」这类时长；timeoutTitle 是「行为」页限时卡片的标题
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  abort: { zh: '超过 {t}，{style}让这一轮抛锚了', en: 'Over {t}, {style} dropped anchor on this turn' },
  // 超时设置的卡片标题：赶在退潮前回来
  timeoutTitle: { zh: '潮汐时限', en: 'Tide limit' },
}

export default words
