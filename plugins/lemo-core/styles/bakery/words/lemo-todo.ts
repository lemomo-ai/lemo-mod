// 面包风格给 lemo-todo 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-todo.」）。
// 只放带风格味道的文字；没写的键，lemo-todo 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '备料单', en: 'Prep list' },
  placeholder: { zh: '添一样要备的，回车保存', en: 'Add to the prep list, press Enter to save' },
  // 压缩上下文后存的那条笔记，{text} 是小模型缩成的一句。压缩像给面团排气
  compactNote: { zh: '排气前：{text}', en: 'Before the punch-down: {text}' },
  compactDone: { zh: '上下文压缩了，摘要已写进备料单', en: 'Context compacted, summary added to the prep list' },
}

export default words
