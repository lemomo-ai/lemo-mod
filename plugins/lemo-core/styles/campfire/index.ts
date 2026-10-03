// 篝火（Campfire）：露营的一夜，生火、添柴、扎营、守夜、看星星、收营。炭火橙红只当底色用，主色是松针绿。
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

// 两根木柴上的一堆篝火：y 火心，o 火焰，r 火苗外缘，b 树皮，l 木柴的截面。
// 三帧：木柴不动，火苗尖左右跳、火心忽高忽低，偶尔蹦出一颗火星
const FIRE: string[][] = [
  ['................', '.......r........', '......rr...r....', '.....rrorr.r....', '.....roooorr....', '....rrooyoorr...', '....rooyyyoor...', '..lbbbooyyobbbl.', '...lbbbbbbbbbl..', '................'],
  ['..........y.....', '........r.......', '....r..rr.......', '....r.rrorr.....', '....rroooorr....', '....rrooyoorr...', '....rooyyyoor...', '..lbbbooyyobbbl.', '...lbbbbbbbbbl..', '................'],
  ['.............o..', '......r.........', '......rr..r.....', '.....rorr.rr....', '.....rooyoor....', '....rrooyyoor...', '....rooyyyoor...', '..lbbbooyyobbbl.', '...lbbbbbbbbbl..', '................'],
]

export const campfire: LemoStyle = {
  id: 'campfire',
  name: { zh: '篝火', en: 'Campfire' },
  colors: {
    ink: '#3F9065', // 松针绿
    grid: '#A08C78', // 木柴的灰褐
    pencil: '#938A82', // 柴灰
    accent: '#D66B1F', // 炭火橙红，只做底色。压深一点像烧透的炭，和亮橙、朱红拉开；白字对比不够，配深色字
    onAccent: '#1F1712', // 炭黑
    red: '#D9414F', // 野莓红，和炭火的橙红分开
    inkDark: '#24452F', // 深松林
    chip: '#F4ECE2', // 帐篷帆布
    bubble: '#D9A35F', // 往上飘的火星
    bubbleAccent: '#C45F1A', // 再深一点的炭火
    cardFillLight: '#FFF6EE', // 火光映着的暖白
    cardFillDark: '#26201C',
    deskCardFill: '#FBF8F4',
    deskCardBorder: '#EEE4D8',
  },
  // 火堆上方往上飘的火星
  bubbles: ['*', '˙ ·', '⋆', '· ˙', '˙'],
  sprite: { palette: { y: '#FFD54F', o: '#F7882F', r: '#E04A26', b: '#8C5A33', l: '#D9A56A' }, frames: FIRE },
  motif: 'sprite',
  icon: 'assets/campfire/icon.png',
  sounds: { tick: 'assets/campfire/tick.wav', done: 'assets/campfire/done.wav', deny: 'assets/campfire/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。英文挑讲故事的英国口音
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
