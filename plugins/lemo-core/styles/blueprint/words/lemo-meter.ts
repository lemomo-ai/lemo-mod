// 三角尺风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文 = 图幅用了多少，额度 = 工时用了多少）、底行的「图号 T03」
  tbandCtx: { zh: '图幅', en: 'paper' },
  tbandQuota: { zh: '工时', en: 'hours' },
  tbandSample: { zh: '图号', en: 'sheet' },
  // 还没读数时的占位
  pending: { zh: '待审', en: 'pending' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '图号 {no}', en: 'Sheet {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Set Square，不再重复）
  brandSub: { zh: 'TRI-TRI', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'PLAN', en: 'PLAN' },
}

export default words
