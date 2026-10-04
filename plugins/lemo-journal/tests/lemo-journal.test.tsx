import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'
import type { On } from 'claude-code'

import { register } from '../hooks/register'
import { lemoCalls as lemoCallsOf, testCore } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-journal',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

const HOME = '/Users/tester'
const LOG = `${HOME}/.claude/lemo-mod/journal.md`

type Turn = { steps: number; tools: number; ms: number }

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
const capsOf = async ($: Engine) => ((await probeRun($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-journal')
const toggle = async ($: Engine, id: string, isOn: boolean) => probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-journal', id, on: isOn }))

/** 测试里替引擎画面板：假核心不画面板（分页、头部由真的 lemo-core 画），这里给一个「引擎原样画」的里层 */
function paneBottom(on: On) {
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
}

/**
 * 假核心不写编号、上一轮统计、标签这几个状态。测试的 hook 在所有插件最底下，
 * 读 lemo-core 的这几个键时由它直接回答，别的照常往下走
 */
function coreState(on: On, v: { seq?: number; turnNo?: number; lastTurn?: Turn; tags?: Record<string, string>; lang?: 'zh' | 'en'; style?: unknown }) {
  on('state.get', async ($$, e, next) => {
    if (e.plugin === 'lemo-core') {
      const value =
        e.key === 'seq' ? v.seq
        : e.key === 'turnNo' ? v.turnNo
        : e.key === 'lastTurn' ? v.lastTurn
        : e.key === 'tags' ? v.tags
        : e.key === 'lang' ? v.lang
        : e.key === 'style' ? v.style
        : undefined
      if (value !== undefined) return { value: { value, version: 1 } } as never
    }
    return next(e)
  })
}

/** 日志文件放在内存里：读得到就回内容，读不到就拒绝（像文件不存在） */
function memFiles(on: On, files: Record<string, string>) {
  on('fs.read', async ($$, e) => (files[e.path] === undefined ? { deny: 'ENOENT' } : { value: files[e.path] }) as never)
  on('fs.exists', async ($$, e) => ({ value: files[e.path] !== undefined }) as never)
  on('fs.write', async ($$, e) => {
    files[e.path] = e.text
    return { value: undefined } as never
  })
}

/** 替引擎接住用户发消息、一轮开始、一轮结束 */
function engineBottom(on: On) {
  on('prompt.submit', async ($$, e) => ({ text: e.text }))
  on('turn.start', async ($$, e) => ({ turnId: e.turnId }))
  on('turn.complete', async () => ({ text: '' }))
}

const done = (ms: number, extra: Record<string, unknown> = {}) => ({ answer: '好了', durationMs: ms, isAborted: false, reason: 'answer', turnId: 't1', ...extra })

test('面板：后台页有日志、自动分类，行为页有每轮统计（没有 commit 署名）；日志链接只在终端', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  mock.env(on, { HOME })
  paneBottom(on)
  coreState(on, { lastTurn: { steps: 3, tools: 2, ms: 75_000 }, tags: { '1': 'question', '2': 'code', '3': 'debug' } })
  for (const surface of ['terminal', 'desktop'] as const) {
    await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
    const bg = await mountChecked($, { ...HUB, surface } as never)
    expect(await bg.find({ type: 'Text', text: /^日志/ })).toBeDefined()
    expect(await bg.find({ type: 'Text', text: /~\/\.claude\/lemo-mod\/journal\.md/ })).toBeDefined()
    expect(await bg.find({ key: 'journal-log-switch' })).toBeDefined()
    expect(await bg.find({ type: 'Text', text: '暂无记录' })).toBeDefined()
    expect(await bg.find({ type: 'Text', text: /^自动分类/ })).toBeDefined()
    expect(await bg.find({ key: 'journal-classify-switch' })).toBeDefined()
    expect(await bg.find({ type: 'Text', text: '最近：T01 提问 · T02 改代码 · T03 排查' })).toBeDefined()
    // 打开日志文件的链接：桌面的文件窗格打不开 ~/.claude 下的文件，桌面上不显示
    const link = await bg.find({ key: 'journal-open' })
    if (surface === 'terminal') expect(link?.text).toBe(`[打开日志文件](file://${LOG})`)
    else expect(link).toBeUndefined()
    await bg.unmount()

    await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
    const be = await mountChecked($, { ...HUB, surface } as never)
    expect(await be.find({ type: 'Text', text: /^每轮统计/ })).toBeDefined()
    expect(await be.find({ type: 'Text', text: '上一轮：3 步 · 2 次工具 · 用时 1:15' })).toBeDefined()
    // 不改 commit 署名，面板上没有署名开关
    expect(await be.find({ type: 'Text', text: /署名/ })).toBeUndefined()
    expect(await be.find({ key: 'journal-credit-switch' })).toBeUndefined()
    expect(await be.find({ key: 'journal-log-switch' })).toBeUndefined()
    await be.unmount()

    // 常用页没有这个 mod 的卡片
    await $.command.run({ command: 'lemo-mod', args: '常用' } as never)
    const main = await mountChecked($, { ...HUB, surface } as never)
    expect(await main.find({ key: 'journal-log-switch' })).toBeUndefined()
    await main.unmount()
  }
})

test('每轮统计：还没跑完一轮时说一声', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  paneBottom(on)
  await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' } as never)
  expect(await ui.find({ type: 'Text', text: '完成一轮后显示' })).toBeDefined()
  await ui.unmount()
})

test('英文界面：卡片换成英文，1 step、1 tool 用单数', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  paneBottom(on)
  coreState(on, { lang: 'en', lastTurn: { steps: 1, tools: 1, ms: 5000 }, tags: { '1': 'chat' } })
  await $.command.run({ command: 'lemo-mod', args: 'behave' } as never)
  const be = await mountChecked($, { ...HUB, surface: 'terminal' } as never)
  expect(await be.find({ type: 'Text', text: 'Last turn: 1 step · 1 tool · 5s' })).toBeDefined()
  expect(await be.find({ type: 'Text', text: /credit/i })).toBeUndefined()
  await be.unmount()
  await $.command.run({ command: 'lemo-mod', args: 'bg' } as never)
  const bg = await mountChecked($, { ...HUB, surface: 'terminal' } as never)
  expect(await bg.find({ type: 'Text', text: 'Recent: T01 chat' })).toBeDefined()
  expect((await bg.find({ key: 'journal-open' }))).toBeUndefined()
  await bg.unmount()
})

test('日志：一轮结束往 ~/.claude/lemo-mod/journal.md 追加一行，面板显示出来', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 2, 14, 5).getTime() })
  // 日志装上时是关的：这里当用户打开过（存在 $.store 里）
  mock.store(on, { log: true })
  mock.env(on, { HOME })
  paneBottom(on)
  coreState(on, { seq: 3, lastTurn: { steps: 3, tools: 2, ms: 45_000 }, tags: { '3': 'code' } })
  const files: Record<string, string> = { [LOG]: '# 旧的抬头\n\n- 10-01 09:00 · T01 · 1s · 1 步 · 0 次工具 · 你好\n' }
  memFiles(on, files)
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  // 项目名取工作目录的最后一段（结尾的斜杠不算）
  await $.session.start({ cwd: '/Users/tester/code/Lemo-mod/', surface: 'terminal', isInteractive: true })

  const text = '把登录页的按钮改成蓝色，顺便看看为什么点了以后没有任何反应，控制台也没报错'
  await $.prompt.submit({ text, origin: { kind: 'composer' } } as never)
  // 后台任务通知不是用户本人发的，不算「用户那句话」
  await $.prompt.submit({ text: '<task-notification>后台任务完成</task-notification>', origin: { kind: 'task-notification' } } as never)
  await $.turn.start({ text, turnId: 't1' })
  await $.turn.complete(done(45_000) as never)
  await clock.settle()

  const lines = (files[LOG] ?? '').split('\n')
  // 抬头换成现在的，旧记录留着，新的一行接在后面
  expect(lines[0]).toBe('# lemo-mod · 日志 / Journal')
  expect(lines[1]).toBe('')
  expect(lines[2]).toBe('- 10-01 09:00 · T01 · 1s · 1 步 · 0 次工具 · 你好')
  expect(lines[3]).toStartWith('- 10-02 14:05 · Lemo-mod · T03 · 改代码 · 45s · 3 步 · 2 次工具 · 把登录页的按钮改成蓝色')
  expect(lines[3]).toEndWith('…')
  expect(lines).toHaveLength(5)

  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface } as never)
    const code = await ui.find({ type: 'Code' })
    expect(code?.text).toContain('T03 · 改代码 · 45s')
    await ui.unmount()
  }
  // 终端面板内嵌（窄窗口）：没有主题的底，Code 的主题代码色看不清，改成一行一个 Text、用终端自己的字色
  const inline = await mountChecked($, { ...HUB, surface: 'terminal', props: { ...HUB.props, placement: 'inline' } } as never)
  expect(await inline.find({ type: 'Code' })).toBeUndefined()
  const row = await inline.find({ type: 'Text', text: /T03 · 改代码 · 45s/ })
  expect(row?.props.color).toBeUndefined()
  await inline.unmount()
})

test('日志：提醒、后台通知引起的一轮，编号那一栏写「提醒」「后台」，不冒用上一条的编号', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 2, 14, 5).getTime() })
  mock.store(on, { log: true })
  mock.env(on, { HOME })
  paneBottom(on)
  coreState(on, { seq: 3, lastTurn: { steps: 1, tools: 0, ms: 4_000 }, tags: { '3': 'code' } })
  const files: Record<string, string> = {}
  memFiles(on, files)
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/Users/tester/code/demo', surface: 'terminal', isInteractive: true })
  // session.append 测试答不了（最底下报 no implementation），mod 在转交之前已经记下是谁引起的，吞掉这个错
  const append = async (kind: string, text: string) => {
    await $.session.append({ door: 'prompt', origin: { kind }, uuid: `u-${text.length}`, message: { type: 'user', role: 'user', content: [{ type: 'text', text }] } } as never).catch(() => undefined)
  }
  await append('plugin', '⏰ 提醒：30 秒到了。请用一两句话告诉用户现在进展到哪了、下一步做什么。')
  await $.turn.start({ text: '⏰ 提醒', turnId: 't1' })
  await $.turn.complete(done(4_000) as never)
  await clock.settle()
  await append('task-notification', '<task-notification>后台任务完成</task-notification>')
  await $.turn.start({ text: '', turnId: 't2' })
  await $.turn.complete(done(4_000) as never)
  await clock.settle()
  const lines = (files[LOG] ?? '').split('\n').filter(l => l.startsWith('- '))
  expect(lines).toEqual(['- 10-02 14:05 · demo · 提醒 · 4s · 1 步 · 0 次工具', '- 10-02 14:05 · demo · 后台 · 4s · 1 步 · 0 次工具'])
})

test('日志：斜杠命令（skill）开头的一轮，编号那一栏写「命令」，后面是输入的命令，不冒用上一条的编号和原文', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 2, 14, 5).getTime() })
  mock.store(on, { log: true })
  mock.env(on, { HOME })
  paneBottom(on)
  // lemo-core 没给这一轮编号（turnNo 0），上一条用户消息是 T03
  coreState(on, { seq: 3, turnNo: 0, lastTurn: { steps: 1, tools: 0, ms: 4_000 }, tags: { '3': 'code' } })
  const files: Record<string, string> = {}
  memFiles(on, files)
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/Users/tester/code/demo', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: '/dataviz 画个图', origin: { kind: 'composer' } } as never)
  await $.turn.start({ text: '/dataviz 画个图', turnId: 't1' })
  await $.turn.complete(done(4_000) as never)
  await clock.settle()
  const lines = (files[LOG] ?? '').split('\n').filter(l => l.startsWith('- '))
  expect(lines).toEqual(['- 10-02 14:05 · demo · 命令 · 4s · 1 步 · 0 次工具 · /dataviz 画个图'])
})

test('日志：一轮是谁引起的在这一轮开始时定：提醒之后跑的 skill 记「命令」；跑着时排队进来的话改不了正在跑那一轮', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 2, 14, 5).getTime() })
  mock.store(on, { log: true })
  mock.env(on, { HOME })
  paneBottom(on)
  coreState(on, { seq: 3, turnNo: 0, lastTurn: { steps: 1, tools: 0, ms: 4_000 }, tags: { '3': 'code' } })
  const files: Record<string, string> = {}
  memFiles(on, files)
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/Users/tester/code/demo', surface: 'terminal', isInteractive: true })
  const append = async (kind: string, text: string) => {
    await $.session.append({ door: 'prompt', origin: { kind }, uuid: `u-${text.length}`, message: { type: 'user', role: 'user', content: [{ type: 'text', text }] } } as never).catch(() => undefined)
  }
  // 提醒那一轮：跑着的时候用户输入了一条命令（排队）
  await append('plugin', '⏰ 提醒：30 秒到了。')
  await $.turn.start({ text: '⏰ 提醒', turnId: 't1' })
  await $.prompt.submit({ text: '/dataviz 画个图', origin: { kind: 'composer' } } as never)
  await $.turn.complete(done(4_000) as never)
  await clock.settle()
  // 轮到这条命令（skill 不进对话记录）：跑着的时候用户又输入了一句话
  await $.turn.start({ text: '/dataviz 画个图', turnId: 't2' })
  await $.prompt.submit({ text: '再画一张', origin: { kind: 'composer' } } as never)
  await $.turn.complete(done(4_000) as never)
  await clock.settle()
  const lines = (files[LOG] ?? '').split('\n').filter(l => l.startsWith('- '))
  expect(lines).toEqual([
    '- 10-02 14:05 · demo · 提醒 · 4s · 1 步 · 0 次工具',
    '- 10-02 14:05 · demo · 命令 · 4s · 1 步 · 0 次工具 · /dataviz 画个图',
  ])
})

test('日志：只留最近 500 行', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  mock.env(on, { HOME })
  coreState(on, { seq: 9, lastTurn: { steps: 1, tools: 0, ms: 1000 } })
  const old = Array.from({ length: 600 }, (_, i) => `- 10-01 09:00 · T01 · 1s · 1 步 · 0 次工具 · 第 ${i} 行`).join('\n')
  const files: Record<string, string> = { [LOG]: `# 抬头\n\n${old}\n` }
  memFiles(on, files)
  engineBottom(on)
  // 没有 session.start：在安全页上打开日志
  await toggle($, 'log', true)
  await $.prompt.submit({ text: '最后一条', origin: { kind: 'composer' } } as never)
  await $.turn.complete(done(1000) as never)
  await clock.settle()
  const rows = (files[LOG] ?? '').split('\n').filter(l => l.startsWith('- '))
  expect(rows).toHaveLength(500)
  expect(rows[0]).toEndWith('第 101 行')
  // 没有 session.start（拿不到工作目录）：不加项目名，时间后面直接是编号
  expect(rows[499]).toMatch(/^- \d\d-\d\d \d\d:\d\d · T09 · 1s · 1 步 · 0 次工具 · 最后一条$/)
})

test('日志：两轮紧挨着结束，排队写，两行都在（不会后写的盖掉先写的）', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 2, 14, 5).getTime() })
  mock.store(on, { log: true })
  mock.env(on, { HOME })
  coreState(on, { seq: 2, lastTurn: { steps: 1, tools: 0, ms: 1000 } })
  // 写文件要一会儿：先读到的内容在写完之前不变，不排队的话第二次会读到旧的那份
  const files: Record<string, string> = { [LOG]: '# 抬头\n\n- 10-01 09:00 · T01 · 1s · 1 步 · 0 次工具 · 旧的\n' }
  on('fs.read', async ($$, e) => (files[e.path] === undefined ? { deny: 'ENOENT' } : { value: files[e.path] }) as never)
  on('fs.write', async ($$, e) => {
    await clock.sleep(100)
    files[e.path] = e.text
    return { value: undefined } as never
  })
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/work/alpha', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: '第二条', origin: { kind: 'composer' } } as never)
  await $.turn.complete(done(1000) as never)
  await $.turn.complete(done(2000) as never)
  await clock.settle()
  await clock.advance(100)
  await clock.settle()
  await clock.advance(100)
  await clock.settle()
  const rows = (files[LOG] ?? '').split('\n').filter(l => l.startsWith('- '))
  expect(rows).toEqual([
    '- 10-01 09:00 · T01 · 1s · 1 步 · 0 次工具 · 旧的',
    '- 10-02 14:05 · alpha · T02 · 1s · 1 步 · 0 次工具 · 第二条',
    '- 10-02 14:05 · alpha · T02 · 2s · 1 步 · 0 次工具 · 第二条',
  ])
})

test('日志：被中断的一轮、子 agent 的一轮不记；关掉开关后也不记', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on, { log: true })
  mock.env(on, { HOME })
  paneBottom(on)
  coreState(on, { seq: 1, lastTurn: { steps: 1, tools: 0, ms: 1000 } })
  const files: Record<string, string> = {}
  memFiles(on, files)
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true })

  await $.turn.complete(done(1000, { isAborted: true, reason: 'aborted' }) as never)
  await $.turn.complete(done(1000, { agentId: 'a1' }) as never)
  await clock.settle()
  expect(files[LOG]).toBeUndefined()

  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' } as never)
  expect((await ui.find({ key: 'journal-log-switch' }))?.props.label).toBe('已开 · 点击关闭')
  await ui.press({ key: 'journal-log-switch' })
  expect(await ui.find({ type: 'Text', text: /未开启/ })).toBeDefined()
  expect((await ui.find({ key: 'journal-log-switch' }))?.props.label).toBe('打开')
  await ui.unmount()
  await $.turn.complete(done(1000) as never)
  await clock.settle()
  expect(files[LOG]).toBeUndefined()
})

// 自动分类挂在 session.append 上。这一版的测试工具接不住 session.append：测试自己（或内联插件）的 hook
// 不调 next 就被跳过（「returned an answer without next」），调了 next 底下又没有实现。
// 所以这里不走引擎，直接拿 register 登记的 hook 来调：假的 $ 只给这几个 hook 用到的东西
type Hook = (...args: unknown[]) => Promise<unknown>

function hooksOf() {
  const list: { name: string; match: unknown; fn: Hook }[] = []
  const fakeOn = (name: string, a: unknown, b?: unknown) => {
    if (typeof a === 'function') list.push({ name, match: undefined, fn: a as Hook })
    else list.push({ name, match: a, fn: b as Hook })
  }
  register(fakeOn as never, {} as never)
  return (name: string) => list.find(x => x.name === name)?.fn
}

function fakeEngine(o: { seq: number; classifyOn?: boolean; fresh?: boolean; label?: string }) {
  const tagged: { n: number; kind: string }[] = []
  const asked: string[] = []
  const later: (() => void)[] = []
  const $ = {
    state: {
      get: async (ref: { plugin: string; key: string }) => {
        if (ref.plugin === 'lemo-core' && ref.key === 'seq') return { value: o.seq, version: 1 }
        // 自动分类默认关着；这几个测试默认当它开着（classifyOn: false 的那个测关掉不贴）。
        // fresh：刚装上，状态里还没有这个开关（读到的是默认值）
        if (ref.plugin === 'lemo-journal' && ref.key === 'classifyOn' && o.fresh !== true) return { value: o.classifyOn ?? true, version: 1 }
        return { value: undefined, version: 0 }
      },
      set: async () => ({ isSet: true, version: 2 }),
    },
    // 开关每次从 $.store 现读（所有会话共用一份），和上面的状态一样回答
    store: {
      get: async (key: string) => (key === 'classify' && o.fresh !== true ? o.classifyOn ?? true : undefined),
      set: async () => undefined,
    },
    clock: {
      // 「追加完再做」：先攒着，测试里手动放行
      after: (_ms: number, fn: () => void) => {
        later.push(fn)
        return { cancel: () => undefined }
      },
      now: async () => 0,
    },
    model: {
      classify: async (text: string, labels: readonly string[]) => {
        asked.push(text)
        expect(labels).toEqual(['question', 'code-change', 'debugging', 'chat'])
        return o.label
      },
    },
    lemo: {
      tag: async (x: { n: number; kind: string }) => {
        tagged.push(x)
      },
    },
  }
  // 放行攒着的事，再让它们跑完（假的 $ 都是立刻完成的 Promise，几十轮微任务足够）
  const flush = async () => {
    for (const f of later.splice(0)) f()
    for (let i = 0; i < 50; i++) await Promise.resolve()
  }
  return { $, tagged, asked, flush }
}

const row = (text: string, kind = 'composer', extra: Record<string, unknown> = {}) => ({
  door: 'prompt',
  origin: { kind },
  uuid: `u-${text.length}`,
  message: { type: 'user', role: 'user', content: [{ type: 'text', text }] },
  ...extra,
})

test('自动分类：用户本人的消息在追加以后贴标签，调 $.lemo.tag({ n, kind })', async () => {
  const hook = hooksOf()
  const submit = hook('prompt.submit')!
  const append = hook('session.append')!
  const eng = fakeEngine({ seq: 4, label: 'debugging' })
  let appended = false
  // prompt.submit 记下原文；session.append 先让里层（lemo-core）定号，再读编号
  await submit(eng.$, { text: '为什么测试一直失败', origin: { kind: 'composer' } }, async () => ({ text: '' }))
  await append(eng.$, row('<system-reminder>x</system-reminder>为什么测试一直失败'), async (e: unknown) => {
    appended = true
    return e
  })
  expect(appended).toBe(true)
  // 贴标签放在 clock.after 里，不拖慢追加
  expect(eng.asked).toEqual([])
  await eng.flush()
  expect(eng.asked).toEqual(['为什么测试一直失败'])
  expect(eng.tagged).toEqual([{ n: 4, kind: 'debug' }])
})

test('自动分类：后台通知、子 agent、系统插入的消息不贴；关掉开关不贴；模型没给出标签不贴', async () => {
  const hook = hooksOf()
  const append = hook('session.append')!
  const pass = async (e: unknown) => e

  const a = fakeEngine({ seq: 2, label: 'chat' })
  await append(a.$, row('done', 'task-notification'), pass)
  await append(a.$, row('子 agent 的话', 'composer', { agentId: 'a1' }), pass)
  await append(a.$, { ...row('提醒'), message: { type: 'user', role: 'user', isMeta: true, content: [{ type: 'text', text: '提醒' }] } }, pass)
  await a.flush()
  expect(a.tagged).toEqual([])

  const off = fakeEngine({ seq: 3, classifyOn: false, label: 'chat' })
  await append(off.$, row('你好'), pass)
  await off.flush()
  expect(off.asked).toEqual([])
  expect(off.tagged).toEqual([])

  // 等模型的时候关掉了（这个会话、别的会话或「全部关闭」）：模型回来以后不贴
  const late = fakeEngine({ seq: 6, label: 'chat' })
  const classify = late.$.model.classify
  late.$.model.classify = async (text: string, labels: readonly string[]) => {
    const k = await classify(text, labels)
    late.$.store.get = async () => undefined
    return k
  }
  await append(late.$, row('稍等'), pass)
  await late.flush()
  expect(late.asked).toEqual(['稍等'])
  expect(late.tagged).toEqual([])

  const none = fakeEngine({ seq: 5, label: undefined })
  await append(none.$, row('嗯'), pass)
  await none.flush()
  expect(none.asked).toEqual(['嗯'])
  expect(none.tagged).toEqual([])
})

test('不改 commit、PR 的署名：存档里留着「署名打开」也一样', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { credit: true })
  paneBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('attribution.text', async ($$, e) => ({ text: e.text }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true })
  const commit = await $.attribution.text({ kind: 'commit', text: 'Co-Authored-By: Claude' })
  expect(commit.text).toBe('Co-Authored-By: Claude')
  const pr = await $.attribution.text({ kind: 'pr', text: 'Generated with Claude Code' })
  expect(pr.text).toBe('Generated with Claude Code')
})

// 带风格文字的风格（照柠檬实验室 words/lemo-journal.ts 的键写）：看 mod 取风格文字的键对不对
const LAB = {
  id: 'lemon-lab',
  name: { zh: '柠檬实验室', en: 'Lemo Lab' },
  colors: {
    ink: '#6F8FE0', grid: '#7FA3CC', pencil: '#8A9099', accent: '#F2CF1D', onAccent: '#1B1D1F', red: '#E0524A',
    inkDark: '#2F4F96', chip: '#E9EFFA', bubble: '#8FB3D9', bubbleAccent: '#E2B714',
    cardFillLight: '#FFFBEA', cardFillDark: '#262A31', deskCardFill: '#F7F9FC', deskCardBorder: '#E4ECF6', deskFigure: '#1B1D1F',
  },
  bubbles: [],
  sprite: null,
  motif: 'none',
  icon: null,
  sounds: { tick: 't.wav', done: 'd.wav', deny: 'x.wav' },
  voices: { zh: [], en: [] },
  words: {
    'lemo-journal.logTitle': { zh: '实验日志', en: 'Lab log' },
    'lemo-journal.head': { zh: '# 柠檬实验室 · 实验日志', en: '# 柠檬实验室 · 实验日志' },
  },
}

test('风格文字：卡片标题、日志抬头换成风格里的；抬头不跟界面语言变', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 2, 9, 30).getTime() })
  mock.store(on, { log: true })
  mock.env(on, { HOME })
  paneBottom(on)
  coreState(on, { style: LAB, lang: 'en', seq: 1, lastTurn: { steps: 1, tools: 0, ms: 2000 } })
  const files: Record<string, string> = {}
  memFiles(on, files)
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true })

  await $.command.run({ command: 'lemo-mod', args: 'bg' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' } as never)
  expect(await ui.find({ type: 'Text', text: 'Lab log' })).toBeDefined()
  await ui.unmount()

  await $.prompt.submit({ text: 'hello', origin: { kind: 'composer' } } as never)
  await $.turn.complete(done(2000) as never)
  await clock.settle()
  expect(files[LOG]).toBe('# 柠檬实验室 · 实验日志\n\n- 10-02 09:30 · project · T01 · 2s · 1 step · 0 tools · hello\n')
})

test('开关存进 $.store：新会话开始时读回来', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { log: true })
  paneBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' } as never)
  expect((await ui.find({ key: 'journal-log-switch' }))?.props.label).toBe('已开 · 点击关闭')
  // 自动分类没存过：默认关着（每条消息多调一次小模型）
  expect((await ui.find({ key: 'journal-classify-switch' }))?.props.label).toBe('打开')
  await ui.unmount()
})

test('安全：刚装上不写日志、开会话不读日志文件、不调模型；在安全页打开「日志」以后一轮结束才写', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 3, 10, 0).getTime() })
  mock.store(on)
  mock.env(on, { HOME })
  coreState(on, { seq: 1, lastTurn: { steps: 1, tools: 0, ms: 1000 } })
  // 记下碰过的文件、调过的模型
  const reads: string[] = []
  const writes: string[] = []
  const models: string[] = []
  on('fs.read', async ($$, e) => {
    reads.push(e.path)
    return { deny: 'ENOENT' } as never
  })
  on('fs.exists', async () => ({ value: false }) as never)
  on('fs.write', async ($$, e) => {
    writes.push(e.path)
    return { value: undefined } as never
  })
  on('model.classify', async () => {
    models.push('classify')
    return { value: 'chat' } as never
  })
  on('model.complete', async () => {
    models.push('complete')
    return { value: { isAnswered: false, reason: 'api-error' } } as never
  })
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: '你好', origin: { kind: 'composer' } } as never)
  await $.turn.complete(done(1000) as never)
  await clock.advance(2000)
  expect(reads).toEqual([])
  expect(writes).toEqual([])
  expect(models).toEqual([])
  // 安全页上两行，装上时都关着；报到时不再写「装上就生效」的事
  expect((await capsOf($)).map(c => [c.id, c.kind, c.on])).toEqual([['log', 'file', false], ['classify', 'cost', false]])
  expect((await capsOf($))[0]?.desc.zh).toContain('~/.claude/lemo-mod/journal.md')
  const joined = (await lemoCallsOf($)).filter(c => c.op === 'join').map(c => c.input as { always?: unknown })
  expect(joined.map(j => j.always)).toEqual([undefined])

  // 打开日志：读一次日志文件（面板上显示尾巴），一轮结束写一行
  expect(await toggle($, 'log', true)).toBe(true)
  expect((await capsOf($)).find(c => c.id === 'log')?.on).toBe(true)
  await $.turn.complete(done(1000) as never)
  await clock.settle()
  expect(reads).toContain(LOG)
  expect(writes).toEqual([LOG])
  // 「全部关闭」：两个都关，再一轮不写
  await toggle($, 'classify', true)
  await probeRun($, 'off')
  expect((await capsOf($)).map(c => c.on)).toEqual([false, false])
  await $.turn.complete(done(1000) as never)
  await clock.settle()
  expect(writes).toEqual([LOG])
  // 认不出的 id 不认
  expect(await toggle($, 'nope', true)).toBe(false)
})

test('日志：文件在、却读不出来（太大、没权限）时这次不写，不盖掉旧日志；真不存在才新建', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 2, 14, 5).getTime() })
  mock.store(on, { log: true })
  mock.env(on, { HOME })
  coreState(on, { seq: 1, lastTurn: { steps: 1, tools: 0, ms: 1000 } })
  let there = true
  const writes: string[] = []
  on('fs.read', async () => ({ deny: 'EACCES' }) as never)
  on('fs.exists', async () => ({ value: there }) as never)
  on('fs.write', async ($$, e) => {
    writes.push(e.text)
    return { value: undefined } as never
  })
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/demo', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: '你好', origin: { kind: 'composer' } } as never)
  await $.turn.complete(done(1000) as never)
  await clock.settle()
  expect(writes).toEqual([])
  there = false
  await $.turn.complete(done(1000) as never)
  await clock.settle()
  expect(writes).toHaveLength(1)
  expect(writes[0]).toStartWith('# lemo-mod · 日志 / Journal')
})

test('日志、自动分类：别的会话里关掉了（$.store 是共用的），这个会话也跟着停，安全页照 $.store 报', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on, { now: new Date(2026, 9, 2, 14, 5).getTime() })
  const kv = new Map<string, unknown>([['log', true], ['classify', true]])
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  mock.env(on, { HOME })
  coreState(on, { seq: 1, lastTurn: { steps: 1, tools: 0, ms: 1000 } })
  const files: Record<string, string> = {}
  memFiles(on, files)
  engineBottom(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/demo', surface: 'terminal', isInteractive: true })
  expect((await capsOf($)).map(c => c.on)).toEqual([true, true])
  // 别的会话按了「全部关闭」：只改了共用的存档
  kv.set('log', false)
  kv.set('classify', false)
  expect((await capsOf($)).map(c => c.on)).toEqual([false, false])
  await $.prompt.submit({ text: '你好', origin: { kind: 'composer' } } as never)
  await $.turn.complete(done(1000) as never)
  await clock.settle()
  expect(files[LOG]).toBeUndefined()
})

test('安全：刚装上不调小模型贴标签（自动分类默认关）', async () => {
  const hook = hooksOf()
  const append = hook('session.append')!
  const eng = fakeEngine({ seq: 1, fresh: true, label: 'chat' })
  await append(eng.$, row('你好'), async (e: unknown) => e)
  await eng.flush()
  expect(eng.asked).toEqual([])
  expect(eng.tagged).toEqual([])
})
