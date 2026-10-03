// 邮筒（Postbox）：老邮局的柜台、邮票、邮戳、挂号和投递。深邮政绿只当底色用，上面写深色字（桌面横条的大数字也用这个深色）；
// 邮票黄是强调色的气泡。不出现任何真实邮政机构的名字或标志。
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

// 绿色邮筒：g 筒身，h 亮面，d 筒顶和底座的深绿，k 投信口，y 邮票黄的铭牌，p 小旗杆，r 红色小旗和邮票，w/e 一封信（e 是牛皮纸色的下沿）。
// 三帧：信从右上角飞来 → 信到了投信口 → 信投进去了，旁边的小旗竖起来
const POSTBOX: string[][] = [
  ['...........wwwwr', '......dggd.eeeee', '.....dhgggd.....', '....dddddddd....', '.....hkkkkg.....', '.....hggggg.p...', '.....hyyyyg.prr.', '.....hyyyyg.p...', '.....hggggg.p...', '....dddddddd....'],
  ['................', '......dggd......', '.....dwwwwr.....', '....ddeeeeed....', '.....hkkkkg.....', '.....hggggg.p...', '.....hyyyyg.prr.', '.....hyyyyg.p...', '.....hggggg.p...', '....dddddddd....'],
  ['................', '......dggd......', '.....dhgggd.....', '....dddddddd.rr.', '.....hkkkkg.prr.', '.....hggggg.p...', '.....hyyyyg.p...', '.....hyyyyg.p...', '.....hggggg.p...', '....dddddddd....'],
]

export const postOffice: LemoStyle = {
  id: 'post-office',
  name: { zh: '小邮筒', en: 'Postie' },
  colors: {
    ink: '#3C9E6A', // 邮政绿的中间调
    grid: '#A8946F', // 牛皮纸包裹的麻绳色
    pencil: '#8F8A80', // 旧柜台上的铅笔灰
    accent: '#1D924F', // 深邮政绿，只做底色
    onAccent: '#0B130E', // 绿底上的深色字（也是桌面横条的大数字，所以不能用白字）
    red: '#D94A3D', // 邮戳红
    inkDark: '#1D4A34', // 墨绿
    chip: '#E7F2EA', // 浅绿底
    bubble: '#B49B72', // 牛皮纸信封
    bubbleAccent: '#E8B422', // 邮票黄
    cardFillLight: '#FCF8EE', // 信纸米白
    cardFillDark: '#1E2923', // 夜里的邮筒绿
    deskCardFill: '#F8FAF6',
    deskCardBorder: '#E1EADF',
  },
  // 邮戳上的波浪线和航空信封的叉
  bubbles: ['≈', '~≈~', '×', '≈ ~', '~'],
  sprite: {
    palette: { g: '#1D924F', h: '#4DBB78', d: '#13693A', k: '#14211A', y: '#E8B422', w: '#F7F3EA', e: '#C4AA7A', r: '#D94A3D', p: '#8F8A80' },
    frames: POSTBOX,
  },
  motif: 'sprite',
  icon: 'assets/post-office/icon.png',
  sounds: { tick: 'assets/post-office/tick.wav', done: 'assets/post-office/done.wav', deny: 'assets/post-office/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。
  // 英文挑一个英式口音，像老邮局柜台后面的人
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
