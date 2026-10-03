// lemo-watch 自己的文字（中性的默认文字；带风格味道的放在 lemo-core 的风格包 words/lemo-watch.ts，按同样的键覆盖）。
// {n} 是秒数，{t} 是剩余时间（mm:ss）

import type { Lang } from './shared/lemo'

const zh = {
  title: '定时提醒',
  /** 卡片说明：没在计时 */
  desc: '{n} 秒后请 Claude 汇报进度',
  /** 卡片说明：计时中 */
  left: '剩余 {t}',
  btn: '{n} 秒后提醒',
  cancel: '取消提醒',
  /** 横条、状态栏上的胶囊 */
  badge: '提醒',
  /** 到点时横条上的提示 */
  sent: '已发送提醒，Claude 开始汇报',
  /** mod 重新加载、关掉又打开、电脑睡醒时，已经过点 10 分钟以上：不发了，横条上说一句 */
  expired: '提醒已超时 10 分钟以上，本次不发送',
  /** 到点发给 Claude 的消息（前面会加上 ⏰ 和空格） */
  prompt: '提醒：{n} 秒到了。请用一两句话告诉用户现在进展到哪了、下一步做什么。',
  /** /lemo-mod 提醒 的回复 */
  set: '已设置：{n} 秒后请 Claude 汇报进度。',
  /** 报到时拼进命令提示的词 */
  command: '提醒 30',
}

export type WatchStrings = typeof zh

const en: WatchStrings = {
  title: 'Reminder',
  desc: 'Asks Claude for a progress update in {n} seconds',
  left: '{t} left',
  btn: 'Remind in {n} s',
  cancel: 'Cancel reminder',
  badge: 'Reminder',
  sent: 'Reminder sent, Claude is reporting',
  expired: 'Reminder is over 10 minutes late · not sent this time',
  prompt: 'Reminder: {n} seconds are up. In one or two sentences, tell the user where things stand and what comes next.',
  set: 'Set: Claude will be asked for a progress update in {n} seconds.',
  command: 'remind 30',
}

export const STR: Record<Lang, WatchStrings> = { zh, en }

/**
 * 安全页上的一行（lemo.caps，「手动触发」）。不带风格味道：安全页要一眼看懂，所以不走风格包，
 * 也不放进上面那组（那组的每个键风格包都能覆盖）。{n} 是默认秒数
 */
export const CAP_STR: Record<Lang, { title: string; desc: string }> = {
  zh: {
    title: '定时提醒',
    desc: '{n} 秒后代你给 Claude 发消息，请它汇报进度',
  },
  en: {
    title: 'Reminder',
    desc: 'Sends Claude a message for you in {n} seconds, asking for a progress update',
  },
}
