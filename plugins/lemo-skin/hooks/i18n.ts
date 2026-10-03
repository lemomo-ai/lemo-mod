// lemo-skin 自己的文字（中性的默认文字，素色风格下显示的就是它们）。
// 带风格味道的放在风格包 words/lemo-skin.ts，按下面这些键覆盖（mod 里用 word(lk, 'lemo-skin.<键>', 默认) 取）：
//   reply、replyBare、turnDone、running、info、skill、verb.<工具名>
// 占位符：{no} 是消息编号（T03），{n} 是数字，{name} 是 skill 名，{tool} 是工具名。
// 英文要分单复数的写成 [单数, 复数]，用 plural() 挑

import type { Lang } from './shared/lemo'

/** [单数, 复数]：n 为 1 用第一个 */
export type Plural = readonly [string, string]

const zh = {
  title: '换皮',
  // Claude 每段回复上面的小标签
  reply: ' 回复 {no} ',
  // 对不上编号的回复（比如恢复的旧会话）
  replyBare: ' 回复 ',
  // 耗时行（一轮结束那一行）
  turnDone: ' ✓ {no} 完成 ',
  steps: ['{n} 步', '{n} 步'] as Plural,
  tools: ['{n} 次工具', '{n} 次工具'] as Plural,
  // 工具进度行（命令跑了几秒后出现的那一行）
  running: '运行中',
  bgHint: 'ctrl+b 转到后台运行',
  // 启动提示前面的小标签
  info: '提示',
  // 调用 skill 时横条上的提示
  skill: '调用 skill：{name}',
  // 工具行的动词：只有这几种工具换皮，别的工具照引擎原样画
  verb: { Read: '读取', Bash: '运行', Grep: '检索', Glob: '查找', WebFetch: '抓取', WebSearch: '搜索' } as Readonly<Record<string, string>>,
  state: { running: '进行中', error: '出错', interrupted: '中断', done: '完成' },
  // 折叠的工具组那一行
  group: {
    read: ['读取 {n} 个文件', '读取 {n} 个文件'] as Plural,
    bash: ['运行 {n} 条命令', '运行 {n} 条命令'] as Plural,
    search: ['检索 {n} 次', '检索 {n} 次'] as Plural,
    tools: ['查找工具 {n} 次', '查找工具 {n} 次'] as Plural,
    other: ['调用 {tool} {n} 次', '调用 {tool} {n} 次'] as Plural,
    sep: '，',
  },
  // 消息的标签（lemo-journal 自动分类贴的），显示在编号后面；认不出的标签原样显示
  kinds: { question: '提问', code: '改代码', debug: '排查', chat: '闲聊' } as Readonly<Record<string, string>>,
  unfold: {
    title: '展开工具行',
    desc: '把合并的工具行（如「读取 3 个文件」）逐条展开',
    on: '已展开 · 点击收起',
    off: '展开',
    // 输入框右下角的模式标签
    mode: '展开工具行',
  },
  // 安全页上的那一行（能力清单）
  cap: {
    title: '消息样式',
    desc: '消息加编号 T01、T02，回复标注「回复 T03」，工具行和耗时行使用风格样式',
  },
  // 面板「已装的 mod」里列的、装上就生效的外观（在安全页「消息样式」里能关）。terminal 那几条只在有终端的会话里列（桌面没有这几行）
  always: {
    common: [
      '消息加编号 T01、T02，回复标注「回复 T03」',
      '工具行和合并的工具组使用风格样式，显示开始时间',
      '调用 skill 时在横条提示「调用 skill：名字」',
    ],
    terminal: [
      '耗时行显示编号、用时、步数和工具次数',
      '「转到后台」提示、启动提示、输入框下方提示使用风格样式',
    ],
  },
}

export type SkinStrings = typeof zh

const en: SkinStrings = {
  title: 'Skin',
  reply: ' Reply {no} ',
  replyBare: ' Reply ',
  turnDone: ' ✓ {no} done ',
  steps: ['{n} step', '{n} steps'],
  tools: ['{n} tool', '{n} tools'],
  running: 'Running',
  bgHint: 'ctrl+b to run in the background',
  info: 'Notice',
  skill: 'Skill: {name}',
  verb: { Read: 'Read', Bash: 'Run', Grep: 'Search', Glob: 'Find', WebFetch: 'Fetch', WebSearch: 'Web search' },
  state: { running: 'running', error: 'error', interrupted: 'stopped', done: 'done' },
  group: {
    read: ['read {n} file', 'read {n} files'],
    bash: ['ran {n} command', 'ran {n} commands'],
    search: ['searched {n} time', 'searched {n} times'],
    tools: ['looked up tools', 'looked up tools ×{n}'],
    other: ['{tool} × {n}', '{tool} × {n}'],
    sep: ', ',
  },
  kinds: { question: 'question', code: 'code', debug: 'debug', chat: 'chat' },
  unfold: {
    title: 'Unfold tool rows',
    desc: 'Expands grouped tool rows (like "read 3 files") into one row per call',
    on: 'Unfolded · click to collapse',
    off: 'Unfold',
    mode: 'unfolded',
  },
  cap: {
    title: 'Message style',
    desc: 'Messages numbered T01, T02, replies marked "Reply T03", tool rows and turn lines use the style',
  },
  always: {
    common: [
      'Messages numbered T01, T02; replies marked "Reply T03"',
      'Tool rows and grouped tool rows use the style and show their start time',
      'Shows "Skill: name" on the band when a skill is called',
    ],
    terminal: [
      'Turn line shows the number, time, steps and tool count',
      'The "run in background" hint, startup notices and the hint under the prompt use the style',
    ],
  },
}

export const STR: Record<Lang, SkinStrings> = { zh, en }

/** 按数量挑单复数 */
export function plural(p: Plural, n: number): string {
  return n === 1 ? p[0] : p[1]
}
