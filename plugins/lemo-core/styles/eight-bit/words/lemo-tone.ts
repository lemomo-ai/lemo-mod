// 掌机风格给 lemo-tone 的文字。键不带 mod 名前缀（index.ts 会加上「lemo-tone.」）。
// 只放带风格味道的文字；没写的键，lemo-tone 用自己的默认文字。
import type { LemoText } from '../../../types'

// 给模型看的要求：不随界面语言变（lemo-tone 固定读 en 那一格），所以中英两格写同一段英文，
// 由要求本身说「按用户的语言回答」。口吻是老游戏的画面：先写「任务」，最后停在「存档点」
const VOICE_ON =
  '{style} voice is on. Write each reply like a screen from a retro game, in the user\'s language: ' +
  'open with one line starting with "任务：" (English: "Quest:") stating what you set out to do, ' +
  'then the answer, then one line starting with "存档点：" (English: "Save point:") summing up where things now stand. Keep code and tool use as usual.'
const VOICE_OFF =
  '{style} voice is now off. From this reply on, write normally: no opening "任务：" / "Quest:" line ' +
  'and no closing "存档点：" / "Save point:" line, even though earlier replies had them.'

const words: Readonly<Record<string, LemoText>> = {
  // 「行为」页的卡片标题和说明
  voiceTitle: { zh: '游戏口吻', en: 'Game voice' },
  voiceDesc: { zh: '每条消息悄悄附一句要求：Claude 回答时先写「任务」，最后写「存档点」', en: 'Quietly asks with every message: open with the quest, end at a save point' },
  // 输入框右下角的模式标签
  voiceMode: { zh: '游戏口吻', en: 'game voice' },
  voicePrompt: { zh: VOICE_ON, en: VOICE_ON },
  voiceOffPrompt: { zh: VOICE_OFF, en: VOICE_OFF },
}

export default words
