// 小苗风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '园丁便签', en: 'Garden notes' },
  placeholder: { zh: '写一条园丁便签，回车保存', en: 'Jot a garden note, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句。压缩在温室里是「换盆」
  compactNote: { zh: '换盆前：{text}', en: 'Before repotting: {text}' },
  compactDone: { zh: '上下文换盆压缩了，摘要已写进园丁便签', en: 'Context repotted and compacted, summary saved to the garden notes' },
}

export default words
