// 灯笼风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 摊主揣在围裙兜里的小本子
  title: { zh: '小本本', en: 'Pocket notes' },
  placeholder: { zh: '记一笔，回车保存', en: 'Jot something down, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句。压缩像收拾摊面
  compactNote: { zh: '收拾摊面前：{text}', en: 'Before tidying the stall: {text}' },
  compactDone: { zh: '上下文压缩了，摘要记进了小本本', en: 'Context compacted, summary jotted in the pocket notes' },
}

export default words
