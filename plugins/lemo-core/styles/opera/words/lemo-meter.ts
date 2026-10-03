// 脸谱风格给 lemo-meter 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-meter.」）。
// 只放带风格味道的文字；没写的键，lemo-meter 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 终端横条：刻度尺前面的标签（上下文是台上站了多满，额度是戏份）、底行的「场次 T03」
  tbandCtx: { zh: '台面', en: 'stage' },
  tbandQuota: { zh: '戏份', en: 'quota' },
  tbandSample: { zh: '场次', en: 'scene' },
  // 还没读数时的占位：还在侧幕候场
  pending: { zh: '候场', en: 'waiting' },
  // 桌面横条右上角的编号胶囊，{no} 是 T03
  trial: { zh: '场次 {no}', en: 'Scene {no}' },
  // 桌面横条品牌名后面的小字（英文界面品牌名已经是英文，不再重复）
  brandSub: { zh: 'MASKY', en: '' },
  // 状态栏开头的品牌短名
  statusBrand: { zh: 'OPERA', en: 'OPERA' },
}

export default words
