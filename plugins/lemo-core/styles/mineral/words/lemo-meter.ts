// 锦鲤风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是墨池，额度是颜料）、底行的「画稿 T03」
  tbandCtx: { zh: '墨池', en: 'inkwell' },
  tbandQuota: { zh: '颜料', en: 'pigment' },
  tbandSample: { zh: '画稿', en: 'panel' },
  // 还没读数时的占位：这块还留白
  pending: { zh: '留白', en: 'blank' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '画稿 {no}', en: 'Panel {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是英文，不再重复）
  brandSub: { zh: 'LUCKY KOI', en: '' },
  // 状态栏开头的品牌短名：壁画
  statusBrand: { zh: 'MURAL', en: 'MURAL' },
}

export default words
