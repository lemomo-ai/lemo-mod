// 望远镜（Telescope）：夜里在天文台开穹顶观星。蓝紫只当底色用，上面写白字；星光金只做点缀（✦ ⋆ 这类窄字符）。
// 风格 = 一包数据：颜色、点缀、像素小画、音效、语音，和各 mod 带风格味道的文字（words/ 下每个 mod 一个文件）。
// 世界观：每条消息是一个观测目标，Claude 的回复是一条观测记录，工具在跑 = 曝光中，调 skill = 换目镜。
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

// 三脚架上的折射望远镜，左上角一颗星在闪：t 镜筒，L 物镜反光，m 架子和目镜，s 星光，S 星芯
// 第一帧平常，第二帧星芒拉长，第三帧这颗暗下去、旁边另一颗亮一下
const TELESCOPE: string[][] = [
  ['................', '..s.........ttL.', '.sSs......ttttL.', '..s.....tttt....', '.....mtttt......', '........mm......', '........mm......', '.......m..m.....', '......m....m....', '................'],
  ['..s.............', '..s.........ttL.', 'ssSss.....ttttL.', '..s.....tttt....', '..s..mtttt......', '........mm......', '........mm......', '.......m..m.....', '......m....m....', '................'],
  ['................', '......s.....ttL.', '..S.......ttttL.', '........tttt....', '.....mtttt......', '........mm......', '........mm......', '.......m..m.....', '......m....m....', '................'],
]

export const observatory: LemoStyle = {
  id: 'observatory',
  name: { zh: '小望', en: 'Peeky' },
  colors: {
    ink: '#7D6FEF', // 蓝紫墨
    grid: '#7380BC', // 星图坐标线
    pencil: '#8C8DA6', // 夜色灰
    accent: '#978DFF', // 蓝紫，只做底色
    onAccent: '#FFFFFF', // 强调色偏深，上面写白字（标签、竹签）
    red: '#E2566A', // 观测用的红光
    inkDark: '#211C52', // 深靛蓝
    chip: '#ECEAFC',
    bubble: '#D9A62E', // 星光金
    bubbleAccent: '#8476F5',
    cardFillLight: '#F6F4FF',
    cardFillDark: '#191733', // 夜空
    deskCardFill: '#F8F7FE',
    deskCardBorder: '#E5E2F7',
    deskFigure: '#16123F', // 深靛蓝：桌面卡片上的大字（横条、面板的数值和风格名）
  },
  bubbles: ['✦', '⋆ ·', '✧', '· ⋆', '⋆'],
  sprite: { palette: { t: '#8577F2', L: '#D4CEFF', m: '#646C8E', s: '#F0B42E', S: '#FFDC7A' }, frames: TELESCOPE },
  motif: 'sprite',
  icon: 'assets/observatory/icon.png',
  sounds: { tick: 'assets/observatory/tick.wav', done: 'assets/observatory/done.wav', deny: 'assets/observatory/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。英文挑一个轻柔的夜班声音
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
