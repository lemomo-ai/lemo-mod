// 掌机风格给 lemo-recap 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-recap.」）。
// 只放带风格味道的文字；没写的键，lemo-recap 用自己的默认文字。
// 小结是一局打完的结算画面
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 卡片标题
  title: { zh: '本局战绩', en: 'Score screen' },
  // 写好后横条上的提示
  done: { zh: '本局战绩出来了', en: 'Score screen is ready' },
  // /lemo-mod 总结 的回复
  start: { zh: '正在结算本局战绩，算好后显示在面板里。', en: 'Tallying the score screen. It will show up in the panel.' },
  // 复制成功的提示
  copied: { zh: '本局战绩已复制到剪贴板', en: 'Score screen copied to the clipboard' },
}

export default words
