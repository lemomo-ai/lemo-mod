// 掌机（Handheld，名字取自像素小画里的那块掌机屏幕）：老掌机的绿屏和八位像素游戏。每一轮对话是一关，Claude 干活是闯关、读档，小结是这一局的战绩。
// 绿屏的黄绿只当底色用（黄绿字在浅色终端上看不清），编号和进行中用屏幕上的像素绿，机身灰做线条，按键的莓红报错。
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

// 一块掌机屏幕：g 机身灰边框，s 绿屏，m 屏上的中绿（金币、草坡、地面），d 屏上最深的绿（小人），r 电源灯。
// 第一帧小人站在地上、头顶悬着一枚金币；第二帧跳起来把金币吃掉，金币的位置闪一下
const SCREEN: string[][] = [
  ['.gggggggggggggg.', '.gssssmsssssssg.', '.gssssmsssssssg.', '.gssssssssssssg.', '.gssssdsssssssg.', '.gsssdddssssssg.', '.gssssdssssmssg.', '.gsssdsdssmmmsg.', '.gmmmmmmmmmmmmg.', '.grgggggggggggg.'],
  ['.gggggggggggggg.', '.gssmsssmsssssg.', '.gssssdsssssssg.', '.gsssdddssssssg.', '.gssssdsssssssg.', '.gsssdsdssssssg.', '.gsssssssssmssg.', '.gssssssssmmmsg.', '.gmmmmmmmmmmmmg.', '.grgggggggggggg.'],
]

export const eightBit: LemoStyle = {
  id: 'eight-bit',
  name: { zh: '掌机仔', en: 'Pixel Pal' },
  colors: {
    ink: '#5A9630', // 屏上的像素绿，中间调
    grid: '#8E9099', // 机身灰
    pencil: '#8B9182', // 带一点绿的灰
    accent: '#9BBC0F', // 掌机绿屏的黄绿，只做底色
    onAccent: '#0F380F', // 屏上最深的绿
    red: '#E0506A', // 按键莓红
    inkDark: '#0F380F',
    chip: '#EDF2DC', // 很浅的屏幕绿
    bubble: '#A3A7B0', // 浅机身灰
    bubbleAccent: '#8BAC0F', // 压暗一点的绿屏
    cardFillLight: '#F6F9E6',
    cardFillDark: '#1A2A12',
    deskCardFill: '#F8FAF2',
    deskCardBorder: '#E2E8D2',
  },
  // 加命、加分和像素闪光
  bubbles: ['1UP', '+1', '·', '* ·', '+'],
  sprite: { palette: { g: '#9A9DA6', s: '#9BBC0F', m: '#306230', d: '#0F380F', r: '#E0506A' }, frames: SCREEN },
  motif: 'sprite',
  icon: 'assets/eight-bit/icon.png',
  sounds: { tick: 'assets/eight-bit/tick.wav', done: 'assets/eight-bit/done.wav', deny: 'assets/eight-bit/deny.wav' },
  // 中文用中文语音念：系统默认是英文语音，念中文会念成一串听不懂的音。按顺序试，没装的跳过。
  // 英文用 Fred：八十年代电脑里那种合成人声
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: ['Fred'] },
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
