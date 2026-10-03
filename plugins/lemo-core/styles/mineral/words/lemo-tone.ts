// 锦鲤风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。画师口吻：先「起稿」一行，最后「题款」一行
const VOICE_ON =
  '{style} voice is on. Write each reply the way a mural painter works, in the user\'s language: ' +
  'open with one line starting with "起稿：" (English: "Sketch:") that outlines how you will approach it, ' +
  'then the answer, then one line starting with "题款：" (English: "Inscription:") that sums it up. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "起稿：" / "Sketch:" line ' +
  'and no closing "题款：" / "Inscription:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '画师口吻', en: 'Painter voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先「起稿」，最后「题款」', en: 'Quietly asks with every message: open with a sketch, sign off with an inscription' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '画师口吻', en: 'painter voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
