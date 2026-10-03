// 灯塔风格给 lemo-sound 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-sound.」）。
// 只放带风格味道的文字；没写的键，lemo-sound 用自己的默认文字。
// 「浮标铃」「呜叮」「雾笛」是这个风格三种音效（assets/lighthouse/*.wav，按 ../sounds.ts 合成）的叫法
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  title: { zh: '海上声音 · 试听', en: 'Sea sounds · preview' },
  desc: {
    zh: '调工具摇一下「浮标铃」，一轮完成是雾笛加一声铃「呜叮」，到点停下拉一声低沉的「雾笛」。',
    en: 'A buoy bell on tool calls, horn and bell on finish, a low foghorn when time is up.',
  },
  tick: { zh: '浮标铃 · 调工具', en: 'Buoy bell · tool' },
  done: { zh: '呜叮 · 完成', en: 'Horn and bell · done' },
  deny: { zh: '雾笛 · 停下', en: 'Foghorn · stopped' },
}

export default words
