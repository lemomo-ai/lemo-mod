// 柠檬风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「嗒」「啵叮」「划掉」是这个风格三种音效（assets/lemon-lab/*.wav）的叫法
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「嗒」，一轮完成「啵叮」，到点停下「划掉」。',
    en: 'Tick on tool calls, pop on finish, scratch when time is up.',
  },
  tick: { zh: '嗒 · 调工具', en: 'Tick · tool' },
  done: { zh: '啵叮 · 完成', en: 'Pop · done' },
  deny: { zh: '划掉 · 停下', en: 'Scratch · stopped' },
}

export default words
