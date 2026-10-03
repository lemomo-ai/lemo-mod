// 篝火风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|一根火柴就点着了，风向也正好。|现在动手，一次就成。',
      '1|柴码得整整齐齐，烧得很匀。|先写测试，再改代码。',
      '3|引火的细枝还潮着，先晾一晾。|再读一遍需求。',
      '2|顺着溪水走，路自己就出来了。|把问题拆小一点。',
      '4|帐篷有根地钉松了。|先备份，再动手。',
      '1|两小堆火拢成一堆，烧得更旺。|这次合并会很顺。',
      '3|地图缺了一角。|补上注释和文档。',
      '0|满天星星，明天准是晴天。|可以发版了。',
      '5|大风天，别在帐篷边上点火。|今天别碰主分支。',
      '3|林子里有响动，看不清是什么。|加日志，别靠猜。',
      '1|炭火稳稳的，能烧到天亮。|放心重构。',
      '2|再添一根柴，火又旺了一点。|小步提交，一次改一点。',
    ],
    en: [
      '0|First match, and the fire takes.|Strike now, it catches first try.',
      '1|Wood stacked neat, burning even.|Write the test, then the code.',
      '3|The kindling is still damp.|Read the requirements again.',
      '2|Follow the creek and the trail shows itself.|Break the problem into smaller pieces.',
      '4|One tent stake has worked loose.|Back up first, then make changes.',
      '1|Two small fires become one bright one.|This merge will go smoothly.',
      '3|A corner of the map is torn off.|Fill in the comments and docs.',
      '0|A sky full of stars. Clear tomorrow.|Ship it.',
      '5|No fires by the tent in high wind.|Leave the main branch alone today.',
      '3|Something rustles past the firelight.|Add logs instead of guessing.',
      '1|The coals are steady and will last till dawn.|Refactor with confidence.',
      '2|One more log and the fire perks up.|Commit in small steps.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个
  ranks: {
    zh: ['上上签', '上签', '中上签', '中签', '下签', '下下签'],
    en: ['Great luck', 'Good luck', 'Fair, rising', 'Fair', 'Poor luck', 'Bad luck'],
  },
  // 签筒名：卡片上签级上面的小字。营地里的签装在一个铁皮罐里
  tube: { zh: '{style} · 铁皮签罐', en: '{style} · Lot tin' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['营火', '灵签'], en: ['CAMP', 'LOT'] },
}

export default words
