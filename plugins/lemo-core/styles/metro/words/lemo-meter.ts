// 小火车风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是车厢载客量，额度是票卡里用掉的车费）、底行的「站点 T03」
  tbandCtx: { zh: '载客', en: 'load' },
  tbandQuota: { zh: '车费', en: 'fare' },
  tbandSample: { zh: '站点', en: 'stop' },
  // 还没读数时的占位：车还没发
  pending: { zh: '待发', en: 'not yet' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '站点 {no}', en: 'Stop {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Train，不再重复）
  brandSub: { zh: 'CHOO-CHOO', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'METRO', en: 'METRO' },
}

export default words
