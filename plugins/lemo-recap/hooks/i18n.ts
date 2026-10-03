// lemo-recap 自己的文字（中性的默认文字，素色风格下显示的就是它们）。
// 带风格味道的放在风格包 lemo-core/styles/<风格>/words/lemo-recap.ts，按同样的键覆盖：title、done、start、copied

import type { Lang } from './shared/lemo'

const zh = {
  /** 报到用的名字，列在面板「已装的 mod」里 */
  join: '会话小结',
  title: '小结',
  desc: '把本次会话汇总成三行摘要',
  write: '写小结',
  again: '重写',
  busy: '生成中…',
  copy: '复制',
  done: '小结已生成',
  start: '正在生成小结，完成后显示在面板中。',
  copied: '已复制到剪贴板',
  copyFail: '复制失败：{why}',
  copyWhy: { 'no-surface': '当前界面不支持剪贴板', 'no-clipboard': '剪贴板不可用', refused: '被系统拒绝' },
  nothing: '暂无可总结的对话，先聊一轮再试。',
  fail: '生成失败（{why}），请稍后重试。',
  why: { 'api-error': '接口出错', 'empty-reply': '模型未返回内容', aborted: '已中断' },
  // 给模型的话跟着界面语言走，小结用用户的语言写。
  // fork 的这句话接在对话记录后面，提示缓存只管前面那段对话，换语言不影响缓存
  prompt: '用三行中文总结这次会话到目前为止做了什么。每行不超过 30 个字，分别以「1.」「2.」「3.」开头，只输出这三行。',
  // 安全页上的一行（lemo.caps，「手动触发」）。不带风格味道：安全页要一眼看懂
  cap: {
    title: '会话小结',
    desc: '用主模型读取整段对话，生成三行小结 · 对话越长用量越多',
  },
}

export type RecapStrings = typeof zh

const en: RecapStrings = {
  join: 'Session recap',
  title: 'Recap',
  desc: 'Summarizes this session in three lines',
  write: 'Write recap',
  again: 'Rewrite',
  busy: 'Generating…',
  copy: 'Copy',
  done: 'Recap is ready',
  start: 'Generating the recap; it will show in the panel.',
  copied: 'Copied to the clipboard',
  copyFail: 'Copy failed: {why}',
  copyWhy: { 'no-surface': 'clipboard not supported here', 'no-clipboard': 'clipboard unavailable', refused: 'refused by the system' },
  nothing: 'Nothing to summarize yet. Have one turn first.',
  fail: 'Failed ({why}). Try again later.',
  why: { 'api-error': 'API error', 'empty-reply': 'the model returned nothing', aborted: 'interrupted' },
  prompt: 'Summarize what this session has done so far in three short lines of English, at most 12 words each. Start the lines with "1.", "2." and "3." and output only those lines.',
  cap: {
    title: 'Session recap',
    desc: 'The main model reads the whole conversation and writes a three-line recap · longer conversations use more',
  },
}

export const STR: Record<Lang, RecapStrings> = { zh, en }

/** /lemo-mod 后面认的词 */
export const WORDS: ReadonlySet<string> = new Set(['总结', 'recap'])
