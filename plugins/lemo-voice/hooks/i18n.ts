// lemo-voice 自己的文字（中性的默认文字；带风格味道的放在 lemo-core 的风格包 words/lemo-voice.ts，按同样的键覆盖）

import type { Lang } from './shared/lemo'

const zh = {
  /** 卡片标题、报到时的显示名 */
  title: '朗读',
  desc: '超过 30 秒的任务完成时，朗读编号和用时',
  /** 朗读关着时的说明（装上时就是关的）：{desc} 是上面那句 */
  offDesc: '{desc} · 已关闭，试听仍可播放',
  on: '已开 · 点击关闭',
  off: '打开',
  hear: '试听',
  /** 一轮超过 30 秒时念的句子：{n} 是第几条消息，{s} 是用了多久（「45 秒」「2 分 15 秒」，lemo-voice 按时长拼好） */
  turn: '第 {n} 条完成，用时 {s}。',
  /** 拿不到编号时（第 0 条，比如新会话里第一轮是提醒引出的，用户还没发过消息）念的句子：{s} 是用了多久（「45 秒」「2 分 15 秒」，lemo-voice 按时长拼好） */
  turnPlain: '这一轮完成，用时 {s}。',
  /** /lemo-mod 朗读 */
  cmd: { word: '朗读', speaking: '正在试听。' },
}

export type VoiceStrings = typeof zh

const en: VoiceStrings = {
  title: 'Speech',
  desc: 'Reads out the message number and time when a task over 30 s finishes',
  offDesc: '{desc} · off, previews still play',
  on: 'On · click to turn off',
  off: 'Turn on',
  hear: 'Preview',
  turn: 'Message {n} done in {s}.',
  turnPlain: 'Turn done in {s}.',
  cmd: { word: 'speak', speaking: 'Playing a preview.' },
}

export const STR: Record<Lang, VoiceStrings> = { zh, en }
