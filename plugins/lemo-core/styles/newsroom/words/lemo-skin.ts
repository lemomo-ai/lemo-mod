// 打字机风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：一篇稿子
  reply: { zh: ' 稿件 {no} ', en: ' Story {no} ' },
  replyBare: { zh: ' 稿件 ', en: ' Story ' },
  // 耗时行
  turnDone: { zh: ' ✓ 稿件 {no} 付印 ', en: ' ✓ Story {no} to press ' },
  // 工具进度行
  running: { zh: '排版中', en: 'Typesetting' },
  // 启动提示前面的小标签
  info: { zh: '本报讯', en: 'Bulletin' },
  // 调用 skill 时的提示：去资料室调一份资料
  skill: { zh: '调阅资料：{name}', en: 'From the archive: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）：抓网页是剪报，搜索是找线索
  'verb.WebFetch': { zh: '剪报', en: 'Clip' },
  'verb.WebSearch': { zh: '找线索', en: 'Dig into' },
}

export default words
