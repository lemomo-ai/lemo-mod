// 打字机风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
// 笔记是选题单；压缩上下文像缩稿：把长稿压成几句
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '选题单', en: 'Assignments' },
  placeholder: { zh: '记一个选题，回车保存', en: 'Add an assignment, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句
  compactNote: { zh: '缩稿前：{text}', en: 'Before the cut: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已记进选题单', en: 'Context compacted, summary added to the assignments' },
}

export default words
