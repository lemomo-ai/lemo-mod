// 小苗风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是盆里的土，额度是水）、底行的「苗牌 T03」
  tbandCtx: { zh: '盆土', en: 'soil' },
  tbandQuota: { zh: '水量', en: 'water' },
  tbandSample: { zh: '苗牌', en: 'pot' },
  // 还没读数时的占位：还在休眠
  pending: { zh: '休眠', en: 'dormant' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '苗牌 {no}', en: 'Pot {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Sprout，不再重复）
  brandSub: { zh: 'SPROUTY', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'GROW', en: 'GROW' },
}

export default words
