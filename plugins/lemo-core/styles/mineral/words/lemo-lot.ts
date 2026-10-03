// 锦鲤风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」。
  // 签文是画室里的一幕：粉本是壁画打稿用的扎孔底样，起甲是壁画颜料层翘起来
  lots: {
    zh: [
      '0|最后一笔落下，满壁生光。|现在动手，一次就成。',
      '1|土红线起稿，一根不乱。|先写测试，再改代码。',
      '3|石青还没研细，先别上墙。|再读一遍需求。',
      '3|头一遍色还湿着。|等检查跑完再下结论。',
      '4|墙面起了甲，颜料在翘。|先备份，再动手。',
      '1|石绿压着石青，一层叠一层。|这次合并会很顺。',
      '2|一面大墙，分成几铺来画。|把问题拆小一点。',
      '3|题款漏了年月。|补上注释和文档。',
      '0|灯一照，满墙的颜色都活了。|可以发版了。',
      '5|铲墙重画之前，先问三遍。|今天别碰主分支。',
      '3|洞里光线暗，颜色看不准。|加日志，别靠猜。',
      '1|粉本对得上，照着扎孔描。|放心重构。',
    ],
    en: [
      '0|The last stroke lands and the whole wall glows.|Start now, it works first try.',
      '1|Red underdrawing, every line in place.|Write the test, then the code.',
      '3|The azurite is not ground fine yet.|Read the requirements once more.',
      '3|The first coat is still wet.|Wait for the checks before you decide.',
      '4|The plaster is flaking, the paint lifts.|Back up first, then change things.',
      '1|Malachite over azurite, layer on layer.|This merge will go smoothly.',
      '2|One huge wall, painted bay by bay.|Break the problem into smaller parts.',
      '3|The inscription is missing its date.|Fill in the comments and docs.',
      '0|Lamps lit, and every color on the wall wakes up.|Ship it.',
      '5|Ask three times before scraping a wall bare.|Leave the main branch alone today.',
      '3|Too dark in the cave to judge the colors.|Add logs instead of guessing.',
      '1|The stencil lines up, just follow the dots.|Refactor with confidence.',
    ],
  },
  // 签级名：按画品分，第几个就是签级几（0 最好）。要正好 6 个
  ranks: {
    zh: ['神品', '妙品', '能品', '佳作', '草稿', '废稿'],
    en: ['Masterpiece', 'Fine work', 'Skilled', 'Decent', 'Rough draft', 'Scrapped'],
  },
  // 签筒名：卡片上签级上面的小字。签插在笔筒里
  tube: { zh: '{style} · 笔筒签', en: '{style} · Brush pot' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['丹青', '有签'], en: ['MURAL', 'LOT'] },
}

export default words
