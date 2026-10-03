// 磁带风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|一遍录成，没有一点杂音。|现在动手，一次就成。',
      '1|电平调好，指针不进红区。|先写测试，再改代码。',
      '3|磁带还没倒到头。|再读一遍需求。',
      '2|A 面放完，翻过来听听。|换个角度看这个问题。',
      '4|磁带开始绞带了。|先备份，再动手。',
      '1|两首歌接得刚刚好。|这次合并会很顺。',
      '2|拿铅笔把松了的带子卷紧。|把问题拆小一点。',
      '3|盒子里的歌单还没写。|补上注释和文档。',
      '0|母带一遍录好。|可以发版了。',
      '5|千万别在母带上覆盖重录。|今天别碰主分支。',
      '3|放出来的声音忽快忽慢。|加日志，别靠猜。',
      '1|开了降噪，底噪全没了。|放心重构。',
    ],
    en: [
      '0|One clean take, not a hiss on it.|Start now, it works first try.',
      '1|Levels set, the needle stays out of the red.|Write the test, then the code.',
      '3|The tape has not rewound all the way.|Read the requirements once more.',
      '2|Side A is done, flip it over.|Look at the problem from the other side.',
      '4|The deck is starting to chew the tape.|Back up first, then change things.',
      '1|Two songs fade into each other just right.|This merge will go smoothly.',
      '2|A pencil winds the loose tape back in.|Break the problem into smaller parts.',
      '3|The track list on the case is still blank.|Fill in the comments and docs.',
      '0|The master tape, done in one take.|Ship it.',
      '5|Never record over the master.|Leave the main branch alone today.',
      '3|Wow and flutter on the playback.|Add logs instead of guessing.',
      '1|Noise reduction on, the hiss is gone.|Refactor with confidence.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。磁带里用排行榜的位置
  ranks: {
    zh: ['榜首', '上榜', '冲榜', '中游', '下滑', '落榜'],
    en: ['No. 1 hit', 'Top ten', 'Climbing', 'Mid chart', 'Slipping', 'Off the chart'],
  },
  // 签筒名：卡片上签级上面的小字。点唱机替你挑一首
  tube: { zh: '{style} · 点唱机', en: '{style} · Jukebox' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['金曲', '点播'], en: ['HOT', 'PICK'] },
}

export default words
