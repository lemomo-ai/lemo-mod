// 锦鲤风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：墙上的一幅画稿
  reply: { zh: ' 画稿 {no} ', en: ' Panel {no} ' },
  replyBare: { zh: ' 画稿 ', en: ' Panel ' },
  // 耗时行：画完题款、落印
  turnDone: { zh: ' ✓ 画稿 {no} 落款 ', en: ' ✓ Panel {no} signed ' },
  // 工具进度行
  running: { zh: '着色中', en: 'Painting' },
  // 启动提示前面的小标签
  info: { zh: '画室告示', en: 'Studio notice' },
  // 调用 skill 时的提示：从颜料盒里调一味色
  skill: { zh: '调一味色：{name}', en: 'Pigment mixed: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）：拓一张网页、翻画谱找资料
  'verb.WebFetch': { zh: '拓印', en: 'Trace' },
  'verb.WebSearch': { zh: '翻画谱', en: 'Browse' },
}

export default words
