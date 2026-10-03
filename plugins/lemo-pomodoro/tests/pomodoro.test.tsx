import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import { engineBottom, lemoCalls, testCore, testSay } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-pomodoro',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const
const BAND = {
  plugin: 'lemo-pomodoro',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: 100, scroll: SCROLL, view: {} },
} as const
const MIN = 60_000
const CHOICES = ['pomo-again', 'pomo-rest', 'pomo-skip']

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
const capsOf = async ($: Engine) => ((await probeRun($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-pomodoro')

test('卡片：两个界面都画得出；开始后显示剩余时间和「停止」，停止后回到「开始」并去掉胶囊', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 假核心不画面板的头部和分页：里层由测试替引擎画
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const badges: { text: unknown }[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e)
    return next(e)
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ type: 'Text', text: /番茄钟/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /专注\s25\s分钟/ })).toBeDefined()
    expect((await ui.find({ key: 'pomo-start' }))?.props.label).toBe('开始 25 分钟')
    await ui.press({ key: 'pomo-start' })
    expect(await ui.find({ type: 'Text', text: /剩余\s25:00/ })).toBeDefined()
    expect(await ui.find({ key: 'pomo-start' })).toBeUndefined()
    expect(badges.at(-1)).toMatchObject({ id: 'pomodoro', text: { zh: '番茄', en: 'Focus' }, tone: 'accent' })
    await ui.press({ key: 'pomo-stop' })
    expect(await ui.find({ key: 'pomo-start' })).toBeDefined()
    expect(badges.at(-1)).toMatchObject({ id: 'pomodoro', text: null })
    await ui.unmount()
  }
})

test('命令：番茄 25 开始计时并加上倒计时胶囊；回复跟着界面语言（命令里的英文词不换语言）；不认的词交给里层', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on, { now: 1_000 })
  mock.store(on)
  const badges: unknown[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e)
    return next(e)
  })
  const r = await $.command.run({ command: 'lemo-mod', args: '番茄 25' } as never)
  expect(JSON.stringify(r)).toContain('番茄钟已开始：25 分钟。')
  expect(badges.at(-1)).toMatchObject({ id: 'pomodoro', text: { zh: '番茄', en: 'Focus' }, tone: 'accent', endsAt: 1_000 + 25 * MIN })

  const word = await $.command.run({ command: 'lemo-mod', args: 'focus 10' } as never)
  expect(JSON.stringify(word)).toContain('番茄钟已开始：10 分钟')
  expect(badges.at(-1)).toMatchObject({ id: 'pomodoro', text: { zh: '番茄', en: 'Focus' }, endsAt: 1_000 + 10 * MIN })
  // 用户发了英文消息，界面换成英文，回复才是英文
  await testSay($, 'say hi in one word')
  const en = await $.command.run({ command: 'lemo-mod', args: '番茄 10' } as never)
  expect(JSON.stringify(en)).toContain('Focus timer started: 10 min.')

  // 不带分钟数是 25 分钟；pomodoro 也认
  await $.command.run({ command: 'lemo-mod', args: 'pomodoro' } as never)
  expect(badges.at(-1)).toMatchObject({ endsAt: 1_000 + 25 * MIN })

  const before = badges.length
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  expect(badges.length).toBe(before)
})

test('到点：去掉胶囊，提示、响铃、朗读；终端弹问题，选「休息 5 分钟」接着计时', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const badges: { text: unknown }[] = []
  const notices: { text: string; tone: string; ms?: number }[] = []
  const sounds: string[] = []
  const said: string[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e)
    return next(e)
  })
  on('lemo.notice', async ($$, e, next) => {
    notices.push(e)
    return next(e)
  })
  on('lemo.play', async ($$, e, next) => {
    sounds.push(e.sound)
    return next(e)
  })
  on('lemo.say', async ($$, e, next) => {
    said.push(e.text)
    return next(e)
  })
  // $.ui.ask 是一次 AskUserQuestion 工具调用：测试替用户答「休息 5 分钟」
  const asked: string[] = []
  on('tool.call', { tool: 'AskUserQuestion' }, async ($$, e) => {
    const q = e.questions[0]?.question ?? ''
    asked.push(`${q} ${(e.questions[0]?.options ?? []).map(o => o.label).join('/')}`)
    return { result: { questions: e.questions, answers: { [q]: '休息 5 分钟' } } }
  })
  // 横条只画在终端上：到点时弹问题
  on('ui.render', { component: 'AbovePrompt' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const band = await mountChecked($, { ...BAND, surface: 'terminal' })

  await $.command.run({ command: 'lemo-mod', args: '番茄 1' } as never)
  await clock.advance(MIN - 1000)
  expect(notices).toHaveLength(0)
  expect(badges.map(b => b.text)).toEqual([{ zh: '番茄', en: 'Focus' }])
  await clock.advance(1000)
  await clock.settle()
  // 到点去掉胶囊；答了「休息 5 分钟」又加上「休息」
  expect(badges.map(b => b.text)).toEqual([{ zh: '番茄', en: 'Focus' }, null, { zh: '休息', en: 'Rest' }])
  expect(badges.at(-1)).toMatchObject({ id: 'pomodoro', tone: 'accent', endsAt: clock.now() + 5 * MIN })
  expect(notices).toEqual([{ text: '番茄时间到，起来活动一下', tone: 'accent', ms: 10_000 }])
  expect(sounds).toEqual(['done'])
  expect(said).toEqual(['番茄时间到，起来活动一下'])
  expect(asked).toEqual(['番茄时间到，接下来？ 再来 25 分钟/休息 5 分钟/暂不'])
  // 终端上横条不加选择行
  for (const key of CHOICES) expect(await band.find({ key })).toBeUndefined()

  // 休息到点：换成休息结束的那句，再问一次
  await clock.advance(5 * MIN)
  await clock.settle()
  expect(notices.at(-1)?.text).toBe('休息结束，继续工作')
  expect(said.at(-1)).toBe('休息结束，继续工作')
  expect(asked.at(-1)).toContain('休息结束，接下来？')
  await band.unmount()
})

test('桌面：到点后不弹问题，横条下面出三个按钮；「再来」接着计时，「暂不」让它消失', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const badges: { text: unknown }[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e)
    return next(e)
  })
  let asked = 0
  on('tool.call', { tool: 'AskUserQuestion' }, async ($$, e) => {
    asked += 1
    return { result: { questions: e.questions, answers: {} } }
  })
  // 里层的横条：先是没装 lemo-meter（引擎自己的那份），再换成 lemo-meter 那样铺满宽度的一块
  let meter = false
  on('ui.render', { component: 'AbovePrompt' }, async ($$, e) => {
    if (!meter) return { type: 'engine', ref: 0 } as const
    const { Box, Text } = $$.ui.resolve(e)
    return (
      <Box flexDirection="column" width="100%">
        <Text>meter band</Text>
      </Box>
    )
  })
  const band = await mountChecked($, { ...BAND, surface: 'desktop' })
  for (const key of CHOICES) expect(await band.find({ key })).toBeUndefined()

  await $.command.run({ command: 'lemo-mod', args: '番茄 1' } as never)
  await clock.advance(MIN)
  await clock.settle()
  expect(asked).toBe(0)
  expect(badges.map(b => b.text)).toEqual([{ zh: '番茄', en: 'Focus' }, null])
  expect(await band.find({ type: 'Text', text: /番茄时间到，接下来？/ })).toBeDefined()
  for (const key of CHOICES) expect(await band.find({ key })).toBeDefined()

  // 「再来 25 分钟」：选择行消失，胶囊回来
  await band.press({ key: 'pomo-again' })
  for (const key of CHOICES) expect(await band.find({ key })).toBeUndefined()
  expect(badges.at(-1)).toMatchObject({ text: { zh: '番茄', en: 'Focus' }, endsAt: clock.now() + 25 * MIN })

  // 装了 lemo-meter 时：选择行接在它的横条下面，横条还在
  meter = true
  await band.redraw()
  await clock.advance(25 * MIN)
  await clock.settle()
  expect(await band.find({ type: 'Text', text: /meter band/ })).toBeDefined()
  for (const key of CHOICES) expect(await band.find({ key })).toBeDefined()

  // 「暂不」：选择行消失，不再计时，横条还在
  const before = badges.length
  await band.press({ key: 'pomo-skip' })
  for (const key of CHOICES) expect(await band.find({ key })).toBeUndefined()
  expect(await band.find({ type: 'Text', text: /meter band/ })).toBeDefined()
  expect(badges.length).toBe(before)
  expect(asked).toBe(0)
  await band.unmount()
})

test('风格词：风格里写了到点那句，就用风格的', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('lemo.style', async ($$, e, next) => {
    const r = await next(e)
    if (r.value === undefined) return r
    return { value: { ...r.value, words: { ...r.value.words, 'lemo-pomodoro.done': { zh: '这一轮做完了，离开实验台走两步', en: 'Step away' } } } }
  })
  const said: string[] = []
  on('lemo.say', async ($$, e, next) => {
    said.push(e.text)
    return next(e)
  })
  on('tool.call', { tool: 'AskUserQuestion' }, async ($$, e) => ({ result: { questions: e.questions, answers: {} } }))
  await $.command.run({ command: 'lemo-mod', args: '番茄 1' } as never)
  await clock.advance(MIN)
  expect(said).toEqual(['这一轮做完了，离开实验台走两步'])
})

test('会话重新开始（热重载）时计时还在状态里：接着走，到点只提示一次；命令里的分钟数最多 180', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  // 到点时终端弹问题：替用户按 Esc（不选），只看提示次数
  on('tool.call', { tool: 'AskUserQuestion' }, async () => ({ deny: 'esc' }) as never)
  engineBottom(on)
  const r = await $.command.run({ command: 'lemo-mod', args: '番茄 100000' } as never)
  expect(JSON.stringify(r)).toContain('180')
  await clock.advance(60_000)
  await $.session.start({ cwd: '/tmp', surface: 'terminal' } as never)
  // 每秒检查一次：一分钟一分钟地推进（一次推太久，模拟时钟会报等待太多）
  for (let m = 1; m < 179; m++) await clock.advance(60_000)
  await clock.advance(58_000)
  expect((await lemoCalls($)).some(c => c.op === 'notice')).toBe(false)
  await clock.advance(5_000)
  await clock.advance(60_000)
  expect((await lemoCalls($)).filter(c => c.op === 'notice')).toHaveLength(1)
})

/**
 * 模拟 mod 关了一阵、电脑睡了一觉：番茄钟的计时状态由测试接管，一开始就留着一个结束时间是 end 的计时。
 * 读写都走这里（写要能落下，到点时才能把它清掉）
 */
function staleTimer(on: On, end: number) {
  let cur: { value: unknown; version: number } = { value: { end, kind: 'focus' }, version: 1 }
  on('state.get', { plugin: 'lemo-pomodoro', key: 'timer' }, async () => ({ value: cur }) as never)
  on('state.set', { plugin: 'lemo-pomodoro', key: 'timer' }, async ($$, e) => {
    cur = { value: (e as unknown as { value: unknown }).value, version: cur.version + 1 }
    return { value: { isSet: true, version: cur.version } } as never
  })
}

test('恢复时过点 10 分钟以内：照常到点（提示、响铃、朗读）', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: 30 * MIN })
  mock.store(on)
  on('tool.call', { tool: 'AskUserQuestion' }, async () => ({ deny: 'esc' }) as never)
  staleTimer(on, 30 * MIN - 9 * MIN)
  engineBottom(on)
  await $.session.start({ cwd: '/tmp', surface: 'terminal' } as never)
  await clock.advance(1_000)
  const calls = await lemoCalls($)
  expect(calls.filter(c => c.op === 'notice').map(c => c.input)).toEqual([{ text: '番茄时间到，起来活动一下', tone: 'accent', ms: 10_000 }])
  expect(calls.some(c => c.op === 'play')).toBe(true)
  expect(calls.some(c => c.op === 'say')).toBe(true)
})

test('恢复时过点超过 10 分钟：作废，去掉胶囊，横条上只说一句已过期，不响不念', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: 30 * MIN })
  mock.store(on)
  on('tool.call', { tool: 'AskUserQuestion' }, async () => ({ deny: 'esc' }) as never)
  staleTimer(on, 30 * MIN - 11 * MIN)
  engineBottom(on)
  await $.session.start({ cwd: '/tmp', surface: 'terminal' } as never)
  await clock.advance(1_000)
  const calls = await lemoCalls($)
  expect(calls.filter(c => c.op === 'notice').map(c => (c.input as { text: string }).text)).toEqual(['番茄钟已超时 10 分钟以上，本次不提醒'])
  expect(calls.filter(c => c.op === 'badge').at(-1)?.input).toMatchObject({ id: 'pomodoro', text: null })
  expect(calls.some(c => c.op === 'play' || c.op === 'say')).toBe(false)
  // 只说一次
  await clock.advance(5_000)
  expect((await lemoCalls($)).filter(c => c.op === 'notice')).toHaveLength(1)
})

test('安全：刚装上什么都不做——开会话、跑一轮、等一小时，不响不念、不弹问题、不挂胶囊；安全页上列一行「手动触发」', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
  const asked: string[] = []
  on('tool.call', { tool: 'AskUserQuestion' }, async ($$, e) => {
    asked.push(e.questions[0]?.question ?? '')
    return { result: { questions: e.questions, answers: {} } }
  })
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  await $.turn.complete({ answer: '好', isAborted: false, durationMs: 10, turnId: 't1', reason: 'answer' })
  await clock.advance(60 * MIN)
  expect(asked).toEqual([])
  expect((await lemoCalls($)).filter(c => ['badge', 'notice', 'play', 'say'].includes(c.op))).toEqual([])
  // 报到时不再写「装上就生效」的事
  expect((await lemoCalls($)).filter(c => c.op === 'join').map(c => (c.input as { always?: unknown }).always)).toEqual([undefined])
  // 「代你操作」，但只在你点了以后：manual，没有开关
  const caps = await capsOf($)
  expect(caps.map(c => [c.id, c.kind, c.on, c.manual])).toEqual([['timer', 'act', false, true]])
  expect(caps[0]?.desc.zh).toContain('响铃和朗读跟随对应开关')
  expect(await probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-pomodoro', id: 'timer', on: true }))).toBe(false)
  await probeRun($, 'off')
  await clock.advance(30 * MIN)
  expect(asked).toEqual([])
  // 「全部关闭」顺带停掉正在走的番茄钟：胶囊去掉，到点不弹问题
  await $.command.run({ command: 'lemo-mod', args: '番茄 25' } as never)
  await probeRun($, 'off')
  expect((await lemoCalls($)).filter(c => c.op === 'badge').at(-1)?.input).toMatchObject({ id: 'pomodoro', text: null })
  await clock.advance(30 * MIN)
  expect(asked).toEqual([])
})

test('「全部关闭」：到点那一下已经清掉计时、还没问接下来时按下，不提示不问；问题开着时按下，按旧回答也不再计时', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const badges: unknown[] = []
  let offAtBadge = false
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e.text)
    if (offAtBadge && e.text === null) {
      offAtBadge = false
      await probeRun($, 'off')
    }
    return next(e)
  })
  let offAtAsk = false
  const asked: string[] = []
  on('tool.call', { tool: 'AskUserQuestion' }, async ($$, e) => {
    const q = e.questions[0]?.question ?? ''
    asked.push(q)
    // 问题开着的时候，用户在别处按了「全部关闭」，然后才回答
    if (offAtAsk) await probeRun($, 'off')
    return { result: { questions: e.questions, answers: { [q]: '再来 25 分钟' } } }
  })
  on('ui.render', { component: 'AbovePrompt' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const band = await mountChecked($, { ...BAND, surface: 'terminal' })

  // 到点、去胶囊的那一刻按下：不提示、不问
  await $.command.run({ command: 'lemo-mod', args: '番茄 1' } as never)
  offAtBadge = true
  await clock.advance(MIN)
  await clock.settle()
  expect(offAtBadge).toBe(false)
  expect(asked).toEqual([])
  expect((await lemoCalls($)).filter(c => c.op === 'notice' || c.op === 'say')).toEqual([])

  // 问题开着时按下：回答「再来」也不再计时
  badges.length = 0
  await $.command.run({ command: 'lemo-mod', args: '番茄 1' } as never)
  offAtAsk = true
  await clock.advance(MIN)
  await clock.settle()
  expect(asked).toHaveLength(1)
  expect(badges).toEqual([{ zh: '番茄', en: 'Focus' }, null])
  await clock.advance(30 * MIN)
  expect(asked).toHaveLength(1)
  await band.unmount()
})
