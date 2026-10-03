// lemo-journal 自己的文字（中性的默认文字；带风格味道的放在风格包 words/lemo-journal.ts，按同样的键覆盖）。
// 占位符 {steps}、{t} 这类由 fill() 替换

import type { Lang } from './shared/lemo'

const zh = {
  // 自动分类的标签名。存进 lemo-core 的 tags 的是键（question、code、debug、chat），显示时按语言换成这里的名字
  kinds: { question: '提问', code: '改代码', debug: '排查', chat: '闲聊' } as Readonly<Record<string, string>>,
  // 日志里一行的「几步几次工具」
  turnStats: '{steps} 步 · {tools} 次工具',
  // 不是用户本人引起的一轮，日志里编号那一栏写这个：lemo-watch 的提醒、后台任务通知和助手交回的报告
  by: { remind: '提醒', bg: '后台' },
  on: '已开 · 点击关闭',
  off: '打开',
  log: {
    title: '日志',
    desc: '每轮结束向 {path} 记录一行：时间、项目、编号、标签、用时、步数和消息开头',
    off: '未开启 · 开启后每轮结束记录到 {path}',
    open: '打开日志文件',
    empty: '暂无记录',
  },
  classify: {
    title: '自动分类',
    desc: '给每条消息自动打标签（提问 / 改代码 / 排查 / 闲聊），显示在编号后 · 每条额外调用一次小模型',
    recent: '最近：',
  },
  stats: {
    title: '每轮统计',
    desc: '上一轮的请求步数、工具次数和用时',
    last: '上一轮：{steps} 步 · {tools} 次工具 · 用时 {t}',
    none: '完成一轮后显示',
  },
  // 安全页上的两行（lemo.caps）。不带风格味道：安全页要一眼看懂。{path} 是日志文件的位置
  cap: {
    log: {
      title: '日志',
      desc: '每轮结束向 {path} 记录一行：时间、项目名、编号、用时和你这条消息的前约 50 个字 · 保留最近 500 行，所有会话共用',
    },
    classify: {
      title: '自动分类',
      desc: '每条消息额外调用一次小模型（通常是 Haiku）打标签 · 发给它的是每条消息的前 2000 个字',
    },
  },
}

export type JournalStrings = typeof zh

const en: JournalStrings = {
  kinds: { question: 'question', code: 'code', debug: 'debug', chat: 'chat' },
  turnStats: '{steps} steps · {tools} tools',
  by: { remind: 'reminder', bg: 'background' },
  on: 'On · click to turn off',
  off: 'Turn on',
  log: {
    title: 'Log',
    desc: 'Logs one line to {path} after each turn: time, project, number, tag, duration, steps and the start of your message',
    off: 'Off · when on, logs each turn to {path}',
    open: 'Open the log file',
    empty: 'Nothing logged yet',
  },
  classify: {
    title: 'Auto tags',
    desc: 'Tags each message (question / code / debug / chat), shown after the number · one extra small-model call per message',
    recent: 'Recent: ',
  },
  stats: {
    title: 'Per-turn stats',
    desc: 'Request steps, tool calls and time of the last turn',
    last: 'Last turn: {steps} steps · {tools} tools · {t}',
    none: 'Shows after the first turn',
  },
  cap: {
    log: {
      title: 'Log',
      desc: 'Logs one line to {path} after each turn: time, project name, number, duration and the first ~50 characters of your message · keeps the last 500 lines, shared by all sessions',
    },
    classify: {
      title: 'Auto tags',
      desc: 'One extra small-model call (usually Haiku) per message to tag it · sends the first 2000 characters of each message',
    },
  },
}

export const STR: Record<Lang, JournalStrings> = { zh, en }
