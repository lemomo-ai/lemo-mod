// 泡泡鱼风格给 lemo-voice 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-voice.」）。
// 只放带风格味道的文字；没写的键，lemo-voice 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 一轮超过 30 秒、结束时念的一句。{n} 是第几条消息，{s} 是用了多久（「45 秒」「2 分 15 秒」）
  turn: { zh: '鱼缸{n}游完一圈，用时 {s}。', en: 'Tank {n} finished a lap in {s}.' },
  // 拿不到编号（第 0 条）时念的一句，不带编号。{s} 是用了多久（「45 秒」「2 分 15 秒」）
  turnPlain: { zh: '游完一圈，用时 {s}。', en: 'Lap done in {s}.' },
}

export default words
