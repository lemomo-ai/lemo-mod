// 灯塔风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：守灯人的一班守望
  reply: { zh: ' 守望 {no} ', en: ' Watch {no} ' },
  replyBare: { zh: ' 守望 ', en: ' Watch ' },
  // 耗时行：船靠岸了
  turnDone: { zh: ' ✓ {no} 已靠岸 ', en: ' ✓ {no} made port ' },
  // 工具进度行：灯在转，光扫过海面
  running: { zh: '探照中', en: 'Sweeping' },
  // 启动提示前面的小标签
  info: { zh: '守灯人告示', en: 'Keeper notice' },
  // 调用 skill 时的提示：升一面信号旗
  skill: { zh: '升信号旗：{name}', en: 'Signal flag up: {name}' },
  // 工具行的动词：从远处捞一样东西回来、拿望远镜瞭望
  'verb.WebFetch': { zh: '打捞', en: 'Haul in' },
  'verb.WebSearch': { zh: '瞭望', en: 'Scan' },
}

export default words
