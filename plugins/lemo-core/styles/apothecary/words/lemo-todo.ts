// 葫芦风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
// 笔记是压在柜台上的便笺
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '柜台便笺', en: 'Counter notes' },
  placeholder: { zh: '写一张便笺，回车保存', en: 'Write a counter note, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句
  compactNote: { zh: '压缩前：{text}', en: 'Before compaction: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已写进柜台便笺', en: 'Context compacted, summary saved to the counter notes' },
}

export default words
