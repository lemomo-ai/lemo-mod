// 面包风格给 lemo-lot 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-lot.」）。
// 只放带风格味道的文字；没写的键，lemo-lot 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 签文：每支签一行「签级|签文|解签」。签级 0 最好、5 最差，对应下面 ranks 的第几个。
  // 中英两份按顺序一一对应（第几支签换了语言还是同一支），文字里不能有「|」
  lots: {
    zh: [
      '0|面团醒得刚好，一按就回弹。|时机正好，放手去写。',
      '1|面粉称得准，一克不差。|先把输入输出写清楚。',
      '3|酵母放少了，面团起不来。|少了一步初始化，回头查查。',
      '2|二次发酵，还要再等一会儿。|先跑一遍测试再下结论。',
      '4|烤箱还没预热好。|先把环境配好再动手。',
      '1|整形漂亮，割口划得齐。|这次重构会很顺。',
      '2|面粉撒了一台面。|先把工作区收拾干净。',
      '3|切开才发现中间没熟。|边界情况再测一遍。',
      '0|满炉金黄，香味飘到街口。|可以发版了。',
      '5|整盘烤焦，烟雾报警器响了。|今天别往主分支上推。',
      '4|盐罐和糖罐贴错了标签。|名字再核一遍，别凭感觉。',
      '3|老面忘了喂，有点发酸。|该更新依赖了。',
    ],
    en: [
      '0|The dough springs back at a touch.|The timing is right, go build it.',
      '1|The flour weighs out to the gram.|Pin down the inputs and outputs first.',
      '3|Too little yeast, the dough will not rise.|A setup step is missing, go back and check.',
      '2|Second rise, give it a little longer.|Run the tests before you decide.',
      '4|The oven has not finished preheating.|Set up the environment before you start.',
      '1|Neatly shaped, the scoring clean.|This refactor will go smoothly.',
      '2|Flour all over the counter.|Clean up the working tree first.',
      '3|Cut it open, the middle is still raw.|Test the edge cases again.',
      '0|A golden tray, the smell reaches the corner.|Ship it.',
      '5|The whole tray burnt, the smoke alarm going off.|Do not push to main today.',
      '4|The salt and sugar jars swapped labels.|Double-check the names, do not go by feel.',
      '3|You forgot to feed the starter.|Time to update the dependencies.',
    ],
  },
  // 签级名：第几个就是签级几（0 最好）。要正好 6 个。按烤得怎么样排
  ranks: {
    zh: ['满炉金黄', '香脆出炉', '再烤一会', '还在发酵', '边上烤焦', '整盘烤糊'],
    en: ['Golden batch', 'Crisp and good', 'Almost there', 'Still rising', 'Singed edges', 'Burnt tray'],
  },
  // 签筒名：卡片上签级上面的小字。面包房的签装在面包篮里
  tube: { zh: '{style} · 签篮', en: '{style} · Fortune basket' },
  // 桌面签文卡片右边的红色印章：两行，中文每行两个字，英文每行不超过五个字母
  stamp: { zh: ['麦香', '灵签'], en: ['FRESH', 'LOT'] },
}

export default words
