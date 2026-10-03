// 杨枝甘露（Mango Sago）：港式糖水铺，杨枝甘露、芋圆、双皮奶、红豆沙，一碗一勺。草莓芋泥粉只当底色用，芒果黄做点缀。
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

// 一碗杨枝甘露，瓷勺在碗里搅：p 粉色的碗，q 碗底和碗脚，m 芒果，w 西米，s 瓷勺（三帧勺子挪来挪去，西米跟着转）
const BOWL_BODY = ['.pppppppppppppp.', '..pppppppppppp..', '...qqqqqqqqqq...', '.....qqqqqq.....']
const BOWL: string[][] = [
  ['..............s.', '.............s..', '............s...', '...pppppppsppp..', '.pmmwmmmmmssmmp.', '.pmmmmmwmmmmwmp.', ...BOWL_BODY],
  ['...........s....', '..........s.....', '.........s......', '...pppppsppppp..', '.pmmmwmmssmmwmp.', '.pmmwmmmmmwmmmp.', ...BOWL_BODY],
  ['................', '..............s.', '.............s..', '...pppppppppsp..', '.pmwmmmmwmmssmp.', '.pmmmmwmmmmmmwp.', ...BOWL_BODY],
]

export const dessert: LemoStyle = {
  id: 'dessert',
  name: { zh: '芒芒', en: 'Mango Pop' },
  colors: {
    ink: '#CF5D8D', // 玫瑰糖浆
    grid: '#B39BD3', // 芋泥紫
    pencil: '#9A8A93', // 瓷碗边的灰
    accent: '#F08CB0', // 草莓芋泥粉，只做底色
    onAccent: '#3B1426',
    red: '#E2513C', // 辣椒红，和粉色拉开
    inkDark: '#6E2440', // 红豆沙
    chip: '#FBE7EF', // 淡粉
    bubble: '#EBA43A', // 芒果
    bubbleAccent: '#E9709C',
    cardFillLight: '#FFF3F7', // 草莓牛奶
    cardFillDark: '#2E2329',
    deskCardFill: '#FFFAFC',
    deskCardBorder: '#F6DDE7',
  },
  bubbles: ['✧', '∘ ∘', '·', '✦ ·', '∘'],
  sprite: { palette: { p: '#F08CB0', q: '#CF5D8D', m: '#F5B53F', w: '#FFFFFF', s: '#9FB3C9' }, frames: BOWL },
  motif: 'sprite',
  icon: 'assets/dessert/icon.png',
  sounds: { tick: 'assets/dessert/tick.wav', done: 'assets/dessert/done.wav', deny: 'assets/dessert/deny.wav' },
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
