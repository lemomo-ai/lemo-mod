// 磁带风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是磁带走了多少）、底行的「曲目 T03」
  tbandCtx: { zh: '磁带', en: 'tape' },
  tbandQuota: { zh: '额度', en: 'quota' },
  tbandSample: { zh: '曲目', en: 'track' },
  // 还没读数时的占位：空白带
  pending: { zh: '待录', en: 'blank' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '曲目 {no}', en: 'Track {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Cassette，不再重复）
  brandSub: { zh: 'CASSIE', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'SIDE A', en: 'SIDE A' },
}

export default words
