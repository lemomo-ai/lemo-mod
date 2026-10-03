import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import { engineBottom, lemoCalls, testCore, testSay } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-watch',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

type Badge = { id: string; text: unknown; tone: string; endsAt?: number | null }

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
const capsOf = async ($: Engine) => ((await probeRun($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-watch')

test('卡片：两个界面都画出「定时提醒」和「30 秒后提醒」按钮', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 测试里替 lemo-core 画面板里层（假核心不画面板）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ type: 'Text', text: /定时提醒/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /30\s秒后请\sClaude\s汇报进度/ })).toBeDefined()
    expect(await ui.find({ key: 'watch-set' })).toBeDefined()
    expect(await ui.find({ key: 'watch-cancel' })).toBeUndefined()
    await ui.unmount()
  }
})

test('卡片按钮：计时时说明显示剩余时间、加胶囊；取消后胶囊去掉，到点也不发消息', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  // 测试里替 lemo-core 画面板里层（假核心不画面板）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const badges: Badge[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e)
    return next(e)
  })
  const sent: string[] = []
  on('prompt.submit', async ($$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    await ui.press({ key: 'watch-set' })
    expect(await ui.find({ key: 'watch-cancel' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /剩余\s00:30/ })).toBeDefined()
    expect(badges.at(-1)).toMatchObject({ id: 'watch', text: { zh: '提醒', en: 'Reminder' }, tone: 'accent', endsAt: clock.now() + 30_000 })
    await clock.advance(10_000)
    await ui.press({ key: 'watch-cancel' })
    expect(badges.at(-1)).toMatchObject({ id: 'watch', text: null })
    expect(await ui.find({ key: 'watch-set' })).toBeDefined()
    await clock.advance(60_000)
    expect(sent).toEqual([])
    await ui.unmount()
  }
})

test('命令「提醒 10」：加胶囊；到点发出以 ⏰ 开头的消息，胶囊去掉，出提示、放音效', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  // 测试里替 lemo-core 画面板里层（假核心不画面板）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const badges: Badge[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e)
    return next(e)
  })
  const notices: string[] = []
  on('lemo.notice', async ($$, e, next) => {
    notices.push(`${e.tone}:${e.text}`)
    return next(e)
  })
  const sounds: string[] = []
  on('lemo.play', async ($$, e, next) => {
    sounds.push(e.sound)
    return next(e)
  })
  const sent: string[] = []
  on('prompt.submit', async ($$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })

  const r = await $.command.run({ command: 'lemo-mod', args: '提醒 10' } as never)
  expect((r as { text?: string }).text).toBe('已设置：10 秒后请 Claude 汇报进度。')
  expect(badges.at(-1)).toMatchObject({ id: 'watch', text: { zh: '提醒', en: 'Reminder' }, tone: 'accent', endsAt: 10_000 })

  await clock.advance(9_000)
  expect(sent).toEqual([])
  await clock.advance(1_000)
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatch(/^⏰ /)
  expect(sent[0]).toBe('⏰ 提醒：10 秒到了。请用一两句话告诉用户现在进展到哪了、下一步做什么。')
  expect(badges.at(-1)).toMatchObject({ id: 'watch', text: null })
  expect(notices).toEqual(['accent:已发送提醒，Claude 开始汇报'])
  expect(sounds).toEqual(['done'])

  // 到点以后卡片回到原样
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ key: 'watch-set' })).toBeDefined()
  await ui.unmount()
})

test('命令：回复跟着界面语言（命令里的英文词不换语言）；最少 5 秒，不带数字默认 30；再定一个会换掉前一个', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const sent: string[] = []
  on('prompt.submit', async ($$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  const badges: Badge[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e)
    return next(e)
  })

  // 命令里的英文词不换语言；用户发了英文消息，回复和发给 Claude 的提醒才是英文
  const zh = await $.command.run({ command: 'lemo-mod', args: 'remind 2' } as never)
  expect((zh as { text?: string }).text).toContain('5 秒后')
  await testSay($, 'say hi in one word')
  const r = await $.command.run({ command: 'lemo-mod', args: 'remind 2' } as never)
  expect((r as { text?: string }).text).toBe('Set: Claude will be asked for a progress update in 5 seconds.')
  expect(badges.at(-1)).toMatchObject({ text: { zh: '提醒', en: 'Reminder' }, endsAt: 5_000 })
  await clock.advance(5_000)
  expect(sent).toEqual(['⏰ Reminder: 5 seconds are up. In one or two sentences, tell the user where things stand and what comes next.'])

  // 不带数字：30 秒。中途再定一个 10 秒的，前一个作废，只发一条
  await testSay($, '换回中文说话')
  const r2 = await $.command.run({ command: 'lemo-mod', args: '提醒' } as never)
  expect((r2 as { text?: string }).text).toContain('30 秒后')
  await clock.advance(1_000)
  await $.command.run({ command: 'lemo-mod', args: '提醒 10' } as never)
  await clock.advance(60_000)
  expect(sent).toHaveLength(2)
  expect(sent[1]).toMatch(/^⏰ 提醒：10 秒到了/)
})

test('命令：不认的词交给里层，不定提醒', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const badges: Badge[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e)
    return next(e)
  })
  const r = await $.command.run({ command: 'lemo-mod', args: '番茄 25' } as never)
  expect((r as { text?: string }).text).toBeUndefined()
  expect(badges).toEqual([])
})

test('别的分页：不画提醒卡片', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 测试里替 lemo-core 画面板里层（假核心不画面板）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ key: 'watch-set' })).toBeUndefined()
  await ui.unmount()
})

test('报到：常用页、命令词；会话重新开始（热重载）时按剩下的时间接着等，只发一次', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  // 测试里替引擎答 session.start
  on('session.start', async () => ({ cwd: '/tmp' }))
  const joined: { mod: string; tabs: readonly string[]; commands?: { zh: readonly string[]; en: readonly string[] } }[] = []
  on('lemo.join', async ($$, e, next) => {
    joined.push(e)
    return next(e)
  })
  const sent: string[] = []
  on('prompt.submit', async ($$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  await $.session.start({ cwd: '/tmp', surface: 'terminal' } as never)
  expect(joined.at(-1)).toMatchObject({ mod: 'lemo-watch', tabs: ['main'], commands: { zh: ['提醒 30'], en: ['remind 30'] } })

  await $.command.run({ command: 'lemo-mod', args: '提醒 30' } as never)
  await clock.advance(10_000)
  await $.session.start({ cwd: '/tmp', surface: 'terminal' } as never)
  await clock.advance(19_000)
  expect(sent).toEqual([])
  await clock.advance(1_000)
  expect(sent).toHaveLength(1)
  await clock.advance(60_000)
  expect(sent).toHaveLength(1)
})

test('到点那一刻消息被别的 hook 拦下：不说「已发出」，也不响', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('prompt.submit', async () => ({ drop: '被拦下了' }))
  engineBottom(on)
  await $.command.run({ command: 'lemo-mod', args: '提醒 5' } as never)
  await clock.advance(5_000)
  const calls = await lemoCalls($)
  expect(calls.filter(c => c.op === 'badge').at(-1)?.input).toMatchObject({ id: 'watch', text: null })
  expect(calls.some(c => c.op === 'notice' || c.op === 'play')).toBe(false)
})

/**
 * 模拟 mod 关了一阵、电脑睡了一觉：提醒的状态由测试接管，一开始就留着一个 at 到点的 5 秒提醒。
 * 读写都走这里（写要能落下，到点时才能把它清掉）
 */
function staleRemind(on: On, at: number) {
  let cur: { value: unknown; version: number } = { value: { at, sec: 5 }, version: 1 }
  on('state.get', { plugin: 'lemo-watch', key: 'remind' }, async () => ({ value: cur }) as never)
  on('state.set', { plugin: 'lemo-watch', key: 'remind' }, async ($$, e) => {
    cur = { value: (e as unknown as { value: unknown }).value, version: cur.version + 1 }
    return { value: { isSet: true, version: cur.version } } as never
  })
}

test('恢复时过点 10 分钟以内：照常发提醒', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: 20 * 60_000 })
  mock.store(on)
  const sent: string[] = []
  on('prompt.submit', async ($$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  staleRemind(on, 20 * 60_000 - 9 * 60_000)
  engineBottom(on)
  await $.session.start({ cwd: '/tmp', surface: 'terminal' } as never)
  await clock.advance(1_000)
  expect(sent).toHaveLength(1)
  expect((await lemoCalls($)).filter(c => c.op === 'badge').at(-1)?.input).toMatchObject({ id: 'watch', text: null })
})

test('恢复时过点超过 10 分钟：不发，去掉胶囊，横条上说一句已过期', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on, { now: 20 * 60_000 })
  mock.store(on)
  const sent: string[] = []
  on('prompt.submit', async ($$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  staleRemind(on, 20 * 60_000 - 11 * 60_000)
  engineBottom(on)
  await $.session.start({ cwd: '/tmp', surface: 'terminal' } as never)
  await clock.advance(10_000)
  expect(sent).toEqual([])
  const calls = await lemoCalls($)
  expect(calls.filter(c => c.op === 'badge').at(-1)?.input).toMatchObject({ id: 'watch', text: null })
  expect(calls.filter(c => c.op === 'notice').map(c => (c.input as { text: string }).text)).toEqual(['提醒已超时 10 分钟以上，本次不发送'])
})

test('安全：刚装上什么都不做——开会话、跑一轮、等十分钟，不替你发消息、不挂胶囊、不出声；安全页上列一行「手动触发」', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
  const sent: string[] = []
  on('prompt.submit', async ($$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  await $.turn.complete({ answer: '好', isAborted: false, durationMs: 10, turnId: 't1', reason: 'answer' })
  await clock.advance(10 * 60_000)
  expect(sent).toEqual([])
  expect((await lemoCalls($)).filter(c => ['badge', 'notice', 'play', 'say'].includes(c.op))).toEqual([])
  // 「代你操作」，但只在你点了以后：manual，没有开关，on 总是 false
  const caps = await capsOf($)
  expect(caps.map(c => [c.id, c.kind, c.on, c.manual])).toEqual([['remind', 'act', false, true]])
  expect(caps[0]?.desc.zh).toContain('代你给 Claude 发消息')
  // 安全页上没有开关：按了也不认；「全部关闭」不出错
  expect(await probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-watch', id: 'remind', on: true }))).toBe(false)
  await probeRun($, 'off')
  await clock.advance(60_000)
  expect(sent).toEqual([])
  // 用户自己定了提醒，到点才发
  await $.command.run({ command: 'lemo-mod', args: '提醒 5' } as never)
  await clock.advance(5_000)
  expect(sent).toHaveLength(1)
  // 「全部关闭」顺带取消正在等的提醒：胶囊去掉，到点也不发
  await $.command.run({ command: 'lemo-mod', args: '提醒 30' } as never)
  await probeRun($, 'off')
  expect((await lemoCalls($)).filter(c => c.op === 'badge').at(-1)?.input).toMatchObject({ id: 'watch', text: null })
  await clock.advance(60_000)
  expect(sent).toHaveLength(1)
})

test('「全部关闭」：到点那一下已经把提醒清掉、还没发出去时按下，也不发', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const sent: string[] = []
  on('prompt.submit', async ($$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  // 到点后 mod 先去掉胶囊、再发消息：去胶囊的那一刻用户按了「全部关闭」
  let armed = false
  on('lemo.badge', async ($$, e, next) => {
    if (armed && e.text === null) {
      armed = false
      await probeRun($, 'off')
    }
    return next(e)
  })
  await $.command.run({ command: 'lemo-mod', args: '提醒 5' } as never)
  armed = true
  await clock.advance(5_000)
  await clock.settle()
  expect(armed).toBe(false)
  expect(sent).toEqual([])
  expect((await lemoCalls($)).filter(c => c.op === 'notice' || c.op === 'play')).toEqual([])
  // 之后再定一个照常发
  await $.command.run({ command: 'lemo-mod', args: '提醒 5' } as never)
  await clock.advance(5_000)
  expect(sent).toHaveLength(1)
})
