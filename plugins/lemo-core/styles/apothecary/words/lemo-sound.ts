// 葫芦风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 三种音效（assets/apothecary/*.wav，参数在 ../sounds.ts）：药斗木抽屉「咔嗒」、铜戥子上的小铃「叮铃」、铁药碾滚一下「咕隆」
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '声音 · 试听', en: 'Sound · preview' },
  desc: {
    zh: '调工具药斗「咔嗒」，一轮完成戥子小铃「叮铃」，到点停下药碾「咕隆」。',
    en: 'A drawer clicks on tool calls, a little brass bell on finish, the grinding wheel rumbles when time is up.',
  },
  tick: { zh: '咔嗒 · 调工具', en: 'Click · tool' },
  done: { zh: '叮铃 · 完成', en: 'Ting · done' },
  deny: { zh: '咕隆 · 停下', en: 'Rumble · stopped' },
}

export default words
