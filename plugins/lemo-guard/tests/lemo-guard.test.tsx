import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { Plugin } from 'claude-code/testing'

import { lemoCalls, testCore } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-guard',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const
// 假核心不画面板：测试里替引擎画面板本身（ref 0 表示按原样画），只看本 mod 接在后面的卡片
const ENGINE_PANE = async () => ({ type: 'engine', ref: 0 }) as const

// 测试里的 $ 只有引擎自己的方法，没有插件加的 $.lemo。用一个探针插件替测试调安全页用的三个方法：
// /probe caps | toggle <JSON 参数> | off，回复是结果的 JSON
const probe: Plugin = {
  name: 'probe',
  register(on) {
    on('command.run', { command: 'probe' }, async ($, e) => {
      const i = e.args.indexOf(' ')
      const op = i < 0 ? e.args : e.args.slice(0, i)
      const arg = i < 0 ? {} : JSON.parse(e.args.slice(i + 1))
      // 校验规定 $ 上的方法要逐个写出来调用，不能当值传来传去
      let r: unknown = null
      if (op === 'caps') r = await $.lemo.caps({})
      else if (op === 'toggle') r = await $.lemo.toggle(arg)
      else if (op === 'off') r = await $.lemo.off({})
      else return { text: 'no such method' }
      return { text: JSON.stringify(r ?? null) }
    })
  },
}

type Run = { command: { run: (e: never) => Promise<unknown> } }
type Cap = { mod: string; id: string; kind: string; on: boolean; manual?: boolean; title: { zh: string; en: string }; desc: { zh: string; en: string } }

async function callProbe($: Run, op: string, arg?: unknown): Promise<unknown> {
  const r = (await $.command.run({ command: 'probe', args: arg === undefined ? op : `${op} ${JSON.stringify(arg)}` } as never)) as { text: string }
  return JSON.parse(r.text)
}

/** 替引擎存 $.store（和 mock.store 一样），返回存的东西，测试直接看 */
function kvStore(on: On, init: Record<string, unknown> = {}): Map<string, unknown> {
  const kv = new Map(Object.entries(init))
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  return kv
}

/** 能力清单里 lemo-guard 的那几行 */
async function guardCaps($: Run): Promise<Cap[]> {
  return ((await callProbe($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-guard')
}

test('安全：刚装上什么都不做——不限时、不停下哪一轮、不放行也不拒绝工具、不改工具说明、不往提示里加话；在安全页打开以后才会停', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  // 存档全空：刚装上
  mock.store(on)
  on('ui.render', { component: 'Pane' }, ENGINE_PANE)
  // 替引擎答下面这些操作，记下谁调了：刚装上一件都不该有
  const did: string[] = []
  const rec = (op: string) => async () => {
    did.push(op)
    return { value: undefined } as never
  }
  on('fs.write', rec('fs.write'))
  on('model.complete', rec('model.complete'))
  on('model.classify', rec('model.classify'))
  on('model.fork', rec('model.fork'))
  on('audio.play', rec('audio.play'))
  on('audio.speak', rec('audio.speak'))
  on('prompt.submit', rec('prompt.submit'))
  on('agent.register', rec('agent.register'))
  on('agent.spawn', rec('agent.spawn'))
  on('tool.register', rec('tool.register'))
  on('process.run', rec('process.run'))
  on('http.fetch', rec('http.fetch'))
  on('turn.abort', async ($$, e) => {
    did.push(`turn.abort ${e.turnId}`)
    return { value: undefined } as never
  })
  // 替引擎接会话、一轮的开始和结束、权限判断、工具说明、系统提示
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.start', async ($$, e) => ({ turnId: e.turnId }))
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
  on('tool.check', async () => ({ decision: 'ask' }) as never)
  on('tool.describe', async ($$, e) => ({ description: e.description }))
  on('prompt.compose', async () => ({ sections: [] }))
  // 替引擎跑 Bash：记下真正交给工具的命令
  const ran: string[] = []
  on('tool.call', { tool: 'Bash' }, async ($$, e) => {
    if (e.tool === 'Bash') ran.push(e.command)
    return { result: { stdout: 'ok', stderr: '', interrupted: false } } as never
  })

  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  // 一轮对话：等确认的一条强推（以前会被拦），然后 Claude 干了十分钟
  await $.turn.start({ text: '帮我推一下', turnId: 't1' })
  const push = { tool: 'Bash', command: 'git push --force origin main', tool_use_id: 'u1' } as never
  expect((await $.tool.check({ tool: 'Bash', input: { command: 'git push --force origin main' }, tool_use_id: 'u1' })).decision).toBe('ask')
  expect((await $.tool.call(push)).deny).toBeUndefined()
  expect(ran).toEqual(['git push --force origin main'])
  await clock.advance(600_000)
  await $.turn.complete({ answer: '推好了', durationMs: 600_000, isAborted: false, turnId: 't1', reason: 'answer' } as never)
  const bash = { tool: 'Bash', description: 'Executes a bash command.', provider: { plugin: 'engine', tier: 'core' } } as never
  expect((await $.tool.describe(bash)).description).toBe('Executes a bash command.')
  const facts = { model: 'claude-test', promptModel: 'claude-test', surfaces: ['terminal'], tools: [], outputStyle: null, traits: [] } as never
  expect((await $.prompt.compose(facts)).sections).toEqual([])

  expect(did).toEqual([])
  // 没放音效、没出提示、没挂胶囊（这些走 $.lemo，假核心记下了）
  expect((await lemoCalls($)).filter(c => ['play', 'say', 'notice', 'badge', 'set'].includes(c.op))).toEqual([])
  // 安全页上是一行「限时」，关着
  expect((await guardCaps($)).map(c => [c.id, c.kind, c.on])).toEqual([['timeout', 'act', false]])

  // 在安全页按「打开」以后，超过时限的那一轮才被停下
  expect(await callProbe($, 'toggle', { mod: 'lemo-guard', id: 'timeout', on: true })).toBe(true)
  await $.turn.start({ text: '再做点事', turnId: 't2' })
  await clock.advance(119_000)
  expect(did).toEqual([])
  await clock.advance(1_000)
  expect(did).toEqual(['turn.abort t2'])
  expect((await lemoCalls($)).filter(c => c.op === 'play')).toEqual([{ op: 'play', input: { sound: 'deny' } }])
})

test('安全页：限时一行（act）；「打开」设成 2 分钟、已选的时长不动；「关掉」设回不停；别的 mod、认不出的 id、试听都不认', { plugins: [testCore, probe] }, async ($, on) => {
  mock.clock(on)
  const store = kvStore(on)
  on('ui.render', { component: 'Pane' }, ENGINE_PANE)
  const [row] = await guardCaps($)
  expect(row?.title).toEqual({ zh: '限时', en: 'Time limit' })
  expect(row?.manual).toBeUndefined()
  // 关着时，说明里写的是打开以后的时限
  expect(row?.desc.zh).toContain('超过 2 分钟')
  expect(row?.desc.en).toContain('over 2 min')

  expect(await callProbe($, 'toggle', { mod: 'lemo-guard', id: 'timeout', on: true })).toBe(true)
  expect(store.get('timeout')).toBe('120')
  // 「行为」页的卡片和安全页改的是同一个值
  await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect((await ui.find({ key: 'guard-pick' }))?.props.value).toBe('120')
  await ui.select({ key: 'guard-pick', value: '300' })
  await ui.unmount()
  const [five] = await guardCaps($)
  expect(five?.on).toBe(true)
  expect(five?.desc.zh).toContain('超过 5 分钟')
  // 已经开着、选了 5 分钟：再按「打开」不改成 2 分钟
  expect(await callProbe($, 'toggle', { mod: 'lemo-guard', id: 'timeout', on: true })).toBe(true)
  expect(store.get('timeout')).toBe('300')

  expect(await callProbe($, 'toggle', { mod: 'lemo-guard', id: 'timeout', on: false })).toBe(true)
  expect(store.get('timeout')).toBe('off')
  expect((await guardCaps($))[0]?.on).toBe(false)

  // 不是自己的往下传（假核心答 false）；自己的但认不出、没有试听，答 false，什么都不改
  expect(await callProbe($, 'toggle', { mod: 'lemo-journal', id: 'timeout', on: true })).toBe(false)
  expect(await callProbe($, 'toggle', { mod: 'lemo-guard', id: 'nope', on: true })).toBe(false)
  expect(await callProbe($, 'toggle', { mod: 'lemo-guard', id: 'timeout', preview: true })).toBe(false)
  expect(store.get('timeout')).toBe('off')
})

test('安全页「全部关闭」：限时设回不停，这一轮已经在走的计时也停掉', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  const store = kvStore(on, { timeout: '30' })
  const aborted: string[] = []
  on('turn.start', async ($$, e) => ({ turnId: e.turnId }))
  on('turn.abort', async ($$, e) => {
    aborted.push(e.turnId)
    return { value: undefined } as never
  })
  await $.turn.start({ text: '做点事', turnId: 't1' })
  await clock.advance(20_000)
  await callProbe($, 'off')
  expect(store.get('timeout')).toBe('off')
  expect((await guardCaps($))[0]?.on).toBe(false)
  await clock.advance(60_000)
  expect(aborted).toEqual([])
})

test('面板：「行为」页有限时的卡片，常用页没有；终端是一排按钮、桌面是下拉框，手机上没有 Select，不画', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, ENGINE_PANE)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ key: 'guard-pick' })).toBeUndefined()
    await ui.unmount()
  }
  await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    const pick = await ui.find({ key: 'guard-pick' })
    expect(pick).toBeDefined()
    if (surface === 'terminal') {
      expect((await ui.find({ key: 'guard-pick-off' }))?.props.variant).toBe('primary')
      expect((await ui.find({ key: 'guard-pick-30' }))?.props.variant).toBe('secondary')
    } else expect(pick?.props.value).toBe('off')
    expect(await ui.find({ type: 'Text', text: /限时/ })).toBeDefined()
    await ui.unmount()
  }
  const phone = await mountChecked($, { ...HUB, surface: 'mobile' })
  expect(await phone.find({ type: 'Text', text: /限时/ })).toBeUndefined()
  await phone.unmount()
})

test('限时：选 30 秒，一轮超过 30 秒就停掉；按时结束的不停；选择记在 $.store', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, ENGINE_PANE)
  const aborted: string[] = []
  const plays: unknown[] = []
  const notices: unknown[] = []
  // 替引擎接一轮的开始、结束和停止
  on('turn.start', async ($$, e) => ({ turnId: e.turnId }))
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
  on('turn.abort', async ($$, e) => {
    aborted.push(e.turnId)
    return { value: undefined } as never
  })
  on('lemo.play', async ($$, e, next) => {
    plays.push(e)
    return next(e)
  })
  on('lemo.notice', async ($$, e, next) => {
    notices.push(e)
    return next(e)
  })

  await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'guard-pick-30' })
  expect((await ui.find({ key: 'guard-pick-30' }))?.props.variant).toBe('primary')
  await ui.unmount()

  // 超时：到 30 秒停掉这一轮，放拦截音效，出红色提示
  await $.turn.start({ text: '做点事', turnId: 't1' })
  await clock.advance(29_000)
  expect(aborted).toEqual([])
  await clock.advance(1_000)
  expect(aborted).toEqual(['t1'])
  expect(plays).toEqual([{ sound: 'deny' }])
  expect(notices).toEqual([expect.objectContaining({ tone: 'red', text: '本轮超过 30 秒，已自动中止' })])

  // 按时结束：计时器取消，不停
  await $.turn.start({ text: '再来', turnId: 't2' })
  await clock.advance(10_000)
  await $.turn.complete({ answer: '好了', durationMs: 10_000, isAborted: false, turnId: 't2', reason: 'answer' } as never)
  await clock.advance(60_000)
  expect(aborted).toEqual(['t1'])

  // 选择记在 $.store：重新打开面板还是 30 秒；改回「不停」以后不再计时
  const again = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect((await again.find({ key: 'guard-pick' }))?.props.value).toBe('30')
  await again.select({ key: 'guard-pick', value: 'off' })
  await again.unmount()
  await $.turn.start({ text: '慢慢来', turnId: 't3' })
  await clock.advance(600_000)
  expect(aborted).toEqual(['t1'])
})
