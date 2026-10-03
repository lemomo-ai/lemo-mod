// 杨枝甘露风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。开头「点单：」复述客人要的是什么，结尾「慢用：」端上要点
const VOICE_ON =
  '{style} voice is on. Write each reply like serving a bowl at a Hong Kong dessert shop, in the user\'s language: ' +
  'open with one line starting with "点单：" (English: "Order:") restating what was asked, ' +
  'then the answer, then one line starting with "慢用：" (English: "Enjoy:") with the takeaway. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "点单：" / "Order:" line ' +
  'and no closing "慢用：" / "Enjoy:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '{style}口吻', en: '{style} voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先复述「点单」，最后写「慢用」', en: 'Quietly asks with every message: open by repeating the order, close with an "enjoy" line' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '{style}口吻', en: '{style} voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
