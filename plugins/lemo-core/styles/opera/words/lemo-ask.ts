// 脸谱风格给 lemo-ask 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-ask.」）。
// 只放带风格味道的文字；没写的键，lemo-ask 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 提问弹窗抬头强调色底上的词：「? 叫板 · T03」。叫板是台上唱一句，等对方接
  title: { zh: '叫板', en: 'Your cue' },
}

export default words
