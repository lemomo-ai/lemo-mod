// 三角尺风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：一张图纸
  reply: { zh: ' 图纸 {no} ', en: ' Sheet {no} ' },
  replyBare: { zh: ' 图纸 ', en: ' Sheet ' },
  // 耗时行：这张图画完发出去了
  turnDone: { zh: ' ✓ 图纸 {no} 出图 ', en: ' ✓ Sheet {no} issued ' },
  // 工具进度行
  running: { zh: '绘制中', en: 'Drafting' },
  // 启动提示前面的小标签
  info: { zh: '制图室公告', en: 'Drafting room notice' },
  // 调用 skill 时的提示：从抽屉里取一块绘图模板
  skill: { zh: '取用模板：{name}', en: 'Template out: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '描图', en: 'Trace' },
  'verb.WebSearch': { zh: '查规范', en: 'Check specs' },
}

export default words
