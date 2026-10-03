// 火箭风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。开头一行「任务：」，结尾一行「状态：」，像飞控的一次通报
const VOICE_ON =
  '{style} voice is on. Write each reply like a call from mission control, in the user\'s language: ' +
  'open with one line starting with "任务：" (English: "Mission:") saying what you are about to do, ' +
  'then the answer, then one line starting with "状态：" (English: "Status:") saying where things stand. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "任务：" / "Mission:" line ' +
  'and no closing "状态：" / "Status:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '飞控口吻', en: 'Mission control voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先报「任务」，最后报「状态」', en: 'Quietly asks with every message: call out the mission first, end with a status call' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '飞控口吻', en: 'flight voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
