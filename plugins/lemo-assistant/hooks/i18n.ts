// lemo-assistant 的文字（中性的默认文字；带风格味道的放在风格包 words/lemo-assistant.ts，按同样的键覆盖：
// title、done）。占位符 {why} 由 register.tsx 用 fill 替换。
// 风格包里的 ask（派不出去时填进输入框的请求）不用了：不往输入框里填东西（会盖掉草稿）

import type { Lang } from './shared/lemo'

const zh = {
  title: '助手',
  desc: '只读子 agent（Haiku）：可读取、查找文件，不能执行命令 · 用来写三行周报',
  btn: '派助手写周报',
  busy: '助手工作中…',
  offerOn: 'Claude 可派 · 点击收回',
  offerOff: '仅限手动 · 点击允许 Claude 派',
  // 派出去时交给子 agent 的任务。不进系统提示词，可以跟着语言变；子 agent 按任务的语言回答
  task: '读一下当前目录的 README、docs 和最近改过的文件，用三行写一份周报：1. 做了什么 2. 卡在哪 3. 下一步。只输出这三行，用中文。',
  // 任务的简短名字（$.agent.spawn 的 description），后台任务列表里显示它
  taskName: '写三行周报',
  // 接在任务后面：替它列好的文件（它可能没有列目录的工具）。{files} 是逗号隔开的路径
  files: '\n\n当前目录里的文件（新改的在前）：{files}',
  done: '周报已完成',
  fail: '助手派出失败：{why}。',
  // 自动模式的审核只看对话，看不到用户按了按钮，会拦下按钮派的助手。说清楚原因，再给两条不绕过审核的路：
  // 让用户自己对 Claude 说（审核看得到这句），或者换权限模式。没允许 Claude 派时要先允许
  auto: '自动模式的审核看不到你按了按钮',
  // 接在「派出失败」那句后面：中文句号后直接接，英文空一格
  tipSep: '',
  autoTip: '可以直接对 Claude 说「派助手写三行周报」，或换成其他权限模式再按。',
  autoTipOff: '可以先按下面的按钮允许 Claude 派助手，再对 Claude 说「派助手写三行周报」；或换成其他权限模式再按。',
  noStart: '未启动',
  empty: '助手已完成，但没有返回内容',
  // 安全页上的两行（lemo.caps）。不带风格味道：安全页要一眼看懂
  cap: {
    offer: {
      title: 'Claude 可派助手',
      desc: '允许 Claude 自行派出只读助手读取项目文件 · 它读的文件发给 Haiku，报告进入当前对话，Claude 接着回复（花主模型用量）',
    },
    send: {
      title: '派助手写周报',
      desc: '读取 README、docs 和最近改动的文件，写三行周报 · 读的文件发给 Haiku，报告进入当前对话，Claude 接着回复（花主模型用量）',
    },
  },
  // 「全部关闭」时「Claude 可派助手」没存进去（横条上的提示）
  offFail: '「Claude 可派助手」没关上 · 请在「安全」页再关一次',
}

export type AssistantStrings = typeof zh

const en: AssistantStrings = {
  title: 'Assistant',
  desc: 'Read-only subagent (Haiku): can read and find files, cannot run commands · writes a three-line report',
  btn: 'Write a report',
  busy: 'Assistant working…',
  offerOn: 'Claude can send it · click to revoke',
  offerOff: 'Manual only · click to let Claude send it',
  task: 'Read the README, docs and recently changed files in the current directory and write a three-line report: 1. what was done 2. what is stuck 3. what comes next. Output only those three lines, in English.',
  taskName: 'Three-line report',
  files: '\n\nFiles here (most recently changed first): {files}',
  done: 'Report ready',
  fail: 'Could not send the assistant: {why}.',
  auto: 'the auto mode check cannot see that you pressed the button',
  tipSep: ' ',
  autoTip: 'Ask Claude to "send the assistant to write a three-line report", or switch to another permission mode and press it again.',
  autoTipOff: 'Press the button below to let Claude send it, then ask Claude to "send the assistant to write a three-line report"; or switch to another permission mode and press it again.',
  noStart: 'not started',
  empty: 'The assistant finished but returned nothing',
  cap: {
    offer: {
      title: 'Claude can send the assistant',
      desc: 'Lets Claude send the read-only assistant to read project files on its own · files it reads go to Haiku; its report enters this conversation and Claude replies (main-model usage)',
    },
    send: {
      title: 'Write a report',
      desc: 'Reads the README, docs and recently changed files and writes a three-line report · files it reads go to Haiku; the report enters this conversation and Claude replies (main-model usage)',
    },
  },
  offFail: "\"Claude can send the assistant\" didn't turn off · turn it off again on the Safety page",
}

export const STR: Record<Lang, AssistantStrings> = { zh, en }
