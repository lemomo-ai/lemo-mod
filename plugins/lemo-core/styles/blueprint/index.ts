// 三角尺（Set Square，名字取自像素小画里的三角板）：在蓝图上工程制图，图纸、尺寸、比例尺、审图、盖章、描图。
// 制图亮蓝只当底色用，上面写深制图蓝的字（白字在这个亮度上对比不够）；石墨灰做次要色，红铅笔做出错、拦截。
// 风格 = 一包数据：颜色、点缀、像素小画、音效、语音，和各 mod 带风格味道的文字（words/ 下每个 mod 一个文件）。
// 世界观：每条消息是一张图纸，Claude 的回复是这张图，工具在跑 = 绘制中，调 skill = 取用模板，一轮完成 = 出图。
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

// 三角板靠着一条线，铅笔贴着三角板往右画：b 三角板，g 石墨（笔杆和画出来的线），n 削开的木头，k 笔尖，e 橡皮
// 每帧铅笔往右挪一格，线跟着长一格
const SET_SQUARE: string[][] = [
  ['................', '.b..............', '.bb.............', '.b.b........e...', '.b..b......gg...', '.b...b....gg....', '.b....b..gg.....', '.bbbbbbb.n......', '.gggggggk.......', '................'],
  ['................', '.b..............', '.bb.............', '.b.b.........e..', '.b..b.......gg..', '.b...b.....gg...', '.b....b...gg....', '.bbbbbbb..n.....', '.ggggggggk......', '................'],
  ['................', '.b..............', '.bb.............', '.b.b..........e.', '.b..b........gg.', '.b...b......gg..', '.b....b....gg...', '.bbbbbbb...n....', '.gggggggggk.....', '................'],
]

export const blueprint: LemoStyle = {
  id: 'blueprint',
  name: { zh: '小三角', en: 'Tri-Tri' },
  colors: {
    ink: '#3B6FE0', // 制图蓝线
    grid: '#8AA2E0', // 图纸方格
    pencil: '#858D99', // 石墨灰
    accent: '#5580FF', // 制图亮蓝（饱和、偏宝蓝，和岩彩那种沉稳的石青蓝拉开），只做底色
    onAccent: '#0A1B38', // 深制图蓝
    red: '#E04848', // 审图红铅笔
    inkDark: '#102A66',
    chip: '#E8EEFD',
    bubble: '#93A3C9', // 淡描线
    bubbleAccent: '#3F6EF0',
    cardFillLight: '#F2F6FF',
    cardFillDark: '#0F2347', // 晒图纸的深蓝
    deskCardFill: '#F6F8FF',
    deskCardBorder: '#DCE4FA',
  },
  // 对位十字、尺寸线、交叉记号
  bubbles: ['+', '|-|', '·', '+ ·', '×'],
  sprite: { palette: { b: '#4C78F5', g: '#6E7887', n: '#E2B98A', k: '#56606F', e: '#E8838A' }, frames: SET_SQUARE },
  motif: 'sprite',
  icon: 'assets/blueprint/icon.png',
  sounds: { tick: 'assets/blueprint/tick.wav', done: 'assets/blueprint/done.wav', deny: 'assets/blueprint/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。英文挑一个一丝不苟的英式声音
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
