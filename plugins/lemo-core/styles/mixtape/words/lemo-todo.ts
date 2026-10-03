// 磁带风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
// 笔记是磁带的 B 面：正曲以外随手记下的东西。压缩上下文像把磁带翻个面
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: 'B 面笔记', en: 'B-side notes' },
  placeholder: { zh: '写一条 B 面笔记，回车保存', en: 'Jot a B-side note, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句
  compactNote: { zh: '翻面前：{text}', en: 'Before the flip: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已写进 B 面笔记', en: 'Context compacted, summary saved to the B-side notes' },
}

export default words
