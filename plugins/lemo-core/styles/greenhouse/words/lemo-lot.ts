// 小苗风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|一夜之间，整盘都出了苗。|现在动手，一次就成。',
      '1|根扎得稳，叶子朝着光。|先写测试，再改代码。',
      '3|种子还泡在水里，没到时候。|再读一遍需求。',
      '2|分苗之后，每株都有了地方。|把大函数拆成小块。',
      '4|叶子背面趴着几只蚜虫。|先备份，再动手。',
      '1|嫁接的口子长严实了。|这次合并会很顺。',
      '3|盆土太湿，根闷得慌。|删掉没人调用的代码。',
      '3|苗牌被水冲得看不清了。|补上注释和文档。',
      '0|第一朵花开了。|可以发版了。',
      '5|主干一剪下去就长不回来。|今天别碰主分支。',
      '3|叶子发黄，还没找到原因。|加日志，别靠猜。',
      '1|换了大盆，根舒展开了。|放心重构。',
    ],
    en: [
      '0|The whole tray came up overnight.|Go ahead, it lands first try.',
      '1|Roots set deep, leaves turned to the light.|Write the tests first, then the code.',
      '3|The seeds are still soaking.|Read the requirements once more.',
      '2|Pricked out, every seedling has room.|Split the big function into small ones.',
      '4|Aphids hiding under the leaves.|Back up before you touch anything.',
      '1|The graft has healed clean.|This merge will go smoothly.',
      '3|Soggy soil, sulking roots.|Cut the code nobody calls.',
      '3|The plant tags have washed blank.|Fill in the comments and docs.',
      '0|The first flower is open.|Ship it.',
      '5|Cut the main stem and it never grows back.|Leave the main branch alone today.',
      '3|Yellowing leaves, cause unknown.|Add logs instead of guessing.',
      '1|Up a pot size, the roots stretch out.|Refactor with confidence.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个
  ranks: {
    zh: ['上上签', '上签', '中上签', '中签', '下签', '下下签'],
    en: ['Great luck', 'Good luck', 'Fair, rising', 'Fair', 'Poor luck', 'Bad luck'],
  },
  // 签筒名：卡片上签级上面的小字。温室里从种子罐里抽签
  tube: { zh: '{style} · 种子罐', en: '{style} · Seed jar' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['温室', '灵签'], en: ['GREEN', 'LOT'] },
}

export default words
