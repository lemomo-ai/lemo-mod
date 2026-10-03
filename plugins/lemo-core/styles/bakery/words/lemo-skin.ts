// 面包风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：一炉面包
  reply: { zh: ' 炉次 {no} ', en: ' Batch {no} ' },
  replyBare: { zh: ' 炉次 ', en: ' Batch ' },
  // 耗时行
  turnDone: { zh: ' ✓ 第 {no} 炉出炉 ', en: ' ✓ Batch {no} baked ' },
  // 工具进度行
  running: { zh: '烘烤中', en: 'In the oven' },
  // 启动提示前面的小标签：店里的小黑板
  info: { zh: '小黑板', en: 'Chalkboard' },
  // 调用 skill 时的提示：翻出一张配方卡
  skill: { zh: '翻开配方：{name}', en: 'Recipe card: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '进货', en: 'Pick up' },
  'verb.WebSearch': { zh: '翻食谱', en: 'Leaf through' },
}

export default words
