// 小苗风格给 lemo-recap 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-recap.」）。
// 只放带风格味道的文字；没写的键，lemo-recap 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 卡片标题
  title: { zh: '长势报告', en: 'Growth report' },
  // 写好后横条上的提示
  done: { zh: '长势报告写好了', en: 'The growth report is ready' },
  // /lemo-mod 总结 的回复
  start: { zh: '正在写长势报告，写好后显示在面板里。', en: 'Writing the growth report. It will show up in the panel.' },
  // 复制成功的提示
  copied: { zh: '长势报告已复制到剪贴板', en: 'Growth report copied to the clipboard' },
}

export default words
