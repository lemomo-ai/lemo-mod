// 邮筒风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「咚」「叮铃」「退信」是这个风格三种音效（assets/post-office/*.wav，按 ../sounds.ts 合成）的叫法：盖邮戳、邮差的自行车铃、退信的两下闷响
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '柜台声音 · 试听', en: 'Counter sounds · preview' },
  desc: {
    zh: '调工具盖一下邮戳「咚」，一轮完成是邮差的车铃「叮铃」，到点停下是「退信」的两下闷响。',
    en: 'Postmark thump on tool calls, bike bell on finish, return-to-sender thuds when time is up.',
  },
  tick: { zh: '咚 · 调工具', en: 'Thump · tool' },
  done: { zh: '叮铃 · 完成', en: 'Ring-ring · done' },
  deny: { zh: '退信 · 停下', en: 'Returned · stopped' },
}

export default words
