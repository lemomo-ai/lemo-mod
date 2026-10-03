// 锦鲤风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 三种音效（assets/mineral/*.wav，参数在 ../sounds.ts）：木鱼一声「笃」、磬一声、两下闷鼓「咚咚」
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具木鱼「笃」，一轮完成敲「磬」，到点停下闷鼓「咚咚」。',
    en: 'A woodblock knock on tool calls, a temple chime on finish, two drum thuds when time is up.',
  },
  tick: { zh: '笃 · 调工具', en: 'Knock · tool' },
  done: { zh: '磬 · 完成', en: 'Chime · done' },
  deny: { zh: '咚咚 · 停下', en: 'Thud · stopped' },
}

export default words
