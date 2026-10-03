// 磁带（Cassette）：八十年代随身听。每一轮对话是一首歌，Claude 干活是走带、录音，用量是磁带走了多少。
// VU 橙只当底色用（橙字在浅色终端上发虚），编号和进行中用琥珀屏的中间调，桌面深色字用磁带棕。
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

// 一盘磁带：b 磁带棕外壳，w VU 橙标签条，e 标签米（标签和带轮的齿），k 深色透明窗，r 录音红指示灯。
// 两帧之间带轮的齿从「+」转到「×」，录音灯一亮一灭
const CASSETTE: string[][] = [
  ['.bbbbbbbbbbbbbb.', '.bwwwwwwwwwwwwb.', '.beeeeeeeeeereb.', '.bekkkkkkkkkkeb.', '.bekkekkkkekkeb.', '.bekeeekkeeekeb.', '.bekkekkkkekkeb.', '.bekkkkkkkkkkeb.', '.bbbbbbbbbbbbbb.', '...bbkbbbbkbb...'],
  ['.bbbbbbbbbbbbbb.', '.bwwwwwwwwwwwwb.', '.beeeeeeeeeeeeb.', '.bekkkkkkkkkkeb.', '.bekekekkekekeb.', '.bekkekkkkekkeb.', '.bekekekkekekeb.', '.bekkkkkkkkkkeb.', '.bbbbbbbbbbbbbb.', '...bbkbbbbkbb...'],
]

export const mixtape: LemoStyle = {
  id: 'mixtape',
  name: { zh: '小磁', en: 'Cassie' },
  colors: {
    ink: '#C9862F', // 琥珀屏，中间调
    grid: '#8E949C', // 铝灰
    pencil: '#8F8676', // 标签米压暗的暖灰
    accent: '#FF8A1F', // VU 橙，只做底色
    onAccent: '#1A1C1B',
    red: '#E5483C', // 录音红
    inkDark: '#6B4A35', // 磁带棕
    chip: '#F3EBDA', // 浅标签米
    bubble: '#A9AFB8', // 浅铝灰
    bubbleAccent: '#E8751A', // 压暗一点的 VU 橙
    cardFillLight: '#FFF7EC',
    cardFillDark: '#2A2522',
    deskCardFill: '#FBF8F2',
    deskCardBorder: '#EEE5D4',
  },
  // 音符和 VU 表跳动的格子
  bubbles: ['♪', 'ılı', '♫', '·ıl', '♪ ·'],
  sprite: { palette: { b: '#8B5E3C', w: '#FF8A1F', e: '#E8DCC2', k: '#2A2522', r: '#E5483C' }, frames: CASSETTE },
  motif: 'sprite',
  icon: 'assets/mixtape/icon.png',
  sounds: { tick: 'assets/mixtape/tick.wav', done: 'assets/mixtape/done.wav', deny: 'assets/mixtape/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: ['Samantha'] },
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
