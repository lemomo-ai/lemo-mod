// 掌机风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|一命通关，一滴血没掉。|现在动手，一次就成。',
      '1|前面就是存档点。|先提交一次，再往下走。',
      '3|这一关的地图还没摸清。|再读一遍需求。',
      '2|攒够金币，再去打大怪。|先把小毛病清掉。',
      '4|血条只剩最后一格。|先备份，再动手。',
      '1|双人模式，配合默契。|这次合并会很顺。',
      '2|大关拆成几个小房间。|把问题拆小一点。',
      '3|说明书缺了一页。|补上注释和文档。',
      '0|打出了隐藏结局。|可以发版了。',
      '5|没存档就去打最终大怪。|今天别碰主分支。',
      '3|小人卡在墙里出不来。|加日志，别靠猜。',
      '1|满血满蓝，装备齐全。|放心重构。',
    ],
    en: [
      '0|A no-hit run, every heart intact.|Start now, it works first try.',
      '1|A save point just ahead.|Commit now, then keep going.',
      '3|The map for this stage is still dark.|Read the requirements once more.',
      '2|Collect your coins before the boss.|Clear the small bugs first.',
      '4|Down to your last heart.|Back up first, then change things.',
      '1|Two players, perfectly in sync.|This merge will go smoothly.',
      '2|A big level, split into small rooms.|Break the problem into smaller parts.',
      '3|A page is missing from the manual.|Fill in the comments and docs.',
      '0|You found the secret ending.|Ship it.',
      '5|Facing the final boss with no save.|Leave the main branch alone today.',
      '3|Your hero is stuck inside a wall.|Add logs instead of guessing.',
      '1|Full health, full gear.|Refactor with confidence.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。用游戏结算的评级
  ranks: {
    zh: ['S 级', 'A 级', 'B 级', 'C 级', 'D 级', '游戏结束'],
    en: ['Rank S', 'Rank A', 'Rank B', 'Rank C', 'Rank D', 'Game over'],
  },
  // 签筒名：卡片上签级上面的小字。签从宝箱里开出来
  tube: { zh: '{style} · 宝箱', en: '{style} · Treasure chest' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['额外', '一命'], en: ['EXTRA', 'LIFE'] },
}

export default words
