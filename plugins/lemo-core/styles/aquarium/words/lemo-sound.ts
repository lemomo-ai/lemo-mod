// 泡泡鱼风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「啵」「叮铃」「咚咚」是这个风格三种音效（assets/aquarium/*.wav，按 sounds.ts 合成）的叫法：
// 气泡冒出水面、玻璃一样的铃音、指节敲两下缸壁
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具「啵」，一轮完成「叮铃」，到点停下「咚咚」。',
    en: 'A bubble on tool calls, a glass chime on finish, a knock when time is up.',
  },
  tick: { zh: '啵 · 调工具', en: 'Bloop · tool' },
  done: { zh: '叮铃 · 完成', en: 'Chime · done' },
  deny: { zh: '咚咚 · 停下', en: 'Knock · stopped' },
}

export default words
