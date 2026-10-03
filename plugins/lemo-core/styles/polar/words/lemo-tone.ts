// 企鹅风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。开头一行「站况：」，结尾一行「交接：」，像越冬站的值班记录
const VOICE_ON =
  '{style} voice is on. Write each reply like an entry in a station duty log, in the user\'s language: ' +
  'open with one line starting with "站况：" (English: "Conditions:") saying what you checked, ' +
  'then the answer, then one line starting with "交接：" (English: "Handover:") with what the next shift needs to know. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "站况：" / "Conditions:" line ' +
  'and no closing "交接：" / "Handover:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '站务口吻', en: 'Station voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先写「站况」，最后写「交接」', en: 'Quietly asks with every message: open with conditions, end with a handover note' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '站务口吻', en: 'station voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
