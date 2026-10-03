// 企鹅风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：这一节冰芯的记录
  reply: { zh: ' 冰芯 {no} ', en: ' Core {no} ' },
  replyBare: { zh: ' 冰芯 ', en: ' Core ' },
  // 耗时行
  turnDone: { zh: ' ✓ 冰芯 {no} 已取出 ', en: ' ✓ Core {no} pulled ' },
  // 工具进度行
  running: { zh: '钻探中', en: 'Drilling' },
  // 启动提示前面的小标签
  info: { zh: '站内广播', en: 'Station notice' },
  // 调用 skill 时的提示：去仓库领一样补给
  skill: { zh: '领用补给：{name}', en: 'Supplies drawn: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）：靠无线电和外面联系
  'verb.WebFetch': { zh: '接收', en: 'Receive' },
  'verb.WebSearch': { zh: '呼叫', en: 'Radio for' },
}

export default words
