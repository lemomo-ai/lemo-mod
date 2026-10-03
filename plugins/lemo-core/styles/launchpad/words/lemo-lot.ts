// 火箭风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|倒计时归零，火箭干净利落地离开发射塔。|时机正好，现在就动手。',
      '1|各个席位挨个报告：可以发射。|跑一遍全部测试，然后合并。',
      '2|加注完成，等发射窗口打开。|先写计划，再写代码。',
      '3|高空风太大，倒计时暂停。|等检查跑完再下结论。',
      '4|有个传感器读数不对。|加日志，别靠猜。',
      '5|发射台冒烟，紧急中止。|今天别碰主分支。',
      '1|一级分离干净利落。|把用不上的旧代码删掉。',
      '0|整流罩打开，载荷入轨。|可以发版了。',
      '3|遥测断了几秒，又接上了。|给不稳的那一步加上重试和超时。',
      '2|全流程演练一遍就过。|上线前在测试环境再走一遍。',
      '4|燃料管路有一点渗漏。|先备份，再动手。',
      '1|轨道参数和算出来的一模一样。|放心重构。',
    ],
    en: [
      '0|T-zero, and the rocket clears the tower.|The timing is right, go now.',
      '1|Every console reports go.|Run the full test suite, then merge.',
      '2|Fueled up, waiting for the window to open.|Write the plan before the code.',
      '3|Upper winds too strong, the count is on hold.|Let the checks finish before you decide.',
      '4|One sensor reads out of range.|Add logging instead of guessing.',
      '5|Smoke on the pad. Abort, abort.|Leave the main branch alone today.',
      '1|Stage one separates cleanly.|Delete the dead code you no longer need.',
      '0|Fairing open, payload in orbit.|Ready to ship.',
      '3|Telemetry drops out for a few seconds, then comes back.|Give the flaky step a retry and a timeout.',
      '2|The dress rehearsal runs clean.|Walk it through staging once more before release.',
      '4|A slow leak in a fuel line.|Back up first, then make changes.',
      '1|The orbit matches the math exactly.|Refactor with confidence.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。这里按发射结果排：从完美入轨到紧急中止
  ranks: {
    zh: ['完美入轨', '准予发射', '有惊无险', '暂停倒数', '推迟发射', '紧急中止'],
    en: ['Perfect orbit', 'Go for launch', 'Close call', 'Hold', 'Scrub', 'Abort'],
  },
  // 签筒名：卡片上签级上面的小字
  tube: { zh: '{style} · 放行签', en: '{style} · Go / no-go' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['点火', '升空'], en: ['LIFT', 'OFF'] },
}

export default words
