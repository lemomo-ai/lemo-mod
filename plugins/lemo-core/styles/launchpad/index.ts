// 火箭（Rocket，名字取自像素小画里发射台上的那枚火箭）：火箭发射的那一套，倒计时、点火、遥测、入轨、中止。
// 铝灰蓝只当底色用，上面写近太空黑的字；火箭橙是主色（编号、圆点、进行中）。
// 风格 = 一包数据：颜色、点缀、像素小画、音效、语音，和各 mod 带风格味道的文字（words/ 下每个 mod 一个文件）。
// 世界观：每条消息是一次飞行，Claude 的回复是这次飞行的报告，工具在跑 = 推进中，调 skill = 挂载载荷，一轮完成 = 入轨。
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

// 发射台上的火箭，旁边是勤务塔：w 铝箭体，r 火箭橙（箭头、尾翼、外焰），g 钢架（塔、台面、舷窗、喷口），y 焰心
// 尾焰在跳：第一帧小火苗，第二帧火焰窜进导流槽，第三帧两边冒起白烟
const ROCKET: string[][] = [
  ['.......r........', '......rrr....g..', '......wgw....g..', '......www.gggg..', '......www....g..', '.....rwwwr...g..', '.....rgggr...g..', '.......y.....g..', '...gggg.ggggggg.', '................'],
  ['.......r........', '......rrr....g..', '......wgw....g..', '......www.gggg..', '......www....g..', '.....rwwwr...g..', '.....rgggr...g..', '......ryr....g..', '...ggggyggggggg.', '................'],
  ['.......r........', '......rrr....g..', '......wgw....g..', '......www.gggg..', '......www....g..', '.....rwwwr...g..', '.....rgggr...g..', '....w..y..w..g..', '...ggggrggggggg.', '................'],
]

export const launchpad: LemoStyle = {
  id: 'launchpad',
  name: { zh: '火箭咻咻', en: 'Zoomy' },
  colors: {
    ink: '#E0631A', // 火箭橙
    grid: '#8597AC', // 钢架灰蓝
    pencil: '#8A929D', // 仪表灰
    accent: '#A6B5C7', // 铝灰蓝，只做底色
    onAccent: '#0F131B', // 近太空黑
    red: '#DD3A52', // 中止红
    inkDark: '#141922', // 近太空黑
    chip: '#ECEFF3',
    bubble: '#97A6B7', // 尾烟灰
    bubbleAccent: '#8E9FB4',
    cardFillLight: '#F4F6F9',
    cardFillDark: '#11141B',
    deskCardFill: '#F8F9FB',
    deskCardBorder: '#E1E6ED',
    deskFigure: '#0F131B', // 近太空黑：桌面卡片上的大字（横条、面板的数值和风格名）
  },
  // 倒计时 3、2、1，然后升空
  bubbles: ['·', '3', '· 2', '1', '^'],
  sprite: { palette: { w: '#B9C4D1', r: '#E8651B', g: '#5E6B7D', y: '#FFC93C' }, frames: ROCKET },
  motif: 'sprite',
  icon: 'assets/launchpad/icon.png',
  sounds: { tick: 'assets/launchpad/tick.wav', done: 'assets/launchpad/done.wav', deny: 'assets/launchpad/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。英文挑一个清楚利落的飞控播报声
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
