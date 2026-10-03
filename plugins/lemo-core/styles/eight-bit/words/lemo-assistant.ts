// 掌机风格给 lemo-assistant 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-assistant.」）。
// 只放带风格味道的文字；没写的键，lemo-assistant 用自己的默认文字。
// 子 agent 是二号玩家：先替你把关卡跑一遍，回来交攻略
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '二号玩家', en: 'Player 2' },
  done: { zh: '二号玩家交了攻略', en: 'Player 2 turned in a walkthrough' },
}

export default words
