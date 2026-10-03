// 望远镜风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。开头一行「目标：」，结尾一行「记录：」，像观测日志的一条
const VOICE_ON =
  '{style} voice is on. Write each reply like an entry in an observing log, in the user\'s language: ' +
  'open with one line starting with "目标：" (English: "Target:") naming what you pointed at, ' +
  'then the answer, then one line starting with "记录：" (English: "Log:") noting what you saw. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "目标：" / "Target:" line ' +
  'and no closing "记录：" / "Log:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '观测口吻', en: 'Observer voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先写「目标」，最后写「记录」', en: 'Quietly asks with every message: name the target first, end with a log line' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '观测口吻', en: 'observer voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
