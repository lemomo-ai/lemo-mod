// 篝火风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '行囊清单', en: 'Pack list' },
  placeholder: { zh: '往行囊清单里记一条，回车保存', en: 'Add to the pack list, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句。压缩在营地里是「打包」
  compactNote: { zh: '打包前：{text}', en: 'Before packing down: {text}' },
  compactDone: { zh: '上下文压缩打包了，摘要已记进行囊清单', en: 'Context packed down, summary saved to the pack list' },
}

export default words
