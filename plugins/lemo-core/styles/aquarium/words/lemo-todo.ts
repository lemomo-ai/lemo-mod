// 泡泡鱼风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '饲养便签', en: 'Keeper\'s notes' },
  placeholder: { zh: '写一条饲养便签，回车保存', en: 'Write a keeper\'s note, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句。压缩在这个风格里是「换水」
  compactNote: { zh: '换水前：{text}', en: 'Before the water change: {text}' },
  compactDone: { zh: '上下文压缩，换了一次水，摘要已写进饲养便签', en: 'Water changed: context compacted, summary in the keeper\'s notes' },
}

export default words
