// lemo-journal：记录。
// - 日志：每轮结束（主对话、没被中断）往 ~/.claude/lemo-mod/journal.md 追加一行（带项目名：几个会话共用这个文件）
// - 自动分类：用户本人每发一条消息，用小模型贴一个标签（提问、改代码、排查、闲聊），交给 lemo-core 记（$.lemo.tag），lemo-skin 显示在编号后面
// - 每轮统计：「行为」页一张卡片，读 lemo-core 的 lastTurn
// 两个开关存在 $.store，换个会话还在。不放在 /config（userConfig）：
// 桌面 App 改不了插件的设置项，所以做成面板上的按钮。
// 两个开关装上时都是关的（日志会往用户电脑上写文件，自动分类会多花用量），
// 都列在「安全」页（lemo.caps），那里和面板卡片上的按钮改的是同一个值。
// 不改「commit 署名」（attribution.text）：开源项目不在别人的 commit 里留自己的名字，
// 要署名的用户用 Claude Code 自己的署名设置

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { STR } from './i18n'
import { HUB, NOT_PERSON, REMIND_MARK, clip, exp, fill, fmtDur, hubWrap, inkOf, mdhm, sec, steady, word } from './shared/lemo'
import type { CardSpec, Look } from './shared/lemo'

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

// lemo-core 的状态（只读）：上一轮几步几次工具、第 n 条消息的标签。编号 seq 用上面的 seqOf($) 读
const LAST = { plugin: 'lemo-core', key: 'lastTurn' } as const
const TAGS = { plugin: 'lemo-core', key: 'tags' } as const

// 自己的状态：日志最近几行，两个开关（值存在 $.store，这里放一份给面板读）。
// 默认都关：日志会往 ~/.claude 下写文件，自动分类每条消息多调一次小模型
const tail = atom({ plugin: 'lemo-journal', key: 'tail' } as const, [] as readonly string[])
const logOn = atom({ plugin: 'lemo-journal', key: 'logOn' } as const, false)
const classifyOn = atom({ plugin: 'lemo-journal', key: 'classifyOn' } as const, false)

// 能力清单的一行（类型从 lemo-core 的合约里取）
type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]

// 自动分类的标签：给模型看英文，存进 lemo-core 的是短键，界面上按语言显示（i18n 的 kinds）
const KIND_LABELS = ['question', 'code-change', 'debugging', 'chat'] as const
const KIND_KEY: Readonly<Record<string, string>> = { question: 'question', 'code-change': 'code', debugging: 'debug', chat: 'chat' }

// $.fs：日志放在 ~/.claude/lemo-mod/journal.md。$.fs 没有追加，读出来接上一行再整个写回去，只留最近 500 行。
// 日志和 $.store 都是所有会话共用的：用户别的会话也装了 lemo-journal，也会往这里写
const LOG_SHOWN = '~/.claude/lemo-mod/journal.md'
const KEEP = 500

// 日志文件第一行。风格包可以换（键 head），这里是中性的默认
const LOG_HEAD = '# lemo-mod · 日志 / Journal'

// 日志文件的位置，第一次用时按 HOME 算
let logPath: string | null = null
// 这个会话的项目名：工作目录的最后一段（session.start 的 e.cwd）。好几个会话、好几个项目共用一个日志文件，
// 光有 T 编号分不清是哪个会话的哪条，所以每行带上它；拿不到就不加
let project = ''
// 这个会话里写日志排成一队：$.fs 没有追加，每次是读出来、接一行、整个写回去。两轮紧挨着结束时，
// 两次写会都读到旧的那份、各接各的，后写的盖掉先写的那行。所以上一次写完再读改写下一次。
// 只管得了这个会话；别的会话同一瞬间写还是可能丢一行，要两个会话几乎同时结束一轮才会碰上，接受
let logQueue: Promise<void> = Promise.resolve()
// 用户本人刚发出的消息原文：prompt.submit 里记下，追加进对话记录时对上编号
let pendingText = ''
let lastPrompt = ''
let said: { n: number; text: string } = { n: 0, text: '' }
// 日志文件的尾巴读过没有。日志关着时开会话不读这个文件（关着就不碰它），
// 打开日志、或者用户翻到「后台」页看这张卡片时再读一次
let tailLoaded = false
// 这一轮是谁引起的：用户本人、lemo-watch 的提醒，还是后台任务通知、助手交回的报告这类。
// 不是用户本人引起的一轮，日志里编号那一栏写「提醒」「后台」，不冒用用户上一条的编号
type TurnBy = 'person' | 'remind' | 'bg'
let turnBy: TurnBy = 'person'

/** 英文的「1 steps」「1 tools」改成单数 */
const one = (t: string) => t.replace(/\b1 (step|tool)s\b/g, '1 $1')

/**
 * 不跟界面语言变的文字（日志抬头）：风格包里中英两份写成一样，这里固定取中文那份。
 * 抬头只在新建日志文件时写一次，跟着语言变的话，同一个文件里会有两种抬头
 */
const fixed = (lk: Look, key: string, fallback: string) => word({ st: lk.st, lang: 'zh' }, key, fallback)

async function logFile($: EngineInterface): Promise<string | null> {
  if (logPath !== null) return logPath
  const home = await $.env.get('HOME').catch(() => undefined)
  logPath = home === undefined || home === '' ? null : `${home}/.claude/lemo-mod/journal.md`
  return logPath
}

async function readLog($: EngineInterface): Promise<string> {
  const path = await logFile($)
  if (path === null) return ''
  try {
    return await $.fs.read(path)
  } catch {
    return ''
  }
}

async function showLogTail($: EngineInterface, text: string) {
  const lines = text.split('\n').filter(l => l.startsWith('- '))
  await update($, tail, () => lines.slice(-6))
}

/** 工作目录的最后一段：/Users/me/code/Lemo-mod/ → Lemo-mod；空的、只有根目录时是 '' */
function projectOf(cwd: string): string {
  return cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? ''
}

/** 排进这个会话的写日志队列：前面的写完（成没成都算完）再写这一行 */
function queueLog($: EngineInterface, line: string, head: string): Promise<void> {
  const job = logQueue.then(() => appendLog($, line, head))
  logQueue = job.catch(() => undefined)
  return job
}

async function appendLog($: EngineInterface, line: string, head: string) {
  const path = await logFile($)
  if (path === null) return
  // 排队等的时候可能关掉了（这个会话、别的会话，或者「全部关闭」）：写之前再看一次
  if (!(await liveFlag($, 'log'))) return
  let old = ''
  try {
    old = await $.fs.read(path)
  } catch {
    // 读不出来：文件真不存在才新建。存在却读不了（超过 4 MiB、没权限……）这次不写，免得盖掉旧日志
    if (await $.fs.exists(path).catch(() => true)) return
  }
  const rows = old.split('\n')
  // 第一行是抬头（# 开头）就去掉，写回去时换成现在的抬头
  if (rows[0]?.startsWith('#') === true) rows.shift()
  const lines = [...rows.filter(l => l.trim() !== ''), line].slice(-KEEP)
  const text = `${head}\n\n${lines.join('\n')}\n`
  try {
    await $.fs.write(path, text)
    await showLogTail($, text)
  } catch {
    // 写不进去就算了，不影响对话
  }
}

// 一轮一行：时间 · 项目 · T03 · 标签 · 用时 · 几步几次工具 · 用户那句话的开头。
// 不是用户本人引起的一轮：编号那一栏写「提醒」「后台」，不带标签和用户的话。
// 这一行在一轮刚结束时就拼好（编号、标签是这一轮的），再排队写进文件
async function logTurn($: EngineInterface, ms: number, by: TurnBy) {
  if (!(await liveFlag($, 'log'))) return
  const lk = await look($)
  const S = STR[lk.lang]
  const last = (await $.state.get(LAST)).value ?? null
  const stats = last === null ? '' : ` · ${one(fill(S.turnStats, { steps: last.steps, tools: last.tools }))}`
  const where = project === '' ? '' : ` · ${project}`
  const now = await $.clock.now()
  let who = S.by[by === 'remind' ? 'remind' : 'bg']
  let kind = ''
  let tailText = ''
  if (by === 'person') {
    const n = await seqOf($)
    const tag = ((await $.state.get(TAGS)).value ?? {})[String(n)]
    const text = said.n === n && said.text !== '' ? said.text : lastPrompt
    who = exp(n)
    kind = tag === undefined ? '' : ` · ${S.kinds[tag] ?? tag}`
    tailText = text === '' ? '' : ` · ${clip(text, 50)}`
  }
  await queueLog($, `- ${mdhm(now)}${where} · ${who}${kind} · ${fmtDur(ms)}${stats}${tailText}`, fixed(lk, 'lemo-journal.head', LOG_HEAD))
}

// $.model.classify：用小模型给第 n 条消息贴标签，交给 lemo-core 存（lemo-skin 显示在编号后面）
async function classifyPrompt($: EngineInterface, n: number, text: string) {
  if (n <= 0 || text === '' || !(await liveFlag($, 'classify'))) return
  try {
    const k = await $.model.classify(text.slice(0, 2000), KIND_LABELS)
    const kind = k === undefined ? undefined : KIND_KEY[k]
    // 等模型的时候关掉了：不贴
    if (kind !== undefined && (await liveFlag($, 'classify'))) await $.lemo.tag({ n, kind })
  } catch {
    // 请求失败就不贴标签
  }
}

async function loadPrefs($: EngineInterface) {
  const log = await $.store.get('log')
  if (typeof log === 'boolean') await update($, logOn, () => log)
  const cls = await $.store.get('classify')
  if (typeof cls === 'boolean') await update($, classifyOn, () => cls)
}

async function loadTail($: EngineInterface) {
  await showLogTail($, await readLog($))
}

/** 不急的放到后面：读日志文件，面板上显示最近几行。读过一次就不再读（之后每写一行，面板跟着更新） */
function laterTail($: EngineInterface) {
  if (tailLoaded) return
  tailLoaded = true
  $.clock.after(0, () => {
    void loadTail($)
  })
}

// 两个开关。状态库的 read/update 只认写死的 atom，不能当参数传，所以按名字分开写。
// 面板卡片、安全页（lemo.toggle）、「全部关闭」（lemo.off）都走这里：会话状态和 $.store 一起改
type Flag = 'log' | 'classify'

async function setFlag($: EngineInterface, f: Flag, v: boolean) {
  switch (f) {
    case 'log': {
      await update($, logOn, () => v)
      await $.store.set('log', v)
      // 刚打开：面板上补出日志文件的尾巴
      if (v) laterTail($)
      return
    }
    case 'classify': {
      await update($, classifyOn, () => v)
      await $.store.set('classify', v)
      return
    }
  }
}

async function toggle($: EngineInterface, f: Flag) {
  await setFlag($, f, !(await liveFlag($, f)))
}

/**
 * 开关现在的值：每次从 $.store 现读（所有会话共用一份），会话状态跟着对齐。
 * 别的会话里关掉了、按了「全部关闭」，这个会话里的日志、自动分类也跟着停。读不到就当关着
 */
async function liveFlag($: EngineInterface, f: Flag): Promise<boolean> {
  let v: boolean
  try {
    v = (await $.store.get(f)) === true
  } catch {
    return false
  }
  switch (f) {
    case 'log': {
      if ((await read($, logOn)) !== v) await update($, logOn, () => v)
      return v
    }
    case 'classify': {
      if ((await read($, classifyOn)) !== v) await update($, classifyOn, () => v)
      return v
    }
  }
}

// 安全页上的两行：写什么文件、花谁的用量，说清楚。不带风格味道（安全页要一眼看懂）
async function journalCaps($: EngineInterface): Promise<Cap[]> {
  const row = (id: Flag, kind: 'file' | 'cost', isOn: boolean): Cap => ({
    mod: 'lemo-journal',
    id,
    kind,
    title: { zh: STR.zh.cap[id].title, en: STR.en.cap[id].title },
    desc: { zh: fill(STR.zh.cap[id].desc, { path: LOG_SHOWN }), en: fill(STR.en.cap[id].desc, { path: LOG_SHOWN }) },
    on: isOn,
  })
  // 照 $.store 报：别的会话里改过，这个会话的安全页也是对的
  return [row('log', 'file', await liveFlag($, 'log')), row('classify', 'cost', await liveFlag($, 'classify'))]
}

export const register: Register = on => {
  // ---------- 生命周期 ----------
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-journal',
      title: { zh: '记录', en: 'Journal' },
      tabs: ['bg', 'behave'],
      // 没有 always：日志、自动分类都会做事（写文件、多调模型），列在安全页上，有开关
    })
    project = projectOf(e.cwd)
    await loadPrefs($)
    // 日志开着才读日志文件；关着时等用户打开日志、或者翻到那张卡片再读
    if (await read($, logOn)) laterTail($)
    return next(e)
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------
  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...(await journalCaps($))] }
  })

  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-journal') return next(e)
    if (e.on === undefined || (e.id !== 'log' && e.id !== 'classify')) return { value: false }
    await setFlag($, e.id, e.on)
    return { value: true }
  })

  // 存不进去也要往下传：别的 mod 的开关照样关
  on('lemo.off', async ($, e, next) => {
    try {
      await setFlag($, 'log', false)
    } catch {
      // 照样往下传
    }
    try {
      await setFlag($, 'classify', false)
    } catch {
      // 照样往下传
    }
    return next(e)
  })

  // 用户发消息：记下原文（只记用户本人的；后台通知、别的 agent、插件发来的不算）
  on('prompt.submit', async ($, e, next) => {
    if (!NOT_PERSON.has(e.origin.kind)) {
      pendingText = e.text.trim()
      lastPrompt = pendingText
    }
    return next(e)
  })

  // 消息进了对话记录：lemo-core 在里层给它定号，所以先 next 再读编号。
  // 判断「是不是用户本人发的」和 lemo-core 编号那个 hook 一样。贴标签要另外调一次模型，放到后面做，不拖慢追加
  on('session.append', { door: 'prompt' }, async ($, e, next) => {
    const o = e.origin
    const main = e.agentId === undefined && o.kind !== 'model' && o.kind !== 'tool'
    // 桌面会在用户的话前后附上别的内容（< 开头），优先用 prompt.submit 时记下的原文
    const first = e.message.content
      .map(b => ('text' in b && typeof b.text === 'string' ? b.text.trim() : ''))
      .find(t => t !== '' && !t.startsWith('<'))
    // 先记下这一轮是谁引起的（转交之前就记，转交出错也不影响）：
    // 不是用户本人发的，lemo-watch 的提醒以 ⏰ 开头，别的算后台；日志里都不给它编号
    const isPerson = main && !NOT_PERSON.has(o.kind) && e.message.isMeta !== true
    if (main && NOT_PERSON.has(o.kind)) turnBy = first?.startsWith(REMIND_MARK) === true ? 'remind' : 'bg'
    else if (isPerson) turnBy = 'person'
    const r = await next(e)
    if (!isPerson) return r
    const n = await seqOf($)
    const text = pendingText !== '' ? pendingText : first ?? ''
    pendingText = ''
    said = { n, text }
    $.clock.after(0, () => {
      void classifyPrompt($, n, text)
    })
    return r
  })

  // 一轮结束：lemo-core 在里层写 lastTurn（几步几次工具），所以先 next 再读。只记主对话、没被中断的
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId !== undefined || e.isAborted) return r
    const ms = e.durationMs
    const by = turnBy
    $.clock.after(0, () => {
      void logTurn($, ms, by)
    })
    return r
  })

  // ---------- 统一面板：后台页「日志」「自动分类」，行为页「每轮统计」 ----------
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    const at = await hubTab($, e.surface)
    if (at !== 'bg' && at !== 'behave') return inner
    const lk = await look($, e.props)
    const el = $.ui.resolve(e)
    const { Box, Text, Code, Markdown } = el
    const S = STR[lk.lang]
    const isTerm = e.surface === 'terminal'
    const onOff = (key: string, isOn: boolean, f: Flag) => (
      <Button key={key} label={isOn ? S.on : S.off} {...sec(e.surface)} onPress={() => toggle($, f)} />
    )
    const specs: CardSpec[] = []

    if (at === 'bg') {
      // 用户翻到这张卡片了：日志关着时开会话没读过日志文件，这时读一次，显示以前记的
      laterTail($)
      const isLog = await read($, logOn)
      const lines = await read($, tail)
      // Markdown 里的 file: 链接能点开本机文件；Link 元素只认 https。
      // 桌面的文件窗格只看工作目录里的文件，打不开 ~/.claude 下的日志，所以只在终端给链接
      const path = isTerm ? await logFile($) : null
      const link = path === null ? null : <Markdown key="journal-open" text={`[${S.log.open}](file://${encodeURI(path)})`} />
      // Code 用主题配好的代码颜色（浅色主题是深灰、深色主题是近白）。终端里面板内嵌时（lk.inline）没有主题的底，
      // 这些颜色直接落在终端底色上，终端和主题明暗不一样时看不见。内嵌时一行一个 Text，用终端自己的字色；停靠时照旧用 Code
      const shown =
        lines.length === 0 ? (
          <Text dimColor>{S.log.empty}</Text>
        ) : lk.inline && isTerm ? (
          <Box flexDirection="column">
            {lines.map((l, i) => (
              <Text key={`journal-tail-${i}`} {...inkOf(lk, e.surface)} wrap="truncate-end">{l}</Text>
            ))}
          </Box>
        ) : (
          <Code source={lines.join('\n')} language="markdown" wrap="truncate-end" />
        )
      specs.push({
        id: 'journal-log',
        title: word(lk, 'lemo-journal.logTitle', S.log.title),
        desc: fill(isLog ? S.log.desc : S.log.off, { path: LOG_SHOWN }),
        buttons: onOff('journal-log-switch', isLog, 'log'),
        extra: (
          <Box flexDirection="column" gap={isTerm ? 0 : 1}>
            {shown}
            {link}
          </Box>
        ),
      })

      const isClassify = await read($, classifyOn)
      const tg = (await $.state.get(TAGS)).value ?? {}
      const recentTags = Object.entries(tg)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .slice(-5)
        .map(([n, k]) => `${exp(Number(n))} ${S.kinds[k] ?? k}`)
        .join(' · ')
      specs.push({
        id: 'journal-classify',
        title: word(lk, 'lemo-journal.classifyTitle', S.classify.title),
        desc: S.classify.desc,
        buttons: onOff('journal-classify-switch', isClassify, 'classify'),
        extra: recentTags === '' ? null : <Text color={lk.c.pencil}>{S.classify.recent + recentTags}</Text>,
      })
    }

    if (at === 'behave') {
      // 读 lemo-core 的 lastTurn 会订阅：每轮结束它一改，这张卡片自动重画
      const last = (await $.state.get(LAST)).value ?? null
      specs.push({
        id: 'journal-stats',
        title: word(lk, 'lemo-journal.statsTitle', S.stats.title),
        desc: S.stats.desc,
        extra:
          last === null ? (
            <Text dimColor>{S.stats.none}</Text>
          ) : (
            <Text {...inkOf(lk, e.surface)}>{one(fill(S.stats.last, { steps: last.steps, tools: last.tools, t: fmtDur(last.ms) }))}</Text>
          ),
      })
    }

    return hubWrap(el, lk, e.surface, inner, specs)
  })
}
