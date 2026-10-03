import { expect, mock, test } from 'claude-code/testing'

import type { On } from 'claude-code'

import { lemoCalls, testCore, testSay } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-sound',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

type Played = { sound: string; gain?: number; preview?: boolean }

test('面板卡片：两个界面都有开关和三个试听按钮；装上时声音是关的，按钮写「打开」', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 假核心不画面板：测试替它画里层（ref 0 表示按原样画）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface } as never)
    for (const key of ['sound-mute', 'sound-tick', 'sound-done', 'sound-deny']) expect(await ui.find({ key })).toBeDefined()
    // 假核心的风格没有 words，显示的是中性的默认文字。lemo-core 还没写过静音状态时照它的默认：关着
    expect((await ui.find({ key: 'sound-mute' }))?.props.label).toBe('打开')
    expect((await ui.find({ key: 'sound-tick' }))?.props.label).toBe('调工具')
    expect((await ui.find({ key: 'sound-done' }))?.props.label).toBe('一轮结束')
    expect((await ui.find({ key: 'sound-deny' }))?.props.label).toBe('限时中止')
    expect(await ui.find({ type: 'Text', text: /^提示音/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /调用工具、一轮结束/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /已关闭/ })).toBeDefined()
    await ui.unmount()
  }
})

test('面板卡片：不在「常用」页时不画', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' } as never)
  expect(await ui.find({ key: 'sound-mute' })).toBeUndefined()
  await ui.unmount()
})

test('试听：三个按钮都调 $.lemo.play，带 preview: true；嗒放轻一点', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const played: Played[] = []
  on('lemo.play', async ($$, e, next) => {
    played.push(e)
    return next(e)
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    played.length = 0
    const ui = await mountChecked($, { ...HUB, surface } as never)
    await ui.press({ key: 'sound-tick' })
    await ui.press({ key: 'sound-done' })
    await ui.press({ key: 'sound-deny' })
    expect(played).toEqual([
      { sound: 'tick', gain: 0.7, preview: true },
      { sound: 'done', gain: 1, preview: true },
      { sound: 'deny', gain: 1, preview: true },
    ])
    await ui.unmount()
  }
})

test('调工具：放「嗒」（tick，0.7），不带 preview，调用照常交给里层', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  const played: Played[] = []
  on('lemo.play', async ($$, e, next) => {
    played.push(e)
    return next(e)
  })
  // 测试替引擎跑工具
  on('tool.call', async () => ({ result: 'ran' }) as never)
  const r = await $.tool.call({ tool: 'Bash', command: 'ls' } as never)
  expect(JSON.stringify(r)).toContain('ran')
  expect(played).toEqual([{ sound: 'tick', gain: 0.7 }])
})

test('一轮完成：主对话放「啵叮」（done）；子 agent 的一轮、被中断的一轮不响', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  const played: Played[] = []
  on('lemo.play', async ($$, e, next) => {
    played.push(e)
    return next(e)
  })
  on('turn.complete', async () => ({ text: '' }))
  await $.turn.complete({ answer: 'ok', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })
  expect(played).toEqual([{ sound: 'done', gain: 1 }])
  await $.turn.complete({ answer: 'ok', durationMs: 1000, isAborted: false, turnId: 't2', reason: 'answer', agentId: 'a1' })
  await $.turn.complete({ answer: '', durationMs: 1000, isAborted: true, turnId: 't3', reason: 'aborted' })
  // 接口出错、拒答结束的一轮也不响：听着不该像「完成」
  await $.turn.complete({ answer: '', durationMs: 1000, isAborted: false, turnId: 't4', reason: 'error' } as never)
  await $.turn.complete({ answer: '', durationMs: 1000, isAborted: false, turnId: 't5', reason: 'refusal', refusal: 'no' } as never)
  expect(played.length).toBe(1)
})

test('命令：/lemo-mod 静音（mute）只关，声音（sound）只开，输入几次都一样；别的词交给里层', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const sets: { muted?: boolean; speech?: boolean }[] = []
  on('lemo.set', async ($$, e, next) => {
    sets.push(e)
    return next(e)
  })
  // 装上时就是静音：再输入「静音」还是静音，不会反过来打开
  const zh = await $.command.run({ command: 'lemo-mod', args: '静音' } as never)
  expect(JSON.stringify(zh)).toContain('已静音。')
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: '声音' } as never))).toContain('已取消静音。')
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: '声音' } as never))).toContain('已取消静音。')
  // 命令里的英文词不换语言，用户发了英文消息才回英文
  await testSay($, 'say hi in one word')
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: 'mute' } as never))).toContain('Muted.')
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: 'sound' } as never))).toContain('Unmuted.')
  // 「取消静音 / unmute」也是打开
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: 'unmute' } as never))).toContain('Unmuted.')
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: '取消静音' } as never))).toContain('Unmuted.')
  expect(sets).toEqual([{ muted: true }, { muted: false }, { muted: false }, { muted: true }, { muted: false }, { muted: false }, { muted: false }])
  // 不认的词不碰静音：假核心收到后回一个空结果
  const other = await $.command.run({ command: 'lemo-mod', args: '番茄 25' } as never)
  expect(JSON.stringify(other)).not.toContain('静音')
  expect(sets.length).toBe(7)
})

test('打开以后：按钮变成「已开 · 点击关闭」，说明里不再写「已关闭」，试听照样带 preview 放；命令静音后切回来', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const played: Played[] = []
  on('lemo.play', async ($$, e, next) => {
    played.push(e)
    return next(e)
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface } as never)
    expect((await ui.find({ key: 'sound-mute' }))?.props.label).toBe('打开')
    await ui.press({ key: 'sound-mute' })
    expect((await ui.find({ key: 'sound-mute' }))?.props.label).toBe('已开 · 点击关闭')
    expect(await ui.find({ type: 'Text', text: /已关闭/ })).toBeUndefined()
    await ui.press({ key: 'sound-done' })
    expect(played.at(-1)).toEqual({ sound: 'done', gain: 1, preview: true })
    // 命令也能切回来
    const r = await $.command.run({ command: 'lemo-mod', args: '静音' } as never)
    expect(JSON.stringify(r)).toContain('已静音。')
    expect((await ui.find({ key: 'sound-mute' }))?.props.label).toBe('打开')
    expect(await ui.find({ type: 'Text', text: /已关闭/ })).toBeDefined()
    await ui.unmount()
  }
})

/** 记下所有「做事」的调用（写文件、起程序、联网、调模型、出声、发消息、派 agent、加工具、停一轮）：存档全空时一件都不该有 */
function watchActs(on: On): string[] {
  const did: string[] = []
  for (const ev of ['fs.write', 'process.run', 'http.fetch', 'model.complete', 'model.classify', 'model.fork', 'audio.play', 'audio.speak', 'prompt.submit', 'agent.spawn', 'agent.register', 'tool.register', 'turn.abort'] as const) {
    on(ev, async () => {
      did.push(ev)
      return { value: undefined } as never
    })
  }
  on('process.spawn', async function* () {
    did.push('process.spawn')
    return { value: { code: 0, signal: null } } as never
  })
  return did
}

test('安全：刚装上（存档全空）不出声——音效都交给 lemo-core（装上时静音），自己不去开声音；工具照常交给里层；按了「打开」才开', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const did = watchActs(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async () => ({ text: '' }))
  on('tool.call', async () => ({ result: 'ran' }) as never)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const joined: { always?: unknown }[] = []
  on('lemo.join', async ($$, e, next) => {
    joined.push(e)
    return next(e)
  })
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  // 放音效不是外观：不写进「装上就生效」
  expect(joined[0]?.always).toBeUndefined()
  // 一轮：调一次工具，正常答完
  expect(JSON.stringify(await $.tool.call({ tool: 'Bash', command: 'ls' } as never))).toContain('ran')
  await $.turn.complete({ answer: 'ok', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' })
  expect(did).toEqual([])
  // 都走 $.lemo.play、不带 preview：响不响由 lemo-core 的声音开关定；没去改静音
  const calls = await lemoCalls($)
  expect(calls.filter(c => c.op === 'play')).toEqual([
    { op: 'play', input: { sound: 'tick', gain: 0.7 } },
    { op: 'play', input: { sound: 'done', gain: 1 } },
  ])
  expect(calls.filter(c => c.op === 'set')).toEqual([])
  // 卡片上是关着的；按「打开」才把静音关掉
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' } as never)
  expect((await ui.find({ key: 'sound-mute' }))?.props.label).toBe('打开')
  await ui.press({ key: 'sound-mute' })
  await ui.unmount()
  expect((await lemoCalls($)).filter(c => c.op === 'set')).toEqual([{ op: 'set', input: { muted: false } }])
})
