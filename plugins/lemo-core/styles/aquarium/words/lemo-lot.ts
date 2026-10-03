// 泡泡鱼风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|水清见底，鱼游得正欢。|现在动手，一次就成。',
      '1|水温稳当，过滤器嗡嗡在转。|先写测试，再改代码。',
      '3|新水还没晾好，先别放鱼。|再读一遍需求。',
      '2|分了缸，谁也不挤谁。|把问题拆小一点。',
      '4|缸壁上有道细细的划痕。|先备份，再动手。',
      '1|两群鱼并进一口缸，相安无事。|这次合并会很顺。',
      '3|缸上的标签泡得字都化开了。|补上注释和文档。',
      '0|小鱼苗孵出来了。|可以发版了。',
      '5|整缸水倒掉之前，先把鱼捞出来。|今天别碰主分支。',
      '3|水突然浑了，说不清为什么。|加日志，别靠猜。',
      '1|水草扎了根，缸里自成一片天。|放心重构。',
      '2|鱼群一转身，都跟着领头那条。|先照着现有的写法来。',
    ],
    en: [
      '0|Clear water all the way down to the gravel.|Dive in, it works first try.',
      '1|Steady temperature, filter humming.|Write the test, then the code.',
      '3|The new water has not settled yet.|Read the requirements once more.',
      '2|Split into two tanks, nobody is crowded.|Break the problem into smaller parts.',
      '4|A fine scratch along the glass.|Back up first, then change things.',
      '1|Two schools share one tank in peace.|This merge will go smoothly.',
      '3|The tank label has soaked illegible.|Fill in the comments and docs.',
      '0|The fry have hatched.|Ship it.',
      '5|Net the fish before you drain the tank.|Leave the main branch alone today.',
      '3|The water clouded over for no clear reason.|Add logs instead of guessing.',
      '1|The plants have rooted and the tank runs itself.|Refactor with confidence.',
      '2|The school turns and follows its leader.|Follow the patterns already in the code.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个
  ranks: {
    zh: ['上上签', '上签', '中上签', '中签', '下签', '下下签'],
    en: ['Great luck', 'Good luck', 'Fair, rising', 'Fair', 'Poor luck', 'Bad luck'],
  },
  // 签筒名：卡片上签级上面的小字。泡泡鱼的签装在漂流瓶里
  tube: { zh: '{style} · 漂流瓶', en: '{style} · Message bottle' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['水族', '灵签'], en: ['AQUA', 'LOT'] },
}

export default words
