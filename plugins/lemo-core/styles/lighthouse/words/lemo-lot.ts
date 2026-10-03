// 灯塔风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
// 在这个风格里，抽签是看今天的海况：签级从顺风满帆到风暴
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '1|浮标排得整整齐齐。|先写测试，把航道标出来。',
      '3|海上起了薄雾。|再读一遍需求，别凭印象。',
      '0|灯光照到港口，一路顺风。|现在动手，一次就成。',
      '4|礁石就藏在水面下。|先备份，再动手。',
      '2|潮水还在涨，再等一等。|等检查跑完再下结论。',
      '1|老船长认得这条航线。|照着项目里现成的写法来。',
      '3|罗盘的指针有点晃。|加日志，别靠猜。',
      '5|风暴预警，所有船回港。|今天别碰主分支，更别强推。',
      '0|船稳稳地靠了岸。|可以发版了。',
      '2|灯油还剩一半。|先把最要紧的做完。',
      '3|海图上少画了一段海岸。|补上注释和文档。',
      '4|锚链缠在了一起。|先理清依赖，再往下做。',
    ],
    en: [
      '1|The buoys line up neatly.|Write the tests first and mark the channel.',
      '3|A thin fog rolls in.|Reread the requirements, not your memory of them.',
      '0|The beam reaches the harbor, fair wind all the way.|Start now, it lands on the first try.',
      '4|Rocks just under the surface.|Back up first, then make changes.',
      '2|The tide is still coming in.|Wait for the checks before you decide.',
      '1|The old captain knows this route.|Follow the patterns already in the project.',
      '3|The compass needle wobbles.|Add logs instead of guessing.',
      '5|Storm warning, every boat back to port.|Leave main alone today, and no force pushes.',
      '0|The ship eases into its berth.|Ship it.',
      '2|The lamp is down to half its oil.|Finish the most important part first.',
      '3|The chart is missing a stretch of coast.|Fill in the comments and docs.',
      '4|The anchor chain is tangled.|Sort out the dependencies before going on.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个
  ranks: {
    zh: ['顺风满帆', '风平浪静', '微风', '起雾', '大浪', '风暴'],
    en: ['Fair wind', 'Calm seas', 'Light breeze', 'Fog', 'Heavy swell', 'Storm'],
  },
  // 签筒名：卡片上签级上面的小字
  tube: { zh: '{style} · 海况签', en: '{style} · Sea forecast' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['顺风', '顺水'], en: ['FAIR', 'WIND'] },
}

export default words
