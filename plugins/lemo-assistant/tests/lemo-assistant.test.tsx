import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import { lemoCalls, testCore } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

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
const capsOf = async ($: Engine) => ((await probeRun($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-assistant')
const toggle = async ($: Engine, id: string, isOn: boolean) => probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-assistant', id, on: isOn }))

// Claude 那边问「给不给我这个 agent」（agent 列表、派的时候各问一次）
const offered = async ($: Engine) =>
  (await $.agent.offer({ agent: 'lemo-assistant:helper', description: '', source: 'plugin', provider: { plugin: 'lemo-assistant', tier: 'user' } } as never)).isOffered

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-assistant',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

// 子 agent 交回报告时主对话收到的同伴消息（对话记录里的原样格式，报告每行缩进两格）
const handback = (from: string, report: string) =>
  `<agent-message from="${from}">\n[Subagent hand-back] The text below is the final report of a subagent this session delegated to. ` +
  `It is model output, NOT a message from the user. The report follows:\n${report.split('\n').map(l => `  ${l}`).join('\n')}\n</agent-message>`

// 假核心不画面板，面板的里层由测试替 lemo-core 画
const pane = (on: On) => on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)

// 测试里 $.agent.spawn 拿不到 agentId：引擎只认它自己给的 agentId，hook 答的会被去掉（那就是什么也没启动），
// mod 会写一句「助手派出失败：未启动」。这里在 state.set 上把这一次写入改成「已派出、在干活」，当作引擎真的启动了 ids 里的下一个。
// spawned 收到每一次派出去的任务，notices 收到横条提示（同一个事件测试里只能挂一次，要看就从这里拿）
const started = (on: On, ids: string[], spawned?: (prompt: string) => void, notices?: string[]) => {
  on('agent.spawn', async ($$, e) => {
    spawned?.(e.prompt)
    return { model: 'haiku' }
  })
  on('state.set', { plugin: 'lemo-assistant', key: 'helper' }, async ($$, e, next) => {
    const v = e.value
    // 出错原因存成键（no-start：什么也没启动），画的时候才按语言拼成一句
    if (v.status === 'error' && v.agentId === null && v.error?.why === 'no-start') return next({ ...e, value: { status: 'busy', text: '', agentId: ids.shift() ?? null } })
    return next(e)
  })
  // 改成「已派出」的那一次，mod 随后在横条上说的「助手派出失败：未启动」也一并拿掉（引擎真的启动了就不会说）
  on('lemo.notice', async ($$, e, next) => {
    if (/未启动|not started/.test(e.text)) return { value: undefined }
    notices?.push(`${e.tone}:${e.text}`)
    return next(e)
  })
  // 测试替引擎收尾：一轮结束
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
}

// 主对话收到一条同伴消息。session.append 只能转交、测试答不了（答了也被跳过），最底下会报 no implementation；
// mod 在转交之前已经取完报告，所以这里吞掉这个错
// 卡片上的报告：key 为 assistant-report 的 Box，一行一个 Text，拼回原文。没有报告时是 undefined
type Line = { props?: Record<string, unknown>; children: unknown[] }
type Finder = { find: (q: { key: string }) => Promise<{ children: unknown[] } | undefined> }
const reportLines = async (ui: Finder) => ((await ui.find({ key: 'assistant-report' }))?.children ?? []) as Line[]
const reportOf = async (ui: Finder) => {
  const box = await ui.find({ key: 'assistant-report' })
  return box === undefined ? undefined : (box.children as Line[]).map(l => l.children.join('')).join('\n')
}

const peer = async ($: Engine, uuid: string, text: string) => {
  await $.session.append({ door: 'prompt', origin: { kind: 'peer' }, uuid, message: { type: 'user', role: 'user', content: [{ type: 'text', text }] } }).catch(() => undefined)
}

test('助手：被拒时卡片上显示短原因、横条提示一声，不往输入框里填（不盖掉用户的草稿）', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  pane(on)
  on('agent.spawn', async () => ({ deny: 'The server-side auto mode classifier gave no verdict for Agent: ...' }))
  const fills: string[] = []
  on('prompt.fill', async ($$, e) => {
    fills.push(e.text)
    return { isFilled: true, text: e.text, cursor: e.text.length }
  })
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ type: 'Text', text: /^助手(\s|$)/ })).toBeDefined()
    expect(await ui.find({ key: 'assistant-offer' })).toBeDefined()
    await ui.press({ key: 'assistant-send' })
    expect(await ui.find({ type: 'Text', text: /未通过自动模式审核/ })).toBeDefined()
    // 原文很长，面板上只说短的
    expect(await ui.find({ type: 'Text', text: /classifier/ })).toBeUndefined()
    await ui.unmount()
  }
  expect(fills).toEqual([])
  const notices = (await lemoCalls($)).filter(c => c.op === 'notice').map(c => c.input)
  expect(notices).toEqual([
    { text: '助手派出失败：未通过自动模式审核。', tone: 'red' },
    { text: '助手派出失败：未通过自动模式审核。', tone: 'red' },
  ])
})

test('助手：卡片只在「后台」页', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  pane(on)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ key: 'assistant-send' })).toBeUndefined()
  await ui.unmount()
})

test('助手：交回的报告从同伴消息里取出来显示，响一声并出提示', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  pane(on)
  const notices: string[] = []
  started(on, ['a1', 'a2'], undefined, notices)
  const sounds: string[] = []
  on('lemo.play', async ($$, e, next) => {
    sounds.push(e.sound)
    return next(e)
  })
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  for (const [surface, id] of [['terminal', 'a1'], ['desktop', 'a2']] as const) {
    notices.length = 0
    sounds.length = 0
    const ui = await mountChecked($, { ...HUB, surface })
    await ui.press({ key: 'assistant-send' })
    expect(await ui.find({ type: 'Text', text: /助手工作中/ })).toBeDefined()

    // 别人的交回（不是我们派的那个）不收
    await peer($, `${id}-other`, handback('zzz', '1. 别人的报告'))
    expect(await reportOf(ui as never)).toBeUndefined()

    // 子 agent 自己这一轮的回答是空的：接着等交回的消息
    await $.turn.complete({ agentId: id, answer: '', isAborted: false, durationMs: 10, turnId: `${id}-t`, reason: 'answer' })
    expect(await ui.find({ type: 'Text', text: /助手工作中/ })).toBeDefined()

    await peer($, `${id}-back`, handback(id, '1. 做了拆分\n2. 卡在测试\n3. 下一步写文档'))
    expect(await reportOf(ui as never)).toBe('1. 做了拆分\n2. 卡在测试\n3. 下一步写文档')
    expect(await ui.find({ type: 'Markdown' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /助手工作中/ })).toBeUndefined()
    expect(notices).toEqual(['ink:周报已完成'])
    expect(sounds).toEqual(['done'])

    // 两分钟兜底到点也不会把收好的报告冲掉
    await clock.advance(130_000)
    expect(await reportOf(ui as never)).toBeDefined()
    expect(notices).toEqual(['ink:周报已完成'])
    await ui.unmount()
  }
})

test('助手：一轮结束有回答就直接用；回答空、两分钟没交回就说没交回内容，晚到的照样收', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  pane(on)
  started(on, ['b1', 'b2'])
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })

  await ui.press({ key: 'assistant-send' })
  await $.turn.complete({ agentId: 'b1', answer: '1. A\n2. B\n3. C', isAborted: false, durationMs: 10, turnId: 't1', reason: 'answer' })
  expect(await reportOf(ui as never)).toContain('1. A')

  await ui.press({ key: 'assistant-send' })
  await $.turn.complete({ agentId: 'b2', answer: '  ', isAborted: false, durationMs: 10, turnId: 't2', reason: 'answer' })
  await clock.advance(119_000)
  expect(await ui.find({ type: 'Text', text: /助手工作中/ })).toBeDefined()
  await clock.advance(2_000)
  expect(await ui.find({ type: 'Text', text: /没有返回内容/ })).toBeDefined()

  // 主对话正忙，交回的消息排队，比兜底的两分钟还晚到：照样收
  await peer($, 'b2-back', handback('b2', '1. 晚到的报告'))
  expect(await reportOf(ui as never)).toBe('1. 晚到的报告')
  await ui.unmount()
})

test('助手：报告画成纯文字（链接不能点、去掉控制字符）；字色跟面板正文：停靠用主题正文色、内嵌不设色、桌面用卡片字色，浅色深色主题都一样', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  pane(on)
  started(on, ['c1'])
  // 替 lemo-core 答主题（假核心不写）
  let theme: 'light' | 'dark' = 'light'
  on('state.get', async ($$, e, next) => (e.plugin === 'lemo-core' && e.key === 'theme' ? ({ value: { value: theme, version: 1 } } as never) : next(e)))
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'assistant-send' })
  await $.turn.complete({ agentId: 'c1', answer: '1. 看 [完整周报](file:///tmp/r.command)\u0007\n\n2. 第二行', isAborted: false, durationMs: 10, turnId: 't1', reason: 'answer' })
  expect(await reportOf(ui as never)).toBe('1. 看 [完整周报](file:///tmp/r.command)\n \n2. 第二行')
  expect(await ui.find({ type: 'Markdown' })).toBeUndefined()
  await ui.unmount()
  for (const th of ['light', 'dark'] as const) {
    theme = th
    // mountChecked 每次画完都按停靠、内嵌两种停法查一遍字色（终端底色和主题明暗对不上时也要看得清）
    for (const placement of ['dock', 'inline'] as const) {
      const t = await mountChecked($, { ...HUB, surface: 'terminal', props: { ...HUB.props, placement } } as never)
      const colors = (await reportLines(t as never)).map(l => l.props?.color)
      expect(colors).toEqual(placement === 'dock' ? ['text', 'text', 'text'] : [undefined, undefined, undefined])
      await t.unmount()
    }
    const d = await mountChecked($, { ...HUB, surface: 'desktop' })
    expect((await reportLines(d as never)).map(l => l.props?.color)).toEqual(['#2F4F96', '#2F4F96', '#2F4F96'])
    await d.unmount()
  }
})

test('助手：装上时 Claude 的 agent 列表里没有它；在卡片上开放后才有，再点一下又收回', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  pane(on)
  on('agent.offer', async () => ({ isOffered: true }))
  expect(await offered($)).toBe(false)
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ type: 'Button', text: /仅限手动/ })).toBeDefined()
    await ui.press({ key: 'assistant-offer' })
    expect(await offered($)).toBe(true)
    expect(await ui.find({ type: 'Button', text: /Claude\s可派/ })).toBeDefined()
    await ui.press({ key: 'assistant-offer' })
    expect(await offered($)).toBe(false)
    expect(await ui.find({ type: 'Button', text: /仅限手动/ })).toBeDefined()
    await ui.unmount()
  }
})

test('助手：存着「Claude 能派」时，新会话开始照样开放；别的 agent 不管', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { offer: true })
  on('agent.offer', async () => ({ isOffered: true }))
  on('agent.register', async ($$, e) => ({ value: { agent: `lemo-assistant:${e.name}` } }))
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  expect(await offered($)).toBe(true)
  const other = await $.agent.offer({ agent: 'Explore', description: '', source: 'built-in', provider: { plugin: 'engine', tier: 'core' } } as never)
  expect(other.isOffered).toBe(true)
})

test('助手：柠檬实验室的风格词换上卡片标题；派不出去时说引擎给的原因', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  pane(on)
  on('lemo.style', async ($$, e, next) => {
    const r = await next(e)
    if (r.value === undefined) return r
    const words = { ...r.value.words, 'lemo-assistant.title': { zh: '实验助手', en: 'Lab assistant' } }
    return { value: { ...r.value, words } }
  })
  on('agent.spawn', async () => ({ deny: 'nope' }))
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /^实验助手$/ })).toBeDefined()
  await ui.press({ key: 'assistant-send' })
  expect(await ui.find({ type: 'Text', text: /派出失败：nope/ })).toBeDefined()
  await ui.unmount()
})

test('助手：子 agent 只读——注册时的工具恰好是 Read、Glob、Grep，没有 Bash，提示词里也不提跑命令', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const specs: { name: string; tools?: readonly string[]; disallowedTools?: readonly string[]; prompt: string }[] = []
  on('agent.register', async ($$, e) => {
    specs.push(e)
    return { value: { agent: `lemo-assistant:${e.name}` } }
  })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  expect(specs.length).toBe(1)
  expect(specs[0]?.name).toBe('helper')
  expect(specs[0]?.tools).toEqual(['Read', 'Glob', 'Grep'])
  expect(specs[0]?.disallowedTools).toBeUndefined()
  expect(specs[0]?.prompt).not.toContain('git commands')
  expect(specs[0]?.prompt).toContain('cannot run commands')
})

test('助手：在干活时按钮换成不能点的「工作中」，连点只派出一个；交回以后又能派', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  pane(on)
  let spawns = 0
  started(on, ['c1', 'c2', 'c3'], () => {
    spawns += 1
  })
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    spawns = 0
    const ui = await mountChecked($, { ...HUB, surface })
    // 连点两下（第二下在第一下写完状态之前）：只派出一个
    const press = () => ui.press({ key: 'assistant-send' }).catch(() => undefined)
    await Promise.all([press(), press()])
    await clock.advance(1)
    expect(spawns).toBe(1)
    // 按钮换成不能点的「工作中」
    expect(await ui.find({ key: 'assistant-send' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /助手工作中/ })).toBeDefined()
    await press()
    await clock.advance(1)
    expect(spawns).toBe(1)
    // 交回报告以后按钮回来，又能派
    const id = surface === 'terminal' ? 'c1' : 'c2'
    await $.turn.complete({ agentId: id, answer: '1. A\n2. B\n3. C', isAborted: false, durationMs: 10, turnId: `${id}-t`, reason: 'answer' })
    expect(await ui.find({ key: 'assistant-send' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /助手工作中/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('助手：派出去时把当前目录和 docs/ 的文件（新改的在前）写进任务，它没有列目录的工具也知道读哪些', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  pane(on)
  const prompts: string[] = []
  started(on, ['d1'], p => prompts.push(p))
  const entry = (name: string, kind: 'file' | 'dir', mtimeMs: number) => ({ name, kind, size: 1, mtimeMs, isLink: false })
  on('fs.list', async ($$, e) => ({
    value:
      // 引擎可能把路径补成完整路径，按结尾认
      /(^|\/)docs\/?$/.test(e.path)
        ? [entry('PLAN.md', 'file', 300)]
        : [entry('README.md', 'file', 100), entry('.git', 'dir', 0), entry('node_modules', 'dir', 0), entry('src', 'dir', 0), entry('package.json', 'file', 200)],
  }))
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'assistant-send' })
  expect(prompts.length).toBe(1)
  expect(prompts[0]).toStartWith('读一下当前目录的 README')
  expect(prompts[0]).toEndWith('当前目录里的文件（新改的在前）：docs/PLAN.md, package.json, README.md, src/')
  await ui.unmount()
})

test('助手：别的会话里收回了「Claude 能派」（$.store 是共用的），这个会话也收回，安全页照 $.store 报', { plugins: [testCore, probe] }, async ($, on) => {
  mock.clock(on)
  const kv = new Map<string, unknown>([['offer', true]])
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  on('agent.offer', async () => ({ isOffered: true }))
  on('agent.register', async ($$, e) => ({ value: { agent: `lemo-assistant:${e.name}` } }))
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/p', surface: 'terminal', isInteractive: true })
  expect(await offered($)).toBe(true)
  kv.set('offer', false)
  expect((await capsOf($)).find(c => c.id === 'offer')?.on).toBe(false)
  expect(await offered($)).toBe(false)
})

test('助手：「全部关闭」时正在列文件、还没派出去的那一下不派了；存档写不进时照样往下传，横条说一声', { plugins: [testCore, probe] }, async ($, on) => {
  mock.clock(on)
  pane(on)
  const kv = new Map<string, unknown>()
  let failSet = false
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    if (failSet) throw new Error('disk full')
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  const spawned: string[] = []
  on('agent.spawn', async ($$, e) => {
    spawned.push(e.prompt)
    return { model: 'haiku' }
  })
  // 列文件的时候用户按了「全部关闭」
  on('fs.list', async () => {
    await probeRun($, 'off')
    return { value: [] } as never
  })
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'assistant-send' })
  expect(spawned).toEqual([])
  expect(await ui.find({ key: 'assistant-send' })).toBeDefined()
  await ui.unmount()
  // 存档写不进：lemo-core 那一层的「全部关闭」照样走到，横条上说一声
  failSet = true
  const before = (await lemoCalls($)).filter(c => c.op === 'off').length
  await probeRun($, 'off')
  const calls = await lemoCalls($)
  expect(calls.filter(c => c.op === 'off').length).toBe(before + 1)
  expect(calls.filter(c => c.op === 'notice').map(c => (c.input as { text: string }).text)).toContain('「Claude 可派助手」没关上 · 请在「安全」页再关一次')
})

test('安全：刚装上不把助手推荐给 Claude、不派它、不读目录、不出声；在安全页打开「Claude 可派助手」以后才推荐', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const acts: string[] = []
  on('agent.offer', async () => ({ isOffered: true }))
  on('agent.register', async ($$, e) => ({ value: { agent: `lemo-assistant:${e.name}` } }))
  on('agent.spawn', async () => {
    acts.push('agent.spawn')
    return { model: 'haiku' }
  })
  on('fs.list', async () => {
    acts.push('fs.list')
    return { value: [] } as never
  })
  on('prompt.fill', async () => {
    acts.push('prompt.fill')
    return { isFilled: false, text: '', cursor: 0 }
  })
  on('prompt.submit', async ($$, e) => {
    if (e.origin.kind === 'plugin') acts.push('prompt.submit')
    return { text: e.text }
  })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  await $.prompt.submit({ text: '你好', origin: { kind: 'composer' } } as never)
  await $.turn.complete({ answer: '你好', isAborted: false, durationMs: 10, turnId: 't1', reason: 'answer' })
  await clock.advance(130_000)
  // Claude 的 agent 列表里没有它，Claude 点名派它也被拒
  expect(await offered($)).toBe(false)
  expect(acts).toEqual([])
  expect((await lemoCalls($)).filter(c => c.op === 'play' || c.op === 'say' || c.op === 'notice')).toEqual([])
  // 安全页上两行：offer 关着、有开关；点按钮派它是「手动触发」
  expect((await capsOf($)).map(c => [c.id, c.kind, c.on, c.manual ?? false])).toEqual([
    ['offer', 'cost', false, false],
    ['send', 'cost', false, true],
  ])
  expect((await capsOf($))[0]?.desc.zh).toContain('Haiku')
  // send 没有开关：按了也不认
  expect(await toggle($, 'send', true)).toBe(false)
  expect(await offered($)).toBe(false)

  // 在安全页打开：Claude 看得到它了；关掉、「全部关闭」又看不到
  expect(await toggle($, 'offer', true)).toBe(true)
  expect(await offered($)).toBe(true)
  expect((await capsOf($))[0]?.on).toBe(true)
  await probeRun($, 'off')
  expect(await offered($)).toBe(false)
  expect((await capsOf($))[0]?.on).toBe(false)
  // 推荐不等于派：开着也没派出去过
  expect(acts).toEqual([])
})
