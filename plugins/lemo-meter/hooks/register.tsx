// lemo-meter：输入框上方的横条和状态栏。
// - 横条：上下文、五小时额度、花费，右上角是消息编号、各 mod 的胶囊（lemo-core 的 badges）和 git 分支，
//   提示（lemo-core 的 notice）出在标题右边。终端画风格的像素小画 + 刻度尺，桌面画一张铺满宽度的 SVG 卡片
// - 状态栏：品牌短名 ┊ T03 ┊ 上下文 12% ┊ 各胶囊，文字没变不重发
// - 面板卡片：「常用」页的用量（三格数据 + 上下文走势），「后台」页的 git 分支和检查新版本（桌面上没有检查新版本）
// - 安全页：横条、状态栏两行外观（有开关），查新版本是「点了才做」。
//   状态栏默认照用户自己的设置：用户自己设了 statusLine 就不开（lemo-core 的 scan），用户按过开关后照用户的

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren, RenderElement, RenderInput, Timer } from 'claude-code'

import type { LemoMeterLatest, LemoMeterUsage } from '../types'
import { BAND_H, PANE_H, bandSvg, paneSvg, ruler, sparkline, spriteCells } from './draw'
import type { Pill, Tone } from './draw'
import { STR } from './i18n'
import { HUB, bareInk, exp, fill, hubWrap, inkOf, mmss, pct, sec, steady, width, word } from './shared/lemo'
import type { CardSpec, Core, Look } from './shared/lemo'

// ---- lemo-shared BEGIN: 由 scripts/sync-shared.mjs 从 shared/lemo-block.tsx 复制，不要在这里改 ----
// 下面这几个函数要用 $，所以不能放进 shared/lemo.tsx（校验规定 $ 只能传给同一个文件里定义的函数），
// 由 scripts/sync-shared.mjs 原样插进每个 mod 的 hooks/register.tsx。只在 shared/lemo-block.tsx 里改。
// 导入都起了 Lemo 开头的别名，免得和 mod 自己的导入重名。
import type { EngineInterface as LemoEngine } from 'claude-code'
import { visibleTabs as lemoVisibleTabs } from './shared/lemo'
import type { Look as LemoLook, Tab as LemoTabId } from './shared/lemo'

// lemo-core 的状态（校验规定：状态的引用要写在用它的文件里）。读它们会订阅，lemo-core 一改，读过的地方自动重画
const LemoStyleRef = { plugin: 'lemo-core', key: 'style' } as const
const LemoLangRef = { plugin: 'lemo-core', key: 'lang' } as const
const LemoThemeRef = { plugin: 'lemo-core', key: 'theme' } as const
const LemoDeskRef = { plugin: 'lemo-core', key: 'desk' } as const
const LemoTabRef = { plugin: 'lemo-core', key: 'tab' } as const
const LemoModsRef = { plugin: 'lemo-core', key: 'mods' } as const
const LemoSeqRef = { plugin: 'lemo-core', key: 'seq' } as const

/**
 * 画东西时要的风格和语言。读 lemo-core 的状态会订阅，lemo-core 一改自动重画；还没写过时用 $.lemo 兜底。
 * 面板（Pane）的 hook 要把 e.props 传进来：面板停在哪（placement）决定正文用什么颜色（见 shared/lemo.tsx 的 inkOf）
 */
async function look($: LemoEngine, pane?: { placement: 'dock' | 'inline' }): Promise<LemoLook> {
  const st = (await $.state.get(LemoStyleRef)).value ?? (await $.lemo.style({}))
  const lang = (await $.state.get(LemoLangRef)).value ?? (await $.lemo.lang({}))
  const theme = (await $.state.get(LemoThemeRef)).value ?? null
  const desk = (await $.state.get(LemoDeskRef)).value ?? null
  return { st, c: st.colors, lang, theme, desk, inline: pane?.placement === 'inline' }
}

/** 用户本人发了几条消息（T01、T02…） */
async function seqOf($: LemoEngine): Promise<number> {
  return (await $.state.get(LemoSeqRef)).value ?? 0
}

/** 统一面板现在显示哪一页：存的那页在这个界面上没有，就显示第一页 */
async function hubTab($: LemoEngine, surface: string): Promise<LemoTabId> {
  const stored = (await $.state.get(LemoTabRef)).value ?? 'main'
  const mods = (await $.state.get(LemoModsRef)).value
  // 还没有报到表（lemo-core 还没写过，或者测试里用的是假核心）：照存的那页
  if (mods === undefined) return stored
  const shown = lemoVisibleTabs(mods, surface)
  return shown.includes(stored) ? stored : shown[0] ?? 'behave'
}
// ---- lemo-shared END ----

// lemo-core 的胶囊、提示和每秒加一的 frame（只读）
const BadgesRef = { plugin: 'lemo-core', key: 'badges' } as const
const NoticeRef = { plugin: 'lemo-core', key: 'notice' } as const
const FrameRef = { plugin: 'lemo-core', key: 'frame' } as const
// lemo-core 扫描到的用户设置（只读）：用户自己设了状态栏，这里的状态栏默认就不开
const LemoScanRef = { plugin: 'lemo-core', key: 'scan' } as const

const EMPTY: LemoMeterUsage = { ctx: null, quota: null, usd: null }
const IDLE: LemoMeterLatest = { status: 'idle', newest: '', mine: '', isNewer: false, why: '' }
const CHANGELOG = 'https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md'

const usage = atom({ plugin: 'lemo-meter', key: 'usage' } as const, EMPTY)
const history = atom({ plugin: 'lemo-meter', key: 'history' } as const, [] as readonly number[])
const branch = atom({ plugin: 'lemo-meter', key: 'branch' } as const, null as string | null)
const latest = atom({ plugin: 'lemo-meter', key: 'latest' } as const, IDLE)
// 横条开关：外观，装上就开。存进 $.store（键 band），开会话时读回来；横条读它，一改就重画
const bandOn = atom({ plugin: 'lemo-meter', key: 'bandOn' } as const, true)
// 状态栏开关：用户按过就是 true / false（存进 $.store，键 status），没按过是 null，照 lemo-core 的扫描定
const statusPref = atom({ plugin: 'lemo-meter', key: 'statusPref' } as const, null as boolean | null)

type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]

// 桌面代码字体一格大约多少像素，只用来估算宽度
const CELL_PX = 7.8

type Badge = Core['badges'][number]
type Shown = Badge & { text: string | { zh: string; en: string } }

// 上一次发给状态栏的文字：没变就不重发（状态栏每次更新，桌面都会重画底部那一块）
let lastStatus = ''
// 每秒刷新状态栏的计时器
let statusTimer: Timer | null = null

/**
 * 还在的胶囊：text 为 null 的是去掉了；倒计时过了点 3 秒还在的也不画
 * （放胶囊的 mod 到点没能去掉它，比如重载丢了计时器，不能一直挂着「00:00」、桌面也不能因此一直每秒重画）
 */
function liveBadges(list: readonly Badge[] | undefined, now: number): Shown[] {
  return (list ?? []).filter(
    (b): b is Shown => b.text !== null && b.text !== '' && (typeof b.endsAt !== 'number' || b.endsAt > now - 3000),
  )
}

/** 胶囊上的字（按当前语言挑）：有倒计时的在后面加上剩余时间 mm:ss */
function badgeLabel(b: Shown, now: number, lang: 'zh' | 'en'): string {
  const text = typeof b.text === 'string' ? b.text : b.text[lang]
  return typeof b.endsAt === 'number' ? `${text} ${mmss(b.endsAt - now)}` : text
}

/** 终端里胶囊、提示的颜色。强调色只做底色（浅色终端上黄字看不清） */
function termTone(lk: Look, tone: Tone): { color: string; backgroundColor?: string } {
  switch (tone) {
    case 'red':
      return { color: lk.c.red }
    case 'accent':
      return { color: lk.c.onAccent, backgroundColor: lk.c.accent }
    case 'ink':
      return { color: lk.c.ink }
    default:
      return { color: lk.c.pencil }
  }
}

/** 按显示宽度补空格，让几行的标签对齐（中文占两格） */
function padTo(text: string, cols: number): string {
  return text + ' '.repeat(Math.max(0, cols - width(text)))
}

const money = (usd: number | null) => (usd === null ? '—' : `$${usd.toFixed(2)}`)

async function refreshUsage($: EngineInterface) {
  try {
    const u = await $.session.usage()
    const { tokens, window, percent } = u.context
    const ctx = percent ?? (tokens !== undefined && window > 0 ? (tokens / window) * 100 : null)
    const five = u.rateLimits.find(r => r.kind === 'five_hour') ?? u.rateLimits[0]
    await update($, usage, () => ({ ctx, quota: five?.percentUsed ?? null, usd: u.cost?.usd ?? null }))
  } catch {
    // 读不到就沿用上一次的数
  }
}

/**
 * 状态栏开不开：用户按过开关就照用户的；没按过时，用户自己设了状态栏（statusLine）就不开，没设才开。
 * lemo-core 还没扫完（scan 是 null）先当不开，免得用户有自己的状态栏时先冒出来一下（照用户自己的配置来）
 */
async function isStatusOn($: EngineInterface): Promise<boolean> {
  const pref = await read($, statusPref)
  if (pref !== null) return pref
  const sc = (await $.state.get(LemoScanRef)).value ?? null
  return sc !== null && !sc.statusLine
}

// 状态栏：品牌短名 ┊ T03 ┊ 上下文 12% ┊ 各胶囊。
// 由 session.start 里的每秒定时器调：有倒计时胶囊时文字每秒变、每秒发；没有就文字不变、不发。
// 这样别的 mod 加减胶囊、lemo-core 换语言换风格，一秒内也跟上，不用每处都来通知。
// 开关关着时不发；之前发过的去掉（lemo-core 的扫描晚一步到、用户刚关掉，都走这里）
async function showStatus($: EngineInterface) {
  if (!(await isStatusOn($))) {
    if (lastStatus !== '') $.ui.status(undefined)
    lastStatus = ''
    return
  }
  const lk = await look($)
  const S = STR[lk.lang]
  const n = await seqOf($)
  const u = await read($, usage)
  const now = await $.clock.now()
  const list = liveBadges((await $.state.get(BadgesRef)).value, now)
  const parts = [word(lk, 'lemo-meter.statusBrand', S.status.brand), exp(n)]
  if (u.ctx !== null) parts.push(`${S.status.ctx} ${pct(u.ctx)}`)
  for (const b of list) parts.push(badgeLabel(b, now, lk.lang))
  const text = parts.join(' ┊ ')
  if (text === lastStatus) return
  lastStatus = text
  $.ui.status(text)
}

/**
 * HEAD 文件的内容 → 分支名。「ref: refs/heads/main」是 main；分离头指针（只有一串提交号）显示前 7 位；
 * 指向别处的 ref（少见）原样显示；认不出是 null
 */
function headBranch(text: string): string | null {
  const t = text.trim()
  const ref = /^ref:\s*(\S+)$/.exec(t)?.[1]
  if (ref !== undefined) return ref.replace(/^refs\/heads\//, '')
  return /^[0-9a-f]{7,64}$/i.test(t) ? t.slice(0, 7) : null
}

// 去掉末尾的路径分隔符；往上一层（Windows 的反斜杠也认）
const trimSep = (p: string) => p.replace(/[\\/]+$/, '')
const parentOf = (p: string) => p.replace(/[\\/][^\\/]*$/, '')
const isAbsPath = (p: string) => /^([\\/]|[A-Za-z]:[\\/])/.test(p)

/**
 * 读当前分支：从会话目录往上找 .git（和 git 自己一样，在仓库的子目录里打开也认得），读里面的 HEAD 文件。
 * 不跑 git 命令：mod 不在用户的电脑上起程序。
 * .git 是个文件时（git worktree、子模块），里面写着「gitdir: <真正的目录>」，去那个目录读 HEAD。
 * 不是 git 仓库、读不到都是 null
 */
async function readBranch($: EngineInterface): Promise<string | null> {
  let dir = trimSep(await $.session.cwd())
  // 一层一层往上，最多 64 层；到了最上面（/ 或 C:）就停，不去读根目录（「//.git」会被当成网络路径）
  for (let i = 0; i < 64 && dir !== ''; i++) {
    const dot = `${dir}/.git`
    const st = await $.fs.stat(dot).catch(() => null)
    if (st !== null) {
      let gitDir = dot
      if (st.kind === 'file') {
        const to = /^gitdir:\s*(.+?)\s*$/m.exec(await $.fs.read(dot))?.[1]
        if (to === undefined) return null
        gitDir = trimSep(isAbsPath(to) ? to : `${dir}/${to}`)
      }
      return headBranch(await $.fs.read(`${gitDir}/HEAD`))
    }
    const up = parentOf(dir)
    if (up === dir) break
    dir = up
  }
  return null
}

async function refreshBranch($: EngineInterface) {
  const next = await readBranch($).catch(() => null)
  if (next !== (await read($, branch))) await update($, branch, () => next)
}

// 版本号比大小：只比前三段数字
function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split(/[.-]/).slice(0, 3).map(Number)
  const pb = b.split(/[.-]/).slice(0, 3).map(Number)
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x !== y) return x > y
  }
  return false
}

// 回复里没有版本号时存的记号，画的时候换成当前语言的一句
const NO_VERSION = 'no-version'

// $.http：联网查 npm 上 Claude Code 的最新版本，和自己的版本比
async function checkVersion($: EngineInterface) {
  await update($, latest, (): LemoMeterLatest => ({ ...IDLE, status: 'busy' }))
  try {
    const res = await $.http.fetch('https://registry.npmjs.org/@anthropic-ai/claude-code/latest', { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = JSON.parse(res.text) as { version?: unknown }
    const newest = typeof body.version === 'string' ? body.version : ''
    if (newest === '') throw new Error(NO_VERSION)
    const mine = (await $.session.version()).version
    await update($, latest, (): LemoMeterLatest => ({ ...IDLE, status: 'done', newest, mine, isNewer: isNewerVersion(newest, mine) }))
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err)
    await update($, latest, (): LemoMeterLatest => ({ ...IDLE, status: 'error', why }))
  }
}

/** 横条本身：桌面一张 SVG，终端是像素小画 + 刻度尺 + 底行 */
async function drawBand($: EngineInterface, e: RenderInput<'AbovePrompt'>): Promise<RenderElement> {
  const lk = await look($)
  const S = STR[lk.lang]
  const u = await read($, usage)
  const n = await seqOf($)
  const br = await read($, branch)
  const now = await $.clock.now()
  const list = liveBadges((await $.state.get(BadgesRef)).value, now)
  const shown = (await $.state.get(NoticeRef)).value ?? null
  // 读了 frame 就每秒重画一次。有倒计时的胶囊时要读，剩余时间跟着走；
  // 终端有像素小画时也读，小画一直冒泡。
  // 桌面没有倒计时就不读，免得 SVG 跟着一直重画、闪（平时让 SVG 自己的气泡动画跑）
  const ticking = list.some(b => typeof b.endsAt === 'number' && b.endsAt > now)
  const animate = e.surface === 'terminal' && lk.st.sprite !== null && lk.st.sprite.frames.length > 1
  const tick = ticking || animate ? ((await $.state.get(FrameRef)).value ?? 0) : 0
  const pills: Pill[] = list.map(b => ({ text: badgeLabel(b, now, lk.lang), tone: b.tone }))
  const brandName = word(lk, 'lemo-core.title', 'lemo-mod')

  if (e.surface === 'desktop') {
    const { Box, Svg } = $.ui.resolve(e)
    const data = {
      ctx: u.ctx,
      quota: u.quota,
      usd: u.usd,
      label: fill(word(lk, 'lemo-meter.trial', S.trial), { no: exp(n) }),
      pills: br === null ? pills : [...pills, { text: `⎇ ${br}`, tone: 'grey' as const }],
      notice: shown === null ? null : { text: shown.text, tone: shown.tone },
      brand: brandName,
      brandSub: word(lk, 'lemo-meter.brandSub', S.brandSub),
      words: { ctx: S.band.ctx, quota: S.band.quota, cost: S.band.cost, pending: word(lk, 'lemo-meter.pending', S.band.pending) },
    }
    const alt = `${brandName}: ${S.band.ctx} ${pct(u.ctx)}, ${S.band.quota} ${pct(u.quota)}`
    const guess = Math.round(e.props.bodyColumns * CELL_PX)
    // 不给 width，外面包一层竖排 Box，竖排容器会把它横向拉满（桌面上单独放只有 280 像素）。
    // 不加 isInteractive：那样 SVG 装在一个沙盒框里，每重画一次整个框重新加载、闪一下；画成图片，内容没变就不闪
    return (
      <Box flexDirection="column" width="100%">
        <Svg source={bandSvg(data, { width: '100%', guess }, lk.c, lk.st.motif, lk.st.sprite)} alt={alt} height={BAND_H} />
      </Box>
    )
  }

  // 终端（以及别的界面）：两行刻度尺 + 一行底行；提示出现时顶替底行
  const { Box, Text } = $.ui.resolve(e)
  const ink = bareInk(lk, e.surface)
  const ctxLabel = word(lk, 'lemo-meter.tbandCtx', S.tband.ctx)
  const quotaLabel = word(lk, 'lemo-meter.tbandQuota', S.tband.quota)
  const cols = Math.max(width(ctxLabel), width(quotaLabel))
  const scale = (key: string, label: string, v: number | null) => {
    const r = ruler(v)
    return (
      <Box key={key} flexDirection="row">
        <Text color={lk.c.pencil}>{padTo(label, cols) + ' '}</Text>
        <Text color={lk.c.grid}>{r.before}</Text>
        <Text color={lk.c.ink}>●</Text>
        <Text color={lk.c.grid}>{r.after}</Text>
        <Text {...ink}>{' ' + (v === null ? word(lk, 'lemo-meter.pending', S.band.pending) : pct(v))}</Text>
      </Box>
    )
  }
  const sample = word(lk, 'lemo-meter.tbandSample', S.tband.sample)
  let foot: RenderChildren
  if (shown !== null) {
    foot = <Text {...termTone(lk, shown.tone)} bold>{` ● ${shown.text} `}</Text>
  } else {
    foot = (
      <Text color={lk.c.pencil}>
        {`${sample} ${exp(n)}${u.usd === null ? '' : ` · ${money(u.usd)}`}`}
        {pills.map((p, i) => (
          <Text key={`badge-${i}`} color={lk.c.pencil}>
            {' · '}
            <Text {...termTone(lk, p.tone)}>{p.tone === 'accent' ? ` ${p.text} ` : p.text}</Text>
          </Text>
        ))}
        {br === null ? '' : ` · ⎇ ${br}`}
      </Text>
    )
  }
  const meter = (
    <Box flexDirection="column">
      {scale('meter-ctx', ctxLabel, u.ctx)}
      {scale('meter-quota', quotaLabel, u.quota)}
      {foot}
    </Box>
  )
  const sprite = lk.st.sprite
  if (e.surface === 'terminal' && sprite !== null && sprite.frames.length > 0) {
    // 风格的像素小画：每秒换一帧
    const { Raster } = $.ui.resolve(e)
    const frame = sprite.frames[tick % sprite.frames.length] ?? sprite.frames[0] ?? []
    return (
      <Box flexDirection="row" gap={2} alignItems="center">
        <Raster key="meter-sprite" {...spriteCells(sprite.palette, frame)} />
        {meter}
      </Box>
    )
  }
  return meter
}

// 读回存下来的开关（$.store 全局记住）。没存过就照默认：横条开，状态栏照扫描
async function loadPrefs($: EngineInterface) {
  try {
    const band = await $.store.get('band')
    if (typeof band === 'boolean') await update($, bandOn, () => band)
    const status = await $.store.get('status')
    await update($, statusPref, () => (typeof status === 'boolean' ? status : null))
  } catch {
    // 读不到存档就照默认
  }
}

// 这个会话画在桌面上吗。桌面 App 自带一份 Claude Code、跟着 App 更新，查 npm 上命令行版的号会误导，桌面上不提查新版本
async function onDesktop($: EngineInterface): Promise<boolean> {
  try {
    return (await $.session.surfaces()).includes('desktop')
  } catch {
    return false
  }
}

// 能力清单里这个 mod 的几行（安全页照它画）：横条、状态栏是外观；查新版本是点了才联网，桌面上不列
async function meterCaps($: EngineInterface): Promise<Cap[]> {
  const both = (k: 'band' | 'status' | 'version') => ({
    title: { zh: STR.zh.cap[k].title, en: STR.en.cap[k].title },
    desc: { zh: STR.zh.cap[k].desc, en: STR.en.cap[k].desc },
  })
  const rows: Cap[] = [
    { mod: 'lemo-meter', id: 'band', kind: 'look', on: await read($, bandOn), ...both('band') },
    { mod: 'lemo-meter', id: 'status', kind: 'look', on: await isStatusOn($), ...both('status') },
  ]
  if (!(await onDesktop($))) rows.push({ mod: 'lemo-meter', id: 'version', kind: 'net', on: false, manual: true, ...both('version') })
  return rows
}

export const register: Register = on => {
  // ---------- 生命周期 ----------

  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-meter',
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: ['main', 'bg'],
      always: { zh: STR.zh.always, en: STR.en.always },
    })
    await loadPrefs($)
    const r = await next(e)
    await refreshUsage($)
    await showStatus($)
    // 状态栏每秒看一次：文字没变不重发，所以只有倒计时走字、胶囊增减时才真的更新。
    // session.start 可能再来一次（别的插件热重载时），先停掉旧的，免得两个一起跑
    statusTimer?.cancel()
    statusTimer = $.clock.every(1000, () => {
      void showStatus($)
    })
    // 不急的放到后面，免得拖慢会话启动
    $.clock.after(0, () => {
      void refreshBranch($)
    })
    return r
  })

  // 每轮结束：重读用量，记一次上下文百分比（走势只留最近 24 个），再看一眼分支（这一轮可能切过）
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId !== undefined) return r
    await refreshUsage($)
    if (!e.isAborted) {
      const { ctx } = await read($, usage)
      if (ctx !== null) await update($, history, h => [...h, ctx].slice(-24))
    }
    await showStatus($)
    $.clock.after(0, () => {
      void refreshBranch($)
    })
    return r
  })

  // ---------- 输入框上方的横条 ----------
  // 别的 mod（比如 lemo-pomodoro）也会挂 AbovePrompt。同一层的插件谁在外层不一定，所以两种顺序都要对：
  // 它在外层时拿到的是这里的横条，自己往下接；它在里层时，next 拿到的就不是引擎原样，接在横条下面

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // 问卷占着横条时让给它；安全页上关了横条就原样交给里层
    if (e.props.hasSurvey || !(await read($, bandOn))) return next(e)
    const below = await next(e)
    const band = await drawBand($, e)
    if (below.type === 'engine') return band
    // 引擎原样不许放进带 width 的 Box（会拒绝整棵树），所以外面这层不给 width
    const { Box } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" gap={1}>
        {band}
        {below}
      </Box>
    )
  })

  // ---------- 统一面板里的卡片 ----------

  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    const isDesk = e.surface === 'desktop'
    const at = await hubTab($, e.surface)
    if (!isDesk && at !== 'main' && at !== 'bg') return inner
    const lk = await look($, e.props)
    const S = STR[lk.lang]
    const el = $.ui.resolve(e)
    const { Box, Text, Link } = el
    const specs: CardSpec[] = []
    let head: RenderElement | undefined

    if (isDesk) {
      // 桌面：每一页最上面是一张数据卡（标题、编号、上下文、额度、花费、走势）。
      // lemo-core 看到装了 lemo-meter，桌面上就不画自己的标题，只画分页
      const u = await read($, usage)
      const hist = await read($, history)
      const n = await seqOf($)
      const { Svg } = $.ui.resolve(e)
      const title = word(lk, 'lemo-core.title', 'lemo-mod')
      const words = { title, sub: word(lk, 'lemo-meter.brandSub', S.brandSub), ctx: S.band.ctx, quota: S.band.quota, cost: S.band.cost, trend: S.usage.trend, noTrend: S.usage.noTrend }
      const data = { ...u, history: hist, label: fill(word(lk, 'lemo-meter.trial', S.trial), { no: exp(n) }) }
      // Svg 不给 width、外面包竖排 Box 才会横向拉满；不加 isInteractive（会闪）
      head = (
        <Box key="meter-head" flexDirection="column" width="100%">
          <Svg source={paneSvg(data, Math.round(e.props.bodyColumns * CELL_PX), lk.c, lk.st.motif, words)} alt={`${title}: ${S.band.ctx} ${pct(u.ctx)}, ${S.band.quota} ${pct(u.quota)}, ${S.band.cost} ${money(u.usd)}`} height={PANE_H} />
        </Box>
      )
    }

    if (at === 'main' && !isDesk) {
      // 常用：用量（终端）。一行数据 + 一行走势；桌面的用量在顶上的数据卡里
      const u = await read($, usage)
      const hist = await read($, history)
      const extra = (
        <Box flexDirection="column">
          <Text color={lk.c.pencil}>{`${S.band.ctx} ${pct(u.ctx)} ┊ ${S.band.quota} ${pct(u.quota)} ┊ ${S.band.cost} ${money(u.usd)}`}</Text>
          <Text color={lk.c.ink}>{hist.length > 0 ? `${S.usage.trend} ${sparkline(hist)}` : S.usage.noTrend}</Text>
        </Box>
      )
      specs.push({ id: 'meter-usage', title: word(lk, 'lemo-meter.usageTitle', S.usage.title), desc: S.usage.desc, extra })
    } else if (at === 'bg') {
      // 后台：git 分支、检查新版本
      const br = await read($, branch)
      specs.push({
        id: 'meter-branch',
        title: S.branch.title,
        desc: br === null ? S.branch.none : fill(S.branch.value, { b: br }),
        extra: <Text dimColor>{S.branch.desc}</Text>,
      })
    }
    // 检查新版本只在终端有：桌面 App 自带一份 Claude Code、跟着 App 更新，查的却是 npm 上命令行版的号，会误导
    // （比如桌面写「2.1.288 is out, you have 2.1.286」，命令行已是最新）
    if (at === 'bg' && !isDesk) {
      const v = await read($, latest)
      const status =
        v.status === 'idle'
          ? S.version.desc
          : v.status === 'busy'
            ? S.version.busy
            : v.status === 'error'
              ? fill(S.version.failed, { why: v.why === NO_VERSION ? S.version.noVersion : v.why })
              : v.isNewer
                ? fill(S.version.newer, { latest: v.newest, cur: v.mine })
                : fill(S.version.same, { v: v.mine })
      specs.push({
        id: 'meter-version',
        title: S.version.title,
        desc: status,
        buttons: <Button key="meter-check" label={S.version.btn} {...sec(e.surface)} onPress={() => void checkVersion($)} />,
        extra: (
          <Text {...inkOf(lk, e.surface)}>
            {'→ '}
            <Link href={CHANGELOG} label={S.version.changelog} />
          </Text>
        ),
      })
    }
    return hubWrap(el, lk, e.surface, inner, specs, head)
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------

  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...(await meterCaps($))] }
  })

  // 安全页上按了横条、状态栏的开关：存进 $.store（全局记住），横条、状态栏马上跟着变
  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-meter') return next(e)
    const want = e.on
    if (want === undefined) return { value: false }
    if (e.id === 'band') {
      await update($, bandOn, () => want)
      await $.store.set('band', want)
    } else if (e.id === 'status') {
      await update($, statusPref, () => want)
      await $.store.set('status', want)
      await showStatus($)
    } else {
      return { value: false }
    }
    return { value: true }
  })

  // 「全部关闭」只关外观以外的；这个 mod 只有外观和点了才做的查新版本，没有要关的，往下传
  on('lemo.off', async ($, e, next) => next(e))
}
