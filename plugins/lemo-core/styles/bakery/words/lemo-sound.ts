// 面包风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「噗」「叮」「哔哔」是这个风格三种音效（assets/bakery/*.wav，参数在 sounds.ts）的叫法：拍面团、烤箱定时器、烤焦的蜂鸣
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '炉边声音 · 试听', en: 'Bakery sounds · preview' },
  desc: {
    zh: '调工具「噗」（拍面团），一炉出炉「叮」，到点停下是烤焦的「哔哔」。',
    en: 'A pat of dough on tool calls, the oven ding on finish, a burnt-tray buzzer when time is up.',
  },
  tick: { zh: '噗 · 调工具', en: 'Pat · tool' },
  done: { zh: '叮 · 出炉', en: 'Ding · done' },
  deny: { zh: '哔哔 · 停下', en: 'Buzzer · stopped' },
}

export default words
