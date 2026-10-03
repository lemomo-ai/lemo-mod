// 打字机风格给 lemo-watch 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-watch.」）。
// 只放带风格味道的文字；没写的键，lemo-watch 用自己的默认文字。
// {n} 是秒数。到点像编辑部来催稿
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 到点发给 Claude 的消息（lemo-watch 会在前面加上 ⏰ 和空格）
  prompt: {
    zh: '{style}催稿：{n} 秒到了。请用一两句话告诉用户现在进展到哪了、下一步做什么。',
    en: 'The desk is calling: {n} seconds are up. In one or two sentences, tell the user where things stand and what comes next.',
  },
  // /lemo-mod 提醒 的回复
  set: {
    zh: '{n} 秒后，{style}会来催稿，叫 Claude 汇报进度。',
    en: 'In {n} seconds, the desk will call Claude for a progress update.',
  },
  // 面板卡片的说明（没在计时时）
  desc: {
    zh: '{n} 秒后以{style}的名义催稿，叫 Claude 汇报进度',
    en: 'In {n} seconds, the desk calls Claude for a progress update',
  },
}

export default words
