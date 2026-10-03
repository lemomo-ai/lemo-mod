// 泡泡鱼风格给 lemo-skin 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-skin.」）。
// 只放带风格味道的文字；没写的键，lemo-skin 用自己的默认文字。
// 占位符：{no} 是消息编号（T03），{name} 是 skill 名
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // Claude 每段回复上面的小标签：馆里的一口缸
  reply: { zh: ' 鱼缸 {no} ', en: ' Tank {no} ' },
  replyBare: { zh: ' 鱼缸 ', en: ' Tank ' },
  // 耗时行：鱼在缸里游完一圈
  turnDone: { zh: ' ✓ 鱼缸 {no} 游完一圈 ', en: ' ✓ Tank {no}: lap done ' },
  // 工具进度行
  running: { zh: '游动中', en: 'Swimming' },
  // 启动提示前面的小标签
  info: { zh: '馆内广播', en: 'Aquarium notice' },
  // 调用 skill 时的提示：往缸里放进一样东西
  skill: { zh: '往缸里放了：{name}', en: 'Dropped into the tank: {name}' },
  // 工具行的动词（其余几种工具用 lemo-skin 的默认动词）
  'verb.WebFetch': { zh: '打捞', en: 'Scoop' },
  'verb.WebSearch': { zh: '撒网', en: 'Trawl' },
}

export default words
