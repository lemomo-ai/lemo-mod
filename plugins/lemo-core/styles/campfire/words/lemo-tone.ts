// 篝火风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。开头一行「火边：」，结尾一行「收营：」
const VOICE_ON =
  '{style} voice is on. Write each reply like a story told around the fire, in the user\'s language: ' +
  'open with one line starting with "火边：" (English: "By the fire:") saying what you looked at, ' +
  'then the answer, then one line starting with "收营：" (English: "Breaking camp:") with the takeaway. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "火边：" / "By the fire:" line ' +
  'and no closing "收营：" / "Breaking camp:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '火边口吻', en: 'Fireside voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先写「火边」，最后写「收营」', en: 'Quietly asks with every message: start by the fire, end by breaking camp' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '火边口吻', en: 'fireside voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
