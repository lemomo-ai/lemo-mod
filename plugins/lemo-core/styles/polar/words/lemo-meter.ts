// 企鹅风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文 = 补给用了多少，额度 = 燃油用了多少）、底行的「冰芯 T03」
  tbandCtx: { zh: '补给', en: 'stores' },
  tbandQuota: { zh: '燃油', en: 'fuel' },
  tbandSample: { zh: '冰芯', en: 'core' },
  // 还没读数时的占位
  pending: { zh: '无读数', en: 'no reading' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '冰芯 {no}', en: 'Core {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Penguin，不再重复）
  brandSub: { zh: 'WADDLES', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'POLAR', en: 'POLAR' },
}

export default words
