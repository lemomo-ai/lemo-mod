// 杨枝甘露风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」。
  // 英文保留糖水的通行叫法：mango pomelo sago（杨枝甘露）、double-skin milk（双皮奶）
  lots: {
    zh: [
      '0|芒果正当季，杨枝甘露满满一碗。|放手去做，一次就成。',
      '1|双皮奶凝得刚好，一勺下去在颤。|改动不大，放心提交。',
      '2|红豆还没煲开花。|再给它一点时间，先别下结论。',
      '3|芋圆搓得大小不一。|统一一下命名和格式。',
      '4|糖放多了，甜得发齁。|删掉用不上的代码。',
      '1|西米煮到透明，一粒不黏。|这次合并会很顺。',
      '3|冰放早了，糖水变淡。|理一理代码执行的先后。',
      '0|今日售罄，水牌全划掉了。|可以发版了。',
      '5|整锅糖水煲糊了底。|先备份，今天别做大改动。',
      '2|勺子找不到，原来在碗底。|答案多半在你写过的代码里。',
      '4|碗边磕了个小缺口。|小毛病先修，别留到上线。',
      '3|客人说要少甜，你没听清。|再读一遍需求。',
    ],
    en: [
      '0|Mangoes in season, a full bowl of mango pomelo sago.|Go ahead, it lands on the first try.',
      '1|The double-skin milk sets just right and wobbles on the spoon.|A small change, commit with confidence.',
      '2|The red beans have not burst open yet.|Give it time before you decide.',
      '3|The taro balls came out all different sizes.|Make the naming and formatting consistent.',
      '4|Too much sugar, cloyingly sweet.|Cut the code you do not need.',
      '1|The sago turns clear, not a pearl sticks.|This merge will go smoothly.',
      '3|The ice went in too early and watered it down.|Check the order things run in.',
      '0|Sold out, every item crossed off the board.|Ship it.',
      '5|The whole pot scorched on the bottom.|Back up and skip big changes today.',
      '2|The lost spoon was at the bottom of the bowl.|The answer is probably in code you already wrote.',
      '4|A small chip on the rim of the bowl.|Fix the small bug before it ships.',
      '3|The customer asked for less sugar and you missed it.|Read the requirements again.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。按这碗糖水怎么样排
  ranks: {
    zh: ['碗碗见底', '甜度刚好', '再加点料', '清清淡淡', '甜得发齁', '煲糊了底'],
    en: ['Bowls scraped clean', 'Just sweet enough', 'Needs a topping', 'Plain and mild', 'Far too sweet', 'Scorched pot'],
  },
  // 签筒名：卡片上签级上面的小字。糖水铺的签装在一只碗里
  tube: { zh: '{style} · 签碗', en: '{style} · Fortune bowl' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['甜品', '吉签'], en: ['SWEET', 'LUCK'] },
}

export default words
