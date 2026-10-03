// 小火车风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
// 在这个风格里，抽签是从售票机里出一张单程票：票面写着这一程的运气
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|一路绿灯，站站准点。|现在动手，一次就过。',
      '1|换乘通道的指示牌很清楚。|先画好模块的边界再写。',
      '3|车门即将关闭，别硬挤。|发版前夜别做大改动。',
      '2|列车临时停车，很快恢复。|报错先看第一行。',
      '4|坐过了站。|退回上一个能跑的提交。',
      '1|早高峰前的空车厢。|趁安静把测试补齐。',
      '3|线路图上画着一站，其实没建。|删掉没人调用的代码。',
      '0|末班车，刚好赶上。|可以发版了。',
      '5|信号故障，全线停运。|今天别碰主分支。',
      '3|站台广播听不清。|把日志写清楚，别靠猜。',
      '2|换乘要走很长的通道。|把长函数拆成几步。',
      '4|上了反方向的车。|动手前再读一遍需求。',
    ],
    en: [
      '0|Green signals the whole way down the line.|Go now, it lands on the first try.',
      '1|The transfer signs are easy to follow.|Sketch the module boundaries before you code.',
      '3|Doors are closing, do not squeeze in.|No big changes the night before a release.',
      '2|A short hold between stations.|Read the first line of the error.',
      '4|You rode past your stop.|Go back to the last commit that worked.',
      '1|An empty car before rush hour.|Fill in the tests while it is quiet.',
      '3|The map shows a station that was never built.|Delete the code nothing calls.',
      '0|You caught the last train.|Ship it.',
      '5|Signal failure, the whole line is down.|Leave the main branch alone today.',
      '3|The platform announcement is garbled.|Make the logs readable, stop guessing.',
      '2|A long walk to the transfer.|Split the long function into steps.',
      '4|On the train going the wrong way.|Reread the requirements before you build.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个：直达最好，停运最差
  ranks: {
    zh: ['直达', '快车', '准点', '慢车', '晚点', '停运'],
    en: ['Express', 'Rapid', 'On time', 'Local', 'Delayed', 'Suspended'],
  },
  // 签筒名：卡片上签级上面的小字
  tube: { zh: '{style} · 售票机', en: '{style} · Ticket machine' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['单程', '车票'], en: ['ONE', 'WAY'] },
}

export default words
