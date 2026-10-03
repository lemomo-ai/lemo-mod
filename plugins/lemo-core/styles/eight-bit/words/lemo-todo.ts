// 掌机风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
// 笔记是任务清单；压缩上下文像存档：把一大段进度存成一句
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '任务清单', en: 'Quest log' },
  placeholder: { zh: '写一个任务，回车保存', en: 'Add a quest, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句
  compactNote: { zh: '存档前：{text}', en: 'Before the save: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已存进任务清单', en: 'Context compacted, summary saved to the quest log' },
}

export default words
