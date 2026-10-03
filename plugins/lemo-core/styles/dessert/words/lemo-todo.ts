// 杨枝甘露风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '点单纸', en: 'Order slips' },
  placeholder: { zh: '写一张单，回车保存', en: 'Write an order slip, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句。压缩像收走桌上的碗
  compactNote: { zh: '收碗前：{text}', en: 'Before clearing the table: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已写进点单纸', en: 'Context compacted, summary pinned to the order slips' },
}

export default words
