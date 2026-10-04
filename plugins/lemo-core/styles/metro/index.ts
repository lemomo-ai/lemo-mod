// 小火车（Train，名字取自像素小画里往右开的那节车厢）：跑在城市地铁里——线路图、站台、闸机和到站广播。线路品红只当底色用，上面写白字；
// 站牌炭灰是桌面上的深色字。不出现任何真实城市、地铁公司的名字或标志。
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

// 一节车厢往右开：o 车顶，b 银色车身，w 车窗，s 品红色的线路色带，y 车头灯，k/m 转向架和轮毂，g 铁轨、枕木和车尾的风线。
// 四帧：枕木一格一格往左退（车往右走），轮毂交替转，车尾的风线忽闪
const TRAIN: string[][] = [
  ['................', '..oooooooooooo..', 'ggbwwbwwbwwbwwb.', '..bwwbwwbwwbwwwb', '..bbbbbbbbbbbbbb', '..ssssssssssssss', '..bbbbbbbbbbbbby', '...kmk....kmk...', 'gggggggggggggggg', '.g...g...g...g..'],
  ['................', '..oooooooooooo..', '..bwwbwwbwwbwwb.', '..bwwbwwbwwbwwwb', 'g.bbbbbbbbbbbbbb', '..ssssssssssssss', '..bbbbbbbbbbbbby', '...mkm....mkm...', 'gggggggggggggggg', 'g...g...g...g...'],
  ['................', '..oooooooooooo..', '..bwwbwwbwwbwwb.', '.gbwwbwwbwwbwwwb', '..bbbbbbbbbbbbbb', '..ssssssssssssss', '..bbbbbbbbbbbbby', '...kmk....kmk...', 'gggggggggggggggg', '...g...g...g...g'],
  ['................', '..oooooooooooo..', '..bwwbwwbwwbwwb.', '..bwwbwwbwwbwwwb', '..bbbbbbbbbbbbbb', 'ggssssssssssssss', '..bbbbbbbbbbbbby', '...mkm....mkm...', 'gggggggggggggggg', '..g...g...g...g.'],
]

export const metro: LemoStyle = {
  id: 'metro',
  name: { zh: '火车嘟嘟', en: 'Choo-Choo' },
  colors: {
    ink: '#C8479B', // 线路图上的站点品红
    grid: '#8E97A3', // 铁轨钢灰
    pencil: '#8D9198', // 站牌上的小字灰
    accent: '#E4418F', // 线路品红，只做底色
    onAccent: '#FFFFFF', // 强调色偏深，上面写白字（标签、竹签）
    red: '#E4572E', // 信号红
    inkDark: '#2B2E33', // 站牌炭灰
    chip: '#EEEFF2', // 站牌浅灰底
    bubble: '#A0A8B3', // 线路图上的换乘站圈
    bubbleAccent: '#D63C88', // 深一点的品红
    cardFillLight: '#FBF6F9', // 极浅的品红
    cardFillDark: '#24262B', // 隧道里的炭灰
    deskCardFill: '#F7F8FA',
    deskCardBorder: '#E3E5E9',
    deskFigure: '#141518', // 近黑：桌面卡片上的大字（横条、面板的数值和风格名）
  },
  // 线路图：站点和线段
  bubbles: ['-○-', '·', '○-○', '∘', '-·-'],
  sprite: {
    palette: { o: '#8E97A3', b: '#D5DAE0', s: '#E4418F', w: '#3A4049', k: '#59606B', m: '#B9C0C9', y: '#FFD84A', g: '#8E97A3' },
    frames: TRAIN,
  },
  motif: 'sprite',
  icon: 'assets/metro/icon.png',
  sounds: { tick: 'assets/metro/tick.wav', done: 'assets/metro/done.wav', deny: 'assets/metro/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。
  // 英文挑一个清楚的播音腔，像车厢里的到站广播
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
