// 锦鲤（Koi）：岩彩画，敦煌壁画画师的那一盒矿物颜料——石青、石绿、朱砂、赭石、藤黄，铺在宣纸上。
// 一切说成作画：回复是一幅画稿，工具在跑是着色，调 skill 是调一味色，完成是题款落印。
// 石青只当底色用，上面写白字；桌面横条的大数字用墨色。
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

// 一尾朱砂锦鲤（工笔画法）：r 朱砂身子，w 宣纸白斑，k 墨点眼，o 藤黄鳍，b 石青水纹。
// 三帧：尾巴一张一合地摆，嘴边吐个泡往上浮，水纹往后荡
const KOI: string[][] = [
  [
    '................',
    '.....ooo........',
    '...rrrrrr.....oo',
    '.rrwwrrrrr...oo.',
    'rkrwwwrrrrrrrr..',
    'rrrrwwrrrrrrrr..',
    '.rrrrrrrrrr..oo.',
    '...rrrrrrr....oo',
    '.....oo.........',
    '..bbb......bbb..',
  ],
  [
    '................',
    '.....ooo........',
    'b..rrrrrr.......',
    '.rrwwrrrrr....oo',
    'rkrwwwrrrrrrrro.',
    'rrrrwwrrrrrrrro.',
    '.rrrrrrrrrr...oo',
    '...rrrrrrr......',
    '.....oo.........',
    '.bbb......bbb...',
  ],
  [
    'b...............',
    '.....ooo........',
    '...rrrrrr.....oo',
    '.rrwwrrrrr...oo.',
    'rkrwwwrrrrrrrr..',
    'rrrrwwrrrrrrrr..',
    '.rrrrrrrrrr..oo.',
    '...rrrrrrr....oo',
    '.....oo.........',
    'bb......bbb....b',
  ],
]

export const mineral: LemoStyle = {
  id: 'mineral',
  name: { zh: '小锦鲤', en: 'Lucky Koi' },
  colors: {
    ink: '#3E9B7F', // 石绿：编号、圆点、进行中
    grid: '#B5674A', // 土红：壁画起稿的线
    pencil: '#8E8A82', // 淡墨灰
    accent: '#4B86C6', // 石青（二青），只做底色
    onAccent: '#FFFFFF', // 强调色偏深，上面写白字（标签、竹签）
    red: '#D9472F', // 朱砂
    inkDark: '#24466E', // 花青，桌面上的深色字
    chip: '#E6EEF7', // 淡石青
    bubble: '#79A3D6', // 三青
    bubbleAccent: '#3F7BBE', // 头青：深色主题的卡片竖条
    cardFillLight: '#F8F3E8', // 宣纸
    cardFillDark: '#1F2630',
    deskCardFill: '#FBF8F1', // 熟宣
    deskCardBorder: '#ECE4D3',
    deskFigure: '#15181D', // 墨：桌面卡片上的大字（横条、面板的数值和风格名）
  },
  // 研碎的矿石颜料粉
  bubbles: ['∴', '·', '∵', '· ·', '.·'],
  sprite: { palette: { r: '#D9472F', w: '#F3EBDD', k: '#1E1C1A', o: '#D9A21B', b: '#4B86C6' }, frames: KOI },
  motif: 'sprite',
  icon: 'assets/mineral/icon.png',
  sounds: { tick: 'assets/mineral/tick.wav', done: 'assets/mineral/done.wav', deny: 'assets/mineral/deny.wav' },
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
