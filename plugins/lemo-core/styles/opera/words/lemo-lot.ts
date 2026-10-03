// 脸谱风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」。签文是台前幕后的一幕
  lots: {
    zh: [
      '0|一亮相，满堂彩。|现在动手，一次就成。',
      '1|锣鼓点对上了，一板一眼。|先写测试，再改代码。',
      '3|角儿还没对过词。|再读一遍需求。',
      '3|胡琴还在定弦。|等检查跑完再下结论。',
      '4|台板有一块松了。|先备份，再动手。',
      '1|生旦对唱，句句接得上。|这次合并会很顺。',
      '2|一出大戏，一折一折地排。|把问题拆小一点。',
      '3|戏本上缺了一页唱词。|补上注释和文档。',
      '0|谢了三回幕，观众还不肯走。|可以发版了。',
      '5|没排过一遍，硬要上台。|今天别碰主分支。',
      '3|台上灯忽明忽暗，看不清脸谱。|加日志，别靠猜。',
      '1|老戏新排，路数都熟。|放心重构。',
    ],
    en: [
      '0|One pose, and the house roars.|Start now, it works first try.',
      '1|Drums and gongs land on every beat.|Write the test, then the code.',
      '3|The lead has not run lines yet.|Read the requirements once more.',
      '3|The fiddle is still being tuned.|Wait for the checks before you decide.',
      '4|A loose board on the stage floor.|Back up first, then change things.',
      '1|The duet trades lines without a gap.|This merge will go smoothly.',
      '2|A long play, rehearsed one act at a time.|Break the problem into smaller parts.',
      '3|A page of lyrics is missing from the script.|Fill in the comments and docs.',
      '0|Three curtain calls and nobody leaves.|Ship it.',
      '5|Opening night with no rehearsal.|Leave the main branch alone today.',
      '3|The lights flicker, the painted faces blur.|Add logs instead of guessing.',
      '1|An old play restaged, every move familiar.|Refactor with confidence.',
    ],
  },
  // 签级名：按台下的反应分，第几个就是签级几（0 最好）。要正好 6 个
  ranks: {
    zh: ['满堂彩', '叫好', '有彩', '平平', '冷场', '倒彩'],
    en: ['Standing ovation', 'Bravo', 'Warm applause', 'Polite claps', 'Cold house', 'Booed'],
  },
  // 签筒名：卡片上签级上面的小字
  tube: { zh: '{style} · 签筒', en: '{style} · Lot tube' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['梨园', '吉签'], en: ['STAGE', 'LOT'] },
}

export default words
