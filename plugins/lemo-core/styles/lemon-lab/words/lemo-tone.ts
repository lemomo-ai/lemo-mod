// 柠檬风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。名字用 {style}
const VOICE_ON =
  '{style} voice is on. Write each reply like a lab notebook entry, in the user\'s language: ' +
  'open with one line starting with "观察：" (English: "Observation:") saying what you looked at, ' +
  'then the answer, then one line starting with "结论：" (English: "Conclusion:"). Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "观察：" / "Observation:" line ' +
  'and no closing "结论：" / "Conclusion:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '实验室口吻', en: 'Lab voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先写「观察」，最后写「结论」', en: 'Quietly asks with every message: open with an observation, end with a conclusion' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '实验室口吻', en: 'lab voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
