// 灯笼风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：一个摊位
  reply: { zh: ' 摊位 {no} ', en: ' Stall {no} ' },
  replyBare: { zh: ' 摊位 ', en: ' Stall ' },
  // 耗时行
  turnDone: { zh: ' ✓ {no} 号打包好 ', en: ' ✓ {no} packed to go ' },
  // 工具进度行
  running: { zh: '翻炒中', en: 'Sizzling' },
  // 启动提示前面的小标签
  info: { zh: '夜市吆喝', en: 'Market call' },
  // 调用 skill 时的提示：逛进一个摊位
  skill: { zh: '逛进摊位：{name}', en: 'Stopped at stall: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '打包', en: 'Grab' },
  'verb.WebSearch': { zh: '逛着找', en: 'Hunt for' },
}

export default words
