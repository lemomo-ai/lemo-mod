// lemo-lot 自己的文字（中性的默认文字，素色风格下显示的就是它们）。
// 带风格味道的签文、签级名、签筒名、印章字放在风格包 words/lemo-lot.ts，按同样的键覆盖：lots、ranks、tube、stamp

import type { Lang } from './shared/lemo'

const zh = {
  title: '抽签',
  // 报到时列在「已装的 mod」里的外观：签文卡片。抽签工具本身在安全页上
  always: '把抽到的签显示为签文卡片（抽签工具在「安全」页开启）',
  // 签文：每支签一行「签级|签文|解签」，签级 0 最好、5 最差。中英两份按顺序一一对应
  lots: [
    '0|风正好，帆刚升。|现在动手，一次就成。',
    '1|路平，脚下稳。|先写测试，再改代码。',
    '3|水还没烧开。|再读一遍需求。',
    '3|雾还没散，先别赶路。|等检查跑完再下结论。',
    '4|桥上有一块木板松了。|先备份，再动手。',
    '1|顺水行舟。|这次合并会很顺。',
    '2|云散了，月亮越来越亮。|把问题拆小一点。',
    '3|书里少了一页。|补上注释和文档。',
    '0|花开正好。|可以发版了。',
    '5|夜里下雨，路滑。|今天别碰主分支。',
    '3|风向一直在变。|加日志，别靠猜。',
    '1|根深叶茂。|放心重构。',
  ],
  // 签级名：第几个就是签级几
  ranks: ['大吉', '吉', '小吉', '平', '小凶', '凶'],
  tube: '签筒',
  stamp: ['吉祥', '如意'],
  reading: '解签：',
  shaking: '摇签中…',
  failed: '抽签失败',
  // 这个会话里中途关掉了抽签工具，Claude 还调了一次
  off: '抽签工具未开启 · 在 /lemo-mod 安全 中打开',
  // 安全页上的一行（lemo.caps）。不带风格味道：安全页要一眼看懂
  cap: {
    title: '抽签工具',
    desc: '给 Claude 增加抽签工具 draw_lot，说「抽支签」即可抽签 · 开启后下一条消息生效',
  },
}

export type LotStrings = typeof zh

const en: LotStrings = {
  title: 'Lots',
  always: 'Shows drawn lots as fortune cards (turn the lot tool on in Safety)',
  lots: [
    '0|A fair wind, the sail just raised.|Start now, it works first try.',
    '1|A flat road, sure footing.|Write the test, then the code.',
    '3|The water has not boiled yet.|Read the requirements once more.',
    '3|The fog has not lifted; wait before you set off.|Wait for the checks before you decide.',
    '4|One loose plank on the bridge.|Back up first, then change things.',
    '1|Sailing with the current.|This merge will go smoothly.',
    '2|The clouds part and the moon grows bright.|Break the problem into smaller parts.',
    '3|A page is missing from the book.|Fill in the comments and docs.',
    '0|The flowers are in full bloom.|Ship it.',
    '5|Rain at night, the road is slick.|Leave the main branch alone today.',
    '3|The wind keeps changing.|Add logs instead of guessing.',
    '1|Deep roots, full leaves.|Refactor with confidence.',
  ],
  ranks: ['Great luck', 'Good luck', 'Small luck', 'Even', 'Small trouble', 'Bad luck'],
  tube: 'Lot tube',
  stamp: ['GOOD', 'LUCK'],
  reading: 'Reading: ',
  shaking: 'Drawing a lot…',
  failed: 'Draw failed',
  off: 'Lot tool is off · turn it on in /lemo-mod safety',
  cap: {
    title: 'Lot tool',
    desc: 'Adds a draw_lot tool for Claude; say "draw a lot" to draw · takes effect from your next message',
  },
}

export const STR: Record<Lang, LotStrings> = { zh, en }
