import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import type { On } from 'claude-code'

import { testCore } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

const SCROLL = { offset: 0, bodyRows: 12 }

const BAND = {
  plugin: 'lemo-meter',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: 100, scroll: SCROLL, view: {} },
} as const

// 测试里替引擎答最底层：会话开始、一轮结束、面板里层（引擎自己的面板内容）、横条里层
const engine = (on: On) => {
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async () => ({ text: '' }))
  on('ui.render', { component: 'Pane' }, async () => ({ type: 'engine', ref: 0 }) as const)
  on('ui.render', { component: 'AbovePrompt' }, async () => ({ type: 'engine', ref: 0 }) as const)
}

const HUB = {
  plugin: 'lemo-meter',
  component: 'Pane',
  requestId: 'lemo-mod',
  props: { title: 'lemo-mod', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: SCROLL, view: {} },
} as const

// 别的 mod 通过 $.lemo.badge / $.lemo.notice 写进 lemo-core 的状态；假核心不写状态，
// 所以测试在最底层接住 lemo-core 这两个键的读取，替它答出胶囊和提示
const BADGES = [
  { id: 'focus', text: '番茄', tone: 'accent' as const, endsAt: 90_000 },
  { id: 'brief', text: '简短', tone: 'grey' as const },
]
const NOTICE = { text: '拦下了一次强推', tone: 'red' as const, until: 5000 }

// lemo-core 扫描到的用户设置（假核心不扫，测试在最底层替它答）。statusLine：用户自己设了状态栏
const scanned = (on: On, statusLine: boolean) =>
  on('state.get', { plugin: 'lemo-core', key: 'scan' }, async () => ({
    value: { value: { statusLine, spinnerVerbs: false, notif: null, outputStyle: null, theme: null }, version: 1 },
  }))

/**
 * 测试里替引擎答文件系统：files 里的路径能读（stat 是文件），dirs 里的是目录，别的都是「没有这个文件」。
 * 会话目录是 cwd。lemo-meter 读分支只用 session.cwd、fs.stat、fs.read
 */
function fakeFs(on: On, cwd: string | (() => string), files: Readonly<Record<string, string>>, dirs: readonly string[] = []) {
  on('session.cwd', async () => ({ value: typeof cwd === 'string' ? cwd : cwd() }))
  on('fs.stat', async ($$, e) => {
    if (dirs.includes(e.path)) return { value: { kind: 'dir' as const, size: 0, mtimeMs: 0, isLink: false } }
    const text = files[e.path]
    if (text !== undefined) return { value: { kind: 'file' as const, size: text.length, mtimeMs: 0, isLink: false } }
    throw new Error(`ENOENT: ${e.path}`)
  })
  on('fs.read', async ($$, e) => {
    const text = files[e.path]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
}

// 一个普通的 git 仓库：/w/proj，当前在 main
const REPO = { '/w/proj/.git/HEAD': 'ref: refs/heads/main\n' }

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
      return (ev === 'http.fetch' ? { value: { status: 200, ok: true, headers: {}, text: '{"version":"9.9.9"}' } } : { value: undefined }) as never
    })
  }
  on('process.spawn', async function* () {
    did.push('process.spawn')
    return { value: { code: 0, signal: null } } as never
  })
  return did
}

// 素色那样的风格：没有像素小画、不画图案
const PLAIN = {
  id: 'plain',
  name: { zh: '素色', en: 'Plain' },
  colors: {
    ink: '#5B6B7F', grid: '#9AA5B1', pencil: '#8A9099', accent: '#D9DEE5', onAccent: '#1B1D1F', red: '#D64545',
    inkDark: '#33404F', chip: '#EEF1F4', bubble: '#B8C1CC', bubbleAccent: '#9AA5B1',
    cardFillLight: '#FFFFFF', cardFillDark: '#24272B', deskCardFill: '#FAFBFC', deskCardBorder: '#E3E7EC',
  },
  bubbles: [],
  sprite: null,
  motif: 'none' as const,
  icon: null,
  sounds: { tick: 'tick.wav', done: 'done.wav', deny: 'deny.wav' },
  voices: { zh: [], en: [] },
  words: {},
}

test('横条：终端画像素小画和刻度尺，桌面画一张带品牌名的 SVG 卡片', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  const terminal = await mountChecked($, { ...BAND, surface: 'terminal' })
  expect(await terminal.find({ type: 'Raster' })).toBeDefined()
  expect(await terminal.find({ type: 'Text', text: /上下文/ })).toBeDefined()
  expect(await terminal.find({ type: 'Text', text: /├/ })).toBeDefined()
  expect(await terminal.find({ type: 'Text', text: /消息\sT00/ })).toBeDefined()
  expect(await terminal.find({ type: 'Svg' })).toBeUndefined()
  await terminal.unmount()

  const desktop = await mountChecked($, { ...BAND, surface: 'desktop' })
  const card = await desktop.find({ type: 'Svg' })
  const svg = String(card?.props.source)
  // 品牌名取 lemo-core.title，假核心的风格没有文字，所以是默认的 lemo-mod
  expect(svg).toContain('lemo-mod')
  expect(svg).toContain('width="100%"')
  // 烧瓶风格画烧瓶和气泡动画
  expect(svg).toContain('lm-glass')
  expect(svg).toContain('<animate')
  // 不加 isInteractive（会闪），不给 width（外面的竖排 Box 拉满）
  expect(card?.props.isInteractive).toBeUndefined()
  expect(card?.props.width).toBeUndefined()
  expect(await desktop.find({ type: 'Raster' })).toBeUndefined()
  await desktop.unmount()
})

test('横条：胶囊（带倒计时）和 git 分支都画上去', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  on('state.get', { plugin: 'lemo-core', key: 'badges' }, async () => ({ value: { value: BADGES, version: 1 } }))
  fakeFs(on, '/w/proj', REPO, ['/w/proj/.git'])
  on('session.usage', async () => ({ value: { startedAt: 0, context: { tokens: 1200, window: 10000, percent: 12 }, rateLimits: [{ kind: 'five_hour', percentUsed: 30 }], cost: { usd: 0.42 } } }))
  on('ui.status', async () => ({ value: undefined }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  // 读分支放在 clock.after(0) 里
  await clock.advance(0)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...BAND, surface })
    if (surface === 'terminal') {
      expect(await ui.find({ type: 'Text', text: /番茄\s01:30/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /简短/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /⎇ main/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /\$0\.42/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /12%/ })).toBeDefined()
    } else {
      const svg = String((await ui.find({ type: 'Svg' }))?.props.source)
      expect(svg).toContain('番茄 01:30')
      expect(svg).toContain('简短')
      expect(svg).toContain('⎇ main')
      expect(svg).toContain('$0.42')
    }
    await ui.unmount()
  }
})

test('横条：提示出在横条上（终端顶替底行）', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  on('state.get', { plugin: 'lemo-core', key: 'notice' }, async () => ({ value: { value: NOTICE, version: 1 } }))
  const terminal = await mountChecked($, { ...BAND, surface: 'terminal' })
  expect(await terminal.find({ type: 'Text', text: /●\s拦下了一次强推/ })).toBeDefined()
  await terminal.unmount()
  const desktop = await mountChecked($, { ...BAND, surface: 'desktop' })
  expect(String((await desktop.find({ type: 'Svg' }))?.props.source)).toContain('拦下了一次强推')
  await desktop.unmount()
})

test('横条：终端地方不够时一级一级减：先不画小画，再改成一行用量', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  // 对话区 32 列：刻度尺（26 列）加右上角收起按钮（留 4 列）放得下，测试风格的小画（4 列，再空 2 列）放不下
  const mid = await mountChecked($, { ...BAND, surface: 'terminal', props: { ...BAND.props, bodyColumns: 32 } })
  expect(await mid.find({ type: 'Raster' })).toBeUndefined()
  expect(await mid.find({ type: 'Text', text: /├/ })).toBeDefined()
  await mid.unmount()
  // 28 列：刻度尺本身放得下，但右端会被收起按钮「[-]」盖住数值：改成一行用量，右边同样留出 4 列，下面照常是底行
  for (const bodyColumns of [28, 24]) {
    const narrow = await mountChecked($, { ...BAND, surface: 'terminal', props: { ...BAND.props, bodyColumns } })
    expect(await narrow.find({ type: 'Raster' })).toBeUndefined()
    expect(await narrow.find({ type: 'Text', text: /├/ })).toBeUndefined()
    const brief = await narrow.find({ type: 'Text', text: /^\S+ \S+ · \S+ \S+$/ })
    expect(brief?.props.wrap).toBe('truncate')
    expect((await narrow.find({ type: 'Box', key: 'meter-brief' }))?.props.paddingRight).toBe(4)
    await narrow.unmount()
  }
  // 面板在输入框上方、横条只给两行：同样改成一行用量
  const two = await mountChecked($, { ...BAND, surface: 'terminal', props: { ...BAND.props, maxRows: 2 } })
  expect(await two.find({ type: 'Text', text: /├/ })).toBeUndefined()
  expect(await two.find({ type: 'Text', text: /^\S+ \S+ · \S+ \S+$/ })).toBeDefined()
  await two.unmount()
})

test('横条：终端只给一行时，有提示就只写提示', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  on('state.get', { plugin: 'lemo-core', key: 'notice' }, async () => ({ value: { value: NOTICE, version: 1 } }))
  const one = await mountChecked($, { ...BAND, surface: 'terminal', props: { ...BAND.props, maxRows: 1 } })
  expect(await one.find({ type: 'Text', text: /拦下了一次强推/ })).toBeDefined()
  expect(await one.find({ type: 'Text', text: /^\S+ \S+ · \S+ \S+$/ })).toBeUndefined()
  await one.unmount()
})

test('横条：桌面上长提示在右上角胶囊前面收住，末尾加「…」，不从胶囊底下穿过去', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  const long = '已开启：提示音、朗读、编号说明、Claude 可派助手、抽签工具、日志、压缩后自动摘要、限时 · 在 /lemo-mod 安全 中修改'
  on('state.get', { plugin: 'lemo-core', key: 'notice' }, async () => ({ value: { value: { text: long, tone: 'ink', until: 5000 }, version: 1 } }))
  const desktop = await mountChecked($, { ...BAND, surface: 'desktop' })
  const svg = String((await desktop.find({ type: 'Svg' }))?.props.source)
  expect(svg).toContain('已开启：提示音')
  expect(svg).not.toContain('中修改')
  expect(svg).toContain('…</text>')
  expect(svg).toContain('clip-path="url(#lm-notice)"')
  await desktop.unmount()
})

test('横条：风格没有像素小画时终端不画，motif 为 none 时桌面不画烧瓶', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  on('state.get', { plugin: 'lemo-core', key: 'style' }, async () => ({ value: { value: PLAIN, version: 1 } }))
  const terminal = await mountChecked($, { ...BAND, surface: 'terminal' })
  expect(await terminal.find({ type: 'Raster' })).toBeUndefined()
  expect(await terminal.find({ type: 'Text', text: /├/ })).toBeDefined()
  await terminal.unmount()
  const desktop = await mountChecked($, { ...BAND, surface: 'desktop' })
  const svg = String((await desktop.find({ type: 'Svg' }))?.props.source)
  expect(svg).not.toContain('lm-glass')
  expect(svg).toContain('#D9DEE5')
  await desktop.unmount()
})

test('横条：motif 为 sprite 时桌面把像素小画放大画上去，两帧轮流', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  const sprite = { palette: { a: '#123456', b: '#ABCDEF' }, frames: [['ab', 'ba'], ['ba', 'ab']] }
  on('state.get', { plugin: 'lemo-core', key: 'style' }, async () => ({ value: { value: { ...PLAIN, motif: 'sprite', sprite }, version: 1 } }))
  const desktop = await mountChecked($, { ...BAND, surface: 'desktop' })
  const svg = String((await desktop.find({ type: 'Svg' }))?.props.source)
  expect(svg).not.toContain('lm-glass')
  expect(svg).toContain('fill="#123456"')
  expect(svg).toContain('fill="#ABCDEF"')
  expect(svg).toContain('calcMode="discrete"')
  // 有图案时标签挪到图案右边
  expect(svg).toContain('<text x="92"')
  await desktop.unmount()
})

test('横条：有问卷时让给它', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  const ui = await mountChecked($, { ...BAND, surface: 'terminal', props: { ...BAND.props, hasSurvey: true } })
  expect(await ui.find({ type: 'Raster' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /├/ })).toBeUndefined()
  await ui.unmount()
})

test('横条：里层有别的 mod 画了东西（比如番茄钟的选择行），接在横条下面', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('ui.render', { component: 'AbovePrompt' }, async ($$, e) => {
    const { Text } = $$.ui.resolve(e)
    return <Text>接在下面的一行</Text>
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: '接在下面的一行' })).toBeDefined()
    expect(await ui.find({ type: surface === 'terminal' ? 'Raster' : 'Svg' })).toBeDefined()
    await ui.unmount()
  }
})

test('状态栏：品牌短名、编号、上下文；文字没变不重发', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  const sent: (string | undefined)[] = []
  on('ui.status', async ($$, e) => {
    sent.push(e.text)
    return { value: undefined }
  })
  on('session.usage', async () => ({ value: { startedAt: 0, context: { window: 10000, percent: 12 }, rateLimits: [] } }))
  // 用户自己没设状态栏：状态栏默认开
  scanned(on, false)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(sent.at(-1)).toBe('lemo ┊ T00 ┊ 上下文 12%')
  const before = sent.length
  await clock.advance(3000)
  // 没有倒计时：每秒看一次，文字没变就不发
  expect(sent.length).toBe(before)
})

test('状态栏：有倒计时胶囊时每秒走字', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  const sent: (string | undefined)[] = []
  on('ui.status', async ($$, e) => {
    sent.push(e.text)
    return { value: undefined }
  })
  on('state.get', { plugin: 'lemo-core', key: 'badges' }, async () => ({ value: { value: BADGES, version: 1 } }))
  on('session.usage', async () => ({ value: { startedAt: 0, context: { window: 10000 }, rateLimits: [] } }))
  scanned(on, false)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(sent.at(-1)).toBe('lemo ┊ T00 ┊ 番茄 01:30 ┊ 简短')
  await clock.advance(1000)
  expect(sent.at(-1)).toBe('lemo ┊ T00 ┊ 番茄 01:29 ┊ 简短')
})

test('面板：终端「常用」页有用量卡片；桌面每一页最上面是数据卡（标题、编号、三格数据），没有用量卡片', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  mock.store(on)
  const term = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await term.find({ key: 'meter-usage' })).toBeDefined()
  expect(await term.find({ type: 'Svg' })).toBeUndefined()
  expect(await term.find({ type: 'Text', text: /完成一轮后显示走势/ })).toBeDefined()
  expect(await term.find({ key: 'meter-version' })).toBeUndefined()
  await term.unmount()
  for (const tab of ['常用', '后台', '行为']) {
    await $.command.run({ command: 'lemo-mod', args: tab } as never)
    const desk = await mountChecked($, { ...HUB, surface: 'desktop' })
    expect(await desk.find({ key: 'meter-usage' })).toBeUndefined()
    const head = await desk.find({ key: 'meter-head' })
    expect(head).toBeDefined()
    const svg = String((await desk.find({ type: 'Svg' }))?.props.source)
    expect(svg).toContain('5 小时额度')
    expect(svg).toContain('T00')
    expect(svg).toContain('完成一轮后显示走势')
    await desk.unmount()
  }
})

test('面板「常用」：每轮结束记一次上下文，走势画出来', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  mock.store(on)
  let pct = 10
  on('session.usage', async () => ({ value: { startedAt: 0, context: { window: 10000, percent: pct }, rateLimits: [], cost: { usd: 1.5 } } }))
  on('ui.status', async () => ({ value: undefined }))
  const done = { turnId: 't', answer: '', durationMs: 1000, isAborted: false } as never
  await $.turn.complete(done)
  pct = 40
  await $.turn.complete(done)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /上下文走势\s[▁▂▃▄▅▆▇█]{2}$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /\$1\.50/ })).toBeDefined()
  await ui.unmount()
  const desk = await mountChecked($, { ...HUB, surface: 'desktop' })
  expect(String((await desk.find({ type: 'Svg' }))?.props.source)).toContain('polyline')
  await desk.unmount()
})

test('面板「后台」：终端有 git 分支和检查新版本两张卡片，检查后显示结果；桌面上只有 git 分支（桌面 App 自己更新，查命令行版的号会误导）', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  mock.store(on)
  on('http.fetch', async () => ({ value: { status: 200, ok: true, headers: {}, text: '{"version":"9.9.9"}' } }))
  on('session.version', async () => ({ value: { version: '2.1.287' } }))
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { ...HUB, surface })
    expect(await ui.find({ key: 'meter-branch' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /当前目录不是\sgit\s仓库/ })).toBeDefined()
    // 说明里写清楚：读 .git/HEAD，不运行 git
    expect(await ui.find({ type: 'Text', text: /\.git\/HEAD.*不运行\sgit/ })).toBeDefined()
    const isTerm = surface === 'terminal'
    expect((await ui.find({ key: 'meter-version' })) !== undefined).toBe(isTerm)
    expect((await ui.find({ key: 'meter-check' })) !== undefined).toBe(isTerm)
    expect((await ui.find({ type: 'Link', text: /更新日志/ })) !== undefined).toBe(isTerm)
    // 常用页的卡片不在这一页
    expect(await ui.find({ key: 'meter-usage' })).toBeUndefined()
    await ui.unmount()
  }
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'meter-check' })
  expect(await ui.find({ type: 'Text', text: /有新版本\s9\.9\.9（当前\s2\.1\.287）/ })).toBeDefined()
  await ui.unmount()
})

test('分支：从会话目录往上找 .git，读 HEAD 文件（不跑 git）；worktree 的 gitdir、分离头指针、不是仓库都认得', { plugins: [testCore] }, async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  mock.store(on)
  const ran: unknown[] = []
  on('process.run', async ($$, e) => {
    ran.push(e)
    return { value: { exitCode: 0, stdout: 'main\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  let cwd = '/w/proj/src/deep'
  const files: Record<string, string> = {
    ...REPO,
    // git worktree：.git 是个文件，指向主仓库里的 worktrees/feat（相对路径）
    '/w/feat/.git': 'gitdir: ../proj/.git/worktrees/feat\n',
    '/w/proj/.git/worktrees/feat/HEAD': 'ref: refs/heads/feat/login\n',
    // 分离头指针：HEAD 里只有提交号
    '/w/detached/.git/HEAD': '0123456789abcdef0123456789abcdef01234567\n',
  }
  fakeFs(on, () => cwd, files, ['/w/proj/.git', '/w/detached/.git'])
  const branchNow = async () => {
    await $.session.start({ cwd, surface: 'terminal', isInteractive: true })
    await clock.advance(0)
    const ui = await mountChecked($, { ...BAND, surface: 'terminal' })
    const t = (await ui.find({ type: 'Text', text: /⎇/ }))?.text ?? ''
    await ui.unmount()
    return /⎇ (\S+)/.exec(t)?.[1] ?? null
  }
  // 在仓库的子目录里打开：往上找到 /w/proj/.git
  expect(await branchNow()).toBe('main')
  cwd = '/w/feat'
  expect(await branchNow()).toBe('feat/login')
  cwd = '/w/detached'
  expect(await branchNow()).toBe('0123456')
  cwd = '/w/plain'
  expect(await branchNow()).toBeNull()
  expect(ran).toEqual([])
})

test('状态栏：照你自己的设置——你设了状态栏就不开（安全页写「关着」）；按了开关以后照你的，存进 $.store', { plugins: [testCore, safety] }, async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  const kv = new Map<string, unknown>()
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  const sent: (string | undefined)[] = []
  on('ui.status', async ($$, e) => {
    sent.push(e.text)
    return { value: undefined }
  })
  on('session.usage', async () => ({ value: { startedAt: 0, context: { window: 10000, percent: 12 }, rateLimits: [] } }))
  scanned(on, true)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  await clock.advance(3000)
  expect(sent).toEqual([])
  const statusRow = async () => (await capsOf($)).find(c => c.mod === 'lemo-meter' && c.id === 'status')
  expect((await statusRow())?.on).toBe(false)
  // 在安全页打开：马上发，记进 $.store
  expect(await toggle($, { mod: 'lemo-meter', id: 'status', on: true })).toBe(true)
  expect(sent.at(-1)).toBe('lemo ┊ T00 ┊ 上下文 12%')
  expect(kv.get('status')).toBe(true)
  expect((await statusRow())?.on).toBe(true)
  // 再关掉：去掉已经发出去的状态栏
  await toggle($, { mod: 'lemo-meter', id: 'status', on: false })
  expect(sent.at(-1)).toBeUndefined()
  expect(kv.get('status')).toBe(false)
  const before = sent.length
  await clock.advance(3000)
  expect(sent.length).toBe(before)
  // 认不出的 id、别的 mod 的开关不管
  expect(await toggle($, { mod: 'lemo-meter', id: 'nope', on: true })).toBe(false)
  expect(await toggle($, { mod: 'lemo-other', id: 'status', on: true })).toBe(false)
})

test('横条：安全页关掉以后原样交给里层，开关存进 $.store；「全部关闭」不碰它', { plugins: [testCore, safety] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  const kv = new Map<string, unknown>()
  on('store.get', async ($$, e) => ({ value: kv.get(e.key) }))
  on('store.set', async ($$, e) => {
    kv.set(e.key, e.value)
    return { value: undefined }
  })
  const drawn = async (surface: 'terminal' | 'desktop') => {
    const ui = await mountChecked($, { ...BAND, surface })
    const has = (await ui.find({ type: surface === 'terminal' ? 'Raster' : 'Svg' })) !== undefined
    await ui.unmount()
    return has
  }
  expect(await drawn('terminal')).toBe(true)
  expect(await toggle($, { mod: 'lemo-meter', id: 'band', on: false })).toBe(true)
  expect(kv.get('band')).toBe(false)
  for (const surface of ['terminal', 'desktop'] as const) expect(await drawn(surface)).toBe(false)
  // 「全部关闭」不碰外观
  await allOff($)
  expect(kv.get('band')).toBe(false)
  await toggle($, { mod: 'lemo-meter', id: 'band', on: true })
  await allOff($)
  expect(await drawn('desktop')).toBe(true)
})

test('开会话时读回存下来的开关：关过的横条还是关的，打开过的状态栏照开（哪怕你自己也设了状态栏）', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  engine(on)
  mock.store(on, { band: false, status: true })
  const sent: (string | undefined)[] = []
  on('ui.status', async ($$, e) => {
    sent.push(e.text)
    return { value: undefined }
  })
  on('session.usage', async () => ({ value: { startedAt: 0, context: { window: 10000, percent: 12 }, rateLimits: [] } }))
  scanned(on, true)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(sent).toEqual(['lemo ┊ T00 ┊ 上下文 12%'])
  const ui = await mountChecked($, { ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /├/ })).toBeUndefined()
  await ui.unmount()
})

test('能力清单：横条、状态栏是外观；查新版本是点了才联网（没有开关），桌面上不列', { plugins: [testCore, safety] }, async ($, on) => {
  mock.clock(on)
  mock.store(on)
  let surfaces: string[] = ['terminal']
  on('session.surfaces', async () => ({ value: surfaces as never }))
  scanned(on, false)
  const rows = async () => (await capsOf($)).filter(c => c.mod === 'lemo-meter').map(c => [c.id, c.kind, c.on, c.manual === true])
  expect(await rows()).toEqual([
    ['band', 'look', true, false],
    ['status', 'look', true, false],
    ['version', 'net', false, true],
  ])
  surfaces = ['desktop']
  expect((await rows()).map(r => r[0])).toEqual(['band', 'status'])
  // 每一行中英各一句
  for (const c of await capsOf($)) {
    expect(c.title.zh).not.toBe('')
    expect(c.desc.en).not.toBe('')
  }
})

test('安全：刚装上（存档全空）不跑 git、不联网、不写文件、不调模型、不出声；你有自己的状态栏时不发状态栏；打开开关、按「检查」以后才做', { plugins: [testCore, safety] }, async ($, on) => {
  const clock = mock.clock(on)
  engine(on)
  mock.store(on)
  const did = watchActs(on)
  const sent: (string | undefined)[] = []
  on('ui.status', async ($$, e) => {
    sent.push(e.text)
    return { value: undefined }
  })
  on('session.usage', async () => ({ value: { startedAt: 0, context: { window: 10000, percent: 12 }, rateLimits: [] } }))
  on('session.version', async () => ({ value: { version: '2.1.287' } }))
  scanned(on, true)
  fakeFs(on, '/w/proj', REPO, ['/w/proj/.git'])
  await $.session.start({ cwd: '/w/proj', surface: 'terminal', isInteractive: true })
  await clock.advance(0)
  await $.turn.complete({ turnId: 't', answer: '', durationMs: 1000, isAborted: false } as never)
  await clock.advance(3000)
  // 外观照画：横条上有分支（读文件得来）
  const band = await mountChecked($, { ...BAND, surface: 'terminal' })
  expect(await band.find({ type: 'Text', text: /⎇ main/ })).toBeDefined()
  await band.unmount()
  expect(did).toEqual([])
  expect(sent).toEqual([])
  // 打开状态栏的开关以后才发
  await toggle($, { mod: 'lemo-meter', id: 'status', on: true })
  expect(sent).toEqual(['lemo ┊ T00 ┊ 上下文 12%'])
  // 按了「检查」才联网
  await $.command.run({ command: 'lemo-mod', args: '后台' } as never)
  const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
  await ui.press({ key: 'meter-check' })
  await ui.unmount()
  expect(did).toEqual(['http.fetch'])
})
