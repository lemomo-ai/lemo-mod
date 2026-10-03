// 葫芦（Gourd）：老中药铺——百子柜、戥子、药碾、方子，抓药、煎药。
// 一切说成抓药：回复是一张方子，工具在跑是抓药，调 skill 是拉开一格药斗，完成是方子抓齐，提问是问诊。
// 玉绿只当底色用，上面写红木棕的深色字（桌面横条的大数字也用 onAccent）；底色是宣纸色。
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

// 一只药葫芦：j 玉色葫芦，d 深一点的玉色（背光的一面），w 高光，s 红木塞子，r 腰上系的红绳和穗子。
// 三帧：腰上的红穗子往外一荡再落回来，葫芦身上的高光挪一点
const GOURD: string[][] = [
  [
    '.......ss.......',
    '......jjjj......',
    '.....jwjjjd.....',
    '......jjjd......',
    '.......rrrr.....',
    '.....jjjjjdr....',
    '....jwjjjjjdr...',
    '...jjjjjjjjjdr..',
    '....jjjjjjjd.rr.',
    '.....dddddd..rr.',
  ],
  [
    '.......ss.......',
    '......jjjj......',
    '.....jwjjjd.....',
    '......jjjd......',
    '.......rrrr.....',
    '.....jjjjjdrr...',
    '....jwjjjjjd.r..',
    '...jjjjjjjjjd.r.',
    '....jjjjjjjd..rr',
    '.....dddddd...rr',
  ],
  [
    '.......ss.......',
    '......jjjj......',
    '.....jjwjjd.....',
    '......jjjd......',
    '.......rrrr.....',
    '.....jjjjjdr....',
    '....jjwjjjjdr...',
    '...jjjjjjjjjdr..',
    '....jjjjjjjd.rr.',
    '.....dddddd..rr.',
  ],
]

export const apothecary: LemoStyle = {
  id: 'apothecary',
  name: { zh: '宝葫芦', en: 'Magic Gourd' },
  colors: {
    ink: '#B86B3A', // 肉桂：编号、圆点、进行中
    grid: '#9C8A68', // 竹篾：线条、刻度
    pencil: '#8F8A80', // 药渣灰
    accent: '#5FB58F', // 玉绿，只做底色
    onAccent: '#2B1710', // 红木
    red: '#D64B3C', // 朱砂药签
    inkDark: '#4A2A1C', // 红木棕，桌面上的深色字
    chip: '#E8F4EC', // 淡玉
    bubble: '#8CCFB0', // 浅玉，药罐冒的热气
    bubbleAccent: '#3FA67C', // 翠：深色主题的卡片竖条
    cardFillLight: '#FAF6EC', // 宣纸
    cardFillDark: '#22201B',
    deskCardFill: '#FBF9F3',
    deskCardBorder: '#E9E2D2',
  },
  // 药罐上冒的热气
  bubbles: ['˚', '° ˚', '~', '˚ °', '≈'],
  sprite: { palette: { j: '#5FB58F', d: '#3A8A68', w: '#E6F4EC', s: '#7A4A2E', r: '#D64B3C' }, frames: GOURD },
  motif: 'sprite',
  icon: 'assets/apothecary/icon.png',
  sounds: { tick: 'assets/apothecary/tick.wav', done: 'assets/apothecary/done.wav', deny: 'assets/apothecary/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: ['Tessa'] },
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
