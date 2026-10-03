// 邮筒风格给 lemo-recap 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-recap.」）。
// 只放带风格味道的文字；没写的键，lemo-recap 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 卡片标题：这一趟送了什么
  title: { zh: '投递回执', en: 'Delivery receipt' },
  // 写好后横条上的提示
  done: { zh: '投递回执写好了', en: 'Delivery receipt is ready' },
  // /lemo-mod 总结 的回复
  start: { zh: '正在写投递回执，写好后显示在面板里。', en: 'Writing the delivery receipt. It will show up in the panel.' },
  // 复制成功的提示
  copied: { zh: '投递回执已复制到剪贴板', en: 'Delivery receipt copied to the clipboard' },
}

export default words
