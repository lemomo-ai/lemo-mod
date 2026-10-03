// lemo-meter 的默认文字：中性的（素色风格下显示的就是它们）。
// 带风格味道的文字（柠檬实验室的「容量」「样本」「待测」「实验 T03」……）放在
// plugins/lemo-core/styles/lemon-lab/words/lemo-meter.ts，用 word(lk, 'lemo-meter.<键>', 默认) 取。
// 风格能覆盖的键：tbandCtx、tbandQuota、tbandSample、pending、trial、brandSub、statusBrand、usageTitle

import type { Lang } from './shared/lemo'

const zh = {
  // 报到：面板「已装的 mod」里的名字和装上就生效的外观（两样都能在安全页关掉）
  title: '用量横条',
  always: [
    '输入框上方横条：上下文、5 小时额度、花费、git 分支和各 mod 的状态标签',
    '状态栏：消息编号、上下文和状态标签（已有自己的状态栏时默认关闭）',
  ],
  // 安全页上的几行（能力清单）：会做什么、碰到什么
  cap: {
    band: { title: '横条', desc: '输入框上方显示上下文、5 小时额度、花费、git 分支 · 读取 .git/HEAD，不运行 git' },
    status: { title: '状态栏', desc: '输入框下方显示消息编号和上下文 · 已有自己的状态栏时默认关闭' },
    version: { title: '查新版本', desc: '点击后联网查询 Claude Code 最新版本' },
  },
  // 桌面横条
  band: { ctx: '上下文', quota: '5 小时额度', cost: '花费', pending: '暂无' },
  // 终端横条（短一点，刻度尺前面的标签按宽度对齐）
  tband: { ctx: '上下文', quota: '额度', sample: '消息' },
  // 右上角的编号胶囊，{no} 是 T03（和 lemo-skin、lemo-ask 一样：{no} 是编号，{n} 是数字）
  trial: '{no}',
  // 品牌名后面的小字副标题；空字符串表示不画
  brandSub: '',
  // 状态栏：品牌短名 ┊ T03 ┊ 上下文 12% ┊ 各胶囊
  status: { brand: 'lemo', ctx: '上下文' },
  usage: {
    title: '用量',
    desc: '上下文、5 小时额度和本次花费，每轮更新',
    trend: '上下文走势',
    noTrend: '完成一轮后显示走势',
  },
  branch: { title: 'git 分支', desc: '在横条显示当前 git 分支（读取 .git/HEAD，不运行 git）', none: '当前目录不是 git 仓库', value: '当前分支：{b}' },
  version: {
    title: '检查新版本',
    desc: '点击「检查」联网查询 Claude Code 最新版本',
    btn: '检查',
    busy: '查询中…',
    same: '已是最新：{v}',
    newer: '有新版本 {latest}（当前 {cur}）',
    failed: '查询失败（{why}）',
    noVersion: '未获取到版本号',
    changelog: '更新日志',
  },
}

export type MeterStrings = typeof zh

const en: MeterStrings = {
  title: 'Usage meter',
  always: [
    'Band above the prompt: context, 5-hour quota, cost, git branch and each mod\'s status badges',
    'Status line: message number, context and status badges (off by default if you have your own status line)',
  ],
  cap: {
    band: { title: 'Band', desc: 'Shows context, 5-hour quota, cost and git branch above the prompt · reads .git/HEAD, does not run git' },
    status: { title: 'Status line', desc: 'Shows message number and context below the prompt · off by default if you have your own status line' },
    version: { title: 'Check for updates', desc: 'Looks up the latest Claude Code version online when pressed' },
  },
  band: { ctx: 'Context', quota: '5-hour quota', cost: 'Cost', pending: 'n/a' },
  tband: { ctx: 'ctx', quota: 'quota', sample: 'msg' },
  trial: '{no}',
  brandSub: '',
  status: { brand: 'lemo', ctx: 'ctx' },
  usage: {
    title: 'Usage',
    desc: 'Context, 5-hour quota and session cost, updated each turn',
    trend: 'Context trend',
    noTrend: 'The trend appears after the first turn',
  },
  branch: { title: 'git branch', desc: 'Shows the current git branch on the band (reads .git/HEAD, does not run git)', none: 'This directory is not a git repository', value: 'Current branch: {b}' },
  version: {
    title: 'Check for updates',
    desc: 'Press Check to look up the latest Claude Code version online',
    btn: 'Check',
    busy: 'Checking…',
    same: 'Up to date: {v}',
    newer: 'New version {latest} (current {cur})',
    failed: 'Check failed ({why})',
    noVersion: 'no version number found',
    changelog: 'Changelog',
  },
}

export const STR: Record<Lang, MeterStrings> = { zh, en }
