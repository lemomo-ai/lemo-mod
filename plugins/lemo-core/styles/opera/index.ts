// 脸谱（Mask，名字取自像素小画里的红脸谱）：站在京剧的戏台上——开锣、亮相、唱念做打、谢幕，锣鼓经打着点子。
// 一切说成演戏：回复是一场戏，工具在跑是开演，调 skill 是角儿登场，完成是谢幕，提问是叫板。
// 朱红只当底色用，上面写白字；桌面横条的大数字用漆黑；金色做点缀。
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

// 一张红脸谱：r 朱红脸膛，k 漆黑的眉眼和嘴，w 白粉眼窝，g 金色额饰和两颗绒球。
// 三帧：眼珠往左、回正、往右（亮相时的眼神），头上的绒球一颤一颤
const MASK: string[][] = [
  [
    '..g....gg....g..',
    '..gggggggggggg..',
    '..rrrrrwwrrrrr..',
    '.rkkrrrwwrrrkkr.',
    '.rrkkkrrrrkkkrr.',
    '.rwwkwrrrrwkwwr.',
    '.rrrrrrkkrrrrrr.',
    '..rrkkrrrrkkrr..',
    '...rrrkkkkrrr...',
    '.....rrrrrr.....',
  ],
  [
    '.g.....gg.....g.',
    '..gggggggggggg..',
    '..rrrrrwwrrrrr..',
    '.rkkrrrwwrrrkkr.',
    '.rrkkkrrrrkkkrr.',
    '.rkwwwrrrrkwwwr.',
    '.rrrrrrkkrrrrrr.',
    '..rrkkrrrrkkrr..',
    '...rrrkkkkrrr...',
    '.....rrrrrr.....',
  ],
  [
    '..g....gg....g..',
    '..gggggggggggg..',
    '..rrrrrwwrrrrr..',
    '.rkkrrrwwrrrkkr.',
    '.rrkkkrrrrkkkrr.',
    '.rwwwkrrrrwwwkr.',
    '.rrrrrrkkrrrrrr.',
    '..rrkkrrrrkkrr..',
    '...rrrkkkkrrr...',
    '.....rrrrrr.....',
  ],
]

export const opera: LemoStyle = {
  id: 'opera',
  name: { zh: '小花脸', en: 'Masky' },
  colors: {
    ink: '#B8862A', // 赤金：编号、圆点、进行中
    grid: '#A08050', // 旧金：台口的雕花线
    pencil: '#938783', // 后台的灰
    accent: '#E5502F', // 朱红，只做底色
    onAccent: '#FFFFFF', // 强调色偏深，上面写白字（标签、竹签）
    red: '#E2445C', // 胭脂红：出错、拦截（和朱红底色分开）
    inkDark: '#2A1A16', // 漆黑，桌面上的深色字
    chip: '#FBEAE4', // 淡朱
    bubble: '#C9A04A', // 金
    bubbleAccent: '#D2452A', // 深一点的朱红：深色主题的卡片竖条
    cardFillLight: '#FFF6EE',
    cardFillDark: '#22171A', // 漆器
    deskCardFill: '#FDF8F3',
    deskCardBorder: '#F1E3D6',
    deskFigure: '#170E0C', // 漆黑：桌面卡片上的大字（横条、面板的数值和风格名）
  },
  // 台上的亮片和甩开的水袖
  bubbles: ['✦', '~', '✧', '~ ✦', '≈'],
  sprite: { palette: { r: '#E04A2E', k: '#1A1210', w: '#F6EFE4', g: '#E0A82E' }, frames: MASK },
  motif: 'sprite',
  icon: 'assets/opera/icon.png',
  sounds: { tick: 'assets/opera/tick.wav', done: 'assets/opera/done.wav', deny: 'assets/opera/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过
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
