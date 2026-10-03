import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import type { On } from 'claude-code'

import { testCore } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

// lemo-core 扫描到的用户设置（假核心不扫，测试在最底层替它答）。spinnerVerbs：用户自己设了转圈文字
const scanned = (on: On, spinnerVerbs: boolean) =>
  on('state.get', { plugin: 'lemo-core', key: 'scan' }, async () => ({
    value: { value: { statusLine: false, spinnerVerbs, notif: null, outputStyle: null, theme: null }, version: 1 },
  }))

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

test('加载词：换成默认的词，后面带消息编号', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 用户自己没设转圈文字：默认换
  scanned(on, false)
  let shown = ''
  on('ui.render', { component: 'Spinner' }, async ($$, e) => {
    shown = `${e.props.word}${e.props.suffix}`
    return { type: 'engine', ref: 0 } as const
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { plugin: 'lemo-spinner', surface, component: 'Spinner', props: { word: 'Sauteing', message: null, suffix: '…', mode: 'thinking' } } as never)
    expect(shown).toBe('思考中… · T00')
    await ui.unmount()
  }
})

// 画一次加载词，取回 lemo-spinner 改过的「词 + 后缀」（测试在最底层接住 Spinner，记下传到这里的 props）
async function shownOn($: Engine, surface: 'terminal' | 'desktop', seen: { text: string }): Promise<string> {
  const ui = await mountChecked($, { plugin: 'lemo-spinner', surface, component: 'Spinner', props: { word: 'Sauteing', message: null, suffix: '…', mode: 'thinking' } } as never)
  await ui.unmount()
  return seen.text
}

test('编号前进：第几条消息就用第几个词（超过词数从头轮），后缀是消息编号', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 用户自己没设转圈文字：默认换
  scanned(on, false)
  // 假核心不记编号：在最底层替 lemo-core 答 seq
  let seq = 3
  on('state.get', { plugin: 'lemo-core', key: 'seq' }, async () => ({ value: { value: seq, version: 1 } }))
  const seen = { text: '' }
  on('ui.render', { component: 'Spinner' }, async ($$, e) => {
    seen.text = `${e.props.word}${e.props.suffix}`
    return { type: 'engine', ref: 0 } as const
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    seq = 3
    expect(await shownOn($, surface, seen)).toBe('推敲中… · T03')
    seq = 4
    expect(await shownOn($, surface, seen)).toBe('检查中… · T04')
    // 默认 6 个词：第 7 条轮回第 1 个
    seq = 7
    expect(await shownOn($, surface, seen)).toBe('处理中… · T07')
  }
})

test('英文界面：换成英文的默认词', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 用户自己没设转圈文字：默认换
  scanned(on, false)
  on('lemo.lang', async () => ({ value: 'en' as const }))
  on('state.get', { plugin: 'lemo-core', key: 'seq' }, async () => ({ value: { value: 3, version: 1 } }))
  const seen = { text: '' }
  on('ui.render', { component: 'Spinner' }, async ($$, e) => {
    seen.text = `${e.props.word}${e.props.suffix}`
    return { type: 'engine', ref: 0 } as const
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    expect(await shownOn($, surface, seen)).toBe('Weighing… · T03')
  }
})

test('风格词：风格里写了加载词就用风格的（中英都跟着风格）', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 用户自己没设转圈文字：默认换
  scanned(on, false)
  // 假核心的风格没有 words：在 $.lemo.style 上补一条，和柠檬实验室 words/lemo-spinner.ts 里的一样
  on('lemo.style', async ($$, e, next) => {
    const r = await next(e)
    if (r.value === undefined) return r
    const more = {
      'lemo-spinner.words': {
        zh: ['观察中', '记录中', '滴定中', '校准中', '做对照', '冒泡中'],
        en: ['Observing', 'Recording', 'Titrating', 'Calibrating', 'Controlling', 'Fizzing'],
      },
    }
    return { value: { ...r.value, words: { ...r.value.words, ...more } } }
  })
  let lang: 'zh' | 'en' = 'zh'
  on('lemo.lang', async () => ({ value: lang }))
  on('state.get', { plugin: 'lemo-core', key: 'seq' }, async () => ({ value: { value: 2, version: 1 } }))
  const seen = { text: '' }
  on('ui.render', { component: 'Spinner' }, async ($$, e) => {
    seen.text = `${e.props.word}${e.props.suffix}`
    return { type: 'engine', ref: 0 } as const
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    lang = 'zh'
    expect(await shownOn($, surface, seen)).toBe('滴定中… · T02')
    lang = 'en'
    expect(await shownOn($, surface, seen)).toBe('Titrating… · T02')
  }
})

test('照你自己的设置：你设了转圈文字（spinnerVerbs）就不换；扫描还没到也先不换；按了开关以后照你的，存进 $.store', { plugins: [testCore, safety] }, async ($, on) => {
  mock.clock(on)
  const kv = new Map<string, unknown>()
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  let scan: { spinnerVerbs: boolean } | null = null
  on('state.get', { plugin: 'lemo-core', key: 'scan' }, async () => ({
    value: { value: scan === null ? null : { statusLine: false, spinnerVerbs: scan.spinnerVerbs, notif: null, outputStyle: null, theme: null }, version: 1 },
  }))
  const seen = { text: '' }
  on('ui.render', { component: 'Spinner' }, async ($$, e) => {
    seen.text = `${e.props.word}${e.props.suffix}`
    return { type: 'engine', ref: 0 } as const
  })
  // 扫描还没到：不换
  expect(await shownOn($, 'terminal', seen)).toBe('Sauteing…')
  // 你自己设了转圈文字：不换，安全页上写「关着」
  scan = { spinnerVerbs: true }
  for (const surface of ['terminal', 'desktop'] as const) expect(await shownOn($, surface, seen)).toBe('Sauteing…')
  expect((await capsOf($)).find(c => c.id === 'words')?.on).toBe(false)
  // 在安全页打开：换，记进 $.store
  expect(await toggle($, { mod: 'lemo-spinner', id: 'words', on: true })).toBe(true)
  expect(kv.get('words')).toBe(true)
  expect(await shownOn($, 'desktop', seen)).toBe('思考中… · T00')
  // 「全部关闭」不碰外观
  await allOff($)
  expect(await shownOn($, 'terminal', seen)).toBe('思考中… · T00')
  // 没设转圈文字的人关掉它：照原样
  scan = { spinnerVerbs: false }
  await toggle($, { mod: 'lemo-spinner', id: 'words', on: false })
  expect(kv.get('words')).toBe(false)
  expect(await shownOn($, 'terminal', seen)).toBe('Sauteing…')
  // 别的 mod 的开关、认不出的 id 不管
  expect(await toggle($, { mod: 'lemo-spinner', id: 'nope', on: true })).toBe(false)
})

test('能力清单：一行外观「加载词」，中英各一句；开会话时读回存下来的开关', { plugins: [testCore, safety] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { words: false })
  scanned(on, false)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  const row = async () => (await capsOf($)).filter(c => c.mod === 'lemo-spinner')
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  const rows = await row()
  expect(rows.map(c => [c.id, c.kind, c.on, c.manual === true])).toEqual([['words', 'look', false, false]])
  expect(rows[0]?.title.zh).toBe('加载词')
  expect(rows[0]?.desc.en).toContain('spinnerVerbs')
})

test('安全：刚装上（存档全空）只换加载词，别的什么都不做：不写文件、不起程序、不联网、不调模型、不出声', { plugins: [testCore, safety] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  scanned(on, false)
  const did = watchActs(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async () => ({ text: '' }))
  const seen = { text: '' }
  on('ui.render', { component: 'Spinner' }, async ($$, e) => {
    seen.text = `${e.props.word}${e.props.suffix}`
    return { type: 'engine', ref: 0 } as const
  })
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(await shownOn($, 'terminal', seen)).toBe('思考中… · T00')
  await $.turn.complete({ turnId: 't', answer: '', durationMs: 1000, isAborted: false } as never)
  expect(did).toEqual([])
  // 关掉以后照原样
  await toggle($, { mod: 'lemo-spinner', id: 'words', on: false })
  expect(await shownOn($, 'terminal', seen)).toBe('Sauteing…')
  expect(did).toEqual([])
})
