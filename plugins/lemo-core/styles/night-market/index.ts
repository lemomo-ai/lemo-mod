// 灯笼（Lantern，名字取自像素小画里那盏灯笼）：挂在夜市里，摊位、吆喝、排队、打包、收摊。梅子紫只当底色用，灯笼的红橙做点缀。
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

// 一盏挂着的灯笼，在风里晃：r 红纸，d 竹骨，o 里面透出来的灯光，y 金色的上下盖，p 梅子紫的挂绳和穗子。
// 四帧：正、往右、正、往左（挂绳不动，灯身偏一格，穗子偏两格）
const LANTERN: string[][] = [
  ['.......pp.......', '......yyyy......', '....rrdrrdrr....', '...rrdroordrr...', '...rrdoooodrr...', '...rrdroordrr...', '....rrdrrdrr....', '......yyyy......', '.......pp.......', '.......pp.......'],
  ['.......pp.......', '......yyyy......', '.....rrdrrdrr...', '....rrdroordrr..', '....rrdoooodrr..', '....rrdroordrr..', '.....rrdrrdrr...', '.......yyyy.....', '........pp......', '.........pp.....'],
  ['.......pp.......', '......yyyy......', '....rrdrrdrr....', '...rrdroordrr...', '...rrdoooodrr...', '...rrdroordrr...', '....rrdrrdrr....', '......yyyy......', '.......pp.......', '.......pp.......'],
  ['.......pp.......', '......yyyy......', '...rrdrrdrr.....', '..rrdroordrr....', '..rrdoooodrr....', '..rrdroordrr....', '...rrdrrdrr.....', '.....yyyy.......', '......pp........', '.....pp.........'],
]

export const nightMarket: LemoStyle = {
  id: 'night-market',
  name: { zh: '小灯笼', en: 'Lanny' },
  colors: {
    ink: '#E07434', // 灯笼的光
    grid: '#A3849F', // 暮色
    pencil: '#978A95', // 夜里的灰
    // 梅子紫，只做底色。上面的字用深色：onAccent 还是桌面横条大数字的颜色（画在很浅的卡片底上），白字在那里看不见
    accent: '#B062A3',
    onAccent: '#14070F',
    red: '#E23E57', // 偏玫红的红，和灯笼橙拉开
    inkDark: '#55204C', // 深梅子
    chip: '#F4E6F0',
    bubble: '#F2A65A', // 灯笼光晕
    bubbleAccent: '#C46CAE',
    cardFillLight: '#FCF1F8',
    cardFillDark: '#2A1F2E',
    deskCardFill: '#FCF8FB',
    deskCardBorder: '#EEDDEA',
  },
  bubbles: ['⋆', '✦ ·', '∘', '· ✧', '✦'],
  sprite: { palette: { r: '#E8503A', d: '#B8352B', o: '#FFC46B', y: '#E8B84A', p: '#B062A3' }, frames: LANTERN },
  motif: 'sprite',
  icon: 'assets/night-market/icon.png',
  sounds: { tick: 'assets/night-market/tick.wav', done: 'assets/night-market/done.wav', deny: 'assets/night-market/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: ['Karen'] },
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
