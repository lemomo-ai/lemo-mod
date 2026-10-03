// 望远镜风格给 lemo-journal 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-journal.」）。
// 只放带风格味道的文字；没写的键，lemo-journal 用自己的默认文字。
import type { LemoText } from '../../../types'

const words: Readonly<Record<string, LemoText>> = {
  // 后台页「日志」卡片的标题
  logTitle: { zh: '观测日志', en: 'Observing log' },
  // 日志文件的第一行。不跟界面语言变（lemo-journal 固定取中文那份），所以中英两份写成一样，本身就是中英合写。
  // {styleZh}、{styleEn} 是中文名、英文名（用户起了名字就都是起的名字）
  head: { zh: '# {styleZh} · 观测日志 / {styleEn} night log', en: '# {styleZh} · 观测日志 / {styleEn} night log' },
}

export default words
