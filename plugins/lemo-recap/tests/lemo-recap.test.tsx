import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import { engineBottom, lemoCalls, testCore, testSay } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

/**
 * 看 mod 调了哪些 $.lemo 方法：只留提示、音效、打开面板（假核心把 style、lang 这些读取也记了），
 * 每次只给上次取回之后新调的
 */
function watch($: Parameters<typeof lemoCalls>[0]): () => Promise<{ op: string; input: unknown }[]> {
  let seen = 0
  return async () => {
    const all = await lemoCalls($)
    const fresh = all.slice(seen)
    seen = all.length
    return fresh.filter(c => c.op === 'notice' || c.op === 'play' || c.op === 'open')
  }
}

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
const capsOf = async ($: Engine) => ((await probeRun($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-recap')

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-recap',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

const USAGE = { input_tokens: 10, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
const THREE = '1. 拆出了 lemo-recap\n2. 卡片能一键复制\n3. 测试都过了'

// 卡片上的小结：key 为 recap-text 的 Box，一行一个 Text（纯文字，不按 Markdown 画），拼回原文。没有时是 undefined
type Line = { props?: Record<string, unknown>; children: unknown[] }
type Finder = { find: (q: { key: string }) => Promise<{ children: unknown[] } | undefined> }
const recapLines = async (ui: Finder) => ((await ui.find({ key: 'recap-text' }))?.children ?? []) as Line[]
const recapOf = async (ui: Finder) => {
  const box = await ui.find({ key: 'recap-text' })
  return box === undefined ? undefined : (box.children as Line[]).map(l => l.children.join('')).join('\n')
}

test('小结卡片：两个界面都画得出，还没写时只有「写小结」', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    // 假核心的 words 是空的，显示的是中性的默认标题
    expect(await ui.find({ type: 'Text', text: /^小结/ })).toBeDefined()
    expect((await ui.find({ key: 'recap-write' }))?.props.label).toBe('写小结')
    expect(await ui.find({ key: 'recap-copy' })).toBeUndefined()
    await ui.unmount()
  }
})

test('写小结：生成中…，写好后显示三行和「复制」（没有「填入输入框」），横条提示并放音效', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const newCalls = watch($)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  let asked = ''
  on('model.fork', async ($$, e) => {
    asked = e.prompt
    await clock.sleep(1000)
    return { value: { isAnswered: true, text: `\n${THREE}\n`, usage: USAGE } }
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    asked = ''
    const ui = await mountChecked($, { ...HUB, surface })
    await ui.press({ key: 'recap-write' })
    await clock.settle()
    expect(asked).toContain('三行')
    expect(await ui.find({ type: 'Text', text: '生成中…' })).toBeDefined()
    await clock.advance(1000)
    expect(await recapOf(ui as never)).toBe(THREE)
    expect(await ui.find({ type: 'Markdown' })).toBeUndefined()
    expect(await ui.find({ key: 'recap-copy' })).toBeDefined()
    expect(await ui.find({ key: 'recap-fill' })).toBeUndefined()
    expect((await ui.find({ key: 'recap-write' }))?.props.label).toBe('重写')
    await ui.unmount()
    expect(await newCalls()).toEqual([
      { op: 'notice', input: { text: '小结已生成', tone: 'ink' } },
      { op: 'play', input: { sound: 'done' } },
    ])
  }
})

test('复制：复制到按按钮的界面；不成时出提示', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const newCalls = watch($)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  on('model.fork', async () => ({ value: { isAnswered: true, text: THREE, usage: USAGE } }))
  let works = true
  const copied: { text: string; surface?: string }[] = []
  on('ui.copy', async ($$, e) => {
    copied.push({ text: e.text, surface: e.surface })
    return { value: works ? { isCopied: true } : { isCopied: false, reason: 'no-clipboard' } }
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    works = true
    copied.length = 0
    const ui = await mountChecked($, { ...HUB, surface })
    await ui.press({ key: 'recap-write' })
    await clock.settle()
    await newCalls()
    await ui.press({ key: 'recap-copy' })
    expect(copied).toEqual([{ text: THREE, surface }])
    expect(await newCalls()).toEqual([{ op: 'notice', input: { text: '已复制到剪贴板', tone: 'ink' } }])

    works = false
    await ui.press({ key: 'recap-copy' })
    expect(await newCalls()).toEqual([{ op: 'notice', input: { text: '复制失败：剪贴板不可用', tone: 'red' } }])
    await ui.unmount()
  }
})

test('生成失败：显示原因（红字）；还没有对话时说先聊一轮', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const newCalls = watch($)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  let failed = true
  on('model.fork', async () => ({
    value: failed
      ? { isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded', usage: USAGE }
      : { isAnswered: false, reason: 'nothing-to-fork' },
  }))
  for (const surface of ['terminal', 'desktop'] as const) {
    failed = true
    const ui = await mountChecked($, { ...HUB, surface })
    await ui.press({ key: 'recap-write' })
    await clock.settle()
    const err = await ui.find({ type: 'Text', text: /生成失败（接口出错\soverloaded 529）/ })
    expect(err).toBeDefined()
    // 测试用的假核心是柠檬实验室的颜色，红笔是 #E0524A
    expect(err?.props.color).toBe('#E0524A')
    expect(await ui.find({ key: 'recap-copy' })).toBeUndefined()
    expect((await ui.find({ key: 'recap-write' }))?.props.label).toBe('写小结')

    failed = false
    await ui.press({ key: 'recap-write' })
    await clock.settle()
    expect(await ui.find({ type: 'Text', text: /暂无可总结的对话/ })).toBeDefined()
    await ui.unmount()
  }
  // 没写成不弹提示、不放音效，原因写在卡片里
  expect(await newCalls()).toEqual([])
})

test('命令词：/lemo-mod 总结 开始写并打开「常用」页，回一句话；recap 回英文；别的词交给里层', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const newCalls = watch($)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const asked: string[] = []
  on('model.fork', async ($$, e) => {
    asked.push(e.prompt)
    return { value: { isAnswered: true, text: THREE, usage: USAGE } }
  })
  const zh = await $.command.run({ command: 'lemo-mod', args: '总结' } as never)
  expect((zh as { text?: string }).text).toBe('正在生成小结，完成后显示在面板中。')
  expect(await newCalls()).toEqual([{ op: 'open', input: { tab: 'main' } }])
  // 命令返回以后接着写
  await clock.settle()
  expect(asked).toHaveLength(1)
  expect(asked[0]).toContain('三行中文')
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await recapOf(ui as never)).toBe(THREE)
  await ui.unmount()

  // 命令里的英文词不换语言；用户发了英文消息以后，回英文，给模型的话也换成英文
  await testSay($, 'say hi in one word')
  const en = await $.command.run({ command: 'lemo-mod', args: 'recap' } as never)
  expect((en as { text?: string }).text).toBe('Generating the recap; it will show in the panel.')
  await clock.settle()
  expect(asked).toHaveLength(2)
  expect(asked[1]).toContain('three short lines of English')
  await newCalls()

  // 不认的词交给里层（假核心切分页、不回文字），也不开始写
  const other = await $.command.run({ command: 'lemo-mod', args: '番茄 25' } as never)
  expect((other as { text?: string }).text).toBeUndefined()
  await clock.settle()
  expect(asked).toHaveLength(2)
  expect(await newCalls()).toEqual([])
})

test('换到别的分页：不画小结卡片', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ key: 'recap-write' })).toBeUndefined()
  await ui.unmount()
})

test('柠檬实验室风格：卡片标题、提示、命令回复换成「实验小结」', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const newCalls = watch($)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  on('model.fork', async () => ({ value: { isAnswered: true, text: THREE, usage: USAGE } }))
  // 假核心的风格没有 words：在 $.lemo.style 上补几条，和风格包 words/lemo-recap.ts 里的一样
  on('lemo.style', async ($$, e, next) => {
    const r = await next(e)
    if (r.value === undefined) return r
    const words = {
      'lemo-recap.title': { zh: '实验小结', en: 'Lab recap' },
      'lemo-recap.done': { zh: '实验小结写好了', en: 'Lab recap is ready' },
      'lemo-recap.start': { zh: '正在写实验小结，写好后显示在面板里。', en: 'Writing the lab recap. It will show up in the panel.' },
    }
    return { value: { ...r.value, words: { ...r.value.words, ...words } } }
  })
  const reply = await $.command.run({ command: 'lemo-mod', args: '总结' } as never)
  expect((reply as { text?: string }).text).toBe('正在写实验小结，写好后显示在面板里。')
  await clock.settle()
  expect(await newCalls()).toEqual([
    { op: 'open', input: { tab: 'main' } },
    { op: 'notice', input: { text: '实验小结写好了', tone: 'ink' } },
    { op: 'play', input: { sound: 'done' } },
  ])
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ type: 'Text', text: /^实验小结/ })).toBeDefined()
    await ui.unmount()
  }
})

test('正在写的时候再按：不重复问模型', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  let forks = 0
  on('model.fork', async () => {
    forks += 1
    await clock.sleep(1000)
    return { value: { isAnswered: true, text: THREE, usage: USAGE } }
  })
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'recap-write' })
  await clock.settle()
  await ui.press({ key: 'recap-write' })
  await $.command.run({ command: 'lemo-mod', args: '总结' } as never)
  await clock.advance(1000)
  expect(forks).toBe(1)
  expect(await recapOf(ui as never)).toBe(THREE)
  // 写好以后可以重写
  await ui.press({ key: 'recap-write' })
  await clock.advance(1000)
  expect(forks).toBe(2)
  await ui.unmount()
})

test('热重载打断了正在写的小结：会话重新开始时状态还停在撰写中，改成「生成失败（已中断）」', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  // 测试里没法真的热重载：替宿主答重载前留下的状态（撰写中），而新加载的模块 running 是 false。
  // lemo-recap 一写这个状态，就交回宿主自己答
  let leftover = true
  const busy = { status: 'busy', text: '', at: null } as const
  on('state.get', { plugin: 'lemo-recap', key: 'recap' }, async ($$, e, next) => (leftover ? { value: { value: busy, version: 1 } } : next(e)))
  on('state.set', { plugin: 'lemo-recap', key: 'recap' }, async ($$, e, next) => {
    leftover = false
    return next(e)
  })
  engineBottom(on)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(leftover).toBe(false)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ type: 'Text', text: '生成中…' })).toBeUndefined()
    const err = await ui.find({ type: 'Text', text: /生成失败（已中断）/ })
    expect(err).toBeDefined()
    expect(err?.props.color).toBe('#E0524A')
    // 可以重新写
    expect((await ui.find({ key: 'recap-write' }))?.props.label).toBe('写小结')
    await ui.unmount()
  }
})

test('正在写的时候会话重新开始（模块没重载，还在写）：不改状态，写好照常显示', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  on('model.fork', async () => {
    await clock.sleep(1000)
    return { value: { isAnswered: true, text: THREE, usage: USAGE } }
  })
  engineBottom(on)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'recap-write' })
  await clock.settle()
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(await ui.find({ type: 'Text', text: '生成中…' })).toBeDefined()
  await clock.advance(1000)
  expect(await recapOf(ui as never)).toBe(THREE)
  await ui.unmount()
})

test('小结画成纯文字（链接不能点）；字色跟面板正文：停靠用主题正文色、内嵌不设色、桌面用卡片字色，浅色深色主题都一样', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  on('model.fork', async () => ({ value: { isAnswered: true, text: '1. 看 [这里](https://x.example)\n2. 第二行\n3. 第三行', usage: USAGE } }))
  // 替 lemo-core 答主题（假核心不写）
  let theme: 'light' | 'dark' = 'light'
  on('state.get', async ($$, e, next) => (e.plugin === 'lemo-core' && e.key === 'theme' ? ({ value: { value: theme, version: 1 } } as never) : next(e)))
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'recap-write' })
  await clock.settle()
  expect(await recapOf(ui as never)).toBe('1. 看 [这里](https://x.example)\n2. 第二行\n3. 第三行')
  expect(await ui.find({ type: 'Markdown' })).toBeUndefined()
  await ui.unmount()
  for (const th of ['light', 'dark'] as const) {
    theme = th
    // mountChecked 每次画完都按停靠、内嵌两种停法查一遍字色（终端底色和主题明暗对不上时也要看得清）
    for (const placement of ['dock', 'inline'] as const) {
      const t = await mountChecked($, { ...HUB, surface: 'terminal', props: { ...HUB.props, placement } } as never)
      const colors = (await recapLines(t as never)).map(l => l.props?.color)
      expect(colors).toEqual(placement === 'dock' ? ['text', 'text', 'text'] : [undefined, undefined, undefined])
      await t.unmount()
    }
    const d = await mountChecked($, { ...HUB, surface: 'desktop' })
    expect((await recapLines(d as never)).map(l => l.props?.color)).toEqual(['#2F4F96', '#2F4F96', '#2F4F96'])
    await d.unmount()
  }
})

test('「全部关闭」：排着还没开始写的小结不写了', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  let forks = 0
  on('model.fork', async () => {
    forks += 1
    return { value: { isAnswered: true, text: THREE, usage: USAGE } }
  })
  on('lemo.open', async () => ({ value: undefined }))
  await $.command.run({ command: 'lemo-mod', args: '总结' } as never)
  await probeRun($, 'off')
  await clock.settle()
  expect(forks).toBe(0)
  // 之后再按照样能写
  await $.command.run({ command: 'lemo-mod', args: '总结' } as never)
  await clock.settle()
  expect(forks).toBe(1)
})

test('安全：刚装上什么都不做——开会话、跑一轮、压缩一次，不调模型、不出声；安全页上列一行「手动触发」', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const models: string[] = []
  on('model.fork', async () => {
    models.push('fork')
    return { value: { isAnswered: true, text: THREE, usage: USAGE } }
  })
  on('model.complete', async () => {
    models.push('complete')
    return { value: { isAnswered: true, text: 'x', usage: USAGE } } as never
  })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
  on('session.compact', async () => ({ messages: [{ role: 'user', text: '摘要', toolUses: [] }] }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  await $.turn.complete({ answer: '好', isAborted: false, durationMs: 10, turnId: 't1', reason: 'answer' })
  await $.session.compact({ trigger: 'auto', messages: [{ role: 'user', text: '你好', toolUses: [] }] })
  await clock.advance(10_000)
  expect(models).toEqual([])
  expect((await lemoCalls($)).filter(c => ['notice', 'play', 'say', 'open'].includes(c.op))).toEqual([])
  // 「额外用量」，但只在你点了以后：manual，没有开关
  const caps = await capsOf($)
  expect(caps.map(c => [c.id, c.kind, c.on, c.manual])).toEqual([['recap', 'cost', false, true]])
  expect(caps[0]?.desc.zh).toContain('主模型')
  expect(await probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-recap', id: 'recap', on: true }))).toBe(false)
  await probeRun($, 'off')
  await clock.advance(10_000)
  expect(models).toEqual([])
  // 用户自己要小结，才调模型
  await $.command.run({ command: 'lemo-mod', args: '总结' } as never)
  await clock.settle()
  expect(models).toEqual(['fork'])
})
