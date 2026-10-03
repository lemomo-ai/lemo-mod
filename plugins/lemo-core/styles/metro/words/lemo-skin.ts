// 小火车风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：线路上的一站
  reply: { zh: ' 站点 {no} ', en: ' Stop {no} ' },
  replyBare: { zh: ' 站点 ', en: ' Stop ' },
  // 耗时行：列车到站
  turnDone: { zh: ' ✓ {no} 已到站 ', en: ' ✓ Arrived at {no} ' },
  // 工具进度行：列车在两站之间跑
  running: { zh: '行车中', en: 'En route' },
  // 启动提示前面的小标签
  info: { zh: '车站广播', en: 'Platform notice' },
  // 调用 skill 时的提示：换乘到另一条线
  skill: { zh: '换乘：{name}', en: 'Transfer to {name}' },
  // 工具行的动词：出站去取一个网址、在线路图上查
  'verb.WebFetch': { zh: '出站', en: 'Exit to' },
  'verb.WebSearch': { zh: '查线路', en: 'Map search' },
}

export default words
