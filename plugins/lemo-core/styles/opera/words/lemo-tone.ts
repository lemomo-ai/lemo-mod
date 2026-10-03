// 脸谱风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。戏台口吻：上场念「引子」，下场念「下场诗」
const VOICE_ON =
  '{style} voice is on. Write each reply like a scene in a Chinese opera, in the user\'s language: ' +
  'open with one line starting with "引子：" (English: "Prologue:") that sets the scene, ' +
  'then the answer, then one line starting with "下场诗：" (English: "Exit line:") that sums it up. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "引子：" / "Prologue:" line ' +
  'and no closing "下场诗：" / "Exit line:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '戏台口吻', en: 'Stage voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先念「引子」，最后念「下场诗」', en: 'Quietly asks with every message: open with a prologue, leave with an exit line' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '戏台口吻', en: 'stage voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
