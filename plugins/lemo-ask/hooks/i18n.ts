// lemo-ask 的文字（中性的默认文字，素色风格下显示的就是它们）。
// 带风格味道的放在 lemo-core 的风格包 styles/<风格>/words/lemo-ask.ts，按同样的键覆盖（现在只有 title）。

import type { Lang } from './shared/lemo'

const zh = {
  /** 面板「已装的 mod」里的名字和说明 */
  name: '提问弹窗',
  always: '提问弹窗顶部显示编号和问题数',
  /** 抬头强调色底上的词，风格可以覆盖（柠檬实验室是「实验提问」） */
  title: '提问',
  /** 抬头：{title} 是上面的词，{no} 是消息编号 T03 */
  tag: '? {title} · {no}',
  /** 抬头右边的一句：一个问题、几个问题（英文要分单复数，所以分两条） */
  one: '共 1 个问题',
  many: '共 {n} 个问题',
  /** 安全页上的那一行 */
  cap: { title: '提问弹窗标题', desc: '在提问弹窗顶部显示消息编号和问题数，选项不变' },
}

export type AskStrings = typeof zh

const en: AskStrings = {
  name: 'Question header',
  always: 'Shows the message number and question count above the question dialog',
  title: 'Question',
  tag: '? {title} · {no}',
  one: '1 question',
  many: '{n} questions',
  cap: { title: 'Question header', desc: 'Shows the message number and question count above the question dialog; options unchanged' },
}

export const STR: Record<Lang, AskStrings> = { zh, en }
