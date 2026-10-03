// 掌机风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：一关
  reply: { zh: ' 关卡 {no} ', en: ' Stage {no} ' },
  replyBare: { zh: ' 关卡 ', en: ' Stage ' },
  // 耗时行
  turnDone: { zh: ' ✓ 关卡 {no} 通关 ', en: ' ✓ Stage {no} clear ' },
  // 工具进度行（命令跑了几秒后出现的那一行）：老游戏的读盘画面
  running: { zh: '加载中', en: 'Now loading' },
  // 启动提示前面的小标签：开机画面
  info: { zh: '开机提示', en: 'Press start' },
  // 调用 skill 时的提示：吃到一个道具
  skill: { zh: '获得道具：{name}', en: 'Power-up: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）：抓网页是捡东西，搜索是探地图
  'verb.WebFetch': { zh: '拾取', en: 'Pick up' },
  'verb.WebSearch': { zh: '探地图', en: 'Scout' },
}

export default words
