// 火箭风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「哔」「升空」「警报」是这个风格三种音效（assets/launchpad/*.wav，参数在 ../sounds.ts）的叫法：
// 遥测的一声哔、上升的呼啸接一声提示音、中止警报
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「哔」，一轮完成「升空」，到点停下「警报」。',
    en: 'A telemetry beep on tool calls, liftoff on finish, an alarm when time is up.',
  },
  tick: { zh: '哔 · 调工具', en: 'Beep · tool' },
  done: { zh: '升空 · 完成', en: 'Liftoff · done' },
  deny: { zh: '警报 · 停下', en: 'Alarm · stopped' },
}

export default words
