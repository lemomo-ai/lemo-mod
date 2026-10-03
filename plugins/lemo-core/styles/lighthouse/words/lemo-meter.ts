// 灯塔风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是船的吃水，额度是灯油用了多少）、底行的「守望 T03」
  tbandCtx: { zh: '吃水', en: 'draft' },
  tbandQuota: { zh: '灯油', en: 'oil' },
  tbandSample: { zh: '守望', en: 'watch' },
  // 还没读数时的占位：起雾了，看不清
  pending: { zh: '起雾', en: 'fog' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '守望 {no}', en: 'Watch {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Lighthouse，不再重复）
  brandSub: { zh: 'BLINKY', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'BEACON', en: 'BEACON' },
}

export default words
