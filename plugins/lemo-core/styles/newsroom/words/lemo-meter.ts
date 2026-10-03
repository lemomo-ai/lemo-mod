// 打字机风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是版面排满了多少）、底行的「稿件 T03」
  tbandCtx: { zh: '版面', en: 'page' },
  tbandQuota: { zh: '额度', en: 'quota' },
  tbandSample: { zh: '稿件', en: 'story' },
  // 还没读数时的占位
  pending: { zh: '待采', en: 'tbd' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '稿件 {no}', en: 'Story {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Typewriter，不再重复）
  brandSub: { zh: 'CLACKY', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'PRESS', en: 'PRESS' },
}

export default words
