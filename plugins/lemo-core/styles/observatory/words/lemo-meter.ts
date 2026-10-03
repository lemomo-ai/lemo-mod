// 望远镜风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文 = 视场，额度 = 望远镜机时）、底行的「目标 T03」
  tbandCtx: { zh: '视场', en: 'field' },
  tbandQuota: { zh: '机时', en: 'quota' },
  tbandSample: { zh: '目标', en: 'target' },
  // 还没读数时的占位
  pending: { zh: '待观测', en: 'n/a' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '目标 {no}', en: 'Target {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Telescope，不再重复）
  brandSub: { zh: 'PEEKY', en: '' },
  // 状态栏开头的品牌短名：穹顶
  statusBrand: { zh: 'DOME', en: 'DOME' },
}

export default words
