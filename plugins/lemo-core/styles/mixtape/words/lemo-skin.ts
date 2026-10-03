// 磁带风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：磁带上的一首歌
  reply: { zh: ' 曲目 {no} ', en: ' Track {no} ' },
  replyBare: { zh: ' 曲目 ', en: ' Track ' },
  // 耗时行
  turnDone: { zh: ' ✓ 曲目 {no} 放完 ', en: ' ✓ Track {no} faded out ' },
  // 工具进度行
  running: { zh: '走带中', en: 'Tape rolling' },
  // 启动提示前面的小标签：磁带盒里的内页
  info: { zh: '内页说明', en: 'Liner notes' },
  // 调用 skill 时的提示
  skill: { zh: '换上磁带：{name}', en: 'Tape in: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）：抓网页是翻录，搜索是搜台
  'verb.WebFetch': { zh: '翻录', en: 'Dub' },
  'verb.WebSearch': { zh: '搜台', en: 'Tune in' },
}

export default words
