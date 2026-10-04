// 面包（Loaf，名字取自像素小画里刚出炉的那条面包）：住在清晨的面包房，揉面、发酵、整形、进炉、出炉、切片。焦糖面包皮色只当底色用，奶油黄做浅底。
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

// 刚出炉的一条面包，上面冒热气：h 烤得金黄的顶，w 斜着的割口裂开露出的奶油色，c 面包皮，d 底下烤深的一圈，s 热气（三帧往上飘）
const LOAF_BODY = ['....hhhhhhhh....', '..hhwhhhwhhhwh..', '.chhhwhhhwhhhwc.', '.cccccccccccccc.', '..cccccccccccc..', '...dddddddddd...', '................']
const LOAF: string[][] = [
  ['................', '.......s...s....', '......s...s.....', ...LOAF_BODY],
  ['.......s...s....', '......s...s.....', '.......s...s....', ...LOAF_BODY],
  ['......s...s.....', '.......s...s....', '................', ...LOAF_BODY],
]

export const bakery: LemoStyle = {
  id: 'bakery',
  name: { zh: '胖面包', en: 'Chubby Bun' },
  colors: {
    ink: '#B86A3D', // 烤深了的面包皮
    grid: '#B39B78', // 面粉袋的麻色
    pencil: '#968B80', // 撒了面粉的灰
    accent: '#D4914A', // 焦糖面包皮，只做底色
    onAccent: '#FFFFFF', // 强调色偏深，上面写白字（标签、竹签）
    red: '#DB4152', // 覆盆子果酱
    inkDark: '#5B3416', // 深烘的可可色
    chip: '#F5EBDD', // 面粉白
    bubble: '#CDBFAE', // 热气
    bubbleAccent: '#C47F35',
    cardFillLight: '#FFF8E7', // 奶油黄
    cardFillDark: '#2E2620',
    deskCardFill: '#FFFBF4',
    deskCardBorder: '#F2E5CF',
    deskFigure: '#2B1708', // 桌面卡片上的大字（横条、面板的数值和风格名）
  },
  bubbles: ['~', '˚ ~', '≈', '~ ˚', '·'],
  sprite: { palette: { d: '#8A4E22', c: '#C98242', h: '#E5A552', w: '#FBE6B8', s: '#B8AFA3' }, frames: LOAF },
  motif: 'sprite',
  icon: 'assets/bakery/icon.png',
  sounds: { tick: 'assets/bakery/tick.wav', done: 'assets/bakery/done.wav', deny: 'assets/bakery/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: ['Moira'] },
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
