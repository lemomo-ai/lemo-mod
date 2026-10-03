// lemo-tone 自己的文字（中性的默认文字；带风格味道的放在风格包 words/lemo-tone.ts，按同样的键覆盖）

import type { Lang } from './shared/lemo'

const zh = {
  title: '说话方式',
  on: '已开 · 点击关闭',
  off: '打开',
  brief: {
    title: '简短模式',
    desc: '让 Claude 每次回答不超过三句',
    // 横条和状态栏上的小胶囊、输入框右下角的模式标签
    badge: '简短',
    mode: '简短',
  },
  // 风格包可以用 voiceTitle、voiceDesc、voiceMode 覆盖这三个
  voice: {
    title: '记录口吻',
    desc: '让 Claude 回答首行说明看了什么，末行给出结论',
    mode: '记录口吻',
  },
  cmd: {
    briefOn: '简短模式已开启。',
    briefOff: '简短模式已关闭。',
  },
  // 安全页上的两行（lemo.caps）。不带风格味道：安全页要一眼看懂
  cap: {
    brief: {
      title: '简短模式',
      desc: '在每条消息后附加要求：三句以内、不用列表',
    },
    voice: {
      title: '记录口吻',
      desc: '在每条消息后附加要求：首行说明看了什么，末行给出结论 · 关掉后在你的下一条消息附一句，请 Claude 恢复平常写法',
    },
  },
}

export type ToneStrings = typeof zh

const en: ToneStrings = {
  title: 'Tone',
  on: 'On · click to turn off',
  off: 'Turn on',
  brief: {
    title: 'Brief mode',
    desc: 'Keeps each Claude answer to three sentences or fewer',
    badge: 'brief',
    mode: 'brief',
  },
  voice: {
    title: 'Notebook voice',
    desc: 'Claude opens with what it looked at and closes with a conclusion',
    mode: 'notebook voice',
  },
  cmd: {
    briefOn: 'Brief mode is on.',
    briefOff: 'Brief mode is off.',
  },
  cap: {
    brief: {
      title: 'Brief mode',
      desc: 'Appends to each message: three sentences max, no lists',
    },
    voice: {
      title: 'Notebook voice',
      desc: 'Appends to each message: first line says what was looked at, last line gives the conclusion · turning it off adds one line to your next message telling Claude to write normally again',
    },
  },
}

export const STR: Record<Lang, ToneStrings> = { zh, en }

// ---------- 给模型看的要求 ----------
// 附在用户消息后面（prompt.submit 的 context），用户看不到。固定英文，不随界面语言变：
// 要求里写明「按用户的语言回答」，免得同一段要求一会儿中文一会儿英文。
// 口吻的两段是默认（素色）的中性要求；风格包可以用 voicePrompt、voiceOffPrompt 覆盖（柠檬实验室是「观察：」「结论：」）

export const BRIEF_NOTE = 'Brief mode: answer this one in three sentences or fewer, in the user\'s language, no lists.'

export const VOICE_PROMPT =
  'Notebook voice is on. Write each reply in the user\'s language: ' +
  'open with one line saying what you looked at, then the answer, then one closing line with the conclusion. ' +
  'Keep code and tool use as usual.'

export const VOICE_OFF_PROMPT =
  'Notebook voice is now off. From this reply on, write normally: no opening line about what you looked at ' +
  'and no closing conclusion line, even though earlier replies had them.'
