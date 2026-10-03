// 小火车风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「嘀」「叮咚」「蜂鸣」是这个风格三种音效（assets/metro/*.wav，按 ../sounds.ts 合成）的叫法：刷卡过闸机、列车到站、关门警示
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '站台声音 · 试听', en: 'Platform sounds · preview' },
  desc: {
    zh: '调工具是闸机「嘀」，一轮完成是到站「叮咚」，到点停下是关门「蜂鸣」。',
    en: 'A gate beep on tool calls, the arrival chime on finish, the door buzzer when time is up.',
  },
  tick: { zh: '嘀 · 调工具', en: 'Beep · tool' },
  done: { zh: '叮咚 · 完成', en: 'Chime · done' },
  deny: { zh: '蜂鸣 · 停下', en: 'Buzzer · stopped' },
}

export default words
