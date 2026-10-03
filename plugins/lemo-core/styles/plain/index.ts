// 素色：测试用风格，只用中性的灰和蓝，没有点缀、没有像素画、没有带风格味道的文字。
// 用来确认整套 lemo mod 换一包风格数据就能一起换，没有哪里把柠檬实验室写死。
import type { LemoStyle } from '../../types'

export const plain: LemoStyle = {
  id: 'plain',
  name: { zh: '素色', en: 'Plain' },
  colors: {
    ink: '#5B6B7F',
    grid: '#9AA5B1',
    pencil: '#8A9099',
    accent: '#D9DEE5',
    onAccent: '#1B1D1F',
    red: '#D64545',
    inkDark: '#33404F',
    chip: '#EEF1F4',
    bubble: '#B8C1CC',
    bubbleAccent: '#5B6B7F',
    cardFillLight: '#FFFFFF',
    cardFillDark: '#24272B',
    deskCardFill: '#FAFBFC',
    deskCardBorder: '#E3E7EC',
  },
  bubbles: [],
  sprite: null,
  motif: 'none',
  icon: null,
  // 素色暂时沿用柠檬实验室的音效文件
  sounds: { tick: 'assets/lemon-lab/tick.wav', done: 'assets/lemon-lab/done.wav', deny: 'assets/lemon-lab/deny.wav' },
  voices: { zh: ['Tingting', 'Flo (Chinese (China mainland))', 'Meijia'], en: [] },
  words: {},
}
