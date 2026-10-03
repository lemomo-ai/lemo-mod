// lemo-sound 自己的文字（中性的默认文字，素色风格下显示的就是它们）。
// 带风格味道的（柠檬实验室的「嗒」「啵叮」「划掉」、卡片标题）放在风格包
// plugins/lemo-core/styles/lemon-lab/words/lemo-sound.ts，按同样的键（title、desc、tick、done、deny）覆盖

import type { Lang } from './shared/lemo'

const zh = {
  /** 报到时的显示名，列在面板「已装的 mod」里 */
  name: '音效',
  title: '提示音',
  desc: '调用工具、一轮结束、限时中止时播放提示音',
  /** 关着（静音）时在说明后面加一句：装上时就是关的；试听是用户自己点的，关着也照样放 */
  mutedDesc: '{desc} · 已关闭，试听仍可播放',
  tick: '调工具',
  done: '一轮结束',
  deny: '限时中止',
  /** 开关按钮：开着时写这个，按了关掉（静音） */
  on: '已开 · 点击关闭',
  /** 关着（静音）时写这个，按了打开 */
  off: '打开',
  /** /lemo-mod 静音、/lemo-mod 声音：只关、只开，输入几次结果都一样 */
  cmd: { mute: '静音', unmute: '声音', muted: '已静音。', unmuted: '已取消静音。' },
}

export type SoundStrings = typeof zh

const en: SoundStrings = {
  name: 'Sounds',
  title: 'Sounds',
  desc: 'Plays sounds on tool calls, turn ends and time-limit stops',
  mutedDesc: '{desc} · off, previews still play',
  tick: 'Tool call',
  done: 'Turn end',
  deny: 'Time limit',
  on: 'On · click to turn off',
  off: 'Turn on',
  cmd: { mute: 'mute', unmute: 'sound', muted: 'Muted.', unmuted: 'Unmuted.' },
}

export const STR: Record<Lang, SoundStrings> = { zh, en }
