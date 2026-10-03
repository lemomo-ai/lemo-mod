// 灯塔（Lighthouse）：海边灯塔的守灯人、航向、雾笛、浮标和靠岸。海水蓝绿只当底色用，上面写海军蓝的深色字
// （按对比度选的：桌面横条的大数字也用 onAccent，白字在浅色卡片上看不见）。像素小画是红白条纹的灯塔，灯在转。
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

// 红白条纹的灯塔：k 灯室顶和回廊，l 灯，d 背过去的灯（暗），b 光束，r 红条，w 白条（e 是白条两边的阴影，浅色底上也看得出轮廓），
// g 礁石底座，s 海水，f 浪花。四帧：光束扫向左 → 正对着你闪一下 → 扫向右 → 转到背面变暗；浪花一格一格移动
const LIGHTHOUSE: string[][] = [
  ['bb.....kk.......', 'bbbbbbkllk......', 'bb...kkkkkk.....', '......rrrr......', '......ewwe......', '......rrrr......', '.....ewwwwe.....', '.....rrrrrr.....', '...gggggggggg...', 'ssfsssssfsssssfs'],
  ['......bkkb......', '.....bkllkb.....', '.....kkkkkk.....', '......rrrr......', '......ewwe......', '......rrrr......', '.....ewwwwe.....', '.....rrrrrr.....', '...gggggggggg...', 'sssfsssssfsssssf'],
  ['.......kk.....bb', '......kllkbbbbbb', '.....kkkkkk...bb', '......rrrr......', '......ewwe......', '......rrrr......', '.....ewwwwe.....', '.....rrrrrr.....', '...gggggggggg...', 'fsssfsssssfsssss'],
  ['.......kk.......', '......kddk......', '.....kkkkkk.....', '......rrrr......', '......ewwe......', '......rrrr......', '.....ewwwwe.....', '.....rrrrrr.....', '...gggggggggg...', 'sfsssfsssssfssss'],
]

export const lighthouse: LemoStyle = {
  id: 'lighthouse',
  name: { zh: '闪闪', en: 'Blinky' },
  colors: {
    ink: '#3F86B8', // 深海蓝
    grid: '#6FA5A8', // 海图上的等深线
    pencil: '#8A97A0', // 雾灰
    accent: '#1FA0A3', // 海水蓝绿，只做底色
    onAccent: '#10233F', // 蓝绿底上的海军蓝字（也是桌面横条的大数字）
    red: '#E04F45', // 灯塔红
    inkDark: '#173A5E', // 海军蓝
    chip: '#E6F0F5', // 浅海雾
    bubble: '#8FC3C9', // 浪花
    bubbleAccent: '#1A9296', // 深一点的海水蓝绿
    cardFillLight: '#F3FAF9', // 极浅的海水
    cardFillDark: '#1A2A33', // 夜里的海
    deskCardFill: '#F6F9FB',
    deskCardBorder: '#DFE8EE',
  },
  // 灯光和海浪
  bubbles: ['✦', '~ ≈', '·', '≈ ~', '✧'],
  sprite: {
    palette: { r: '#D9473F', w: '#F2F1EC', e: '#B9B6AD', k: '#557A9E', l: '#FFC93C', d: '#B08A3A', b: '#FFE58A', s: '#1FA0A3', f: '#A6DCD9', g: '#6B7680' },
    frames: LIGHTHOUSE,
  },
  motif: 'sprite',
  icon: 'assets/lighthouse/icon.png',
  sounds: { tick: 'assets/lighthouse/tick.wav', done: 'assets/lighthouse/done.wav', deny: 'assets/lighthouse/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。
  // 英文挑爱尔兰口音，像海边的老守灯人
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
