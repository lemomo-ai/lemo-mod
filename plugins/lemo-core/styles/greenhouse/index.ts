// 小苗（Sprout）：育苗温室的世界，播种、浇水、发芽、换盆、开花、修剪。嫩叶绿只当底色用，陶土红当红笔。
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

// 陶土花盆里的一棵小苗：g 嫩叶，d 茎和叶脉，s 盆土，r 盆沿，p 盆身。
// 三帧：站直 → 被风吹得往右摆 → 往上蹿高一格（再回到站直，像在呼吸着长）
const SEEDLING: string[][] = [
  ['................', '..........ggg...', '.........ggggg..', '..ggg...gdggg...', '.ggggg.ddgg.....', '..gggddd........', '....sssdsss.....', '..rrrrrrrrrrr...', '...ppppppppp....', '....ppppppp.....'],
  ['................', '...........ggg..', '..........ggggg.', '...ggg...gdggg..', '..ggggg.ddgg....', '...gggddd.......', '....sssdsss.....', '..rrrrrrrrrrr...', '...ppppppppp....', '....ppppppp.....'],
  ['..........ggg...', '.........ggggg..', '..ggg...gdggg...', '.ggggg.ddgg.....', '..gggddd........', '.......d........', '....sssdsss.....', '..rrrrrrrrrrr...', '...ppppppppp....', '....ppppppp.....'],
]

export const greenhouse: LemoStyle = {
  id: 'greenhouse',
  name: { zh: '芽芽', en: 'Sprouty' },
  colors: {
    ink: '#4E9A3E', // 茎绿
    grid: '#8FAF96', // 玻璃窗框的灰绿
    pencil: '#8C877C', // 盆土灰
    accent: '#86D96A', // 嫩叶绿，只做底色。比八位机的橄榄屏更亮更绿，比药铺的玉绿更偏黄
    onAccent: '#1A2614', // 深土色
    red: '#CF6A48', // 陶土红
    inkDark: '#2A5524', // 深林绿
    chip: '#EAF4E1', // 浅叶底
    bubble: '#8DBFB0', // 喷雾的水汽
    bubbleAccent: '#6EC454', // 深一点的嫩叶绿
    cardFillLight: '#F5FAEE', // 晨光里的浅绿
    cardFillDark: '#20271D',
    deskCardFill: '#F7FAF3',
    deskCardBorder: '#E1ECD7',
  },
  // ψ 是一棵小苗，❀ 是开的花，· , 是喷雾落下的水珠
  bubbles: ['ψ', '· ,', '❀', ', ·', '·'],
  sprite: { palette: { g: '#86D96A', d: '#4E9A3E', s: '#6B4A35', r: '#E08B5F', p: '#C8643F' }, frames: SEEDLING },
  motif: 'sprite',
  icon: 'assets/greenhouse/icon.png',
  sounds: { tick: 'assets/greenhouse/tick.wav', done: 'assets/greenhouse/done.wav', deny: 'assets/greenhouse/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。英文挑温和的爱尔兰口音
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
