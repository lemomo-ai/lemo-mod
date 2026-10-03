// 泡泡鱼风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是缸里的水位，额度是鱼食）、底行的「鱼缸 T03」
  tbandCtx: { zh: '水位', en: 'water' },
  tbandQuota: { zh: '鱼食', en: 'food' },
  tbandSample: { zh: '鱼缸', en: 'tank' },
  // 还没读数时的占位：水还浑，看不清
  pending: { zh: '水浑', en: 'murky' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '鱼缸 {no}', en: 'Tank {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Bubble Fish，不再重复）
  brandSub: { zh: 'BUBBLES', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'TANK', en: 'TANK' },
}

export default words
