// 灯笼风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。开头「吆喝：」一句话喊出答案，结尾「打包：」说用户该带走什么
const VOICE_ON =
  '{style} voice is on. Write each reply like a vendor at a night-market stall, in the user\'s language: ' +
  'open with one line starting with "吆喝：" (English: "Step up:") that calls out the answer in a few words, ' +
  'then the details, then one line starting with "打包：" (English: "To go:") with what the user should take away. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "吆喝：" / "Step up:" line ' +
  'and no closing "打包：" / "To go:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '摊主口吻', en: 'Vendor voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先「吆喝」一句，最后写「打包」带走的', en: 'Quietly asks with every message: open with a vendor\'s call, close with what to take away' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '摊主口吻', en: 'vendor voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
