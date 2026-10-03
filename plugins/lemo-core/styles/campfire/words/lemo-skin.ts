// 篝火风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：围着火讲的一段夜话
  reply: { zh: ' 夜话 {no} ', en: ' Tale {no} ' },
  replyBare: { zh: ' 夜话 ', en: ' Tale ' },
  // 耗时行
  turnDone: { zh: ' ✓ 夜话 {no} 讲完了 ', en: ' ✓ Tale {no} told ' },
  // 工具进度行
  running: { zh: '火正旺', en: 'Crackling' },
  // 启动提示前面的小标签
  info: { zh: '{style}口信', en: 'Word from {style}' },
  // 调用 skill 时的提示：skill 是背包里带的家伙
  skill: { zh: '从背包里取出：{name}', en: 'Pulled from the pack: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '捡柴', en: 'Gather' },
  'verb.WebSearch': { zh: '探路', en: 'Track' },
}

export default words
