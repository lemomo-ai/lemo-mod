import { expect, mock, test } from 'claude-code/testing'

import type { On } from 'claude-code'

import { lemoCalls, testCore, testSay } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-voice',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

// 一轮结束的事件：只改用时、是不是中断、是不是子 agent
const turn = (durationMs: number, more: { isAborted?: boolean; agentId?: string } = {}) =>
  ({ answer: '好了', durationMs, isAborted: more.isAborted ?? false, turnId: 't1', reason: more.isAborted === true ? 'aborted' : 'answer', ...(more.agentId === undefined ? {} : { agentId: more.agentId }) }) as never

test('朗读卡片：两个界面都画出标题、开关和试听；装上时朗读是关的，按钮写「打开」', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 假核心不画面板：测试替它画里层（ref 0 表示按原样画）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ type: 'Text', text: /朗读/ })).toBeDefined()
    // 假核心没写过朗读开关，按 lemo-core 的默认（关）显示
    expect((await ui.find({ key: 'voice-speech' }))?.props.label).toBe('打开')
    expect(await ui.find({ type: 'Text', text: /已关闭，试听仍可播放/ })).toBeDefined()
    expect(await ui.find({ key: 'voice-hear', text: '试听' })).toBeDefined()
    await ui.unmount()
  }
})

test('不在「常用」页时不画卡片', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 假核心不画面板：测试替它画里层（ref 0 表示按原样画）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ key: 'voice-speech' })).toBeUndefined()
  await ui.unmount()
})

test('开关：按一下调 $.lemo.set 把朗读打开，再按一下关掉；静音不管朗读，卡片上不提静音', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 假核心不画面板：测试替它画里层（ref 0 表示按原样画）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const sets: unknown[] = []
  on('lemo.set', async ($$, e, next) => {
    sets.push(e)
    return next(e)
  })
  // 提示音是静音的（lemo-core 的默认）：朗读卡片不受它影响
  on('state.get', { plugin: 'lemo-core', key: 'muted' }, async () => ({ value: { value: true, version: 1 } }))
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  await ui.press({ key: 'voice-speech' })
  // 假核心和真核心一样把朗读开关写进状态
  expect((await ui.find({ key: 'voice-speech' }))?.props.label).toBe('已开 · 点击关闭')
  expect(await ui.find({ type: 'Text', text: /静音|已关闭/ })).toBeUndefined()
  await ui.press({ key: 'voice-speech' })
  expect((await ui.find({ key: 'voice-speech' }))?.props.label).toBe('打开')
  await ui.unmount()
  expect(sets).toEqual([{ speech: true }, { speech: false }])
})

test('试听：念示例句，带 preview（静音、关了朗读也念）', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 假核心不画面板：测试替它画里层（ref 0 表示按原样画）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const said: { text: string; preview?: boolean }[] = []
  on('lemo.say', async ($$, e, next) => {
    said.push(e)
    return next(e)
  })
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'voice-hear' })
  await ui.unmount()
  expect(said).toEqual([{ text: '第 3 条完成，用时 45 秒。', preview: true }])
})

test('一轮超过 30 秒念一句；短的、被中断的、子 agent 的不念', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 测试里没有引擎的主循环：替它答一轮结束
  on('turn.complete', async () => ({ text: '' }))
  const said: { text: string; preview?: boolean }[] = []
  on('lemo.say', async ($$, e, next) => {
    said.push(e)
    return next(e)
  })
  await $.turn.complete(turn(12_000))
  await $.turn.complete(turn(30_000))
  await $.turn.complete(turn(90_000, { isAborted: true }))
  await $.turn.complete(turn(90_000, { agentId: 'a1' }))
  // 接口出错结束的一轮不念「完成」
  await $.turn.complete({ answer: '', durationMs: 90_000, isAborted: false, turnId: 't9', reason: 'error' } as never)
  expect(said).toEqual([])
  await $.turn.complete(turn(45_400))
  expect(said).toHaveLength(1)
  // 假核心没写过消息编号，读到的是 0：不念「第 0 条」，念不带编号的一句；用时四舍五入到秒；自动朗读不带 preview
  expect(said[0]?.text).toBe('这一轮完成，用时 45 秒。')
  expect(said[0]?.preview).toBeUndefined()
})

test('有编号时念「第 n 条完成」；英文、风格词也一样分有没有编号', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 假核心不记消息编号：在最底层替 lemo-core 答 seq，测试里改 seq 就是换编号
  let seq = 4
  on('state.get', { plugin: 'lemo-core', key: 'seq' }, async () => ({ value: { value: seq, version: 1 } }))
  let lang: 'zh' | 'en' = 'zh'
  on('lemo.lang', async () => ({ value: lang }))
  // 风格词开关：打开时往柠檬实验室的 words 里补两句
  let styled = false
  on('lemo.style', async ($$, e, next) => {
    const r = await next(e)
    if (!styled || r.value === undefined) return r
    const more = { 'lemo-voice.turn': { zh: '实验{n}完成，用时 {s}。', en: 'Trial {n} done in {s}.' }, 'lemo-voice.turnPlain': { zh: '实验完成，用时 {s}。', en: 'Trial done in {s}.' } }
    return { value: { ...r.value, words: { ...r.value.words, ...more } } }
  })
  on('turn.complete', async () => ({ text: '' }))
  const said: string[] = []
  on('lemo.say', async ($$, e, next) => {
    said.push(e.text)
    return next(e)
  })
  await $.turn.complete(turn(45_000))
  lang = 'en'
  await $.turn.complete(turn(45_000))
  seq = 0
  await $.turn.complete(turn(45_000))
  styled = true
  await $.turn.complete(turn(45_000))
  seq = 7
  lang = 'zh'
  await $.turn.complete(turn(45_000))
  seq = 0
  await $.turn.complete(turn(45_000))
  // 超过一分钟念分钟，整分钟不带秒，一小时以上念小时和分
  seq = 8
  await $.turn.complete(turn(135_000))
  await $.turn.complete(turn(120_000))
  await $.turn.complete(turn(3_900_000))
  lang = 'en'
  await $.turn.complete(turn(61_000))
  await $.turn.complete(turn(3_600_000))
  expect(said).toEqual([
    '第 4 条完成，用时 45 秒。',
    'Message 4 done in 45 seconds.',
    'Turn done in 45 seconds.',
    'Trial done in 45 seconds.',
    '实验7完成，用时 45 秒。',
    '实验完成，用时 45 秒。',
    '实验8完成，用时 2 分 15 秒。',
    '实验8完成，用时 2 分钟。',
    '实验8完成，用时 1 小时 5 分。',
    'Trial 8 done in 1 minute 1 second.',
    'Trial 8 done in 1 hour.',
  ])
})

test('命令：/lemo-mod 朗读、speak 试听一句，不认的词交给里层', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const said: { text: string; preview?: boolean }[] = []
  on('lemo.say', async ($$, e, next) => {
    said.push(e)
    return next(e)
  })
  const zh = await $.command.run({ command: 'lemo-mod', args: '朗读' } as never)
  expect(JSON.stringify(zh)).toContain('正在试听。')
  // 命令里的英文词不换语言：中文界面下 speak 还是念中文
  await $.command.run({ command: 'lemo-mod', args: 'speak' } as never)
  await testSay($, 'say hi in one word')
  const en = await $.command.run({ command: 'lemo-mod', args: 'speak' } as never)
  expect(JSON.stringify(en)).toContain('Playing a preview')
  expect(said).toEqual([
    { text: '第 3 条完成，用时 45 秒。', preview: true },
    { text: '第 3 条完成，用时 45 秒。', preview: true },
    { text: 'Message 3 done in 45 seconds.', preview: true },
  ])
  const other = await $.command.run({ command: 'lemo-mod', args: '番茄 25' } as never)
  expect(JSON.stringify(other)).not.toContain('朗读')
  expect(said).toHaveLength(3)
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

test('安全：刚装上（存档全空）不朗读——一轮结束的那句交给 lemo-core（装上时朗读关着），自己不去开朗读；按了「打开」才开', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const did = watchActs(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async () => ({ text: '' }))
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const joined: { always?: unknown }[] = []
  on('lemo.join', async ($$, e, next) => {
    joined.push(e)
    return next(e)
  })
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  // 朗读不是外观：不写进「装上就生效」
  expect(joined[0]?.always).toBeUndefined()
  // 一轮超过 30 秒：念的那句走 $.lemo.say、不带 preview，念不念由 lemo-core 的朗读开关定
  await $.turn.complete(turn(45_000))
  expect(did).toEqual([])
  const calls = await lemoCalls($)
  expect(calls.filter(c => c.op === 'say')).toEqual([{ op: 'say', input: { text: '这一轮完成，用时 45 秒。' } }])
  expect(calls.filter(c => c.op === 'set')).toEqual([])
  // 卡片上是关着的；按「打开」才把朗读打开
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect((await ui.find({ key: 'voice-speech' }))?.props.label).toBe('打开')
  await ui.press({ key: 'voice-speech' })
  await ui.unmount()
  expect((await lemoCalls($)).filter(c => c.op === 'set')).toEqual([{ op: 'set', input: { speech: true } }])
})
