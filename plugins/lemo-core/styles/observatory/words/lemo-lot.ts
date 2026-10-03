// 望远镜风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|云层散尽，满天星斗清清楚楚。|条件正好，先把最难的那块做了。',
      '1|赤道仪跟得稳，星点不拖线。|保持小步提交，一步一测。',
      '2|焦点差一点，再拧半圈。|先把报错信息完整读一遍。',
      '3|薄云飘过，星等读数不稳。|多跑几次，别只信一次结果。',
      '4|镜片起雾了。|先停手，把环境理清楚再继续。',
      '5|满月当空，暗的目标一个也看不见。|今天别碰生产环境。',
      '1|导星稳稳落在十字线上。|方向对了，照计划往下做。',
      '0|彗星准时出现在预报的位置。|该过的都过了，可以发版了。',
      '3|星图拿反了，东西对调。|先确认改的是对的文件、对的分支。',
      '2|巡天扫过一片没看过的天区。|动手前先读一遍周围的代码。',
      '4|穹顶的天窗卡在半路。|先备份，再动手。',
      '1|长曝光拍回一张干净的底片。|放心重构，测试兜得住。',
    ],
    en: [
      '0|The clouds part and every star is sharp.|Conditions are perfect, take on the hardest part first.',
      '1|The mount tracks clean, no star trails.|Keep commits small and test each step.',
      '2|Almost in focus, half a turn more.|Read the whole error message first.',
      '3|Thin cloud drifts over, the magnitudes wobble.|Run it a few times, do not trust a single result.',
      '4|Dew on the lens.|Stop and sort out the environment before going on.',
      '5|Full moon, every faint target washed out.|Stay away from production today.',
      '1|The guide star sits right on the crosshair.|You are on course, follow the plan.',
      '0|The comet shows up exactly where predicted.|Everything checks out, ship it.',
      '3|The star chart is upside down.|Make sure you are on the right file and branch.',
      '2|The survey sweeps a patch of sky nobody has charted.|Read the surrounding code before you touch it.',
      '4|The dome slit jams halfway open.|Back up first, then make changes.',
      '1|A long exposure comes back clean.|Refactor with confidence, the tests have you covered.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。这里按观测条件排：从万里无云到阴天
  ranks: {
    zh: ['万里无云', '晴夜', '少云', '多云', '起雾', '阴天'],
    en: ['Perfect seeing', 'Clear night', 'Mostly clear', 'Patchy cloud', 'Fogged in', 'Overcast'],
  },
  // 签筒名：卡片上签级上面的小字
  tube: { zh: '{style} · 星签', en: '{style} · Star lots' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['夜观', '星象'], en: ['NIGHT', 'SKY'] },
}

export default words
