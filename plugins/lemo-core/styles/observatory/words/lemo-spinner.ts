// 望远镜风格给 lemo-spinner 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-spinner.」）。
// 只放带风格味道的文字；没写的键，lemo-spinner 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  words: {
    zh: ['对焦中', '巡天中', '导星中', '曝光中', '描星图', '等云散'],
    en: ['Focusing', 'Sweeping the sky', 'Guiding', 'Exposing', 'Charting stars', 'Waiting on clouds'],
  },
}

export default words
