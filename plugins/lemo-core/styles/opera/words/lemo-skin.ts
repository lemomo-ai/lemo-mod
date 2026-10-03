// 脸谱风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：台上的一场戏
  reply: { zh: ' 场次 {no} ', en: ' Scene {no} ' },
  replyBare: { zh: ' 场次 ', en: ' Scene ' },
  // 耗时行：这一场谢幕
  turnDone: { zh: ' ✓ 场次 {no} 谢幕 ', en: ' ✓ Curtain on {no} ' },
  // 工具进度行
  running: { zh: '开演中', en: 'On stage' },
  // 启动提示前面的小标签：贴在门口的戏报
  info: { zh: '戏报', en: 'Playbill' },
  // 调用 skill 时的提示：一个角儿登场
  skill: { zh: '登场：{name}', en: 'Enter stage left: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）：去取本子、四处打听
  'verb.WebFetch': { zh: '取本子', en: 'Send for' },
  'verb.WebSearch': { zh: '打听', en: 'Ask around' },
}

export default words
