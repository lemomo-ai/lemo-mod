// 柠檬风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签、底行的「样本 T03」
  tbandCtx: { zh: '容量', en: 'ctx' },
  tbandQuota: { zh: '额度', en: 'quota' },
  tbandSample: { zh: '样本', en: 'trial' },
  // 还没读数时的占位
  pending: { zh: '待测', en: 'n/a' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '实验 {no}', en: 'Trial {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Lemo，不再重复）
  brandSub: { zh: 'LEMO LAB', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'LAB', en: 'LAB' },
}

export default words
