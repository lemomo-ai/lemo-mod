// 葫芦风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：柜台上的一张方子
  reply: { zh: ' 方子 {no} ', en: ' Rx {no} ' },
  replyBare: { zh: ' 方子 ', en: ' Rx ' },
  // 耗时行：方子上的药抓齐了
  turnDone: { zh: ' ✓ 方子 {no} 抓齐 ', en: ' ✓ Rx {no} filled ' },
  // 工具进度行
  running: { zh: '抓药中', en: 'Dispensing' },
  // 启动提示前面的小标签
  info: { zh: '柜台告示', en: 'Counter notice' },
  // 调用 skill 时的提示：百子柜上拉开一格药斗
  skill: { zh: '拉开药斗：{name}', en: 'Drawer pulled: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）：进来的货先验一验，拿不准的翻药典
  'verb.WebFetch': { zh: '验货', en: 'Inspect' },
  'verb.WebSearch': { zh: '查药典', en: 'Consult' },
}

export default words
