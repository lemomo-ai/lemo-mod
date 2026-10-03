// 望远镜风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「叮」「星铃」「低鸣」是这个风格三种音效（assets/observatory/*.wav，参数在 ../sounds.ts）的叫法：
// 玻璃般轻的一声、上行的风铃琶音、往下沉的低鸣
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「叮」，一轮完成「星铃」，到点停下「低鸣」。',
    en: 'A glass ping on tool calls, rising star chimes on finish, a low hum when time is up.',
  },
  tick: { zh: '叮 · 调工具', en: 'Ping · tool' },
  done: { zh: '星铃 · 完成', en: 'Star chimes · done' },
  deny: { zh: '低鸣 · 停下', en: 'Low hum · stopped' },
}

export default words
