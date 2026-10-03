// 灯笼风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|灯笼全亮，队伍排到了街口。|放手去做，今天手顺。',
      '1|吆喝一声，熟客都来了。|先写测试，后面改起来放心。',
      '2|雨停了，摊子重新支起来。|小步提交，慢慢推进。',
      '3|零钱不够，找不开。|先把依赖版本对一对。',
      '4|灯笼线松了，风一吹就晃。|先加个保护，再上线。',
      '1|隔壁摊借来一把勺，正好合用。|找个现成的库，别自己造。',
      '3|队越排越长，锅却只有一口。|先找到瓶颈，再谈优化。',
      '0|收摊前最后一锅卖光。|可以发版了。',
      '5|大雨突至，摊子全淋湿了。|今天别碰生产环境。',
      '2|走错一条巷，又绕回原地。|先画一下调用链再动手。',
      '4|打包袋破了个洞。|查一查边界和空值。',
      '3|吆喝太响，听不清客人点什么。|日志少打一点，只看关键的。',
    ],
    en: [
      '0|Every lantern lit, the line reaches the corner.|Go for it, everything clicks today.',
      '1|One call and the regulars come running.|Write the tests first, then change freely.',
      '2|The rain stops and the stalls go back up.|Commit in small steps.',
      '3|Not enough change in the tin.|Line up the dependency versions first.',
      '4|A loose lantern string sways in the wind.|Add a safeguard before it goes live.',
      '1|A ladle borrowed from next door fits just right.|Use a library that already does it.',
      '3|The line keeps growing, and there is one wok.|Find the bottleneck before you optimize.',
      '0|The last pot sells out before closing.|Ship it.',
      '5|A sudden downpour soaks every stall.|Keep your hands off production today.',
      '2|A wrong turn down an alley, back where you started.|Sketch the call chain before you touch it.',
      '4|A hole in the takeaway bag.|Check the edge cases and the nulls.',
      '3|Hawking so loud you cannot hear the order.|Trim the logs down to what matters.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。按今晚生意怎么样排
  ranks: {
    zh: ['灯火通明', '生意兴隆', '人来人往', '平平淡淡', '冷冷清清', '雨中收摊'],
    en: ['All lanterns lit', 'Brisk trade', 'Steady crowd', 'Quiet night', 'Few customers', 'Rained out'],
  },
  // 签筒名：卡片上签级上面的小字。夜市里有个摇签的摊
  tube: { zh: '{style} · 摇签摊', en: '{style} · Fortune stall' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['夜市', '灵签'], en: ['NIGHT', 'LOT'] },
}

export default words
