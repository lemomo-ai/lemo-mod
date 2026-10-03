// 灯塔风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '守灯备忘', en: 'Keeper notes' },
  placeholder: { zh: '写一条守灯备忘，回车保存', en: 'Write a keeper note, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句
  compactNote: { zh: '压缩前：{text}', en: 'Before compaction: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已写进守灯备忘', en: 'Context compacted, summary saved to the keeper notes' },
}

export default words
