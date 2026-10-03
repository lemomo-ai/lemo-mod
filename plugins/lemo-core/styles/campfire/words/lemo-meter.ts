// 篝火风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是背包装了多少，额度是口粮）、底行的「夜话 T03」
  tbandCtx: { zh: '背包', en: 'pack' },
  tbandQuota: { zh: '口粮', en: 'rations' },
  tbandSample: { zh: '夜话', en: 'tale' },
  // 还没读数时的占位：火还没点
  pending: { zh: '未点火', en: 'unlit' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '夜话 {no}', en: 'Tale {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Campfire，不再重复）
  brandSub: { zh: 'CAMPFIRE', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'CAMP', en: 'CAMP' },
}

export default words
