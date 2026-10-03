import { expect, mock, test } from 'claude-code/testing'
import type { Plugin } from 'claude-code/testing'
import { buttonHandles, mountChecked } from './shared/test-colors'
import { width } from '../hooks/shared/lemo'

// 测试里的 $ 只有引擎自己的方法，没有插件加的 $.lemo。用一个探针插件替测试调 $.lemo：
// /probe <方法> <JSON 参数>，回复是结果的 JSON
const probe: Plugin = {
  name: 'probe',
  register(on) {
    on('command.run', { command: 'probe' }, async ($, e) => {
      const i = e.args.indexOf(' ')
      const op = i < 0 ? e.args : e.args.slice(0, i)
      const arg = i < 0 ? {} : JSON.parse(e.args.slice(i + 1))
      // 校验规定 $ 上的方法要逐个写出来调用，不能当值传来传去
      let r: unknown = null
      if (op === 'join') r = await $.lemo.join(arg)
      else if (op === 'style') r = await $.lemo.style({})
      else if (op === 'lang') r = await $.lemo.lang({})
      else if (op === 'badge') r = await $.lemo.badge(arg)
      else if (op === 'notice') r = await $.lemo.notice(arg)
      else if (op === 'recall') r = await $.lemo.recall(arg)
      else if (op === 'caps') r = await $.lemo.caps({})
      else if (op === 'play') r = await $.lemo.play(arg)
      else if (op === 'say') r = await $.lemo.say(arg)
      else if (op === 'toggle') r = await $.lemo.toggle(arg)
      else if (op === 'off') r = await $.lemo.off({})
      else if (op === 'read-badges') r = (await $.state.get({ plugin: 'lemo-core', key: 'badges' })).value
      else if (op === 'read-notice') r = (await $.state.get({ plugin: 'lemo-core', key: 'notice' })).value
      else if (op === 'read-desk') r = (await $.state.get({ plugin: 'lemo-core', key: 'desk' })).value ?? null
      else if (op === 'read-numbers') r = { seq: (await $.state.get({ plugin: 'lemo-core', key: 'seq' })).value, turnNo: (await $.state.get({ plugin: 'lemo-core', key: 'turnNo' })).value, numbers: (await $.state.get({ plugin: 'lemo-core', key: 'numbers' })).value, replies: (await $.state.get({ plugin: 'lemo-core', key: 'replies' })).value }
      else return { text: 'no such method' }
      return { text: JSON.stringify(r ?? null) }
    })
    // 像别的 mod 一样接 /lemo-mod 后面自己的词（「探针」），不认的往下传
    on('lemo.command', async ($, e, next) => {
      if (e.args.trim() !== '探针') return next(e)
      return { value: { text: '探针收到' } }
    })
  },
}

const SCROLL = { offset: 0, bodyRows: 12 }
const HUB = {
  plugin: 'lemo-core',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

test('统一面板：两个界面都画出分页、风格卡片和已装的 mod', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    // 只有 lemo-core 自己时，只有「行为」「安全」两页（没有常用页，先显示行为页）
    expect(await ui.find({ key: 'tab-safe' })).toBeDefined()
    expect(await ui.find({ key: 'tab-behave' })).toBeDefined()
    expect(await ui.find({ key: 'tab-main' })).toBeUndefined()
    await ui.press({ key: 'tab-safe' })
    expect(await ui.find({ key: 'safe-ok' })).toBeDefined()
    await ui.press({ key: 'tab-behave' })
    expect(await ui.find({ key: 'style-lemon-lab' })).toBeDefined()
    expect(await ui.find({ key: 'style-plain' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /已装的\smod/ })).toBeDefined()
    await ui.unmount()
  }
})

test('报到：mod 报到后面板多出它的分页，并列出它装上就生效的事', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-x', title: { zh: '测试', en: 'Test' }, tabs: ['main'], always: { zh: ['自动做一件事'], en: ['Does a thing'] } }) } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ key: 'tab-main' })).toBeDefined()
  await ui.press({ key: 'tab-behave' })
  // 默认只列名字，按「展开说明」才展开（两个界面一样；展开的状态整个会话共用）
  expect(await ui.find({ type: 'Text', text: /测试/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /自动做一件事/ })).toBeUndefined()
  await ui.press({ key: 'core-mods-more' })
  expect(await ui.find({ type: 'Text', text: /自动做一件事/ })).toBeDefined()
  expect((await ui.find({ key: 'core-mods-more' }))?.props.label).toBe('收起')
  await ui.unmount()
  const desk = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(await desk.find({ type: 'Text', text: /自动做一件事/ })).toBeDefined()
  await desk.press({ key: 'core-mods-more' })
  expect(await desk.find({ type: 'Text', text: /自动做一件事/ })).toBeUndefined()
  expect((await desk.find({ key: 'core-mods-more' }))?.props.label).toBe('展开说明')
  await desk.unmount()
})

test('只在终端的 mod：桌面上不显示它的分页', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-y', title: { zh: '游戏', en: 'Game' }, tabs: ['game'], surfaces: ['terminal'] }) } as never)
  const term = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await term.find({ key: 'tab-game' })).toBeDefined()
  await term.unmount()
  const desk = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(await desk.find({ key: 'tab-game' })).toBeUndefined()
  await desk.unmount()
})

test('换风格：命令和按钮都能换，$.lemo.style 跟着变', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'style' } as never))).toContain('lemon-lab')
  const r = await $.command.run({ command: 'lemo-mod', args: '风格 plain' } as never)
  expect(JSON.stringify(r)).toContain('素色')
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'style' } as never))).toContain('\\"id\\":\\"plain')
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'tab-behave' })
  await ui.press({ key: 'style-lemon-lab' })
  await ui.unmount()
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'style' } as never))).toContain('lemon-lab')
  const bad = await $.command.run({ command: 'lemo-mod', args: '风格 nope' } as never)
  expect(JSON.stringify(bad)).toContain('没有「nope」')
})

test('换风格、换语言：面板开着时标题跟着换（用同一个 id 再 open 一次）', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  const titles: string[] = []
  let isOpen = false
  on('ui.open', async ($$, e) => {
    isOpen = true
    titles.push(e.title ?? '')
    return { value: { isPlaced: true } } as never
  })
  on('ui.panes', async () => ({ value: isOpen ? [{ id: 'lemo-mod', title: titles.at(-1) ?? '', isShown: true, isFocused: false, isPlaced: true }] : [] }) as never)
  on('prompt.submit', async ($$, e) => ({ text: e.text }))
  // 面板没开时换风格：不去开它
  await $.command.run({ command: 'lemo-mod', args: '风格 小锦鲤' } as never)
  expect(titles).toEqual([])
  await $.command.run({ command: 'lemo-mod', args: '' } as never)
  expect(titles.at(-1)).toBe('小锦鲤')
  await $.command.run({ command: 'lemo-mod', args: '风格 lemon-lab' } as never)
  expect(titles.at(-1)).toBe('Lemo 实验室')
  // 起了名字，标题也换
  await $.command.run({ command: 'lemo-mod', args: '起名 豆豆' } as never)
  expect(titles.at(-1)).toBe('豆豆')
  await $.command.run({ command: 'lemo-mod', args: '起名' } as never)
  expect(titles.at(-1)).toBe('Lemo 实验室')
  // 用户发英文消息换成英文界面，标题也换
  await $.prompt.submit({ text: 'say hi in one word', origin: { kind: 'composer' } } as never)
  expect(titles.at(-1)).toBe('Lemo Lab')
})

test('起名：命令和面板卡片都能给当前风格起名字，文字里的 {style} 换成它；每个风格各记各的，不带名字恢复原名', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  // 自己接 $.store，好看存进去的起名表
  const kv = new Map<string, unknown>([['lang', 'zh']])
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  on('prompt.submit', async ($$, e) => ({ text: e.text }))
  const st = async () => JSON.parse(((await $.command.run({ command: 'probe', args: 'style' } as never)) as { text: string }).text) as { id: string; words: Record<string, { zh: string; en: string }> }
  const say = async (args: string) => ((await $.command.run({ command: 'lemo-mod', args } as never)) as { text?: string }).text
  expect((await st()).words['lemo-core.title']).toEqual({ zh: 'Lemo 实验室', en: 'Lemo Lab' })
  expect(await say('起名 豆豆')).toBe('已将「Lemo 实验室」改名为「豆豆」。')
  // 起的名字中英界面通用；别的句子里的 {style} 也换了，日志抬头的 {styleZh}、{styleEn} 也是
  const a = await st()
  expect(a.words['lemo-core.title']).toEqual({ zh: '豆豆', en: '豆豆' })
  expect(a.words['lemo-core.cmdTag']).toEqual({ zh: ' 豆豆 ', en: ' 豆豆 ' })
  expect(a.words['lemo-journal.head']?.zh).toContain('豆豆')
  expect(JSON.stringify(a.words)).not.toMatch(/\{style(Zh|En)?\}/)
  // 换个风格是它自己的名字；用起的名字也能换回来
  await say('风格 mineral')
  expect((await st()).words['lemo-core.title']?.zh).toBe('小锦鲤')
  expect(await say('起名')).toBe('「小锦鲤」尚未起名。用法：/lemo-mod 起名 <名字>')
  await say('风格 豆豆')
  expect((await st()).id).toBe('lemon-lab')
  // 「起名」后面不带空格、名字是数字开头都照原样取；太长不收
  expect(await say('起名007')).toBe('已将「Lemo 实验室」改名为「007」。')
  expect(await say('起名 一二三四五六七八九')).toContain('名字过长')
  expect((await st()).words['lemo-core.title']?.zh).toBe('007')
  // 面板「行为」页的起名卡片：输入框回车就起名，说明里写着现在的名字，「恢复原名」按钮
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    await ui.press({ key: 'tab-behave' })
    const input = await ui.find({ type: 'Input' })
    expect(input).toBeDefined()
    await ui.input({ key: input?.key ?? '', text: `小柠（${surface}）` })
    expect((await st()).words['lemo-core.title']?.zh).toBe(`小柠（${surface}）`)
    expect(await ui.find({ type: 'Text', text: new RegExp(`现在叫「小柠（${surface}）」`) })).toBeDefined()
    await ui.press({ key: 'core-name-reset' })
    expect((await st()).words['lemo-core.title']?.zh).toBe('Lemo 实验室')
    await ui.unmount()
  }
  // 存进 $.store，换个会话还在：每个风格各记各的
  await say('起名 豆豆')
  expect(kv.get('nicks')).toEqual({ 'lemon-lab': '豆豆' })
  // 英文界面的命令词和回复
  await $.prompt.submit({ text: 'say hi in one word', origin: { kind: 'composer' } } as never)
  expect(await say('name Dodo')).toBe('Renamed "Lemo Lab" to "Dodo".')
  // 名字的头尾是字母、挨着汉字时中间加空格，挨着汉字的那头才加
  expect((await st()).words['lemo-watch.desc']?.zh).toBe('{n} 秒后以 Dodo 的名义，叫 Claude 汇报进度')
  expect(await say('name')).toBe('"Lemo Lab" has its original name back.')
  expect((await st()).words['lemo-watch.desc']?.zh).toBe('{n} 秒后以 Lemo 实验室的名义，叫 Claude 汇报进度')
  expect((await st()).words['lemo-guard.abort']?.zh).toMatch(/Lemo 实验室把这一轮停了$/)
})

test('/lemo-mod 后面的词先问各 mod（lemo.command），都不认才由核心处理', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  expect((await $.command.run({ command: 'lemo-mod', args: '探针' } as never) as { text?: string }).text).toBe('探针收到')
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: '风格' } as never))).toContain('可选的风格')
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: '没有这个词' } as never))).toContain('没有这个词')
})

test('/lemo-mod 不带参数：只打开面板，不回文字', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  let opened = ''
  on('ui.open', async ($$, e) => {
    opened = e.id
    return { value: undefined } as never
  })
  const r = await $.command.run({ command: 'lemo-mod', args: '' } as never)
  expect(opened).toBe('lemo-mod')
  expect((r as { text?: string }).text).toBeUndefined()
})

test('焦点：桌面上用户输 /lemo-mod 打开时请 App 把焦点给面板；终端、开会话自动弹的安全页都不要焦点', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on, { lang: 'zh' })
  const asks: (true | undefined)[] = []
  on('ui.open', async ($$, e) => {
    asks.push(e.focus)
    return { value: { isPlaced: true } } as never
  })
  let surfaces = ['desktop']
  on('session.surfaces', async () => ({ value: surfaces }) as never)
  on('ui.toast', async () => ({ value: undefined }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('session.messages', async () => ({ value: [] }))
  // 开会话：没按过「我看完了」，自动弹安全页
  await $.session.start({ cwd: '/tmp', surface: 'desktop', isInteractive: true } as never)
  await clock.advance(2000)
  expect(asks).toEqual([undefined])
  await $.command.run({ command: 'lemo-mod', args: '' } as never)
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  expect(asks.slice(1)).toEqual([true, true])
  // 终端（含同时连着桌面的终端会话）照旧
  for (const s of [['terminal'], ['terminal', 'desktop']]) {
    surfaces = s
    await $.command.run({ command: 'lemo-mod', args: '' } as never)
    expect(asks.at(-1)).toBeUndefined()
  }
})

test('语言：命令里的英文词不换语言，用户发英文消息才换', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('prompt.submit', async ($$, e) => ({ text: e.text }))
  const r = await $.command.run({ command: 'lemo-mod', args: 'style' } as never)
  expect(JSON.stringify(r)).toContain('可选的风格')
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'lang' } as never))).toContain('zh')
  // 插件发来的消息不算
  await $.prompt.submit({ text: 'reminder from a plugin', origin: { kind: 'plugin', name: 'lemo-watch' } } as never)
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'lang' } as never))).toContain('zh')
  await $.prompt.submit({ text: 'say hi in one word', origin: { kind: 'composer' } } as never)
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'lang' } as never))).toContain('en')
  expect(JSON.stringify(await $.command.run({ command: 'lemo-mod', args: '风格' } as never))).toContain('Styles:')
})

// 新用户（还没记过语言）先按系统的语言设置选：LC_ALL、LC_MESSAGES、LANG 取第一个有值的，zh 开头用中文，别的、没设的用英文。
// 记过语言的照记下的
const SYSTEM_LANG: readonly { env: Record<string, string>; saved?: string; want: string }[] = [
  { env: { LANG: 'zh_CN.UTF-8' }, want: '"zh"' },
  { env: { LANG: 'en_AU.UTF-8' }, want: '"en"' },
  { env: { LC_ALL: 'zh_TW.UTF-8', LANG: 'en_US.UTF-8' }, want: '"zh"' },
  { env: { LC_MESSAGES: 'en_US.UTF-8', LANG: 'zh_CN.UTF-8' }, want: '"en"' },
  { env: {}, want: '"en"' },
  { env: { LANG: 'en_US.UTF-8' }, saved: 'zh', want: '"zh"' },
  { env: { LANG: 'zh_CN.UTF-8' }, saved: 'en', want: '"en"' },
]
for (const c of SYSTEM_LANG) {
  test(`新用户的语言：系统 ${JSON.stringify(c.env)}，记过的 ${c.saved ?? '无'} → ${c.want}`, { plugins: [probe] }, async ($, on) => {
    mock.clock(on)
    mock.store(on, c.saved === undefined ? {} : { lang: c.saved })
    mock.env(on, c.env)
    on('session.start', async ($$, e) => ({ cwd: e.cwd }))
    await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
    const r = await $.command.run({ command: 'probe', args: 'lang' } as never)
    expect((r as { text: string }).text).toBe(c.want)
  })
}

test('恢复旧会话：按对话记录补上编号，你的消息和 Claude 的回复都对得上', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('session.messages', async () => ({
    value: [
      { role: 'user', text: '帮我抽一支签', toolUses: [] },
      { role: 'assistant', text: '抽好了，是上上签。', toolUses: [] },
      { role: 'user', text: '', toolUses: [], toolResults: [] },
      { role: 'user', text: '读一下 login.css', toolUses: [] },
      { role: 'assistant', text: '我先看看文件。', toolUses: [] },
      { role: 'assistant', text: '按钮四周留 14px 和 28px。', toolUses: [] },
    ],
  }) as never)
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  const r = JSON.parse(((await $.command.run({ command: 'probe', args: 'read-numbers' } as never)) as { text: string }).text)
  expect(r.seq).toBe(2)
  expect(r.numbers.texts['读一下 login.css']).toBe(2)
  expect(r.replies.texts['抽好了，是上上签。']).toBe(1)
  expect(r.replies.texts['我先看看文件。']).toBe(2)
  expect(r.replies.texts['按钮四周留 14px 和 28px。']).toBe(2)
})

test('恢复旧会话：同一句话发过两次，按先后各记一个号（dupes）', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('session.messages', async () => ({
    value: [
      { role: 'user', text: '你好', toolUses: [] },
      { role: 'assistant', text: '你好！', toolUses: [] },
      { role: 'user', text: '读一下 readme', toolUses: [] },
      { role: 'user', text: '你好', toolUses: [] },
      { role: 'user', text: '⏰ 柠檬实验室提醒：30 秒到了。', toolUses: [] },
    ],
  }) as never)
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  const r = JSON.parse(((await $.command.run({ command: 'probe', args: 'read-numbers' } as never)) as { text: string }).text)
  expect(r.seq).toBe(3)
  expect(r.numbers.dupes).toEqual({ 你好: [1, 3] })
  expect(r.numbers.texts['读一下 readme']).toBe(2)
})

test('存下来的编号：按消息 id 找回用户消息、回复、耗时行的号（恢复旧会话时用）', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, {
    lang: 'zh',
    'rows:s-old': { u: { 'u-1': 1, 'u-2': 2 }, r: { 'a-1': 1 }, t: { 'd-1': [1, 3, 2] } },
    'rows:s-other': { u: { 'u-9': 9 }, r: {}, t: {} },
  })
  const recall = async (id: string) => JSON.parse(((await $.command.run({ command: 'probe', args: 'recall ' + JSON.stringify({ id }) } as never)) as { text: string }).text)
  expect(await recall('u-2')).toEqual({ u: 2 })
  expect(await recall('a-1')).toEqual({ r: 1 })
  expect(await recall('d-1')).toEqual({ t: [1, 3, 2] })
  expect(await recall('u-9')).toEqual({ u: 9 })
  expect(await recall('nope')).toBe(null)
})

test('编号：斜杠命令不记原文，不会借走下一条消息的号', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  on('prompt.submit', async ($$, e) => ({ text: e.text }))
  const send = async (text: string, uuid: string) => {
    await $.prompt.submit({ text, origin: { kind: 'composer' } } as never)
    // session.append 测试答不了（最底下报 no implementation），lemo-core 在转交之前已经记下号
    await $.session.append({ door: 'prompt', origin: { kind: 'composer' }, uuid, message: { type: 'user', role: 'user', content: [{ type: 'text', text }] } } as never).catch(() => undefined)
  }
  // 命令本身不进 session.append：只有 prompt.submit
  await $.prompt.submit({ text: '/lemo-mod', origin: { kind: 'composer' } } as never)
  await send('改一下按钮颜色', 'u-1')
  // 路径开头的消息照常记
  await send('/Users/me/a.css 看一下', 'u-2')
  const r = JSON.parse(((await $.command.run({ command: 'probe', args: 'read-numbers {}' } as never)) as { text: string }).text)
  expect(r.seq).toBe(2)
  expect(r.numbers.texts['/lemo-mod']).toBeUndefined()
  expect(r.numbers.texts['改一下按钮颜色']).toBe(1)
  expect(r.numbers.texts['/Users/me/a.css 看一下']).toBe(2)
})

test('编号：提醒、助手交回、斜杠命令（skill）开头的一轮，回复不借用上一条的号（记 0）；用户本人发的照常带号', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  on('prompt.submit', async ($$, e) => ({ text: e.text }))
  on('turn.start', async ($$, e) => ({ turnId: e.turnId }))
  const numbers = async () => JSON.parse(((await $.command.run({ command: 'probe', args: 'read-numbers {}' } as never)) as { text: string }).text)
  const prompt = async (text: string, uuid: string, kind: string) => {
    if (kind === 'composer') await $.prompt.submit({ text, origin: { kind } } as never)
    await $.session.append({ door: 'prompt', origin: { kind }, uuid, message: { type: 'user', role: 'user', content: [{ type: 'text', text }] } } as never).catch(() => undefined)
    await $.turn.start({ text, turnId: `t-${uuid}` })
  }
  const reply = async (text: string, uuid: string) => {
    await $.session.append({ door: 'response', origin: { kind: 'model' }, uuid, message: { type: 'assistant', role: 'assistant', content: [{ type: 'text', text }] } } as never).catch(() => undefined)
  }
  await prompt('帮我看看按钮', 'u-1', 'composer')
  await reply('好', 'a-1')
  expect((await numbers()).turnNo).toBe(1)
  // lemo-watch 的提醒（插件发的）开头的一轮：回复记 0；同样的话也不会按原文对到 T01 上
  await prompt('⏰ 提醒：30 秒到了', 'p-1', 'plugin')
  await reply('好', 'a-2')
  let r = await numbers()
  expect(r.turnNo).toBe(0)
  expect(r.replies.ids['a-1']).toBe(1)
  expect(r.replies.ids['a-2']).toBe(0)
  expect(r.replies.texts['好']).toBe(0)
  // 助手交回（peer）也一样
  await prompt('<agent-message from="x">报告</agent-message>', 'p-2', 'peer')
  await reply('收到报告', 'a-3')
  expect((await numbers()).replies.ids['a-3']).toBe(0)
  // 用户本人发的：照常 T02
  await prompt('再改一下颜色', 'u-2', 'composer')
  await reply('改好了', 'a-4')
  r = await numbers()
  expect(r.seq).toBe(2)
  expect(r.replies.ids['a-4']).toBe(2)
  // 斜杠命令（skill）：命令本身不编号，这一轮的回复也不借 T02
  await $.prompt.submit({ text: '/dataviz 画个图', origin: { kind: 'composer' } } as never)
  await $.turn.start({ text: '/dataviz 画个图', turnId: 't-skill' })
  await reply('画好了', 'a-5')
  r = await numbers()
  expect(r.seq).toBe(2)
  expect(r.replies.ids['a-5']).toBe(0)
  // 路径开头、当消息发出去的照常带号（编过号以后 turn.start 不再改成 0）
  await prompt('/tmp 下有什么', 'u-3', 'composer')
  await reply('有两个文件', 'a-6')
  r = await numbers()
  expect(r.seq).toBe(3)
  expect(r.replies.ids['a-6']).toBe(3)
})

test('编号：斜杠命令一输入就清号（加载词不带上一条的号）；一轮跑着时输入的命令不动那一轮的号；不经过用户输入的 skill 也不借号', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  on('prompt.submit', async ($$, e) => ({ text: e.text }))
  on('turn.start', async ($$, e) => ({ turnId: e.turnId }))
  on('turn.complete', async () => ({ text: '' }))
  const turnNo = async () => JSON.parse(((await $.command.run({ command: 'probe', args: 'read-numbers {}' } as never)) as { text: string }).text).turnNo
  const done = { answer: '好', durationMs: 1000, isAborted: false, reason: 'answer' }
  const send = async (text: string, uuid: string) => {
    await $.prompt.submit({ text, origin: { kind: 'composer' } } as never)
    await $.session.append({ door: 'prompt', origin: { kind: 'composer' }, uuid, message: { type: 'user', role: 'user', content: [{ type: 'text', text }] } } as never).catch(() => undefined)
    await $.turn.start({ text, turnId: `t-${uuid}` })
  }
  await send('帮我看看按钮', 'u-1')
  // 这一轮还在跑：输入 /lemo-mod（马上跑的命令）不清号，后面的回复、耗时行还是 T01
  await $.prompt.submit({ text: '/lemo-mod', origin: { kind: 'composer' } } as never)
  expect(await turnNo()).toBe(1)
  await $.turn.complete({ ...done, turnId: 't-u-1' } as never)
  // 停着时输入 skill 命令：这一轮还没开始（turn.start 之前加载词已经出来了），号先清掉
  await $.prompt.submit({ text: '/dataviz 画个图', origin: { kind: 'composer' } } as never)
  expect(await turnNo()).toBe(0)
  await $.turn.start({ text: '/dataviz 画个图', turnId: 't-skill' })
  expect(await turnNo()).toBe(0)
  await $.turn.complete({ ...done, turnId: 't-skill' } as never)
  await send('再改一下颜色', 'u-2')
  expect(await turnNo()).toBe(2)
  await $.turn.complete({ ...done, turnId: 't-u-2' } as never)
  // 定时任务、/loop 跑的 skill：没有用户输入，这一轮也不借 T02
  await $.turn.start({ text: '/dataviz 再画一张', turnId: 't-loop' })
  expect(await turnNo()).toBe(0)
})

const FACTS = { model: 'claude-test', promptModel: 'claude-test', surfaces: ['terminal'], tools: [], outputStyle: null, traits: [] } as never

test('系统提示词：编号说明默认不加；在安全页打开后多一段固定的说明（T01 是第几条消息）；bare 时不加', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('prompt.compose', async () => ({ sections: [{ id: 'intro', text: 'x', scope: 'shared' as const }] }))
  const off = await $.prompt.compose(FACTS)
  expect(off.sections.map(s => s.id)).not.toContain('lemo-core:numbering')
  await $.command.run({ command: 'probe', args: 'toggle ' + JSON.stringify({ mod: 'lemo-core', id: 'note', on: true }) } as never)
  const a = await $.prompt.compose(FACTS)
  const note = a.sections.find(s => s.id === 'lemo-core:numbering')
  expect(note?.text).toContain('T03')
  expect(note?.scope).toBe('session')
  const bare = await $.prompt.compose({ ...(FACTS as object), traits: ['bare'] } as never)
  expect(bare.sections.map(s => s.id)).not.toContain('lemo-core:numbering')
})

test('编号说明：每次从 $.store 现读——别的会话里关掉了，这个会话的系统提示词和安全页也跟着变', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  const kv = new Map<string, unknown>([['note', true]])
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  on('store.keys', async () => ({ value: [...kv.keys()] }) as never)
  on('prompt.compose', async () => ({ sections: [] }))
  const caps = async () => JSON.parse(((await $.command.run({ command: 'probe', args: 'caps' } as never)) as { text: string }).text) as { mod: string; id: string; on: boolean }[]
  expect((await $.prompt.compose(FACTS)).sections.map(s => s.id)).toContain('lemo-core:numbering')
  kv.set('note', false)
  expect((await caps()).find(c => c.mod === 'lemo-core' && c.id === 'note')?.on).toBe(false)
  expect((await $.prompt.compose(FACTS)).sections.map(s => s.id)).not.toContain('lemo-core:numbering')
})

test('朗读：试第一个语音被拒的时候按了「全部关闭」，不再试下一个、也不用系统默认语音', { plugins: [probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on, { lang: 'zh' })
  const tried: (string | undefined)[] = []
  let offFirst = true
  on('audio.speak', async ($$, e) => {
    tried.push(e.voice)
    if (offFirst) {
      offFirst = false
      await $.command.run({ command: 'probe', args: 'off' } as never)
    }
    throw new Error('no such voice')
  })
  await $.command.run({ command: 'probe', args: 'toggle ' + JSON.stringify({ mod: 'lemo-core', id: 'speech', on: true }) } as never)
  await $.command.run({ command: 'probe', args: 'say ' + JSON.stringify({ text: '好了' }) } as never)
  await clock.settle()
  expect(tried).toEqual(['Tingting'])
  // 没按「全部关闭」时照常一个个试，最后用系统默认语音
  offFirst = false
  tried.length = 0
  await $.command.run({ command: 'probe', args: 'toggle ' + JSON.stringify({ mod: 'lemo-core', id: 'speech', on: true }) } as never)
  await $.command.run({ command: 'probe', args: 'say ' + JSON.stringify({ text: '好了' }) } as never)
  await clock.settle()
  expect(tried).toEqual(['Tingting', 'Flo (Chinese (China mainland))', 'Meijia', undefined])
})

test('/lemo-mod 的回复照抄用户打的字时转义 Markdown：起名、不认的风格、不认的词都不会变成链接', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  const say = async (args: string) => ((await $.command.run({ command: 'lemo-mod', args } as never)) as { text?: string }).text ?? ''
  expect(await say('起名 [豆](file:///x)')).toContain('「\\[豆\\]\\(file\\:\\/\\/\\/x\\)」')
  expect(await say('风格 [a](https://x.example)')).toContain('没有「\\[a\\]\\(https\\:\\/\\/x\\.example\\)」风格')
  expect(await say('[c](https://x.example)')).toContain('无法识别「\\[c\\]\\(https\\:\\/\\/x\\.example\\)」')
})

test('声音开关：没装 lemo-sound、lemo-voice 而有会出声的 mod 时，「行为」页给出静音、朗读开关', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const mount = () => mountChecked($, { ...HUB, surface: 'terminal' })
  // 只有不出声的 mod：没有这张卡片
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-tone', title: { zh: '口吻', en: 'Tone' }, tabs: ['behave'] }) } as never)
  let ui = await mount()
  expect(await ui.find({ key: 'core-mute' })).toBeUndefined()
  await ui.unmount()
  // 单装番茄钟（会响、会念）：两个开关都有
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-pomodoro', title: { zh: '番茄钟', en: 'Focus' }, tabs: ['main'], uses: ['sound', 'speech'] }) } as never)
  ui = await mount()
  await ui.press({ key: 'tab-behave' })
  // 装上时声音、朗读都是关的
  expect((await ui.find({ key: 'core-mute' }))?.props.label).toBe('取消静音')
  expect((await ui.find({ key: 'core-speech' }))?.props.label).toBe('朗读：关')
  await ui.press({ key: 'core-mute' })
  await ui.press({ key: 'core-speech' })
  expect((await ui.find({ key: 'core-mute' }))?.props.label).toBe('静音')
  expect((await ui.find({ key: 'core-speech' }))?.props.label).toBe('朗读：开')
  await ui.unmount()
  // 装了 lemo-voice：朗读开关归它，这里只剩静音；再装 lemo-sound，整张卡片不出现
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-voice', title: { zh: '朗读', en: 'Speech' }, tabs: ['main'] }) } as never)
  ui = await mount()
  expect(await ui.find({ key: 'core-mute' })).toBeDefined()
  expect(await ui.find({ key: 'core-speech' })).toBeUndefined()
  await ui.unmount()
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-sound', title: { zh: '音效', en: 'Sounds' }, tabs: ['main'] }) } as never)
  ui = await mount()
  expect(await ui.find({ key: 'core-mute' })).toBeUndefined()
  await ui.unmount()
})

test('终端面板在输入框上方（inline）时和停在旁边一样：写键盘提示，按钮编数字（ctrl+x Tab 一样进得去）', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-pomodoro', title: { zh: '番茄钟', en: 'Focus' }, tabs: ['main'], uses: ['sound', 'speech'] }) } as never)
  const inline = await mountChecked($, { ...HUB, surface: 'terminal', props: { ...HUB.props, placement: 'inline' } } as never)
  await inline.press({ key: 'tab-behave' })
  expect((await inline.find({ key: 'core-mute' }))?.props.hotkey).toBe('1')
  expect(await inline.find({ key: 'lemo-hotkey-1' })).toBeDefined()
  expect(await inline.find({ type: 'Text', text: /ctrl\+x Tab 进入面板/ })).toBeDefined()
  await inline.unmount()
  // 停在旁边（dock）时一样
  const dock = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect((await dock.find({ key: 'core-mute' }))?.props.hotkey).toBe('1')
  // 头部数 mod 时算上 lemo-core 自己：番茄钟加核心，2 个
  expect(await dock.find({ type: 'Text', text: /· 2 个 mod$/ })).toBeDefined()
  expect(await dock.find({ type: 'Text', text: /进入面板/ })).toBeDefined()
  await dock.unmount()
})

test('终端面板：按卡片顺序给每张卡片标题行的按钮编数字热键，按钮前面画出号码；桌面不编', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // 单装番茄钟：「行为」页有风格（标题行没有按钮，不占号）、声音开关（1）、已装的 mod（2）
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-pomodoro', title: { zh: '番茄钟', en: 'Focus' }, tabs: ['main'], uses: ['sound', 'speech'] }) } as never)
  const term = await mountChecked($, { ...HUB, surface: 'terminal' })
  await term.press({ key: 'tab-behave' })
  expect((await term.find({ key: 'style-lemon-lab' }))?.props.hotkey).toBeUndefined()
  expect((await term.find({ key: 'core-mute' }))?.props.hotkey).toBe('1')
  // 同一张卡片里的第二个按钮不编
  expect((await term.find({ key: 'core-speech' }))?.props.hotkey).toBeUndefined()
  expect((await term.find({ key: 'core-mods-more' }))?.props.hotkey).toBe('2')
  expect(await term.find({ key: 'lemo-hotkey-1' })).toBeDefined()
  expect(await term.find({ key: 'lemo-hotkey-2' })).toBeDefined()
  expect(await term.find({ key: 'lemo-hotkey-3' })).toBeUndefined()
  // 分页按钮照显示的顺序从 a 往后排（常用在最前、安全在最后）；键盘提示照实际页数写：这里三页（常用、行为、安全），写 a–c
  expect((await term.find({ key: 'tab-main' }))?.props.hotkey).toBe('a')
  expect((await term.find({ key: 'tab-behave' }))?.props.hotkey).toBe('b')
  expect((await term.find({ key: 'tab-safe' }))?.props.hotkey).toBe('c')
  expect(await term.find({ key: 'tab-bg' })).toBeUndefined()
  expect(await term.find({ type: 'Text', text: /a–c 换页/ })).toBeDefined()
  await term.unmount()
  const desk = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect((await desk.find({ key: 'core-mute' }))?.props.hotkey).toBeUndefined()
  expect(await desk.find({ key: 'lemo-hotkey-1' })).toBeUndefined()
  await desk.unmount()
})

test('胶囊和提示：加、去掉', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('ui.toast', async () => ({ value: undefined }) as never)
  await $.command.run({ command: 'probe', args: 'badge ' + JSON.stringify({ id: 'focus', text: '番茄', tone: 'accent', endsAt: 1000 }) } as never)
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'read-badges' } as never))).toContain('番茄')
  await $.command.run({ command: 'probe', args: 'badge ' + JSON.stringify({ id: 'focus', text: null, tone: 'accent' }) } as never)
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'read-badges' } as never))).not.toContain('番茄')
  await $.command.run({ command: 'probe', args: 'notice ' + JSON.stringify({ text: '拦下了', tone: 'red' }) } as never)
  expect(JSON.stringify(await $.command.run({ command: 'probe', args: 'read-notice' } as never))).toContain('拦下了')
})

// ---------- 安全 ----------

// 一个假 mod：在能力清单里接一行「写文件」的开关，认自己的 toggle、off
const fakeMod: Plugin = {
  name: 'fake-mod',
  register(on) {
    let isOn = false
    on('lemo.caps', async ($, e, next) => {
      const r = await next(e)
      return { value: [...(r.value ?? []), { mod: 'fake-mod', id: 'log', kind: 'file' as const, title: { zh: '假日志', en: 'Fake log' }, desc: { zh: '写一个文件', en: 'Writes a file' }, on: isOn }] }
    })
    on('lemo.toggle', async ($, e, next) => {
      if (e.mod !== 'fake-mod') return next(e)
      isOn = e.on === true
      return { value: true }
    })
    on('lemo.off', async ($, e, next) => {
      isOn = false
      return next(e)
    })
  },
}

test('安全：刚装上时弹出安全页、横条挂红胶囊；按「我看完了」后存下；下次开会话只写「已开启：…」', { plugins: [probe, fakeMod] }, async ($, on) => {
  const clock = mock.clock(on)
  const kv = new Map<string, unknown>([['lang', 'zh']])
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  const opened: string[] = []
  on('ui.open', async ($$, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } } as never
  })
  on('ui.toast', async () => ({ value: undefined }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('session.messages', async () => ({ value: [] }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  await clock.advance(2000)
  expect(opened).toContain('lemo-mod')
  const badges = async () => JSON.stringify(await $.command.run({ command: 'probe', args: 'read-badges' } as never))
  expect(await badges()).toContain('未完成安全确认')
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  // 自己的三行和假 mod 的一行都在，装上时都是关的
  for (const k of ['lemo-core-sound', 'lemo-core-speech', 'lemo-core-note', 'fake-mod-log']) {
    expect((await ui.find({ key: `cap-sw-${k}` }))?.props.label).toBe('打开')
  }
  // 能试听的有「试听」
  expect(await ui.find({ key: 'cap-try-lemo-core-sound' })).toBeDefined()
  expect(await ui.find({ key: 'cap-try-fake-mod-log' })).toBeUndefined()
  // 按开关：由那个 mod 自己处理，页面跟着变
  await ui.press({ key: 'cap-sw-fake-mod-log' })
  expect((await ui.find({ key: 'cap-sw-fake-mod-log' }))?.props.label).toBe('关闭')
  await ui.press({ key: 'safe-ok' })
  expect(kv.get('safeOk')).toBe(true)
  expect(await badges()).not.toContain('未完成安全确认')
  await ui.unmount()
})

test('安全：「全部关闭」让每个 mod 关掉自己的开关，也算看过安全页', { plugins: [probe, fakeMod] }, async ($, on) => {
  mock.clock(on)
  const kv = new Map<string, unknown>([['lang', 'zh']])
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  await $.command.run({ command: 'probe', args: 'toggle ' + JSON.stringify({ mod: 'lemo-core', id: 'sound', on: true }) } as never)
  await $.command.run({ command: 'probe', args: 'toggle ' + JSON.stringify({ mod: 'fake-mod', id: 'log', on: true }) } as never)
  const ons = async () => (JSON.parse(((await $.command.run({ command: 'probe', args: 'caps' } as never)) as { text: string }).text) as { id: string; on: boolean }[]).filter(c => c.on).map(c => c.id)
  expect(await ons()).toEqual(['sound', 'log'])
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  // 安全页在最后一页，先切过去
  await ui.press({ key: 'tab-safe' })
  await ui.press({ key: 'safe-off' })
  expect(await ons()).toEqual([])
  expect(kv.get('muted')).toBe(true)
  expect(kv.get('safeOk')).toBe(true)
  await ui.unmount()
})

test('安全：扫描用户自己的设置，重叠的写在安全页上（只看几项，不存）', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  const kv = new Map<string, unknown>([['lang', 'zh']])
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  on('settings.read', async () => ({ value: { statusLine: { type: 'command', command: 'x' }, preferredNotifChannel: 'iterm2', env: { SECRET: 'no' } } }) as never)
  on('config.list', async () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'choice', value: 'dark-daltonized', provider: { kind: 'engine' }, isLocked: false }] }) as never)
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('ui.toast', async () => ({ value: undefined }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'tab-safe' })
  expect(await ui.find({ type: 'Text', text: /已有自己的状态栏/ })).toBeDefined()
  // 通知方式的内部值换成人话（不直接显示 notifications_disabled）
  expect(await ui.find({ type: 'Text', text: /iTerm2 通知/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /dark-daltonized/ })).toBeDefined()
  await ui.unmount()
  // 设置里的东西一样都没存
  expect(JSON.stringify([...kv.entries()])).not.toMatch(/SECRET|iterm2|statusLine/)
})

test('安全：刚装上什么都不做——不出声、不朗读、不往系统提示里加话', { plugins: [probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const heard: string[] = []
  on('audio.play', async () => {
    heard.push('play')
    return { value: undefined } as never
  })
  on('audio.speak', async () => {
    heard.push('speak')
    return { value: undefined } as never
  })
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('ui.toast', async () => ({ value: undefined }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('prompt.compose', async () => ({ sections: [] }))
  on('session.messages', async () => ({ value: [] }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  await clock.advance(2000)
  await $.command.run({ command: 'probe', args: 'play ' + JSON.stringify({ sound: 'done' }) } as never)
  await $.command.run({ command: 'probe', args: 'say ' + JSON.stringify({ text: '完成' }) } as never)
  expect(heard).toEqual([])
  expect((await $.prompt.compose(FACTS)).sections).toEqual([])
})

test('桌面暗色：读 App 自己记的明暗，暗色时卡片换深色底、字换浅色；亮色、读不到时照原样；终端不读', { plugins: [probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on, { lang: 'zh', safeOk: true })
  let mode = 'dark'
  const reads: string[] = []
  on('env.get', async ($$, e) => ({ value: e.name === 'HOME' ? '/Users/me' : undefined }) as never)
  on('fs.read', async ($$, e) => {
    reads.push(String(e.path))
    if (String(e.path).endsWith('Claude/config.json')) return { value: JSON.stringify({ userThemeMode: mode, darkMode: 'light' }) } as never
    throw new Error('ENOENT')
  })
  on('session.messages', async () => ({ value: [] }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  // 终端会话：不读 App 的设置
  on('session.surfaces', async () => ({ value: ['terminal'] }) as never)
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  await clock.advance(4000)
  expect(reads.filter(p => p.includes('Application Support'))).toEqual([])
})

test('桌面暗色：桌面会话里 App 是暗色，卡片用深色底和浅色字，扫描里写「桌面 App：暗色」；换回亮色几秒内跟上', { plugins: [probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on, { lang: 'zh', safeOk: true })
  let mode = 'dark'
  on('env.get', async ($$, e) => ({ value: e.name === 'HOME' ? '/Users/me' : undefined }) as never)
  on('fs.read', async ($$, e) => {
    if (String(e.path) === '/Users/me/Library/Application Support/Claude/config.json') return { value: JSON.stringify({ userThemeMode: mode }) } as never
    throw new Error('ENOENT')
  })
  on('session.messages', async () => ({ value: [] }) as never)
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('session.surfaces', async () => ({ value: ['desktop'] }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/project', surface: 'desktop', isInteractive: true } as never)
  const fills = async (ui: { findAll: (q: { type: string }) => Promise<{ props: Record<string, unknown> }[]> }) => (await ui.findAll({ type: 'Box' })).map(b => b.props.backgroundColor)
  const titleColor = async (ui: { find: (q: { type: string; text: string }) => Promise<{ props: Record<string, unknown> } | undefined> }) => (await ui.find({ type: 'Text', text: '安全' }))?.props.color
  expect(JSON.parse(((await $.command.run({ command: 'probe', args: 'read-desk' } as never)) as { text: string }).text)).toBe('dark')
  await $.command.run({ command: 'lemo-mod', args: '安全' } as never)
  let ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /桌面 App：暗色/ })).toBeDefined()
  // 卡片底是风格的深色卡片底（柠檬实验室 #262A31），标题是浅色
  expect(await fills(ui)).toContain('#262A31')
  expect(await fills(ui)).not.toContain('#F7F9FC')
  expect(await titleColor(ui)).toBe('#FFFBEA')
  await ui.unmount()
  // App 换回亮色：3 秒内跟上，卡片回到原来的浅色
  mode = 'light'
  await clock.advance(3000)
  expect(JSON.parse(((await $.command.run({ command: 'probe', args: 'read-desk' } as never)) as { text: string }).text)).toBe('light')
  ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(await fills(ui)).toContain('#F7F9FC')
  expect(await fills(ui)).not.toContain('#262A31')
  expect(await titleColor(ui)).toBe('#2F4F96')
  await ui.unmount()
})

test('终端安全页：说明按面板宽度断好行，英文词不拆、标点不放行首', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh', safeOk: true })
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('session.messages', async () => ({ value: [] }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  await $.command.run({ command: 'lemo-mod', args: '安全' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal', props: { ...HUB.props, bodyColumns: 40 } } as never)
  // 断好的行是 wrap="truncate" 的 Text，一行一个
  const lines = (await ui.findAll({ type: 'Text' })).filter(t => t.props.wrap === 'truncate').map(t => t.text)
  expect(lines.length).toBeGreaterThan(10)
  for (const t of lines) expect(width(t)).toBeLessThanOrEqual(33)
  for (const t of lines) expect(t).not.toMatch(/^[。，、；：！？）」]/)
  // 「Claude」这样的英文词整个出现在某一行里（编号说明那行：告诉 Claude 界面上的 T01…）
  expect(lines.some(t => t.includes('Claude'))).toBe(true)
  await ui.unmount()
})

// 窄窗口：终端面板内嵌在输入框上方时没有主题画的底，卡片标题用主题正文色，
// 深色终端配浅色主题是深底黑字、浅色终端配深色主题是浅底白字。内嵌时不给颜色（终端自己的字色），停靠时照旧用主题正文色
test('终端面板内嵌（窄窗口）：卡片标题和安全页的加粗字用终端自己的字色；停靠在对话旁边时照旧用主题正文色', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh', safeOk: true })
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('session.messages', async () => ({ value: [] }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/project', surface: 'terminal', isInteractive: true } as never)
  await $.command.run({ command: 'lemo-mod', args: '安全' } as never)
  for (const placement of ['inline', 'dock'] as const) {
    const ui = await mountChecked($, { ...HUB, surface: 'terminal', props: { ...HUB.props, placement } } as never)
    const texts = await ui.findAll({ type: 'Text' })
    const title = texts.find(t => t.props.bold === true && t.text === '安全')
    expect(title).toBeDefined()
    expect(title?.props.color).toBe(placement === 'inline' ? undefined : 'text')
    const themed = texts.filter(t => t.props.color === 'text')
    if (placement === 'inline') expect(themed).toEqual([])
    else expect(themed.length).toBeGreaterThan(1)
    await ui.unmount()
  }
})

// 桌面 App 第一下点击丢失：光标在输入框时点面板按钮，按下鼠标那一刻面板拿到焦点，App 把 isFocused 改成 true
// 再要一次画；引擎每画一次给新建的按钮新 handle、放掉旧的，松开鼠标时 App 发的还是旧 handle，这一下就丢了。
// 面板按钮用 steady 画：样子没变就还是同一个按钮，handle 不变；样子变了（开关的字变了）才换
test('桌面第一下点击：面板拿到焦点重画后按钮的 handle 不变，按下去照常生效；样子变了的按钮才换', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  const ui = await $.ui.mount({ ...HUB, surface: 'desktop', props: { ...HUB.props, isFocused: false } })
  // 安全页在最后一页，先切过去
  await ui.press({ key: 'tab-safe' })
  const before = buttonHandles(await ui.drawn())
  expect(Object.keys(before)).toEqual(expect.arrayContaining(['lemo-core/tab-safe', 'lemo-core/safe-off', 'lemo-core/cap-sw-lemo-core-note']))
  // 按下鼠标：面板拿到焦点，App 带着 isFocused: true 再要一次画
  await ui.redraw({ ...HUB.props, isFocused: true })
  expect(buttonHandles(await ui.drawn())).toEqual(before)
  // 松开鼠标：按的是按下前那个按钮，照常生效
  await ui.press({ key: 'cap-sw-lemo-core-note' })
  expect((await ui.find({ key: 'cap-sw-lemo-core-note' }))?.props.label).toBe('关闭')
  const after = buttonHandles(await ui.drawn())
  // 字变了的开关换了一个按钮；别的按钮还是原来那个
  expect(after['lemo-core/cap-sw-lemo-core-note']).not.toBe(before['lemo-core/cap-sw-lemo-core-note'])
  expect(after['lemo-core/safe-off']).toBe(before['lemo-core/safe-off'])
  expect(after['lemo-core/tab-safe']).toBe(before['lemo-core/tab-safe'])
  // 再按一次：用的是最新的状态（已经打开，这次关掉），不是第一次画时的
  await ui.press({ key: 'cap-sw-lemo-core-note' })
  expect((await ui.find({ key: 'cap-sw-lemo-core-note' }))?.props.label).toBe('打开')
  expect(buttonHandles(await ui.drawn())['lemo-core/safe-off']).toBe(before['lemo-core/safe-off'])
  await ui.unmount()
})

// 切页时，这一页的按钮在别的页那次画里不在，引擎就放掉了它们的 handle。切回来时引擎给的是新 handle，按下去要照常生效；
// 回来以后拿到焦点再画，handle 又不变。（steady 只复用上一次画里有的按钮、切回来时新建，这条规则在 shared.test.ts 里测：
// 引擎对外给的 handle 不管复用没复用都会换新，这里看不出来）
test('桌面第一下点击：切到别的页再切回来，按钮换了新 handle，按下去照常生效；之后拿到焦点重画不变', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  const ui = await mountChecked($, { ...HUB, surface: 'desktop', props: { ...HUB.props, isFocused: false } })
  await ui.press({ key: 'tab-safe' })
  const first = buttonHandles(await ui.drawn())
  expect(first['lemo-core/safe-off']).toBeDefined()
  await ui.press({ key: 'tab-behave' })
  expect(await ui.find({ key: 'safe-off' })).toBeUndefined()
  await ui.press({ key: 'tab-safe' })
  const back = buttonHandles(await ui.drawn())
  expect(back['lemo-core/safe-off']).toBeDefined()
  expect(back['lemo-core/safe-off']).not.toBe(first['lemo-core/safe-off'])
  expect(back['lemo-core/cap-sw-lemo-core-note']).not.toBe(first['lemo-core/cap-sw-lemo-core-note'])
  await ui.redraw({ ...HUB.props, isFocused: true })
  expect(buttonHandles(await ui.drawn())['lemo-core/safe-off']).toBe(back['lemo-core/safe-off'])
  await ui.press({ key: 'cap-sw-lemo-core-note' })
  expect((await ui.find({ key: 'cap-sw-lemo-core-note' }))?.props.label).toBe('关闭')
  await ui.unmount()
})

test('桌面第一下点击：按钮消失一次再出现（起名后的「恢复原名」），换了新 handle，按下去照常生效', { plugins: [probe] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { lang: 'zh' })
  const ui = await mountChecked($, { ...HUB, surface: 'desktop' })
  await ui.press({ key: 'tab-behave' })
  const name = async (text: string) => {
    const input = await ui.find({ type: 'Input' })
    await ui.input({ key: input?.key ?? '', text })
  }
  await name('小柠')
  const shown = buttonHandles(await ui.drawn())['lemo-core/core-name-reset']
  expect(shown).toBeDefined()
  await ui.press({ key: 'core-name-reset' })
  expect(await ui.find({ key: 'core-name-reset' })).toBeUndefined()
  // 再起一次名：按钮的 key 和字都和上次一样，但中间有一次画里没有它，引擎放掉过它的 handle，这次是新的
  await name('小柠')
  const again = buttonHandles(await ui.drawn())['lemo-core/core-name-reset']
  expect(again).toBeDefined()
  expect(again).not.toBe(shown)
  await ui.redraw({ ...HUB.props, isFocused: false })
  expect(buttonHandles(await ui.drawn())['lemo-core/core-name-reset']).toBe(again)
  await ui.press({ key: 'core-name-reset' })
  expect(await ui.find({ key: 'core-name-reset' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /现在叫「小柠」/ })).toBeUndefined()
  await ui.unmount()
})

test('分页顺序：常用在最前、安全在最后；/lemo-mod 打开常用页，/lemo-mod 安全 跳到安全页，开会话自动弹的仍是安全页', { plugins: [probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on, { lang: 'zh' })
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('ui.toast', async () => ({ value: undefined }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('session.messages', async () => ({ value: [] }))
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-x', title: { zh: '测试', en: 'Test' }, tabs: ['main', 'bg'] }) } as never)
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-y', title: { zh: '游戏', en: 'Game' }, tabs: ['game'], surfaces: ['terminal'] }) } as never)
  // 现在显示哪一页：主按钮（variant primary）那个
  const current = async (find: (key: string) => Promise<unknown>) => {
    for (const id of ['main', 'behave', 'bg', 'game', 'safe']) if (((await find(`tab-${id}`)) as { props?: { variant?: string } } | undefined)?.props?.variant === 'primary') return id
    return null
  }
  const term = await mountChecked($, { ...HUB, surface: 'terminal' })
  const keys: string[] = []
  for (const id of ['main', 'behave', 'bg', 'game', 'safe']) keys.push(String((await term.find({ key: `tab-${id}` }))?.props.hotkey))
  expect(keys).toEqual(['a', 'b', 'c', 'd', 'e'])
  expect(await term.find({ type: 'Text', text: /a–e 换页/ })).toBeDefined()
  // 还没换过页：/lemo-mod 打开的是常用页
  await $.command.run({ command: 'lemo-mod', args: '' } as never)
  expect(await current(k => term.find({ key: k }))).toBe('main')
  await $.command.run({ command: 'lemo-mod', args: '安全' } as never)
  expect(await current(k => term.find({ key: k }))).toBe('safe')
  await term.unmount()
  // 桌面上没有游戏页：顺序是常用、行为、后台、安全
  const desk = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(await desk.find({ key: 'tab-game' })).toBeUndefined()
  await desk.press({ key: 'tab-main' })
  expect(await current(k => desk.find({ key: k }))).toBe('main')
  await desk.unmount()
  // 开会话：没按过「我看完了」，自动弹的还是安全页
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  await clock.advance(2000)
  const again = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await current(k => again.find({ key: k }))).toBe('safe')
  await again.unmount()
})

test('/lemo-mod 开会话时马上登记（排在读存档之前），不等 200 毫秒；读完用户的语言再按那个语言登记；mod 报到后再更新提示', { plugins: [probe] }, async ($, on) => {
  const clock = mock.clock(on)
  const kv = new Map<string, unknown>([['lang', 'en'], ['safeOk', true]])
  const order: string[] = []
  on('store.get', async ($$, e) => {
    order.push('store.get')
    return { value: kv.get(e.key) }
  })
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  const regs: { name: string; description: string; argumentHint?: string }[] = []
  on('command.register', async ($$, e) => {
    order.push('register')
    regs.push({ name: e.name, description: e.description, ...(e.argumentHint === undefined ? {} : { argumentHint: e.argumentHint }) })
    return { value: { command: e.name } }
  })
  on('ui.open', async () => ({ value: { isPlaced: true } }) as never)
  on('ui.toast', async () => ({ value: undefined }) as never)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('session.messages', async () => ({ value: [] }))
  await $.session.start({ cwd: '/tmp', surface: 'desktop', isInteractive: true } as never)
  // 不拨时钟：命令已经在了，而且是开会话做的第一件事
  expect(order[0]).toBe('register')
  expect(regs[0]?.name).toBe('lemo-mod')
  // 存的语言是英文：读完以后按英文再登记一次
  expect(regs.at(-1)?.name).toBe('lemo-mod')
  expect(regs.at(-1)?.argumentHint).toBe('[style]')
  expect(regs.at(-1)?.description).not.toMatch(/\p{Script=Han}/u)
  const n = regs.length
  // mod 报到：等 200 毫秒统一更新提示
  await $.command.run({ command: 'probe', args: 'join ' + JSON.stringify({ mod: 'lemo-x', title: { zh: '测试', en: 'Test' }, tabs: ['main'], commands: { zh: ['测试'], en: ['test'] } }) } as never)
  expect(regs.length).toBe(n)
  await clock.advance(300)
  expect(regs.at(-1)?.argumentHint).toBe('[test | style]')
})
