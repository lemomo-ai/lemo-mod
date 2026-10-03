// 企鹅（Penguin，名字取自像素小画里的企鹅）：住在越冬科考站，补给、冰芯、雪地车、极光、越冬。
// 冰青只当底色用，上面写深海军蓝的字；冰川蓝是主色，安全橙做出错、拦截。
// 风格 = 一包数据：颜色、点缀、像素小画、音效、语音，和各 mod 带风格味道的文字（words/ 下每个 mod 一个文件）。
// 世界观：每条消息钻一节冰芯，Claude 的回复是这节冰芯的记录，工具在跑 = 钻探中，调 skill = 领用补给，小结 = 值班小结。
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

// 站在雪里的企鹅：k 背（石板蓝，深色终端上也看得见），w 白肚皮和眼睛，o 安全橙的嘴和脚，i 雪花
// 雪花一帧往下落一格；第三帧企鹅眨一下眼
const PENGUIN: string[][] = [
  ['......kkkk......', '.i...kkkkkk.....', '.....kwkkwk.....', '.....kkookk.....', '....kkwwwwkk..i.', '...kkkwwwwkkk...', '...k.kwwwwk.k...', '.....kwwwwk.....', '.....oo..oo..i..', '................'],
  ['......kkkk...i..', '.....kkkkkk.....', '.....kwkkwk.....', '.i...kkookk.....', '....kkwwwwkk....', '...kkkwwwwkkk...', '...k.kwwwwk.k.i.', '.....kwwwwk.....', '.....oo..oo.....', '................'],
  ['......kkkk......', '.....kkkkkk.....', '.....kkkkkk..i..', '.....kkookk.....', '....kkwwwwkk....', '.i.kkkwwwwkkk...', '...k.kwwwwk.k...', '.....kwwwwk.....', '.....oo..oo...i.', '................'],
]

export const polar: LemoStyle = {
  id: 'polar',
  name: { zh: '企鹅摇摇', en: 'Waddles' },
  colors: {
    ink: '#3A8EC7', // 冰川蓝
    grid: '#7FAEC3', // 冰面线
    pencil: '#8694A0', // 冷灰
    accent: '#72D2E2', // 冰青，只做底色
    onAccent: '#0B2A33', // 深海军蓝
    red: '#EE681D', // 安全橙
    inkDark: '#12313D',
    chip: '#E5F4F8',
    bubble: '#9CC4D4', // 雪
    bubbleAccent: '#55C0D4',
    cardFillLight: '#F1FAFC',
    cardFillDark: '#0F222A', // 极夜
    deskCardFill: '#F7FBFC',
    deskCardBorder: '#DCECF1',
  },
  // 飘着的雪花
  bubbles: ['*', '· *', '+', '* ·', '×'],
  sprite: { palette: { k: '#546E87', w: '#F4F9FB', o: '#EE6A1F', i: '#9FD3E3' }, frames: PENGUIN },
  motif: 'sprite',
  icon: 'assets/polar/icon.png',
  sounds: { tick: 'assets/polar/tick.wav', done: 'assets/polar/done.wav', deny: 'assets/polar/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。英文挑一个南半球口音
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
