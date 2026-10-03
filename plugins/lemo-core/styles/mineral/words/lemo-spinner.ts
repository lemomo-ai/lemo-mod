// 锦鲤风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
// 作画的六步：研墨、构思、落笔、皴擦、点染、题款（第一轮风格提案里用户看过的那一组）
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['研墨', '构思', '落笔', '皴擦', '点染', '题款'],
    en: ['Grinding ink', 'Composing', 'Sketching', 'Texturing', 'Tinting', 'Inscribing'],
  },
}

export default words
