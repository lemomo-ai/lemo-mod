// 三角尺风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。开头一行「图名：」，结尾一行「审图意见：」，像一张带图签的图纸
const VOICE_ON =
  '{style} voice is on. Write each reply like a sheet in a drawing set, in the user\'s language: ' +
  'open with one line starting with "图名：" (English: "Drawing:") naming what you looked at, ' +
  'then the answer, then one line starting with "审图意见：" (English: "Checker\'s note:") with your verdict. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "图名：" / "Drawing:" line ' +
  'and no closing "审图意见：" / "Checker\'s note:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '审图口吻', en: 'Drafting voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先写「图名」，最后写「审图意见」', en: "Quietly asks with every message: open with a drawing title, end with a checker's note" },
  // 输入框右下角的模式标签
  voiceMode: { zh: '审图口吻', en: 'drafting voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
