// 杨枝甘露风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「叮」「铃铃」「咚」是这个风格三种音效（assets/dessert/*.wav，参数在 sounds.ts）的叫法：勺碰碗、上桌的小铃、碗搁桌上
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '碗勺声 · 试听', en: 'Shop sounds · preview' },
  desc: {
    zh: '调工具「叮」（勺碰碗），一碗上桌「铃铃」，到点停下是碗搁桌上的「咚」。',
    en: 'A spoon tink on tool calls, a sweet chime when a bowl is served, a bowl thud when time is up.',
  },
  tick: { zh: '叮 · 调工具', en: 'Tink · tool' },
  done: { zh: '铃铃 · 上桌', en: 'Chime · done' },
  deny: { zh: '咚 · 停下', en: 'Thud · stopped' },
}

export default words
