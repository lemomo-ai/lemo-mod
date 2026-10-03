// lemo-guard 自己的文字（中性的默认文字；带风格味道的放在 lemo-core 的风格包 words/lemo-guard.ts，按同样的键覆盖：
// abort、timeoutTitle）

import type { LemoGuardTimeout } from '../types'
import type { Lang } from './shared/lemo'

const zh = {
  title: '限时',
  // {t} 是选项的文字，比如「2 分钟」
  abort: '本轮超过 {t}，已自动中止',
  timeout: {
    title: '限时',
    desc: 'Claude 单轮工作超时自动中止 · 等你确认的时间不计',
    label: '时长 ',
    opts: { off: '不停', '30': '30 秒', '120': '2 分钟', '300': '5 分钟' } as Record<LemoGuardTimeout, string>,
  },
  // 安全页上的一行（lemo.caps）。不带风格味道：安全页要一眼看懂。{t} 是开着时的时限，关着时是打开后的时限（2 分钟）
  cap: {
    title: '限时',
    desc: 'Claude 单轮工作超过 {t} 自动中止 · 等你确认的时间不计 · 时长在「行为」页设置',
  },
}

export type GuardStrings = typeof zh

const en: GuardStrings = {
  title: 'Time limit',
  abort: 'This turn ran over {t} and was stopped',
  timeout: {
    title: 'Time limit',
    desc: 'Stops Claude when a turn runs over time · time waiting for you does not count',
    label: 'Duration ',
    opts: { off: 'never', '30': '30 s', '120': '2 min', '300': '5 min' },
  },
  cap: {
    title: 'Time limit',
    desc: 'Stops Claude when a turn runs over {t} · time waiting for you does not count · set the limit on the Behavior page',
  },
}

export const STR: Record<Lang, GuardStrings> = { zh, en }
