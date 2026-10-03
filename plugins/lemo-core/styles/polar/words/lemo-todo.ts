// 企鹅风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '补给清单', en: 'Supply list' },
  placeholder: { zh: '加一项补给清单，回车保存', en: 'Add to the supply list, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句
  compactNote: { zh: '压缩前：{text}', en: 'Before compaction: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已写进补给清单', en: 'Context compacted, summary saved to the supply list' },
}

export default words
