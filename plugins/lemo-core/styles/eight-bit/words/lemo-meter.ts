// 掌机风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是背包装了多少）、底行的「关卡 T03」
  tbandCtx: { zh: '背包', en: 'bag' },
  tbandQuota: { zh: '额度', en: 'quota' },
  tbandSample: { zh: '关卡', en: 'stage' },
  // 还没读数时的占位
  pending: { zh: '待机', en: 'standby' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '关卡 {no}', en: 'Stage {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Handheld，不再重复）
  brandSub: { zh: 'PIXEL PAL', en: '' },
  // 状态栏开头的品牌短名：一号玩家的加命标记
  statusBrand: { zh: '1UP', en: '1UP' },
}

export default words
