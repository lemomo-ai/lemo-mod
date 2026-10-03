// 打字机风格给 lemo-recap 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-recap.」）。
// 只放带风格味道的文字；没写的键，lemo-recap 用自己的默认文字。
// 小结是一张号外
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 卡片标题
  title: { zh: '号外', en: 'Extra edition' },
  // 写好后横条上的提示
  done: { zh: '号外印好了', en: 'The extra is off the press' },
  // /lemo-mod 总结 的回复
  start: { zh: '正在排号外，印好后显示在面板里。', en: 'Setting the extra edition. It will show up in the panel.' },
  // 复制成功的提示
  copied: { zh: '号外已复制到剪贴板', en: 'Extra edition copied to the clipboard' },
}

export default words
