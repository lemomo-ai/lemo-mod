// 三角尺风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|所有尺寸都闭合，一毫米不差。|思路是对的，直接开工。',
      '1|比例尺选得正好，一张图纸刚好放下。|模块边界划得很清楚，照着拆。',
      '2|草图有了，尺寸还没标。|先把接口和类型定下来。',
      '3|两张图上同一个尺寸对不上。|找出重复的定义，只留一份。',
      '4|描图纸上洒了一滴墨。|先备份，再动手。',
      '5|地基画到了图框外面。|今天别碰主分支。',
      '1|丁字尺很稳，一条线拉到头。|放心重构。',
      '0|审图章落下：通过。|可以发版了。',
      '3|铅笔线太淡，晒图晒不出来。|把没说出口的约定写进注释。',
      '2|补了一张剖面图，结构一下清楚了。|改之前先画个流程图。',
      '3|图例里少了一个符号。|补上文档和用法说明。',
      '4|改了三版，修订栏一直没更新。|先确认自己在哪个分支上。',
    ],
    en: [
      '0|Every dimension closes, not a millimeter off.|The approach is sound, start building.',
      '1|The scale is just right, everything fits on one sheet.|Your module boundaries are clear, split along them.',
      '2|The sketch is done, the dimensions are not.|Pin down the interfaces and types first.',
      '3|Two sheets disagree on the same dimension.|Find the duplicate definition and keep only one.',
      '4|An ink blot lands on the tracing paper.|Back up first, then make changes.',
      '5|The foundation runs off the edge of the sheet.|Leave the main branch alone today.',
      '1|The T-square holds steady, one clean line end to end.|Refactor with confidence.',
      '0|The review stamp comes down: approved.|Ship it.',
      '3|The pencil line is too faint to print.|Write the unspoken assumptions into comments.',
      '2|A section view goes in and the structure finally reads clearly.|Sketch the flow before you change it.',
      '3|A symbol is missing from the legend.|Fill in the docs and usage notes.',
      '4|Three revisions in, and the revision block was never updated.|Check which branch you are on before going further.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。这里按审图结论排：从一次通过到作废
  ranks: {
    zh: ['一次通过', '通过', '小修', '修改', '退回', '作废'],
    en: ['Clean pass', 'Approved', 'Minor notes', 'Revise', 'Rejected', 'Void'],
  },
  // 签筒名：卡片上签级上面的小字
  tube: { zh: '{style} · 审图签', en: '{style} · Review lots' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['审定', '合格'], en: ['CHECK', 'OK'] },
}

export default words
