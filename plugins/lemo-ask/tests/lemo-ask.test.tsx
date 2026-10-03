import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import type { On } from 'claude-code'

import { testCore } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

// 测试的 $ 上没有 $.lemo（lemo-core 把它加在插件的 $ 上）：借一个内联插件的命令去调安全页用的三个方法。
// /safety-probe caps | toggle <JSON> | off，回复是结果的 JSON
const safety: Plugin = {
  name: 'safety-probe',
  register(on) {
    on('command.run', { command: 'safety-probe' }, async ($, e) => {
      const [op = '', ...rest] = e.args.split(' ')
      if (op === 'caps') return { text: JSON.stringify(await $.lemo.caps({})) }
      if (op === 'toggle') return { text: JSON.stringify(await $.lemo.toggle(JSON.parse(rest.join(' ')) as never)) }
      if (op === 'off') await $.lemo.off({})
      return { text: 'null' }
    })
  },
}
type CapRow = { mod: string; id: string; kind: string; on: boolean; manual?: boolean; title: { zh: string; en: string }; desc: { zh: string; en: string } }
const probe = async ($: Engine, args: string) => JSON.parse(((await $.command.run({ command: 'safety-probe', args } as never)) as { text: string }).text) as unknown
const capsOf = async ($: Engine) => (await probe($, 'caps')) as CapRow[]
const toggle = async ($: Engine, t: { mod: string; id: string; on: boolean }) => (await probe($, `toggle ${JSON.stringify(t)}`)) as boolean
const allOff = async ($: Engine) => {
  await probe($, 'off')
}

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

const Q = (question: string) => ({ question, header: '测试', options: [{ label: 'A', description: 'a' }, { label: 'B', description: 'b' }], multiSelect: false })

test('提问弹窗：两个界面都在原弹窗上面加中性抬头，弹窗本身照引擎画', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 测试里替引擎画原来的弹窗：ref 0 表示按原样画
  on('ui.render', { component: 'AskUserQuestion' }, async () => ({ type: 'engine', ref: 0 }) as const)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, {
      plugin: 'lemo-ask',
      surface,
      component: 'AskUserQuestion',
      props: { tool: 'AskUserQuestion', questions: [Q('选哪个？')] },
    } as never)
    // 假核心的风格没有 words，显示的是中性的默认文字；编号读 lemo-core 的 seq，假核心没写过是 T00
    const tag = await ui.find({ type: 'Text', text: '? 提问 · T00' })
    expect(tag).toBeDefined()
    // 抬头用强调色底、onAccent 字（假核心是柠檬实验室的颜色）
    expect(tag?.props.backgroundColor).toBe('#F2CF1D')
    expect(tag?.props.color).toBe('#1B1D1F')
    expect(await ui.find({ type: 'Text', text: '共 1 个问题' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /实验提问/ })).toBeUndefined()
    // 引擎自己的弹窗正好出现一次
    expect(JSON.stringify(await ui.drawn()).split('"type":"engine"').length - 1).toBe(1)
    await ui.unmount()
  }
})

test('提问弹窗：柠檬实验室风格的词换成「实验提问」', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  on('ui.render', { component: 'AskUserQuestion' }, async () => ({ type: 'engine', ref: 0 }) as const)
  // 假核心的风格没有 words：在 $.lemo.style 上补一条，和风格包 words/lemo-ask.ts 里的一样
  on('lemo.style', async ($$, e, next) => {
    const r = await next(e)
    if (r.value === undefined) return r
    return { value: { ...r.value, words: { ...r.value.words, 'lemo-ask.title': { zh: '实验提问', en: 'Lab question' } } } }
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, {
      plugin: 'lemo-ask',
      surface,
      component: 'AskUserQuestion',
      props: { tool: 'AskUserQuestion', questions: [Q('选哪个？')] },
    } as never)
    expect(await ui.find({ type: 'Text', text: '? 实验提问 · T00' })).toBeDefined()
    await ui.unmount()
  }
})

test('提问弹窗：英文界面，两个问题用复数', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  on('ui.render', { component: 'AskUserQuestion' }, async () => ({ type: 'engine', ref: 0 }) as const)
  // 界面语言：lemo-core 的状态在测试里没写过，lemo-ask 会问 $.lemo.lang，这里让它答英文
  on('lemo.lang', async () => ({ value: 'en' as const }))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, {
      plugin: 'lemo-ask',
      surface,
      component: 'AskUserQuestion',
      props: { tool: 'AskUserQuestion', questions: [Q('Which one?'), Q('And this?')] },
    } as never)
    expect(await ui.find({ type: 'Text', text: '? Question · T00' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '2 questions' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /提问|问题/ })).toBeUndefined()
    await ui.unmount()
  }
})

// 画一次提问弹窗，回答抬头在不在
async function hasHeader($: Engine, surface: 'terminal' | 'desktop'): Promise<boolean> {
  const ui = await mountChecked($, { plugin: 'lemo-ask', surface, component: 'AskUserQuestion', props: { tool: 'AskUserQuestion', questions: [Q('选哪个？')] } } as never)
  const has = (await ui.find({ type: 'Text', text: /提问\s·\sT\d\d/ })) !== undefined
  // 不管加没加抬头，引擎自己的弹窗都正好出现一次
  expect(JSON.stringify(await ui.drawn()).split('"type":"engine"').length - 1).toBe(1)
  await ui.unmount()
  return has
}

test('安全页：一行外观「提问弹窗标题」，装上就开；关掉后弹窗照原样，存进 $.store；「全部关闭」不碰它', { plugins: [testCore, safety] }, async ($, on) => {
  mock.clock(on)
  const kv = new Map<string, unknown>()
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  on('ui.render', { component: 'AskUserQuestion' }, async () => ({ type: 'engine', ref: 0 }) as const)
  const rows = (await capsOf($)).filter(c => c.mod === 'lemo-ask')
  expect(rows.map(c => [c.id, c.kind, c.on, c.manual === true])).toEqual([['look', 'look', true, false]])
  expect(rows[0]?.desc.zh).not.toBe('')
  expect(rows[0]?.desc.en).not.toBe('')
  expect(await toggle($, { mod: 'lemo-ask', id: 'look', on: false })).toBe(true)
  expect(kv.get('look')).toBe(false)
  for (const surface of ['terminal', 'desktop'] as const) expect(await hasHeader($, surface)).toBe(false)
  expect((await capsOf($)).find(c => c.mod === 'lemo-ask')?.on).toBe(false)
  await toggle($, { mod: 'lemo-ask', id: 'look', on: true })
  await allOff($)
  expect(await hasHeader($, 'desktop')).toBe(true)
  // 别的 mod 的开关、认不出的 id 不管
  expect(await toggle($, { mod: 'lemo-ask', id: 'nope', on: false })).toBe(false)
  expect(await hasHeader($, 'terminal')).toBe(true)
})

test('开会话时读回存下来的开关：关过的抬头还是关的', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { look: false })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('ui.render', { component: 'AskUserQuestion' }, async () => ({ type: 'engine', ref: 0 }) as const)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(await hasHeader($, 'terminal')).toBe(false)
})

test('安全：刚装上（存档全空）只加抬头，别的什么都不做：不写文件、不起程序、不联网、不调模型、不出声、不替你回答', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const did = watchActs(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async () => ({ text: '' }))
  on('ui.render', { component: 'AskUserQuestion' }, async () => ({ type: 'engine', ref: 0 }) as const)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  for (const surface of ['terminal', 'desktop'] as const) expect(await hasHeader($, surface)).toBe(true)
  await $.turn.complete({ turnId: 't', answer: '', durationMs: 1000, isAborted: false } as never)
  expect(did).toEqual([])
})
