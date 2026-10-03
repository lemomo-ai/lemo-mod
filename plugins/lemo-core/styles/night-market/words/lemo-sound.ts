// 灯笼风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「叮铃」「当」「哒哒」是这个风格三种音效（assets/night-market/*.wav，参数在 sounds.ts）的叫法：摊头小铃铛、软一点的锣、梆子
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '摊边声音 · 试听', en: 'Market sounds · preview' },
  desc: {
    zh: '调工具「叮铃」（小铃铛），一轮完成「当」，到点停下是梆子的「哒哒」。',
    en: 'A little bell jingle on tool calls, a soft gong on finish, a wooden clapper when time is up.',
  },
  tick: { zh: '叮铃 · 调工具', en: 'Jingle · tool' },
  done: { zh: '当 · 完成', en: 'Gong · done' },
  deny: { zh: '哒哒 · 停下', en: 'Clack · stopped' },
}

export default words
