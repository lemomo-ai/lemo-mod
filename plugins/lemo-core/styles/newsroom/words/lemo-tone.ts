// 打字机风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。口吻是一篇新闻稿：先写「标题」，最后写「编者按」
const VOICE_ON =
  '{style} voice is on. Write each reply like a news story, in the user\'s language: ' +
  'open with one line starting with "标题：" (English: "Headline:") that sums up the answer as a headline, ' +
  'then the story, then one line starting with "编者按：" (English: "Editor\'s note:") with a caveat or the next step. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "标题：" / "Headline:" line ' +
  'and no closing "编者按：" / "Editor\'s note:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '新闻口吻', en: 'News voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先写「标题」，最后写「编者按」', en: 'Quietly asks with every message: lead with a headline, close with an editor\'s note' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '新闻口吻', en: 'news voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
