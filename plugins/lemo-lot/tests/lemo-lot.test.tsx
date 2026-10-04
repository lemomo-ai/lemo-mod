import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Plugin } from 'claude-code/testing'

import { lemoCalls, testCore, testSay } from './shared/test-core'
import { mountChecked } from './shared/test-colors'

const LOT_TOOL = 'mcp__lemo-lot__draw_lot'

// 带签文的假风格：和 testCore 一样接 $.lemo，只是风格里写了 lemo-lot 的签文、签级名、签筒名、印章字。
// 内联插件的 register 不能用到这个文件里别的东西，所以数据都写在里面
const styledCore: Plugin = {
  name: 'lemo-core',
  register(on) {
    const style = {
      id: 'test-style',
      name: { zh: '测试风格', en: 'Test style' },
      colors: {
        ink: '#6F8FE0', grid: '#7FA3CC', pencil: '#8A9099', accent: '#F2CF1D', onAccent: '#1B1D1F', red: '#E0524A',
        inkDark: '#2F4F96', chip: '#E9EFFA', bubble: '#8FB3D9', bubbleAccent: '#E2B714',
        cardFillLight: '#FFFBEA', cardFillDark: '#262A31', deskCardFill: '#F7F9FC', deskCardBorder: '#E4ECF6', deskFigure: '#1B1D1F',
      },
      bubbles: [],
      sprite: null,
      motif: 'none' as const,
      icon: null,
      sounds: { tick: 'tick.wav', done: 'done.wav', deny: 'deny.wav' },
      voices: { zh: [], en: [] },
      words: {
        'lemo-lot.lots': { zh: ['0|甲号签文。|甲号解签。'], en: ['0|Verse A.|Reading A.'] },
        'lemo-lot.ranks': { zh: ['头签', '二签', '三签', '四签', '五签', '末签'], en: ['Top', 'Second', 'Third', 'Fourth', 'Fifth', 'Last'] },
        'lemo-lot.tube': { zh: '测试签筒', en: 'Test tube' },
        'lemo-lot.stamp': { zh: ['测试', '印章'], en: ['TEST', 'SEAL'] },
      },
    }
    on('engine.create', async (_$, e, next) => {
      const $b = await next(e)
      return {
        ...$b,
        lemo: {
          style: async () => style,
          lang: async () => 'zh' as const,
          join: async () => undefined,
          open: async () => undefined,
          play: async () => undefined,
          say: async () => undefined,
          notice: async () => undefined,
          badge: async () => undefined,
          set: async () => undefined,
          tag: async () => undefined,
          command: async () => null,
          recall: async () => null,
          caps: async () => [] as never[],
          toggle: async () => false,
          off: async () => undefined,
        },
      }
    })
  },
}

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
const capsOf = async ($: Engine) => ((await probeRun($, 'caps')) as Cap[]).filter(c => c.mod === 'lemo-lot')
const toggle = async ($: Engine, isOn: boolean) => probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-lot', id: 'tool', on: isOn }))

const toolUse = (output: unknown, extra: Record<string, unknown> = {}) =>
  ({ tool: LOT_TOOL, tool_use_id: 't1', input: {}, output, isRunning: false, isErrored: false, isInterrupted: false, ...extra })

const mountUse = ($: Engine, surface: 'terminal' | 'desktop', output: unknown, extra: Record<string, unknown> = {}) =>
  mountChecked($, { plugin: 'lemo-lot', surface, component: 'ToolUse', props: toolUse(output, extra) } as never)

test('抽签工具：返回一支默认签，放完成音效，调用行画成签文卡片（终端圆角框，桌面铺满宽度的 SVG）', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 抽签工具装上时关着：这里当用户在安全页打开过（存在 $.store 里）
  mock.store(on, { tool: true })
  const played: unknown[] = []
  on('lemo.play', async ($$, e, next) => {
    played.push(e)
    return next(e)
  })
  const r = await $.tool.call({ tool: LOT_TOOL, wish: '今天能发版吗' } as never)
  const text = String((r as { result?: unknown }).result)
  expect(text).toMatch(/^第 \d{2} 签 · .+\n签文：.+\n解签：.+$/)
  // testCore 的风格里没有 lemo-lot 的文字：用的是中性的默认签文
  expect(text).not.toMatch(/柠檬|滴定|上上签/)
  expect(JSON.stringify(played)).toContain('"sound":"done"')
  expect(JSON.stringify(played)).toContain('"gain":0.8')

  const terminal = await mountUse($, 'terminal', text)
  expect(await terminal.find({ type: 'Text', text: /解签：/ })).toBeDefined()
  expect(await terminal.find({ type: 'Text', text: /第\s\d{2}\s签/ })).toBeDefined()
  expect(await terminal.find({ type: 'Svg' })).toBeUndefined()
  await terminal.unmount()

  const desktop = await mountUse($, 'desktop', text)
  const card = await desktop.find({ type: 'Svg' })
  expect(String(card?.props.source)).toContain('签筒')
  expect(String(card?.props.source)).toContain('解签：')
  // 桌面 SVG 铺满宽度：Svg 不给 width，外面包竖排的 Box
  expect(card?.props.width).toBeUndefined()
  await desktop.unmount()
})

test('签文卡片：风格包那种签文（柠檬实验室）也能解析，MCP 内容块也认', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  const styled = [{ type: 'text', text: '第 09 签 · 上上签\n签文：实验复现成功。\n解签：可以发版了。' }]
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountUse($, surface, styled)
    if (surface === 'terminal') {
      expect(await ui.find({ type: 'Text', text: /实验复现成功/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /上上签/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /第\s09\s签/ })).toBeDefined()
    } else {
      const svg = String((await ui.find({ type: 'Svg' }))?.props.source)
      expect(svg).toContain('实验复现成功')
      // 竹签上竖排的「第九签」
      expect(svg).toContain('>九</text>')
    }
    await ui.unmount()
  }
})

test('签文卡片：还在摇时显示「摇签中」，没摇出来显示一句话', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const running = await mountUse($, surface, undefined, { isRunning: true })
    expect(await running.find({ type: 'Text', text: /摇签中/ })).toBeDefined()
    await running.unmount()
    const failed = await mountUse($, surface, 'oops', { isErrored: true })
    expect(await failed.find({ type: 'Text', text: /抽签失败/ })).toBeDefined()
    await failed.unmount()
  }
})

test('风格：签文、签级名、签筒名、印章字跟着风格走，签级按风格的签级名上颜色', { plugins: [styledCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { tool: true })
  const r = await $.tool.call({ tool: LOT_TOOL, wish: '' } as never)
  const text = String((r as { result?: unknown }).result)
  expect(text).toBe('第 01 签 · 头签\n签文：甲号签文。\n解签：甲号解签。')

  const terminal = await mountUse($, 'terminal', text)
  expect(await terminal.find({ type: 'Text', text: /测试签筒/ })).toBeDefined()
  // 签级 0：红笔的颜色
  expect((await terminal.find({ type: 'Text', text: /头签/ }))?.props.color).toBe('#E0524A')
  await terminal.unmount()

  const desktop = await mountUse($, 'desktop', text)
  const svg = String((await desktop.find({ type: 'Svg' }))?.props.source)
  expect(svg).toContain('测试签筒')
  expect(svg).toContain('印章')
  expect(svg).toContain('fill="#E0524A">头签')
  await desktop.unmount()
})

test('中英文：界面换成英文，签文和卡片也跟着变；换回中文又变回来', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  mock.store(on, { tool: true })
  await testSay($, 'please draw a lot for me')
  const en = String(((await $.tool.call({ tool: LOT_TOOL, wish: '' } as never)) as { result?: unknown }).result)
  expect(en).toMatch(/^Lot \d{2} · .+\nVerse: .+\nReading: .+$/)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountUse($, surface, en)
    if (surface === 'terminal') {
      expect(await ui.find({ type: 'Text', text: /LOT \d{2}/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /Reading: / })).toBeDefined()
    } else {
      const svg = String((await ui.find({ type: 'Svg' }))?.props.source)
      expect(svg).toContain('Lot tube')
      expect(svg).toContain('LOT')
    }
    await ui.unmount()
  }
  // 英文界面下，之前抽的中文签画成同一支签的英文（签文中英按顺序一一对应）
  const old = await mountUse($, 'terminal', '第 03 签 · 小吉\n签文：水还没烧开。\n解签：再读一遍需求。')
  expect(await old.find({ type: 'Text', text: /The water has not boiled yet/ })).toBeDefined()
  expect(await old.find({ type: 'Text', text: /Even/ })).toBeDefined()
  await old.unmount()
  // 对不上当前风格签文的旧签（比如换过风格），照结果原样画
  const other = await mountUse($, 'terminal', '第 03 签 · 小吉\n签文：别的风格的签文。\n解签：照原样。')
  expect(await other.find({ type: 'Text', text: /别的风格的签文/ })).toBeDefined()
  await other.unmount()

  await testSay($, '帮我抽一支签')
  const zh = String(((await $.tool.call({ tool: LOT_TOOL, wish: '' } as never)) as { result?: unknown }).result)
  expect(zh).toMatch(/^第 \d{2} 签 · .+\n签文：.+\n解签：.+$/)
})

test('结果行：抽到签时隐藏（卡片已经画了），出错时照常画', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  let engineDrew = 0
  on('ui.render', { component: 'ToolResult' }, async () => {
    engineDrew += 1
    return { type: 'engine', ref: 0 } as const
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ok = await mountChecked($, { plugin: 'lemo-lot', surface, component: 'ToolResult', props: { tool: LOT_TOOL, tool_use_id: 't1', output: '第 01 签 · 大吉\n签文：花开正好。\n解签：可以发版了。', isErrored: false } } as never)
    expect(await ok.find({ type: 'Text' })).toBeUndefined()
    await ok.unmount()
  }
  expect(engineDrew).toBe(0)
  const bad = await mountChecked($, { plugin: 'lemo-lot', surface: 'terminal', component: 'ToolResult', props: { tool: LOT_TOOL, tool_use_id: 't2', output: 'boom', isErrored: true } } as never)
  expect(engineDrew).toBe(1)
  await bad.unmount()
})

test('折叠行：里层画了计数行（lemo-skin）时，签文卡片接在下面；没有抽签、展开时不接', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  // 替引擎（或 lemo-skin）画原来的折叠行
  on('ui.render', { component: 'ToolGroup' }, async ($$, e) => {
    const { Text } = $$.ui.resolve(e)
    return <Text>原来那一行</Text>
  })
  const lotText = '第 05 签 · 小凶\n签文：桥上有一块木板松了。\n解签：先备份，再动手。'
  const search = { tool_use_id: 's1', tool: 'ToolSearch', input: { query: 'select:mcp__lemo-lot__draw_lot' }, isRunning: false, isErrored: false, isInterrupted: false, output: 'ok' }
  const lot = { tool_use_id: 'l1', tool: LOT_TOOL, input: { wish: '' }, isRunning: false, isErrored: false, isInterrupted: false, output: lotText }
  const group = (calls: unknown[], isExpanded = false) => ({ calls, isActive: false, isExpanded })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await mountChecked($, { plugin: 'lemo-lot', surface, component: 'ToolGroup', props: group([search, lot]) } as never)
    expect(await ui.find({ type: 'Text', text: /原来那一行/ })).toBeDefined()
    if (surface === 'terminal') {
      expect(await ui.find({ type: 'Text', text: /桥上有一块木板松了/ })).toBeDefined()
      expect(await ui.find({ type: 'Svg' })).toBeUndefined()
    } else {
      const card = await ui.find({ type: 'Svg' })
      expect(String(card?.props.source)).toContain('桥上有一块木板松了')
      expect(card?.props.width).toBeUndefined()
    }
    await ui.unmount()

    // 还在摇：折叠行下面补一行「摇签中」
    const running = await mountChecked($, { plugin: 'lemo-lot', surface, component: 'ToolGroup', props: group([search, { ...lot, isRunning: true, output: undefined }]) } as never)
    expect(await running.find({ type: 'Text', text: /摇签中/ })).toBeDefined()
    await running.unmount()

    // 组里没有抽签：原样
    const plain = await mountChecked($, { plugin: 'lemo-lot', surface, component: 'ToolGroup', props: group([search]) } as never)
    expect(await plain.find({ type: 'Text', text: /原来那一行/ })).toBeDefined()
    expect(await plain.find({ type: 'Text', text: /桥上/ })).toBeUndefined()
    expect(await plain.find({ type: 'Svg' })).toBeUndefined()
    await plain.unmount()

    // 展开的折叠行：每条调用单独画成 ToolUse，卡片由 ToolUse 的 hook 画，这里不再接
    const open = await mountChecked($, { plugin: 'lemo-lot', surface, component: 'ToolGroup', props: group([search, lot], true) } as never)
    expect(await open.find({ type: 'Text', text: /桥上/ })).toBeUndefined()
    expect(await open.find({ type: 'Svg' })).toBeUndefined()
    await open.unmount()
  }
})

// 报到表里的一项（lemo-core 的 mods 状态）：只看 mod 名
const joined = (mod: string) => ({ mod, title: { zh: mod, en: mod }, tabs: [] })

test('折叠行：里层是引擎原样、装了 lemo-skin 时只画签文卡片（计数行由外层的 lemo-skin 补）；「展开工具行」打开时不接', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  on('ui.render', { component: 'ToolGroup' }, async () => ({ type: 'engine', ref: 0 }) as const)
  // 假核心不写报到表、也不记「展开工具行」：在最底层替 lemo-core 答
  on('state.get', { plugin: 'lemo-core', key: 'mods' }, async () => ({ value: { value: [joined('lemo-core'), joined('lemo-skin')], version: 1 } }))
  let unfold = false
  on('state.get', { plugin: 'lemo-core', key: 'unfold' }, async ($$, e, next) => (unfold ? { value: { value: true, version: 1 } } : next(e)))
  const lotText = '第 05 签 · 小凶\n签文：桥上有一块木板松了。\n解签：先备份，再动手。'
  const lot = { tool_use_id: 'l1', tool: LOT_TOOL, input: { wish: '' }, isRunning: false, isErrored: false, isInterrupted: false, output: lotText }
  const props = { calls: [lot], isActive: false, isExpanded: false }

  const ui = await mountChecked($, { plugin: 'lemo-lot', surface: 'terminal', component: 'ToolGroup', props } as never)
  expect(await ui.find({ type: 'Text', text: /桥上有一块木板松了/ })).toBeDefined()
  // 引擎那行不带上：lemo-skin 在外层时会把计数行放在上面，带上就多一行。
  // 下一个测试（没装 lemo-skin）里同样的查法找得到引擎原样，所以这里找不到是真的没有
  expect(await ui.find({ type: 'engine' })).toBeUndefined()
  const tree = (await ui.drawn()) as { type: string; children: { type: string }[] }
  expect(tree.children.map(c => c.type)).toEqual(['Box'])
  await ui.unmount()

  // lemo-skin 的「展开工具行」（存在 lemo-core 里）打开后，原样交给里层
  unfold = true
  const open = await mountChecked($, { plugin: 'lemo-lot', surface: 'terminal', component: 'ToolGroup', props } as never)
  expect(await open.find({ type: 'Text', text: /桥上/ })).toBeUndefined()
  expect(await open.find({ type: 'engine' })).toBeDefined()
  await open.unmount()
})

test('折叠行：没装 lemo-skin 时引擎那行留着（同一组里 Read、Bash 那些调用不能丢），签文卡片接在下面', { plugins: [testCore] }, async ($, on) => {
  mock.clock(on)
  on('ui.render', { component: 'ToolGroup' }, async () => ({ type: 'engine', ref: 0 }) as const)
  // 报到表：先是还没写过（假核心不写，当成没装），再是装了别的、没装 lemo-skin
  let mods: ReturnType<typeof joined>[] | null = null
  on('state.get', { plugin: 'lemo-core', key: 'mods' }, async ($$, e, next) => (mods === null ? next(e) : { value: { value: mods, version: 1 } }))
  const lotText = '第 05 签 · 小凶\n签文：桥上有一块木板松了。\n解签：先备份，再动手。'
  const read = { tool_use_id: 'r1', tool: 'Read', input: { file_path: '/tmp/a.ts' }, isRunning: false, isErrored: false, isInterrupted: false, output: 'x' }
  const lot = { tool_use_id: 'l1', tool: LOT_TOOL, input: { wish: '' }, isRunning: false, isErrored: false, isInterrupted: false, output: lotText }
  const props = { calls: [read, lot], isActive: false, isExpanded: false }

  for (const list of [null, [joined('lemo-core'), joined('lemo-lot'), joined('lemo-meter')]]) {
    mods = list
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await mountChecked($, { plugin: 'lemo-lot', surface, component: 'ToolGroup', props } as never)
      // 引擎那行在上、签文卡片在下；外层 Box 不给 width（引擎原样放进带 width 的 Box 会被拒绝整棵树）
      expect(await ui.find({ type: 'engine' })).toBeDefined()
      const tree = (await ui.drawn()) as { type: string; props: Record<string, unknown>; children: { type: string }[] }
      expect(tree.type).toBe('Box')
      expect(tree.props.width).toBeUndefined()
      expect(tree.children.map(c => c.type)).toEqual(['engine', 'Box'])
      if (surface === 'terminal') expect(await ui.find({ type: 'Text', text: /桥上有一块木板松了/ })).toBeDefined()
      else expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain('桥上有一块木板松了')
      await ui.unmount()
    }
  }
})

test('安全：刚装上不给 Claude 注册抽签工具，调了也不抽；在安全页打开后马上注册，下个会话开始时也注册', { plugins: [testCore, probe] }, async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  const registered: string[] = []
  on('tool.register', async ($$, e) => {
    registered.push(e.name)
    return { value: { tool: `mcp__lemo-lot__${e.name}` } } as never
  })
  on('session.start', async ($$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async ($$, e) => ({ text: e.answer }))
  const plays = async () => (await lemoCalls($)).filter(c => c.op === 'play' || c.op === 'say')
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  await $.turn.complete({ answer: '好', isAborted: false, durationMs: 10, turnId: 't1', reason: 'answer' })
  await clock.advance(1000)
  expect(registered).toEqual([])
  // 万一被调到（比如这个会话里刚关掉）：不抽签、不响，回一句「关着」；卡片上也画「关着」那一行
  const r = String(((await $.tool.call({ tool: LOT_TOOL, wish: '' } as never)) as { result?: unknown }).result)
  expect(r).toContain('turned off')
  expect(await plays()).toEqual([])
  const offCard = await mountUse($, 'terminal', r)
  expect(await offCard.find({ type: 'Text', text: /抽签工具未开启/ })).toBeDefined()
  await offCard.unmount()
  // 安全页上一行「新增工具」，关着
  expect((await capsOf($)).map(c => [c.id, c.kind, c.on])).toEqual([['tool', 'tool', false]])

  // 在安全页打开：马上注册（下一条消息起 Claude 能用），调用抽得出签
  expect(await toggle($, true)).toBe(true)
  expect(registered).toEqual(['draw_lot'])
  expect((await capsOf($))[0]?.on).toBe(true)
  const drawn = String(((await $.tool.call({ tool: LOT_TOOL, wish: '' } as never)) as { result?: unknown }).result)
  expect(drawn).toMatch(/^第 \d{2} 签/)
  expect((await plays()).length).toBe(1)
  // 下一个会话开始：存着开，照样注册
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  expect(registered).toEqual(['draw_lot', 'draw_lot'])

  // 「全部关闭」：这个会话里工具还在（引擎没有取消注册），调用不再抽；下一个会话不注册
  await probeRun($, 'off')
  expect((await capsOf($))[0]?.on).toBe(false)
  expect(String(((await $.tool.call({ tool: LOT_TOOL, wish: '' } as never)) as { result?: unknown }).result)).toContain('turned off')
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true } as never)
  expect(registered).toEqual(['draw_lot', 'draw_lot'])
  expect((await plays()).length).toBe(1)
  // 认不出的 id 不认
  expect(await probeRun($, 'toggle ' + JSON.stringify({ mod: 'lemo-lot', id: 'card', on: false }))).toBe(false)
})
