// 打字机（Typewriter）：老报馆。每一轮对话是一篇稿子，Claude 干活是采写、排版、校对，小结是一张号外。
// 新闻纸米灰只当底色用，编号和进行中用油墨蓝的中间调，桌面深色字用油墨深蓝，出错用色带红。
// 风格 = 一包数据：颜色、点缀、像素小画、音效、语音，和各 mod 带风格味道的文字（words/ 下每个 mod 一个文件）。
import type { LemoStyle, LemoText } from '../../types'

import core from './words/lemo-core'
import skin from './words/lemo-skin'
import spinner from './words/lemo-spinner'
import ask from './words/lemo-ask'
import meter from './words/lemo-meter'
import guard from './words/lemo-guard'
import sound from './words/lemo-sound'
import voice from './words/lemo-voice'
import tone from './words/lemo-tone'
import pomodoro from './words/lemo-pomodoro'
import watch from './words/lemo-watch'
import recap from './words/lemo-recap'
import todo from './words/lemo-todo'
import journal from './words/lemo-journal'
import lot from './words/lemo-lot'
import assistant from './words/lemo-assistant'

const prefix = (mod: string, w: Readonly<Record<string, LemoText>>) => Object.fromEntries(Object.entries(w).map(([k, v]) => [`${mod}.${k}`, v]))

// 一台打字机：p 新闻纸（也是键帽），t 油墨字，r 色带红（刚打下去的那个字），k 滚筒和按下去的键，b 机身。
// 字车（纸和滚筒）每帧往左挪一格，打字点不动，当前这一行字跟着长一个；每帧按下的键不一样
const TYPEWRITER: string[][] = [
  ['.....pppppppp...', '.....pttttttp...', '.....pppppppp...', '.....pttrpppp...', '...kkkkkkkkkkkk.', '..bbbbbbbbbbbb..', '.bbpbkbpbpbpbbb.', '.bbbpbpbpbpbpbb.', '.bbbbbkkkkbbbbb.', '................'],
  ['....pppppppp....', '....pttttttp....', '....pppppppp....', '....ptttrppp....', '..kkkkkkkkkkkk..', '..bbbbbbbbbbbb..', '.bbpbpbpbpbpbbb.', '.bbbpbpbpbkbpbb.', '.bbbbbkkkkbbbbb.', '................'],
  ['...pppppppp.....', '...pttttttp.....', '...pppppppp.....', '...pttttrpp.....', '.kkkkkkkkkkkk...', '..bbbbbbbbbbbb..', '.bbpbpbpbkbpbbb.', '.bbbpbpbpbpbpbb.', '.bbbbbkkkkbbbbb.', '................'],
]

export const newsroom: LemoStyle = {
  id: 'newsroom',
  name: { zh: '哒哒', en: 'Clacky' },
  colors: {
    ink: '#5B77A8', // 油墨蓝，中间调
    grid: '#8E96A3', // 版面分栏线的灰
    pencil: '#8C877C', // 旧报纸的暖灰
    accent: '#D6CFBC', // 新闻纸米灰，只做底色
    onAccent: '#1E2F52', // 油墨深蓝
    red: '#D2453C', // 色带红
    inkDark: '#1E2F52', // 油墨深蓝
    chip: '#EFECE3', // 浅新闻纸
    bubble: '#A8A293', // 旧新闻纸
    bubbleAccent: '#C9BFA4', // 压暗一点的新闻纸
    cardFillLight: '#FBF9F3',
    cardFillDark: '#23252B',
    deskCardFill: '#FAF8F3',
    deskCardBorder: '#E8E3D6',
    deskFigure: '#1E2F52', // 油墨深蓝：桌面卡片上的大字（横条、面板的数值和风格名）
  },
  // 段落号、分节号和排版里的星号分隔
  bubbles: ['¶', '§', '***', '· ¶', '§ ·'],
  sprite: { palette: { p: '#E9E2CF', t: '#2A3550', r: '#D2453C', k: '#3A3F4B', b: '#5F6F8C' }, frames: TYPEWRITER },
  motif: 'sprite',
  icon: 'assets/newsroom/icon.png',
  sounds: { tick: 'assets/newsroom/tick.wav', done: 'assets/newsroom/done.wav', deny: 'assets/newsroom/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。
  // 英文用 Daniel：英国口音，像电台里播新闻
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: ['Daniel'] },
  words: {
    ...prefix('lemo-core', core),
    ...prefix('lemo-skin', skin),
    ...prefix('lemo-spinner', spinner),
    ...prefix('lemo-ask', ask),
    ...prefix('lemo-meter', meter),
    ...prefix('lemo-guard', guard),
    ...prefix('lemo-sound', sound),
    ...prefix('lemo-voice', voice),
    ...prefix('lemo-tone', tone),
    ...prefix('lemo-pomodoro', pomodoro),
    ...prefix('lemo-watch', watch),
    ...prefix('lemo-recap', recap),
    ...prefix('lemo-todo', todo),
    ...prefix('lemo-journal', journal),
    ...prefix('lemo-lot', lot),
    ...prefix('lemo-assistant', assistant),
  },
}
