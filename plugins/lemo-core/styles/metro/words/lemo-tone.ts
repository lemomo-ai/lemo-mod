// 小火车风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。口吻像列车广播：先报「本站」，最后报「下一站」
const VOICE_ON =
  '{style} voice is on. Write each reply like a train announcement, in the user\'s language: ' +
  'open with one line starting with "本站：" (English: "This stop:") naming what this reply is about, ' +
  'then the answer, then one line starting with "下一站：" (English: "Next stop:") saying what comes next. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "本站：" / "This stop:" line ' +
  'and no closing "下一站：" / "Next stop:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '报站口吻', en: 'Announcer voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先报「本站」，最后报「下一站」', en: 'Quietly asks with every message: open with this stop, end with the next one' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '报站口吻', en: 'announcer' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
