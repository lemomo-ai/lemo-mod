// 杨枝甘露风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：端上来的一碗糖水
  reply: { zh: ' 糖水 {no} ', en: ' Bowl {no} ' },
  replyBare: { zh: ' 糖水 ', en: ' Bowl ' },
  // 耗时行
  turnDone: { zh: ' ✓ {no} 号上桌 ', en: ' ✓ Bowl {no} served ' },
  // 工具进度行
  running: { zh: '慢煲中', en: 'Simmering' },
  // 启动提示前面的小标签：墙上的水牌（价目牌）
  info: { zh: '水牌', en: 'Menu board' },
  // 调用 skill 时的提示：往碗里加一份料
  skill: { zh: '加料：{name}', en: 'Topping added: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '舀一勺', en: 'Scoop' },
  'verb.WebSearch': { zh: '问街坊', en: 'Ask around' },
}

export default words
