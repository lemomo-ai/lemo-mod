// 杨枝甘露风格给 lemo-recap 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-recap.」）。
// 只放带风格味道的文字；没写的键，lemo-recap 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 卡片标题：这一桌点过、上过的糖水
  title: { zh: '糖水单', en: 'Order recap' },
  // 写好后横条上的提示
  done: { zh: '糖水单写好了', en: 'The order recap is ready' },
  // /lemo-mod 总结 的回复
  start: { zh: '正在写糖水单，写好后显示在面板里。', en: 'Writing up the order recap. It will show up in the panel.' },
  // 复制成功的提示
  copied: { zh: '糖水单已复制到剪贴板', en: 'Order recap copied to the clipboard' },
}

export default words
