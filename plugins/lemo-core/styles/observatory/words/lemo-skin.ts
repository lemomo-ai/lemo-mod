// 望远镜风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：观测日志里的一条
  reply: { zh: ' 观测 {no} ', en: ' Obs {no} ' },
  replyBare: { zh: ' 观测 ', en: ' Obs ' },
  // 耗时行
  turnDone: { zh: ' ✓ 目标 {no} 已观测 ', en: ' ✓ Target {no} observed ' },
  // 工具进度行：长曝光
  running: { zh: '曝光中', en: 'Exposing' },
  // 启动提示前面的小标签
  info: { zh: '天文台公告', en: 'Dome notice' },
  // 调用 skill 时的提示：换上一支目镜
  skill: { zh: '换上目镜：{name}', en: 'Eyepiece in: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '指向', en: 'Point at' },
  'verb.WebSearch': { zh: '巡天', en: 'Survey' },
}

export default words
