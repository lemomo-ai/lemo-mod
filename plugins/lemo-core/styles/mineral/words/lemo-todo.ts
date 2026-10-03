// 锦鲤风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
// 笔记是画稿边上的小字：边注
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '画稿边注', en: 'Margin notes' },
  placeholder: { zh: '写一条边注，回车保存', en: 'Write a margin note, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句
  compactNote: { zh: '压缩前：{text}', en: 'Before compaction: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已写进边注', en: 'Context compacted, summary saved to the margin notes' },
}

export default words
