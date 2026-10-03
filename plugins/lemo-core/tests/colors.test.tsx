import { expect, test } from 'claude-code/testing'

import { colorProblems } from './shared/test-colors'

// 颜色检查本身：每个 mod 的测试都用 mountChecked 挂界面，它靠这个函数判断看不看得清
const T = (props: Record<string, unknown>, ...children: unknown[]) => ({ type: 'Text', props, children })
const B = (props: Record<string, unknown>, ...children: unknown[]) => ({ type: 'Box', props, children })

test('颜色检查：面板里不设字色的字、终端底上用主题正文色的字、自己铺底却不写风格色的字，都会报出来', () => {
  // 面板：底是主题画的，字要设颜色
  expect(colorProblems(B({}, T({}, '没设颜色')), 'Pane')).toHaveLength(1)
  expect(colorProblems(B({}, T({ color: 'text' }, '主题正文色')), 'Pane')).toEqual([])
  expect(colorProblems(B({}, T({ dimColor: true }, '暗色')), 'Pane')).toEqual([])
  expect(colorProblems(B({}, T({ color: '#8A9099' }, '风格色')), 'Pane')).toEqual([])
  // 里层 Text 继承外层的颜色
  expect(colorProblems(T({ color: 'text' }, '外层', T({ bold: true }, '里层')), 'Pane')).toEqual([])
  // 终端底色上：不能用主题正文色，不设颜色（终端自己的字色）可以
  expect(colorProblems(B({}, T({ color: 'text' }, '黑字')), 'UserMessage')).toHaveLength(1)
  expect(colorProblems(B({}, T({}, '终端字色')), 'UserMessage')).toEqual([])
  expect(colorProblems(B({}, T({ color: '#6F8FE0' }, '风格色')), 'AbovePrompt')).toEqual([])
  // 自己铺了底色：字色要写风格色
  expect(colorProblems(B({ backgroundColor: '#E9EFFA' }, T({}, '没设')), 'UserMessage')).toHaveLength(1)
  expect(colorProblems(T({ backgroundColor: '#F2CF1D', color: 'text' }, '主题色'), 'Pane')).toHaveLength(1)
  expect(colorProblems(T({ backgroundColor: '#F2CF1D', color: '#1B1D1F' }, '标签'), 'UserMessage')).toEqual([])
  // 面板内嵌在输入框上方（窄窗口）：没有主题的底，和终端底色一样查
  expect(colorProblems(B({}, T({ color: 'text', bold: true }, '卡片标题')), 'Pane', 'inline')).toHaveLength(1)
  expect(colorProblems(B({}, T({ bold: true }, '卡片标题')), 'Pane', 'inline')).toEqual([])
  expect(colorProblems(B({}, T({ dimColor: true }, '说明')), 'Pane', 'inline')).toEqual([])
  // 按钮、Markdown、输入框由引擎画，不查
  expect(colorProblems(B({}, { type: 'Button', props: { label: 'x' }, children: [] }, { type: 'Markdown', props: {}, children: ['md'] }), 'Pane')).toEqual([])
})
