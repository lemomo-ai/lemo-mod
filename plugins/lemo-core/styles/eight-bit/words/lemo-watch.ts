// 掌机风格给 lemo-watch 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-watch.」）。
// 只放带风格味道的文字；没写的键，lemo-watch 用自己的默认文字。
// {n} 是秒数。到点像走到一个检查点
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 到点发给 Claude 的消息（lemo-watch 会在前面加上 ⏰ 和空格）
  prompt: {
    zh: '{style}检查点：{n} 秒到了。请用一两句话告诉用户现在进展到哪了、下一步做什么。',
    en: '{style} checkpoint: {n} seconds are up. In one or two sentences, tell the user where things stand and what comes next.',
  },
  // /lemo-mod 提醒 的回复
  set: {
    zh: '{n} 秒后到检查点，{style}会叫 Claude 汇报进度。',
    en: 'In {n} seconds, {style} hits a checkpoint and asks Claude for a progress update.',
  },
  // 面板卡片的说明（没在计时时）
  desc: {
    zh: '{n} 秒后到检查点，以{style}的名义叫 Claude 汇报进度',
    en: 'In {n} seconds, a checkpoint asks Claude for a progress update',
  },
}

export default words
