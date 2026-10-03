// 柠檬（Lemo）：烧瓶里装着柠檬汽水的实验室，实验记录本的结构，柠檬黄只当底色用（黄字在浅色终端上看不清）。
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

// 烧瓶里装着柠檬汽水：w 玻璃，l 柠檬水，o 气泡
const FLASK: string[][] = [
  ['......wwww......', '.......ww.......', '.......ww.......', '......w..w......', '.....w..o.w.....', '....wllllllw....', '...wlllollllw...', '..wllllllllllw..', '..wwwwwwwwwwww..', '................'],
  ['......wwww...o..', '.......ww.......', '.......ww.......', '......wo.w......', '.....w....w.....', '....wllolllw....', '...wllllllolw...', '..wllllllllllw..', '..wwwwwwwwwwww..', '................'],
]

export const lemonLab: LemoStyle = {
  id: 'lemon-lab',
  name: { zh: 'Lemo 实验室', en: 'Lemo Lab' },
  colors: {
    ink: '#6F8FE0', // 蓝墨水
    grid: '#7FA3CC', // 方格蓝
    pencil: '#8A9099', // 铅笔灰
    accent: '#F2CF1D', // 柠檬黄，只做底色
    onAccent: '#1B1D1F',
    red: '#E0524A', // 红笔
    inkDark: '#2F4F96', // 深蓝墨水
    chip: '#E9EFFA', // 浅蓝底
    bubble: '#8FB3D9', // 烧瓶玻璃蓝
    bubbleAccent: '#E2B714',
    cardFillLight: '#FFFBEA', // 浅柠檬
    cardFillDark: '#262A31',
    deskCardFill: '#F7F9FC',
    deskCardBorder: '#E4ECF6',
  },
  bubbles: ['°', '∘ °', '○', '° ∘', '∘'],
  sprite: { palette: { w: '#8FB3D9', l: '#F2CF1D', o: '#FFFFFF' }, frames: FLASK },
  motif: 'flask',
  icon: 'assets/lemon-lab/flask.png',
  sounds: { tick: 'assets/lemon-lab/tick.wav', done: 'assets/lemon-lab/done.wav', deny: 'assets/lemon-lab/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: [] },
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
