// 小苗风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：插在盆里的苗牌
  reply: { zh: ' 苗牌 {no} ', en: ' Pot {no} ' },
  replyBare: { zh: ' 苗牌 ', en: ' Pot ' },
  // 耗时行：这一盆发芽了
  turnDone: { zh: ' ✓ {no} 发芽了 ', en: ' ✓ Pot {no} sprouted ' },
  // 工具进度行
  running: { zh: '生长中', en: 'Growing' },
  // 启动提示前面的小标签
  info: { zh: '温室告示牌', en: 'Greenhouse board' },
  // 调用 skill 时的提示：skill 是一包种子
  skill: { zh: '拆开种子包：{name}', en: 'Seed packet opened: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '采摘', en: 'Pick' },
  'verb.WebSearch': { zh: '翻图鉴', en: 'Scout' },
}

export default words
