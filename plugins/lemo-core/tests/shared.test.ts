// 公共代码 shared/lemo.tsx 里的纯函数（每个 mod 都带一份副本，在这里测一次）
import { expect, test } from 'claude-code/testing'
import type { ButtonProps, ElementConstructor, RenderElement } from 'claude-code'

import { cardCols, cjkKeep, clip, cmdWord, replyKey, steady, visibleTabs, width, wrapCjk } from '../hooks/shared/lemo'

test('steady：上一次画里有、样子没变的按钮交回同一个元素，按下去跑最新的 onPress；样子变了、隔了一次没画、没写 key、同一次画里 key 重复都新建；终端照原样', () => {
  // 假的 Button：每建一个给一个新 handle（和引擎一样），子节点原样记下
  let made = 0
  const Fake = ((p: ButtonProps & { children?: unknown }) => {
    made += 1
    return { type: 'Button', props: { key: p.key ?? '', label: p.label ?? '' }, kids: p.children, press: { plugin: '', handle: made }, onPress: p.onPress } as unknown as RenderElement
  }) as ElementConstructor<ButtonProps>
  const ran: string[] = []
  const press = (el: RenderElement) => (el as unknown as { onPress: ButtonProps['onPress'] }).onPress({} as never)
  // 面板每画一次，hook 开头调一次 steady
  const draw = () => steady(Fake, 'desktop')
  let B = draw()
  const first = B({ key: 'go', label: '开始', onPress: () => ran.push('第一次画') })
  // 面板拿到焦点再画一次：样子没变，还是同一个元素；按下去跑这一次画给的 onPress
  B = draw()
  const second = B({ key: 'go', label: '开始', onPress: () => ran.push('第二次画') })
  expect(second).toBe(first)
  expect(made).toBe(1)
  press(first)
  expect(ran).toEqual(['第二次画'])
  // 字变了：新建一个
  B = draw()
  const third = B({ key: 'go', label: '停下', onPress: () => ran.push('第三次画') })
  expect(third).not.toBe(first)
  expect(made).toBe(2)
  // 隔了一次没画（切到别的页又切回来、按钮消失过一次）：引擎已经放掉了它的 handle，再出现时新建
  draw()
  B = draw()
  const fourth = B({ key: 'go', label: '停下', onPress: () => ran.push('第四次画') })
  expect(fourth).not.toBe(third)
  expect(made).toBe(3)
  // 同一次画里同一个 key 出现两次：第二个新建，不会把同一个元素放进树里两次，也不会改掉第一个的动作
  B = draw()
  const a = B({ key: 'go', label: '停下', onPress: () => ran.push('甲') })
  const b = B({ key: 'go', label: '停下', onPress: () => ran.push('乙') })
  expect(a).toBe(fourth)
  expect(b).not.toBe(a)
  ran.length = 0
  press(a)
  press(b)
  expect(ran).toEqual(['甲', '乙'])
  // 没写 key（引擎拿 label 当地址）：两个同字的按钮不记，各跑各的，下一次画也新建
  B = draw()
  const x = B({ label: '打开', onPress: () => ran.push('x') })
  const y = B({ label: '打开', onPress: () => ran.push('y') })
  expect(y).not.toBe(x)
  B = draw()
  expect(B({ label: '打开', onPress: () => undefined })).not.toBe(x)
  ran.length = 0
  press(x)
  press(y)
  expect(ran).toEqual(['x', 'y'])
  // label 写成子节点：照原样交给 Button，不记
  B = draw()
  const kid = B({ key: 'kid', onPress: () => undefined, children: ['好'] })
  expect((kid as unknown as { kids: unknown }).kids).toEqual(['好'])
  // 别的界面各记各的；终端不记，直接用原来的 Button
  expect(steady(Fake, 'mobile')({ key: 'go', label: '停下', onPress: () => undefined })).not.toBe(fourth)
  expect(steady(Fake, 'terminal')).toBe(Fake)
})

test('cmdWord：词和数字之间可以不空格', () => {
  expect(cmdWord('提醒30')).toEqual({ word: '提醒', num: 30, rest: '' })
  expect(cmdWord('提醒 30')).toEqual({ word: '提醒', num: 30, rest: '' })
  expect(cmdWord('Focus25')).toEqual({ word: 'focus', num: 25, rest: '' })
  expect(cmdWord('风格 plain')).toMatchObject({ word: '风格', rest: 'plain' })
  expect(cmdWord('番茄').num).toBeNaN()
  expect(cmdWord('').word).toBe('')
})

test('replyKey：按开头 60 个字对号，前后空白不算', () => {
  expect(replyKey('  好的\n')).toBe('好的')
  expect(replyKey('x'.repeat(80))).toBe('x'.repeat(60))
})

test('visibleTabs：有 mod 在这一页、这个界面上有卡片才显示；「安全」「行为」两页总在', () => {
  const mods = [
    { mod: 'a', title: { zh: 'a', en: 'a' }, tabs: ['main' as const] },
    { mod: 'b', title: { zh: 'b', en: 'b' }, tabs: ['game' as const], surfaces: ['terminal'] },
  ]
  // 常用在最前，安全在最后
  expect(visibleTabs(mods, 'terminal')).toEqual(['main', 'behave', 'game', 'safe'])
  expect(visibleTabs(mods, 'desktop')).toEqual(['main', 'behave', 'safe'])
  expect(visibleTabs([...mods, { mod: 'c', title: { zh: 'c', en: 'c' }, tabs: ['bg' as const] }], 'desktop')).toEqual(['main', 'behave', 'bg', 'safe'])
  expect(visibleTabs([], 'terminal')).toEqual(['behave', 'safe'])
})

test('width、clip：中文占两格，超了截断加省略号', () => {
  expect(width('ab中文')).toBe(6)
  expect(clip('一二三四五六', 7)).toBe('一二三…')
})

test('cjkKeep：挨着中文的空格换成不断行空格，英文不动', () => {
  expect(cjkKeep('一轮超过 30 秒，结束时念一句')).toBe('一轮超过 30 秒，结束时念一句')
  expect(cjkKeep('Read 3 files')).toBe('Read 3 files')
})

test('wrapCjk：按宽度断行，英文词和路径不拆，标点不放行首，左括号不留行尾', () => {
  // 不能断成「花 Hai / ku 的用量」「Cla / ude 调用它」
  const lines = wrapCjk('它读项目里的文件（不能跑命令、不能改文件），花 Haiku 的用量。给 Claude 加一个工具 draw_lot：你说「抽支签」', 20)
  for (const l of lines) expect(width(l)).toBeLessThanOrEqual(20)
  expect(lines.join('\n')).toContain('Haiku')
  expect(lines.join('\n')).toContain('Claude')
  expect(lines.join('\n')).toContain('draw_lot')
  for (const l of lines) expect(l).not.toMatch(/^[。，、；：！？）」]/)
  for (const l of lines) expect(l).not.toMatch(/[（「]$/)
  // 拼回去和原文一样（只少了行首行尾的空格）
  expect(lines.join('').replace(/ /g, '')).toBe('它读项目里的文件（不能跑命令、不能改文件），花 Haiku 的用量。给 Claude 加一个工具 draw_lot：你说「抽支签」'.replace(/ /g, ''))
  // 路径不拆；比一行还长的英文只能硬断
  expect(wrapCjk('往 ~/.claude/lemo-mod/journal.md 追加一行', 34).some(l => l.includes('~/.claude/lemo-mod/journal.md'))).toBe(true)
  // 连着两个不能放行首的标点：和前面那个字一起换行
  for (const l of wrapCjk('说「T03」，Claude 才知道', 9)) expect(l).not.toMatch(/^[」，]/)
  expect(wrapCjk('abcdefghijklmnopqrstuvwxyz', 10)).toEqual(['abcdefghij', 'klmnopqrst', 'uvwxyz'])
  expect(wrapCjk('短', 10)).toEqual(['短'])
})

test('cardCols：卡片说明按面板实际能占的宽度断行，很窄的面板也不按更宽的断（不然每行末尾被截掉）', () => {
  expect(cardCols(80)).toBe(73)
  expect(cardCols(20)).toBe(13)
  const desc = '读取 README、docs 和最近改动的文件，写三行周报'
  for (const l of wrapCjk(desc, cardCols(20))) expect(width(l)).toBeLessThanOrEqual(13)
  expect(wrapCjk(desc, cardCols(20)).join('').replace(/\s/g, '')).toBe(desc.replace(/\s/g, ''))
})
