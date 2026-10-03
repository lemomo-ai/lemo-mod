// 磁带风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。口吻是两首歌之间说话的 DJ：先报「正在播放」，最后报「下一首」
const VOICE_ON =
  '{style} voice is on. Write each reply like a DJ talking between songs, in the user\'s language: ' +
  'open with one line starting with "正在播放：" (English: "Now playing:") naming what you are working on, ' +
  'then the answer, then one line starting with "下一首：" (English: "Up next:") with the next step or the takeaway. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "正在播放：" / "Now playing:" line ' +
  'and no closing "下一首：" / "Up next:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '电台口吻', en: 'DJ voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先报「正在播放」，最后报「下一首」', en: 'Quietly asks with every message: open with now playing, close with up next' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '电台口吻', en: 'DJ voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
