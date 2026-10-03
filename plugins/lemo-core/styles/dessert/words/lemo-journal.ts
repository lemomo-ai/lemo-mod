// 杨枝甘露风格给 lemo-journal 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-journal.」）。
// 只放带风格味道的文字；没写的键，lemo-journal 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 后台页「日志」卡片的标题
  logTitle: { zh: '流水账', en: 'Daybook' },
  // 日志文件的第一行。不跟界面语言变（lemo-journal 固定取中文那份），所以中英两份写成一样，本身就是中英合写
  head: { zh: '# {styleZh} · 流水账 / {styleEn} daybook', en: '# {styleZh} · 流水账 / {styleEn} daybook' },
}

export default words
