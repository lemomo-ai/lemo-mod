// 灯塔风格给 lemo-watch 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-watch.」）。
// 只放带风格味道的文字；没写的键，lemo-watch 用自己的默认文字。{n} 是秒数
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 到点发给 Claude 的消息（lemo-watch 会在前面加上 ⏰ 和空格）：灯塔呼叫船只报位置
  prompt: {
    zh: '{style}呼叫：{n} 秒到了。请用一两句话告诉用户现在进展到哪了、下一步做什么。',
    en: '{style} calling: {n} seconds are up. In one or two sentences, give the user your position: where things stand and what comes next.',
  },
  // /lemo-mod 提醒 的回复
  set: {
    zh: '{n} 秒后，{style}会打灯呼叫，叫 Claude 报一下进度。',
    en: 'In {n} seconds, {style} will signal Claude to report its position.',
  },
  // 面板卡片的说明（没在计时时）
  desc: {
    zh: '{n} 秒后以{style}的名义，叫 Claude 报告进度',
    en: 'In {n} seconds, {style} signals Claude for an update',
  },
}

export default words
