// 葫芦风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」。
  // 签文是药铺里的一幕：君臣佐使是一张方子里各味药的分工，十八反是不能同用的药
  lots: {
    zh: [
      '0|戥子一提，分毫不差。|现在动手，一次就成。',
      '1|对症下药，一味不多。|先写测试，再改代码。',
      '3|还没号脉，就要开方。|再读一遍需求。',
      '3|药还在罐里，火候没到。|等检查跑完再下结论。',
      '4|药斗底下有点返潮。|先备份，再动手。',
      '1|君臣佐使，各归其位。|这次合并会很顺。',
      '2|一大服药，分成几包煎。|把问题拆小一点。',
      '3|药包上忘了写用法。|补上注释和文档。',
      '0|三服下去，药到病除。|可以发版了。',
      '5|十八反的两味，进了一个药包。|今天别碰主分支。',
      '3|脉象忽快忽慢，摸不准。|加日志，别靠猜。',
      '1|老方子传了三代，回回灵。|放心重构。',
    ],
    en: [
      '0|The scale settles, not a grain off.|Start now, it works first try.',
      '1|The right remedy, not one herb too many.|Write the test, then the code.',
      '3|Writing the prescription before taking the pulse.|Read the requirements once more.',
      '3|The pot is on, but it has not simmered long enough.|Wait for the checks before you decide.',
      '4|A little damp under the herb drawers.|Back up first, then change things.',
      '1|Every herb in the formula knows its role.|This merge will go smoothly.',
      '2|One big dose, brewed in several pots.|Break the problem into smaller parts.',
      '3|No directions written on the packet.|Fill in the comments and docs.',
      '0|Three doses in, the patient is up and about.|Ship it.',
      '5|Two clashing herbs in the same packet.|Leave the main branch alone today.',
      '3|The pulse races, then slows, hard to read.|Add logs instead of guessing.',
      '1|A family formula, trusted for three generations.|Refactor with confidence.',
    ],
  },
  // 签级名：按药效分，第几个就是签级几（0 最好）。要正好 6 个
  ranks: {
    zh: ['药到病除', '对症', '温补', '平和', '苦口', '猛药'],
    en: ['Instant cure', 'Right remedy', 'Gentle tonic', 'Mild', 'Bitter pill', 'Harsh dose'],
  },
  // 签筒名：卡片上签级上面的小字。庙里的药签筒
  tube: { zh: '{style} · 药签筒', en: '{style} · Remedy lots' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['妙手', '回春'], en: ['CURE', 'ALL'] },
}

export default words
