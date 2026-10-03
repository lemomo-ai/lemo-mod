// lemo-todo 的文字（中性的默认文字；带风格味道的放在风格包 words/lemo-todo.ts，按同样的键覆盖：
// title、placeholder、compactNote、compactDone）

import type { Lang } from './shared/lemo'

const zh = {
  title: '笔记',
  desc: '共 {n} 条',
  label: '笔记 ',
  placeholder: '写一条笔记，回车保存',
  save: '保存',
  // 给小模型的话：用当前界面语言写，存下来的笔记也是这个语言。这是单独一次调用，不进主对话，不影响提示缓存
  compactPrompt: '下面是一段会话摘要。用一句中文（30 字以内）说这段会话做了什么，只输出这一句。\n\n',
  compactNote: '摘要：{text}',
  compactDone: '上下文已压缩，摘要已存入笔记',
  // 卡片上「自动摘要」的开关和说明（接在条数后面）
  compactOn: '自动摘要：开',
  compactOff: '自动摘要：关',
  compactDesc: ' · 自动摘要：压缩上下文后，用 Haiku 把摘要浓缩成一句存入笔记',
  // 安全页上的一行（lemo.caps）。不带风格味道：安全页要一眼看懂
  cap: {
    title: '压缩后自动摘要',
    desc: '压缩上下文后，把压缩摘要发给 Haiku，浓缩成一句存入笔记 · 存在插件本地存档里，不写进你的项目文件',
  },
  // 「全部关闭」时自动摘要的开关没存进去（横条上的提示）
  offFail: '自动摘要没关上 · 请在「安全」页再关一次',
}

export type TodoStrings = typeof zh

const en: TodoStrings = {
  title: 'Notes',
  desc: 'Total: {n}',
  label: 'Note ',
  placeholder: 'Write a note, press Enter to save',
  save: 'Save',
  compactPrompt: 'Below is a session summary. In one English sentence of at most 15 words, say what the session did. Output only that sentence.\n\n',
  compactNote: 'Summary: {text}',
  compactDone: 'Context compacted, summary saved to notes',
  compactOn: 'Auto summary: on',
  compactOff: 'Auto summary: off',
  compactDesc: ' · Auto summary: after compaction, Haiku condenses the summary into one note',
  cap: {
    title: 'Auto summary after compaction',
    desc: "After compaction, sends the compaction summary to Haiku and saves one condensed line as a note · kept in the plugin's local store, not in your project files",
  },
  offFail: "Auto summary didn't turn off · turn it off again on the Safety page",
}

export const STR: Record<Lang, TodoStrings> = { zh, en }
