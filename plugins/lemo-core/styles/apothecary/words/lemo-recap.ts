// 葫芦风格给 lemo-recap 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-recap.」）。
// 只放带风格味道的文字；没写的键，lemo-recap 用自己的默认文字。
// 小结叫「脉案」：先生记下的这一回怎么看、怎么开的方
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 卡片标题
  title: { zh: '脉案', en: 'Case notes' },
  // 写好后横条上的提示
  done: { zh: '脉案写好了', en: 'Case notes are ready' },
  // /lemo-mod 总结 的回复
  start: { zh: '正在写脉案，写好后显示在面板里。', en: 'Writing up the case notes. They will show up in the panel.' },
  // 复制成功的提示
  copied: { zh: '脉案已复制到剪贴板', en: 'Case notes copied to the clipboard' },
}

export default words
