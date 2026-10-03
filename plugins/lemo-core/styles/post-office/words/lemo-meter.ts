// 邮筒风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是邮袋装了多满，额度是邮资用了多少）、底行的「挂号 T03」
  tbandCtx: { zh: '邮袋', en: 'bag' },
  tbandQuota: { zh: '邮资', en: 'postage' },
  tbandSample: { zh: '挂号', en: 'track' },
  // 还没读数时的占位：还没过秤
  pending: { zh: '待称重', en: 'unweighed' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '挂号 {no}', en: 'Tracking {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是 Postbox，不再重复）
  brandSub: { zh: 'POSTIE', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'POST', en: 'POST' },
}

export default words
