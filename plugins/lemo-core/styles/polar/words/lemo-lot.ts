// 企鹅风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|极光铺满了天，整座站都被照亮。|状态正好，把最想做的那件事做了。',
      '1|补给船准时靠岸。|依赖都到齐了，照计划往下做。',
      '2|冰芯一节一节取上来，层次分明。|一层一层排查，从最近的改动查起。',
      '3|雪地车打了三次火才着。|先把环境配好再跑。',
      '4|风速表的指针一直往上走。|先备份，再动手。',
      '5|白化天，连站房都看不见了。|今天别碰主分支。',
      '1|暖气烧得正旺。|趁热把测试补齐。',
      '0|最后一班飞机准时落地。|可以发版了。',
      '3|冰裂缝上盖着一层薄雪。|看着没问题的地方，也写个测试。',
      '2|雪地车沿着旗杆慢慢往前开。|小步提交，每一步都能退回来。',
      '3|发电机的声音有点不对。|加日志，别靠猜。',
      '4|储油罐的读数比预想的低。|清掉用不上的依赖和文件。',
    ],
    en: [
      '0|The aurora fills the sky and lights up the whole station.|You are in great shape, do the thing you most want to do.',
      '1|The supply ship docks on schedule.|Your dependencies are in, follow the plan.',
      '2|The core comes up section by section, every layer clear.|Debug layer by layer, starting from the latest change.',
      '3|The snowcat starts on the third try.|Get the environment right before you run anything.',
      '4|The anemometer needle keeps climbing.|Back up first, then make changes.',
      '5|Whiteout. You cannot even see the station.|Stay off the main branch today.',
      '1|The heaters are running hot.|Strike while it is warm and fill in the tests.',
      '0|The last flight of the season lands on time.|Ready to ship.',
      '3|A thin crust of snow hides a crevasse.|Write a test for the part that looks fine, too.',
      '2|The snowcat crawls along the flag line.|Commit in small steps you can roll back.',
      '3|The generator sounds a little off.|Add logs instead of guessing.',
      '4|The fuel tank reads lower than expected.|Clear out dependencies and files you no longer use.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。这里按天气排：从极光夜到白化天
  ranks: {
    zh: ['极光夜', '晴好', '微风', '阴冷', '暴风雪', '白化天'],
    en: ['Aurora night', 'Clear and calm', 'Light wind', 'Grey and cold', 'Blizzard', 'Whiteout'],
  },
  // 签筒名：卡片上签级上面的小字
  tube: { zh: '{style} · 冰签', en: '{style} · Ice lots' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['越冬', '平安'], en: ['STAY', 'SAFE'] },
}

export default words
