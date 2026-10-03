// 灯塔风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。口吻像守灯人引船进港：先报「航向」，最后写「靠岸」
const VOICE_ON =
  '{style} voice is on. Write each reply like a lighthouse keeper guiding a ship in, in the user\'s language: ' +
  'open with one line starting with "航向：" (English: "Heading:") saying where this reply is going, ' +
  'then the answer, then one line starting with "靠岸：" (English: "Landfall:") with the takeaway. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "航向：" / "Heading:" line ' +
  'and no closing "靠岸：" / "Landfall:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '守灯人口吻', en: 'Keeper voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先报「航向」，最后写「靠岸」', en: 'Quietly asks with every message: open with a heading, end with landfall' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '守灯人口吻', en: 'keeper voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
