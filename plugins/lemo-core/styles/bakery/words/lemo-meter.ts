// 面包风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是烤盘装了多满）、底行的「炉次 T03」
  tbandCtx: { zh: '烤盘', en: 'tray' },
  tbandQuota: { zh: '额度', en: 'quota' },
  tbandSample: { zh: '炉次', en: 'batch' },
  // 还没读数时的占位
  pending: { zh: '待出炉', en: 'n/a' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '第 {no} 炉', en: 'Batch {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Loaf，不再重复）
  brandSub: { zh: 'CHUBBY BUN', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'OVEN', en: 'OVEN' },
}

export default words
