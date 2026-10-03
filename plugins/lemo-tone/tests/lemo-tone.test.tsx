import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import { lemoCalls, testCore, testSay } from './shared/test-core'
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
const capsOf = async ($: Engine) => ((await probeRun($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-tone')
const toggle = async ($: Engine, id: string, isOn: boolean) => probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-tone', id, on: isOn }))

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-tone',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

type Badge = { id: string; text: unknown; tone: string }

test('简短模式：命令开关，打开时加「简短」胶囊，关掉时去掉', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const badges: Badge[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e as Badge)
    return next(e)
  })
  const first = await $.command.run({ command: 'lemo-mod', args: '简短' } as never)
  expect(JSON.stringify(first)).toContain('已开启')
  expect(badges.at(-1)).toEqual({ id: 'tone-brief', text: { zh: '简短', en: 'brief' }, tone: 'grey' })
  const second = await $.command.run({ command: 'lemo-mod', args: '简短' } as never)
  expect(JSON.stringify(second)).toContain('已关闭')
  expect(badges.at(-1)).toEqual({ id: 'tone-brief', text: null, tone: 'grey' })
})

test('简短模式：只给用户本人的消息附要求，用户的文字原样不动', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const seen: { text: string; context: readonly string[] }[] = []
  on('prompt.submit', async ($$, e) => {
    seen.push({ text: e.text, context: e.context ?? [] })
    return { text: e.text }
  })
  await $.prompt.submit({ text: '关着', origin: { kind: 'composer' } } as never)
  await $.command.run({ command: 'lemo-mod', args: '简短' } as never)
  await $.prompt.submit({ text: '打开了', origin: { kind: 'composer' } } as never)
  await $.prompt.submit({ text: '后台通知', origin: { kind: 'task-notification' } } as never)
  expect(seen.map(s => s.text)).toEqual(['关着', '打开了', '后台通知'])
  expect(seen[0]?.context.join(' ')).not.toContain('three sentences')
  expect(seen[1]?.context.join(' ')).toContain('three sentences')
  expect(seen[2]?.context.join(' ')).not.toContain('three sentences')
})

test('口吻：关掉后的下一条消息附一句「已经关了」，再下一条就不附', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 测试里替 lemo-core 画面板里层（假核心不画面板）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const seen: (readonly string[])[] = []
  on('prompt.submit', async ($$, e) => {
    seen.push(e.context ?? [])
    return { text: e.text }
  })
  await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  await ui.press({ key: 'tone-voice' })
  await $.prompt.submit({ text: '第一条', origin: { kind: 'composer' } } as never)
  await ui.press({ key: 'tone-voice' })
  // 插件发来的消息不附，那一句留给用户的下一条
  await $.prompt.submit({ text: '插件的提醒', origin: { kind: 'plugin', name: 'lemo-watch' } } as never)
  await $.prompt.submit({ text: '第二条', origin: { kind: 'composer' } } as never)
  await $.prompt.submit({ text: '第三条', origin: { kind: 'composer' } } as never)
  await ui.unmount()
  const joined = seen.map(c => c.join(' '))
  expect(joined[0]).toContain('voice is on')
  expect(joined[1]).not.toContain('voice')
  expect(joined[2]).toContain('voice is now off')
  expect(joined[3]).not.toContain('voice')
})

test('中英文：英文命令回英文，中文命令回中文；胶囊和面板跟着换', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 测试里替 lemo-core 画面板里层（假核心不画面板）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const badges: Badge[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e as Badge)
    return next(e)
  })
  // 命令里的英文词不换语言：先当成用户发了一条英文消息
  await testSay($, 'say hi in one word')
  const r = await $.command.run({ command: 'lemo-mod', args: 'brief' } as never)
  expect(JSON.stringify(r)).toContain('Brief mode is on')
  expect(badges.at(-1)?.text).toEqual({ zh: '简短', en: 'brief' })
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Brief mode/ })).toBeDefined()
  expect(await ui.find({ key: 'tone-brief', text: /On · click to turn off/ })).toBeDefined()
  await ui.unmount()
  await testSay($, '换回中文说话')
  const zh = await $.command.run({ command: 'lemo-mod', args: '简短' } as never)
  expect(JSON.stringify(zh)).toContain('简短模式已关闭')
})

test('不认的词交给里层，简短模式不动', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const seen: (readonly string[])[] = []
  on('prompt.submit', async ($$, e) => {
    seen.push(e.context ?? [])
    return { text: e.text }
  })
  // 假核心不认「番茄」，回空对象；lemo-tone 自己处理的话会回一句话
  const r = await $.command.run({ command: 'lemo-mod', args: '番茄 25' } as never)
  expect(r).toEqual({})
  await $.prompt.submit({ text: '还是关着', origin: { kind: 'composer' } } as never)
  expect(seen[0]).toEqual([])
})

test('风格的文字：卡片标题、模式标签、给模型的要求都换成风格里的', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  // 替假核心换一包带文字的风格（假核心的风格没有文字）
  // 插件加的方法也是事件：next(e) 拿到的是 { value: 风格 }，改了 words 再交回去
  on('lemo.style', async ($$, e, next) => {
    const r = await next(e)
    if (r.value === undefined) return r
    const ON = 'Styled voice is on.'
    const OFF = 'Styled voice is now off.'
    return {
      value: {
        ...r.value,
        words: {
          'lemo-tone.voiceTitle': { zh: '风格口吻', en: 'Styled voice' },
          'lemo-tone.voiceDesc': { zh: '风格的说明', en: 'Styled desc' },
          'lemo-tone.voiceMode': { zh: '风格标签', en: 'styled' },
          'lemo-tone.voicePrompt': { zh: ON, en: ON },
          'lemo-tone.voiceOffPrompt': { zh: OFF, en: OFF },
        },
      },
    }
  })
  let modes: readonly string[] = []
  on('ui.render', { component: 'SessionMode' }, async ($$, e) => {
    modes = e.props.modes
    return { type: 'engine', ref: 0 } as const
  })
  const seen: (readonly string[])[] = []
  on('prompt.submit', async ($$, e) => {
    seen.push(e.context ?? [])
    return { text: e.text }
  })
  await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ type: 'Text', text: /风格口吻/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /风格的说明/ })).toBeDefined()
    await ui.unmount()
  }
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  await ui.press({ key: 'tone-voice' })
  const mode = await mountChecked($, { plugin: 'lemo-tone', surface: 'terminal', component: 'SessionMode', props: { modes: [] } } as never)
  expect(modes).toEqual(['风格标签'])
  await mode.unmount()
  await $.prompt.submit({ text: '开着', origin: { kind: 'composer' } } as never)
  await ui.press({ key: 'tone-voice' })
  await $.prompt.submit({ text: '刚关', origin: { kind: 'composer' } } as never)
  await ui.unmount()
  expect(seen[0]).toEqual(['Styled voice is on.'])
  expect(seen[1]).toEqual(['Styled voice is now off.'])
})

test('面板：两个界面都画出「常用」页的简短模式卡片和「行为」页的口吻卡片', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 测试里替 lemo-core 画面板里层（假核心不画面板）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  for (const surface of ['terminal', 'desktop'] as const) {
    await $.command.run({ command: 'lemo-mod', args: '常用' } as never)
    const main = await mountChecked($, { ...HUB, surface })
    expect(await main.find({ type: 'Text', text: /简短模式/ })).toBeDefined()
    expect(await main.find({ key: 'tone-brief', text: /打开/ })).toBeDefined()
    expect(await main.find({ key: 'tone-voice' })).toBeUndefined()
    await main.press({ key: 'tone-brief' })
    expect(await main.find({ key: 'tone-brief', text: /已开/ })).toBeDefined()
    await main.press({ key: 'tone-brief' })
    await main.unmount()

    await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
    const behave = await mountChecked($, { ...HUB, surface })
    // 假核心的风格没有文字，显示的是中性的默认名字
    expect(await behave.find({ type: 'Text', text: /记录口吻/ })).toBeDefined()
    expect(await behave.find({ key: 'tone-voice' })).toBeDefined()
    expect(await behave.find({ key: 'tone-brief' })).toBeUndefined()
    await behave.unmount()

    // 别的分页没有卡片
    await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
    const bg = await mountChecked($, { ...HUB, surface })
    expect(await bg.find({ key: 'tone-brief' })).toBeUndefined()
    expect(await bg.find({ key: 'tone-voice' })).toBeUndefined()
    await bg.unmount()
  }
})

test('模式标签：打开的开关加在后面，原来的标签留着', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 测试里替 lemo-core 画面板里层（假核心不画面板）
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  let modes: readonly string[] = []
  on('ui.render', { component: 'SessionMode' }, async ($$, e) => {
    modes = e.props.modes
    return { type: 'engine', ref: 0 } as const
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const off = await mountChecked($, { plugin: 'lemo-tone', surface, component: 'SessionMode', props: { modes: ['focus'] } } as never)
    expect(modes).toEqual(['focus'])
    await off.unmount()
  }
  await $.command.run({ command: 'lemo-mod', args: '简短' } as never)
  await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'tone-voice' })
  await ui.unmount()
  for (const surface of ['terminal', 'desktop'] as const) {
    const mode = await mountChecked($, { plugin: 'lemo-tone', surface, component: 'SessionMode', props: { modes: ['focus'] } } as never)
    expect(modes).toEqual(['focus', '简短', '记录口吻'])
    await mode.unmount()
  }
})

test('简短模式、口吻记在 $.store 里：新会话开始时照样开着，简短模式的胶囊也挂上', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { brief: true, voice: true })
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  const badges: Badge[] = []
  on('lemo.badge', async ($$, e, next) => {
    badges.push(e as Badge)
    return next(e)
  })
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  expect(badges.at(-1)?.text).toEqual({ zh: '简短', en: 'brief' })
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ key: 'tone-brief', text: /已开/ })).toBeDefined()
  // 关掉也记下来
  await ui.press({ key: 'tone-brief' })
  await ui.unmount()
  const again = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await again.find({ key: 'tone-brief', text: /^打开$/ })).toBeDefined()
  await again.unmount()
})

test('安全：刚装上不往消息里加话、不挂胶囊和模式标签；在安全页打开以后才加，「全部关闭」后不再加', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const seen: (readonly string[])[] = []
  on('prompt.submit', async ($$, e) => {
    seen.push(e.context ?? [])
    return { text: e.text }
  })
  let modes: readonly string[] = []
  on('ui.render', { component: 'SessionMode' }, async ($$, e) => {
    modes = e.props.modes
    return { type: 'engine', ref: 0 } as const
  })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  await $.prompt.submit({ text: '第一条', origin: { kind: 'composer' } } as never)
  await $.turn.complete({ answer: '好', isAborted: false, durationMs: 10, turnId: 't1', reason: 'answer' })
  await clock.advance(1000)
  expect(seen).toEqual([[]])
  const mode = await mountChecked($, { plugin: 'lemo-tone', surface: 'terminal', component: 'SessionMode', props: { modes: [] } } as never)
  expect(modes).toEqual([])
  await mode.unmount()
  expect((await lemoCalls($)).filter(c => c.op === 'badge' && (c.input as { text: unknown }).text !== null)).toEqual([])
  // 安全页上两行，都是「附加提示」，装上时关着
  expect((await capsOf($)).map(c => [c.id, c.kind, c.on])).toEqual([['brief', 'prompt', false], ['voice', 'prompt', false]])

  // 打开简短模式：下一条才附要求
  expect(await toggle($, 'brief', true)).toBe(true)
  await $.prompt.submit({ text: '第二条', origin: { kind: 'composer' } } as never)
  expect(seen[1]?.join(' ')).toContain('three sentences')
  // 「全部关闭」：都关；口吻本来就关着，不附「已经关了」那一句
  await probeRun($, 'off')
  expect((await capsOf($)).map(c => c.on)).toEqual([false, false])
  await $.prompt.submit({ text: '第三条', origin: { kind: 'composer' } } as never)
  expect(seen[2]).toEqual([])
  // 认不出的 id 不认
  expect(await toggle($, 'loud', true)).toBe(false)
})

test('安全：在安全页打开口吻、再关掉，下一条附一句「已经关了」；卡片上的按钮跟着变', { plugins: [testCore, probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const seen: (readonly string[])[] = []
  on('prompt.submit', async ($$, e) => {
    seen.push(e.context ?? [])
    return { text: e.text }
  })
  await toggle($, 'voice', true)
  await $.command.run({ command: 'lemo-mod', args: '行为' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(await ui.find({ key: 'tone-voice', text: /已开/ })).toBeDefined()
  await $.prompt.submit({ text: '开着', origin: { kind: 'composer' } } as never)
  await toggle($, 'voice', false)
  expect(await ui.find({ key: 'tone-voice', text: /^打开$/ })).toBeDefined()
  await ui.unmount()
  await $.prompt.submit({ text: '刚关', origin: { kind: 'composer' } } as never)
  await $.prompt.submit({ text: '再一条', origin: { kind: 'composer' } } as never)
  expect(seen[0]?.join(' ')).toContain('voice is on')
  expect(seen[1]?.join(' ')).toContain('voice is now off')
  expect(seen[2]).toEqual([])
})

test('别的会话里关掉了（$.store 是共用的）：这个会话的下一条也不再附要求，口吻关掉照样附一句「已经关了」；安全页照 $.store 报', { plugins: [testCore, probe] }, async ($, on) => {
  mock.clock(on)
  const kv = new Map<string, unknown>([['brief', true], ['voice', true]])
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  const seen: (readonly string[])[] = []
  on('prompt.submit', async ($$, e) => {
    seen.push(e.context ?? [])
    return { text: e.text }
  })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: '开着', origin: { kind: 'composer' } } as never)
  expect(seen[0]?.join(' ')).toContain('three sentences')
  expect(seen[0]?.join(' ')).toContain('voice is on')
  // 别的会话按了「全部关闭」：只改了共用的存档
  kv.set('brief', false)
  kv.set('voice', false)
  expect((await capsOf($)).map(c => c.on)).toEqual([false, false])
  await $.prompt.submit({ text: '刚关', origin: { kind: 'composer' } } as never)
  await $.prompt.submit({ text: '再一条', origin: { kind: 'composer' } } as never)
  expect(seen[1]?.join(' ')).not.toContain('three sentences')
  expect(seen[1]?.join(' ')).toContain('voice is now off')
  expect(seen[2]).toEqual([])
})
