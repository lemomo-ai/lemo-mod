import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'
import type { SessionMessage } from 'claude-code'

import { engineBottom, lemoCalls, testCore } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

// 只看提示和音效（假核心把 style、lang 这些读取也记下来了）
const playsAndNotices = async ($: Parameters<typeof lemoCalls>[0]) =>
  (await lemoCalls($)).filter(c => c.op === 'play' || c.op === 'notice')

// 测试里的 $ 只有引擎自己的方法，没有插件加的 $.lemo。用一个探针插件替测试调能力清单、开关、「全部关闭」：
// /probe caps、/probe toggle <JSON>、/probe off，回复是结果的 JSON
const probe: Plugin = {
  name: 'probe',
  register(on) {
    on('command.run', { command: 'probe' }, async ($, e) => {
      const i = e.args.indexOf(' ')
      const op = i < 0 ? e.args : e.args.slice(0, i)
      const arg = i < 0 ? {} : JSON.parse(e.args.slice(i + 1))
      let r: unknown = null
      if (op === 'caps') r = await $.lemo.caps({})
      else if (op === 'toggle') r = await $.lemo.toggle(arg)
      else if (op === 'off') r = await $.lemo.off({})
      return { text: JSON.stringify(r ?? null) }
    })
  },
}

type Cap = { mod: string; id: string; kind: string; on: boolean; manual?: boolean; desc: { zh: string; en: string } }
const probeRun = async ($: Engine, args: string) => JSON.parse(((await $.command.run({ command: 'probe', args } as never)) as { text: string }).text) as unknown
const capsOf = async ($: Engine) => ((await probeRun($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-todo')

const SCROLL = { offset: 0, bodyRows: 12 }
// 假核心不画面板：替它（和引擎）答一个空的里层，面板里就只有 lemo-todo 的卡片
const PANE_BOTTOM = { component: 'Pane' } as const
const HUB = {
  plugin: 'lemo-todo',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

test('笔记：在面板里回车保存，马上显示出来（终端和桌面都有输入框）', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', PANE_BOTTOM, async () => ({ type: 'engine', ref: 0 }) as const)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    // 假核心的 words 是空的，显示的是中性的默认标题
    expect(await ui.find({ type: 'Text', text: /^笔记/ })).toBeDefined()
    const input = await ui.find({ type: 'Input' })
    expect(input).toBeDefined()
    await ui.input({ key: input?.key ?? '', text: `烧杯 3 号要换（${surface}）` })
    expect(await ui.find({ type: 'Text', text: `烧杯 3 号要换（${surface}）` })).toBeDefined()
    await ui.unmount()
  }
  // 两个界面各存一条，面板说明里的条数跟着变；每存一条响一声
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /共\s2\s条/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /烧杯\s3\s号要换（terminal）/ })).toBeDefined()
  await ui.unmount()
  expect(await playsAndNotices($)).toEqual([
    { op: 'play', input: { sound: 'tick', gain: 0.7 } },
    { op: 'play', input: { sound: 'tick', gain: 0.7 } },
  ])
})

test('笔记：手机上没有输入框，只列笔记；只显示最近 5 条', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { notes: [1, 2, 3, 4, 5, 6].map(i => ({ at: i * 60_000, text: `第 ${i} 条` })) })
  on('ui.render', PANE_BOTTOM, async () => ({ type: 'engine', ref: 0 }) as const)
  // 会话开始时从存储读回来（换个会话还在）。替引擎答 session.start
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  const ui = await mountChecked($, { ...HUB, surface: 'mobile' })
  expect(await ui.find({ type: 'Input' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /共\s6\s条/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '第 6 条' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '第 2 条' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '第 1 条' })).toBeUndefined()
  await ui.unmount()
})

test('笔记：存之前先读存储里最新的，不盖掉别的会话刚加的', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 这个会话开始以后，别的会话往共用的存储里加了一条（这个会话的状态里还没有）
  mock.store(on, { notes: [{ at: 60_000, text: '别的会话记的' }] })
  on('ui.render', PANE_BOTTOM, async () => ({ type: 'engine', ref: 0 }) as const)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /共\s0\s条/ })).toBeDefined()
  await ui.input({ key: 'todo-note', text: '这个会话记的' })
  expect(await ui.find({ type: 'Text', text: /共\s2\s条/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '别的会话记的' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '这个会话记的' })).toBeDefined()
  await ui.unmount()
})

test('打开面板时先从存储重读笔记：别的会话后加的也看得到；不认的词、别的分页不重读，照旧交给里层', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 所有会话共用的存储：测试自己接 store.get / store.set，好在中途替「别的会话」往里加笔记
  let stored: unknown = [{ at: 60_000, text: '一开始就有的' }]
  on('store.get', async ($$, e) => ({ value: e.key === 'notes' ? stored : undefined }))
  on('store.set', async ($$, e) => {
    if (e.key === 'notes') stored = e.value
    return { value: undefined }
  })
  on('ui.render', PANE_BOTTOM, async () => ({ type: 'engine', ref: 0 }) as const)
  engineBottom(on)
  const count = async () => {
    const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
    const t = (await ui.find({ type: 'Text', text: /共\s\d+\s条/ }))?.text
    const other = await ui.find({ type: 'Text', text: '别的会话记的' })
    await ui.unmount()
    return { t, other: other !== undefined }
  }
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(await count()).toEqual({ t: expect.stringMatching(/共\s1\s条/), other: false })

  // 别的会话加了一条：只写进了存储，这个会话的状态里还没有
  stored = [{ at: 60_000, text: '一开始就有的' }, { at: 120_000, text: '别的会话记的' }]
  // 不认的词、别的分页：不重读
  await $.command.run({ command: 'lemo-mod', args: '番茄 25' } as never)
  expect(await count()).toEqual({ t: expect.stringMatching(/共\s1\s条/), other: false })
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  // 「后台」交给了里层（假核心切到后台页），卡片不画
  const bg = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await bg.find({ type: 'Input' })).toBeUndefined()
  await bg.unmount()

  // 「常用」：重读，再交给里层切回常用页，卡片上就有别的会话那条
  await $.command.run({ command: 'lemo-mod', args: '常用' } as never)
  expect(await count()).toEqual({ t: expect.stringMatching(/共\s2\s条/), other: true })

  // 只打 /lemo-mod（不带词）也重读
  stored = [...(stored as unknown[]), { at: 180_000, text: '又一条' }]
  await $.command.run({ command: 'lemo-mod', args: '' } as never)
  expect(await count()).toEqual({ t: expect.stringMatching(/共\s3\s条/), other: true })
})

test('压缩上下文后：小模型把摘要缩成一句，存成一条笔记，横条出提示', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('ui.render', PANE_BOTTOM, async () => ({ type: 'engine', ref: 0 }) as const)
  const asked: string[] = []
  on('model.complete', async ($$, e) => {
    asked.push(e.prompt)
    // $ 上的调用（op 事件）由 hook 用 { value } 代答
    return { value: { isAnswered: true, text: '把笔记拆成了单独的 mod', usage: { input_tokens: 10, output_tokens: 10 } } } as never
  })
  // 替引擎压缩：压缩后的对话是一条摘要
  const summary = 'This session is being continued from a previous conversation.\n\n用户在把一个大插件拆成小 mod，这一段做完了笔记。'
  const after: SessionMessage[] = [{ role: 'user', text: summary, toolUses: [] }]
  on('session.compact', async () => ({ messages: after }))
  // 压缩前的对话（引擎要求至少一条）
  const before: SessionMessage[] = [{ role: 'user', text: '把笔记拆出来', toolUses: [] }]

  // 自动摘要装上时关着：在笔记卡片上打开
  const card = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect((await card.find({ key: 'todo-compact' }))?.props.label).toBe('自动摘要：关')
  await card.press({ key: 'todo-compact' })
  expect((await card.find({ key: 'todo-compact' }))?.props.label).toBe('自动摘要：开')
  await card.unmount()

  // 预先算的、子 agent 的压缩都不记
  await $.session.compact({ trigger: 'precompute', messages: before })
  await $.session.compact({ trigger: 'auto', agentId: 'a1', messages: before })
  await clock.settle()
  expect(asked).toEqual([])

  await $.session.compact({ trigger: 'manual', messages: before })
  await clock.settle()
  expect(asked.length).toBe(1)
  expect(asked[0]).toContain('这一段做完了笔记')
  expect(await playsAndNotices($)).toEqual([
    { op: 'play', input: { sound: 'tick', gain: 0.7 } },
    { op: 'notice', input: { text: '上下文已压缩，摘要已存入笔记', tone: 'ink' } },
  ])

  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: '摘要：把笔记拆成了单独的 mod' })).toBeDefined()
  await ui.unmount()
})

test('安全：刚装上压缩上下文不调模型、不记笔记；在安全页打开「压缩后自动摘要」以后才调', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('ui.render', PANE_BOTTOM, async () => ({ type: 'engine', ref: 0 }) as const)
  const asked: string[] = []
  on('model.complete', async ($$, e) => {
    asked.push(e.prompt)
    return { value: { isAnswered: true, text: '一句摘要', usage: { input_tokens: 1, output_tokens: 1 } } } as never
  })
  const after: SessionMessage[] = [{ role: 'user', text: 'This session is being continued.\n\n摘要正文', toolUses: [] }]
  on('session.compact', async () => ({ messages: after }))
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  const before: SessionMessage[] = [{ role: 'user', text: '你好', toolUses: [] }]

  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  await $.session.compact({ trigger: 'auto', messages: before })
  await clock.advance(1000)
  expect(asked).toEqual([])
  expect(await playsAndNotices($)).toEqual([])
  // 报到时不再写「装上就生效」的事；安全页上一行，关着
  const joined = (await lemoCalls($)).filter(c => c.op === 'join').map(c => (c.input as { always?: unknown }).always)
  expect(joined).toEqual([undefined])
  expect((await capsOf($)).map(c => [c.id, c.kind, c.on, c.manual ?? false])).toEqual([['compact', 'cost', false, false]])
  expect((await capsOf($))[0]?.desc.zh).toContain('Haiku')
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /共\s0\s条/ })).toBeDefined()
  await ui.unmount()

  // 安全页上打开：下一次压缩才调模型、记一条；卡片上的按钮跟着变
  expect(await probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-todo', id: 'compact', on: true }))).toBe(true)
  const on1 = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect((await on1.find({ key: 'todo-compact' }))?.props.label).toBe('自动摘要：开')
  await on1.unmount()
  await $.session.compact({ trigger: 'auto', messages: before })
  await clock.settle()
  expect(asked.length).toBe(1)

  // 「全部关闭」：再压缩不调
  await probeRun($, 'off')
  expect((await capsOf($))[0]?.on).toBe(false)
  await $.session.compact({ trigger: 'auto', messages: before })
  await clock.settle()
  expect(asked.length).toBe(1)
  // 认不出的 id 不认
  expect(await probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-todo', id: 'notes', on: true }))).toBe(false)
})

test('压缩后自动摘要：排着队或等模型的时候关掉了（别的会话、「全部关闭」），不调模型、不记笔记；安全页照 $.store 报', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  const kv = new Map<string, unknown>([['compact', true]])
  let failSet = false
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    if (failSet) throw new Error('disk full')
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  const asked: string[] = []
  on('model.complete', async ($$, e) => {
    asked.push(e.prompt)
    // 等模型回来的时候，别的会话把开关关了
    kv.set('compact', false)
    return { value: { isAnswered: true, text: '一句摘要', usage: { input_tokens: 1, output_tokens: 1 } } } as never
  })
  const after: SessionMessage[] = [{ role: 'user', text: 'This session is being continued.\n\n摘要正文', toolUses: [] }]
  on('session.compact', async () => ({ messages: after }))
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  const before: SessionMessage[] = [{ role: 'user', text: '你好', toolUses: [] }]
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect((await capsOf($))[0]?.on).toBe(true)

  // 模型回来以后再看一次开关：关了就不记笔记
  await $.session.compact({ trigger: 'auto', messages: before })
  await clock.settle()
  expect(asked.length).toBe(1)
  expect(kv.get('notes')).toBeUndefined()
  expect(await playsAndNotices($)).toEqual([])
  expect((await capsOf($))[0]?.on).toBe(false)

  // 排进定时器、还没开始时关掉：不调模型
  kv.set('compact', true)
  await $.session.compact({ trigger: 'auto', messages: before })
  kv.set('compact', false)
  await clock.settle()
  expect(asked.length).toBe(1)

  // 「全部关闭」时存档写不进：照样往下传，横条说一声
  failSet = true
  const before2 = (await lemoCalls($)).filter(c => c.op === 'off').length
  await probeRun($, 'off')
  const calls = await lemoCalls($)
  expect(calls.filter(c => c.op === 'off').length).toBe(before2 + 1)
  expect(calls.filter(c => c.op === 'notice').map(c => (c.input as { text: string }).text)).toContain('自动摘要没关上 · 请在「安全」页再关一次')
})
