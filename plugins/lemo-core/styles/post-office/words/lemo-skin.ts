// 邮筒风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：一封寄出的信
  reply: { zh: ' 信件 {no} ', en: ' Letter {no} ' },
  replyBare: { zh: ' 信件 ', en: ' Letter ' },
  // 耗时行：信投到了
  turnDone: { zh: ' ✓ {no} 已投递 ', en: ' ✓ {no} delivered ' },
  // 工具进度行：信在分拣
  running: { zh: '分拣中', en: 'Sorting' },
  // 启动提示前面的小标签
  info: { zh: '柜台告示', en: 'Counter notice' },
  // 调用 skill 时的提示：贴一张邮票
  skill: { zh: '贴邮票：{name}', en: 'Stamp affixed: {name}' },
  // 工具行的动词：去取一件包裹、查收件地址
  'verb.WebFetch': { zh: '取件', en: 'Collect' },
  'verb.WebSearch': { zh: '查地址', en: 'Find address' },
}

export default words
