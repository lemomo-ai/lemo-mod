// 泡泡鱼（Bubble Fish，名字取自像素小画里吐泡泡的小鱼）：住在水族馆的一排鱼缸里，水草、气泡、喂食、换水、巡游。珊瑚色只当底色用，主色是深水蓝绿。
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

// 一条珊瑚色的小鱼对着水草吐泡泡：f 鱼身，t 鱼鳍和尾巴，e 眼睛，b 气泡（空心的圈，不是汽水那种实心小点），g 水草。
// 三帧：大泡浮到顶、嘴边又冒一颗（第一帧也是面板图标）→ 大泡出了水面，只剩嘴边那颗 → 尾巴一收、泡泡变大往上浮、水草摆
const FISH: string[][] = [
  ['.............b..', '............b.b.', '.....ttt.....b..', 't....ffff.......', 'tt..ffffff.b....', '.tt.ffffefff..g.', '.ttfftfffff..g..', 'tt..fttfff...gg.', 't....ffff.....g.', '.............gg.'],
  ['................', '................', '.....ttt........', 't....ffff.......', 'tt..ffffff.b....', '.tt.ffffefff..g.', '.ttfftfffff..g..', 'tt..fttfff...gg.', 't....ffff.....g.', '.............gg.'],
  ['................', '............b...', '.....ttt...b.b..', '.....ffff...b...', '.t..ffffff......', '.tt.ffffefff.g..', '.ttfftfffff...g.', '.t..fttfff...gg.', '.....ffff....g..', '.............gg.'],
]

export const aquarium: LemoStyle = {
  id: 'aquarium',
  name: { zh: '泡泡', en: 'Bubbles' },
  colors: {
    ink: '#2E8C9A', // 深水蓝绿
    grid: '#7FAAB3', // 缸壁玻璃的灰蓝
    pencil: '#948F86', // 缸底细沙
    accent: '#FF8577', // 珊瑚色，只做底色
    onAccent: '#142229', // 深海
    red: '#D63A50', // 警示红，比珊瑚深、偏洋红，和底色分开
    inkDark: '#164C58', // 深水
    chip: '#E2F2F4', // 浅水
    bubble: '#55BBD3', // 水里的气泡
    bubbleAccent: '#F2705F', // 深一点的珊瑚
    cardFillLight: '#F0F9FA', // 透过玻璃的浅水色
    cardFillDark: '#182A30',
    deskCardFill: '#F5FAFB',
    deskCardBorder: '#DDEDF0',
    deskFigure: '#142229', // 深海：桌面卡片上的大字（横条、面板的数值和风格名）
  },
  // ><> 是游过去的小鱼，o O 是往上冒的气泡
  bubbles: ['><>', 'o', '°', 'o O', 'o'],
  sprite: { palette: { f: '#FF8577', t: '#E0604F', e: '#14303A', b: '#55BBD3', g: '#3FA37A' }, frames: FISH },
  motif: 'sprite',
  icon: 'assets/aquarium/icon.png',
  sounds: { tick: 'assets/aquarium/tick.wav', done: 'assets/aquarium/done.wav', deny: 'assets/aquarium/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。英文挑澳洲口音（大堡礁的海）
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: ['Karen'] },
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
