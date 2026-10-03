// lemo-pomodoro 自己的文字（中性的默认文字；带风格味道的放在风格包 words/lemo-pomodoro.ts，按同样的键覆盖）。
// {n} 是分钟数，{t} 是剩余时间（mm:ss）

import type { Lang } from './shared/lemo'

const zh = {
  title: '番茄钟',
  // 横条、状态栏上的胶囊（后面由 lemo-core 接上剩余时间）
  badge: { focus: '番茄', rest: '休息' },
  // 到点：横条提示、系统提示和朗读用同一句
  done: '番茄时间到，起来活动一下',
  restDone: '休息结束，继续工作',
  // mod 重新加载、关掉又打开、电脑睡醒时，计时已经过点 10 分钟以上：不再响铃朗读，只说一句
  expired: '番茄钟已超时 10 分钟以上，本次不提醒',
  ask: { q: '番茄时间到，接下来？', qRest: '休息结束，接下来？', header: '番茄钟', again: '再来 {n} 分钟', rest: '休息 {n} 分钟', stop: '暂不' },
  card: { desc: '专注 {n} 分钟，到点提醒', start: '开始 {n} 分钟', stop: '停止', left: '剩余 {t}', restLeft: '休息中，剩余 {t}' },
  cmd: { start: '番茄钟已开始：{n} 分钟。' },
  // 安全页上的一行（lemo.caps，「手动触发」）。不带风格味道：安全页要一眼看懂。{n} 是默认分钟数
  cap: {
    title: '番茄钟',
    desc: '计时 {n} 分钟，到点在横条提醒并询问下一步 · 响铃和朗读跟随对应开关',
  },
}

export type PomodoroStrings = typeof zh

const en: PomodoroStrings = {
  title: 'Focus timer',
  badge: { focus: 'Focus', rest: 'Rest' },
  done: 'Focus time is up. Stretch a bit',
  restDone: 'Break is over. Back to work',
  expired: 'Focus timer ended over 10 minutes ago · no reminder this time',
  ask: { q: 'Focus time is up. What next?', qRest: 'Break is over. What next?', header: 'Focus', again: '{n} more min', rest: 'Rest {n} min', stop: 'Not now' },
  card: { desc: '{n} minutes of focus, with a reminder when time is up', start: 'Start {n} min', stop: 'Stop', left: '{t} left', restLeft: 'Resting, {t} left' },
  cmd: { start: 'Focus timer started: {n} min.' },
  cap: {
    title: 'Focus timer',
    desc: 'Times {n} minutes, then a reminder on the band and a question about what next · chime and speech follow their switches',
  },
}

export const STR: Record<Lang, PomodoroStrings> = { zh, en }
