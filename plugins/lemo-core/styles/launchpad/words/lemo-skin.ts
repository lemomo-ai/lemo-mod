// 火箭风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：这次飞行的报告
  reply: { zh: ' 飞行 {no} ', en: ' Flight {no} ' },
  replyBare: { zh: ' 飞行 ', en: ' Flight ' },
  // 耗时行
  turnDone: { zh: ' ✓ 飞行 {no} 入轨 ', en: ' ✓ Flight {no} in orbit ' },
  // 工具进度行：发动机正在推
  running: { zh: '推进中', en: 'Under thrust' },
  // 启动提示前面的小标签
  info: { zh: '发射场广播', en: 'Range notice' },
  // 调用 skill 时的提示：往火箭上挂一个载荷
  skill: { zh: '挂载载荷：{name}', en: 'Payload loaded: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '下行', en: 'Downlink' },
  'verb.WebSearch': { zh: '扫频', en: 'Scan for' },
}

export default words
