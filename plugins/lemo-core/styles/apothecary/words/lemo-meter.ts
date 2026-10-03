// 葫芦风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是药柜装了多满，额度是库存）、底行的「方子 T03」
  tbandCtx: { zh: '药柜', en: 'cabinet' },
  tbandQuota: { zh: '库存', en: 'stock' },
  tbandSample: { zh: '方子', en: 'Rx' },
  // 还没读数时的占位：还没上戥子
  pending: { zh: '待称', en: 'unweighed' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '方子 {no}', en: 'Rx {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是英文，不再重复）
  brandSub: { zh: 'MAGIC GOURD', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'HERBS', en: 'HERBS' },
}

export default words
