// lemo-core：所有 lemo mod 的核心。
// - 风格：当前用哪个风格包（颜色、点缀、音效、语音、带风格味道的文字），存在 $.store，换个会话还在
// - 界面语言：跟着用户最近一条消息走；还没记过语言的新用户，先按系统的语言设置选
// - 消息编号：用户本人发的第几条消息（T01、T02…），以及回复、耗时行属于第几条
// - 统一面板 /lemo-mod：画头部、分页和「风格」「已装的 mod」两张卡片；别的 mod 把卡片接在后面
// - 公共方法 $.lemo：放音效、朗读、横条提示、胶囊、报到……（见 types/index.d.ts）
// - 系统提示词里加一段固定说明：界面上的 T01、T02 是用户的第几条消息（有开关，默认关）
// - 「安全」页：装上后读一遍用户的设置，列出每个 mod 会做的事和开关；没按「我看完了」之前每次开会话都弹

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type {
  Lemo, LemoBadge, LemoCap, LemoCapKind, LemoKept, LemoLang, LemoModInfo, LemoNotice, LemoNumbers, LemoScan, LemoStyle, LemoTab, LemoText, LemoTheme, LemoTurn, LemoTurnRow,
} from '../types'
import { DEFAULT_STYLE, STYLES } from '../styles'
import { STR, TAB_WORDS, detectLang } from './i18n'
import { HUB, NOT_PERSON, REMIND_MARK, cardCols, cjkKeep, cmdWord, deskDark, exp, fill, hubWrap, inkOf, mix, para, recent, replyKey, sec, steady, visibleTabs, width, word } from './shared/lemo'
import type { CardSpec } from './shared/lemo'

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
const LemoTurnNoRef = { plugin: 'lemo-core', key: 'turnNo' } as const

/**
 * 画东西时要的风格和语言。读 lemo-core 的状态会订阅，lemo-core 一改自动重画；还没写过时用 $.lemo 兜底。
 * 面板（Pane）的 hook 要把 e.props 传进来：面板停在哪（placement）决定正文用什么颜色（见 shared/lemo.tsx 的 inkOf），
 * 面板宽度（bodyColumns）决定卡片说明在哪断行（见 shared/lemo.tsx 的 card）
 */
async function look($: LemoEngine, pane?: { placement: 'dock' | 'inline'; bodyColumns?: number }): Promise<LemoLook> {
  const st = (await $.state.get(LemoStyleRef)).value ?? (await $.lemo.style({}))
  const lang = (await $.state.get(LemoLangRef)).value ?? (await $.lemo.lang({}))
  const theme = (await $.state.get(LemoThemeRef)).value ?? null
  const desk = (await $.state.get(LemoDeskRef)).value ?? null
  return { st, c: st.colors, lang, theme, desk, inline: pane?.placement === 'inline', ...(pane?.bodyColumns === undefined ? {} : { bodyColumns: pane.bodyColumns }) }
}

/** 用户本人发了几条消息（T01、T02…） */
async function seqOf($: LemoEngine): Promise<number> {
  return (await $.state.get(LemoSeqRef)).value ?? 0
}

/** 这一轮回的是第几条消息：提醒、助手交回、斜杠命令开头的一轮是 0（不写号）。lemo-core 还没写过时当作 seq */
async function turnNoOf($: LemoEngine): Promise<number> {
  return (await $.state.get(LemoTurnNoRef)).value ?? (await seqOf($))
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

// 风格文字里的 {style} 换成名字：用户给这个风格起过名字（「起名」，每个风格各记各的）就用起的，没起过用风格自己的名字。
// {styleZh}、{styleEn} 是指定语言的（日志抬头中英合写）。别的 mod 从 lemo-core 的 style 状态读文字，读到的就是填好的
function named(st: LemoStyle, nick: string | undefined): LemoStyle {
  const zh = nick ?? st.name.zh
  const en = nick ?? st.name.en
  const put = (x: string, own: string) =>
    x.replace(/\{style(Zh|En)?\}/g, (m: string, which: string | undefined, at: number) =>
      spaced(x[at - 1] ?? '', which === 'Zh' ? zh : which === 'En' ? en : own, x[at + m.length] ?? ''),
    )
  const one = (v: LemoText[keyof LemoText], own: string) => (typeof v === 'string' ? put(v, own) : v.map(x => put(x, own)))
  const words: Record<string, LemoText> = {}
  for (const [k, w] of Object.entries(st.words)) words[k] = { zh: one(w.zh, zh), en: one(w.en, en) }
  return { ...st, words }
}

// 名字的头或尾是字母、数字，挨着的又是汉字，中间加个空格：「以 Lemo 实验室的名义」「Dodo 守则」，不写成「以Lemo」
const HAN = /\p{Script=Han}/u
const WORDY = /[A-Za-z0-9]/
function spaced(before: string, name: string, after: string): string {
  const head = HAN.test(before) && WORDY.test(name.charAt(0)) ? ' ' : ''
  const tail = HAN.test(after) && WORDY.test(name.charAt(name.length - 1)) ? ' ' : ''
  return head + name + tail
}

// 起的名字最多这么宽（汉字算 2）：横条、面板标题、命令卡片的标签里都要放得下
const NICK_MAX = 16
// 起名的命令词（/lemo-mod 起名 豆豆）
const NICK_WORDS = ['起名', '改名', 'name', 'rename']

const FALLBACK: LemoStyle = named(STYLES[DEFAULT_STYLE] ?? Object.values(STYLES)[0]!, undefined)

const style = atom({ plugin: 'lemo-core', key: 'style' } as const, FALLBACK)
const lang = atom({ plugin: 'lemo-core', key: 'lang' } as const, 'zh' as LemoLang)
const theme = atom({ plugin: 'lemo-core', key: 'theme' } as const, null as LemoTheme)
const desk = atom({ plugin: 'lemo-core', key: 'desk' } as const, null as LemoTheme)
const icon = atom({ plugin: 'lemo-core', key: 'icon' } as const, null as string | null)
const frame = atom({ plugin: 'lemo-core', key: 'frame' } as const, 0)
const tab = atom({ plugin: 'lemo-core', key: 'tab' } as const, 'main' as LemoTab)
const mods = atom({ plugin: 'lemo-core', key: 'mods' } as const, [] as readonly LemoModInfo[])
const modsOpen = atom({ plugin: 'lemo-core', key: 'modsOpen' } as const, false)
const notice = atom({ plugin: 'lemo-core', key: 'notice' } as const, null as LemoNotice | null)
const badges = atom({ plugin: 'lemo-core', key: 'badges' } as const, [] as readonly LemoBadge[])
// 声音、朗读装上时都是关的（除了外观全部默认关），用户在安全页或各自的卡片里打开，存进 $.store
const muted = atom({ plugin: 'lemo-core', key: 'muted' } as const, true)
const speech = atom({ plugin: 'lemo-core', key: 'speech' } as const, false)
const scan = atom({ plugin: 'lemo-core', key: 'scan' } as const, null as LemoScan | null)
const safeOk = atom({ plugin: 'lemo-core', key: 'safeOk' } as const, false)
const capsRev = atom({ plugin: 'lemo-core', key: 'capsRev' } as const, 0)
const seq = atom({ plugin: 'lemo-core', key: 'seq' } as const, 0)
const turnNo = atom({ plugin: 'lemo-core', key: 'turnNo' } as const, 0)
const numbers = atom({ plugin: 'lemo-core', key: 'numbers' } as const, { ids: {}, texts: {} } as LemoNumbers)
const replies = atom({ plugin: 'lemo-core', key: 'replies' } as const, { ids: {}, texts: {} } as LemoNumbers)
const turnRows = atom({ plugin: 'lemo-core', key: 'turnRows' } as const, {} as Readonly<Record<string, LemoTurnRow>>)
const lastTurn = atom({ plugin: 'lemo-core', key: 'lastTurn' } as const, null as LemoTurn | null)
const tags = atom({ plugin: 'lemo-core', key: 'tags' } as const, {} as Readonly<Record<string, string>>)

// 公共方法被别的 mod 调用时没有自己的 $ 可读，所以几个常用值在模块里留一份镜像
let curStyle: LemoStyle = FALLBACK
// 用户给各风格起的名字（风格 id → 名字），存在 $.store 的 nicks 里
let curNicks: Readonly<Record<string, string>> = {}
let curLang: LemoLang = 'zh'
let curMuted = true
let curSpeech = false
// 系统提示词里的编号说明（安全页「附加提示」那一行），默认关
let curNote = false
// 「全部关闭」按一次加一：朗读一条要试好几个语音，每试一个之前比一下，按了以后不再开始新的一次（已经在念的停不了）
let speakGen = 0
// 用户刚发出的消息文字：编号时和对话记录里的文字一起记，桌面上的消息靠它对上号
let pendingText = ''
// 用户刚输入的是斜杠命令：下一轮要是开始了（skill），就是这条命令开头的，不带编号。用户每输一次都重新判断。
// counted：这次输入之后、这一轮开始之前已经编了号（像 /tmp 这样不是命令、当消息发出去的，照常带号）。
// 每轮开始时用完就清掉，不留给下一轮（定时任务、/loop 跑的 skill 不经过用户输入，不会再清一次）
let slashNext = false
let counted = false
// 有一轮正在跑（turn.start 到 turn.complete）。这时输入的命令（/lemo-mod 这种马上跑的）不动正在跑那一轮的号
let busy = false
// 「/名字」开头的是斜杠命令；名字里没有斜杠，所以 /Users/… 这种路径不算
const SLASH = /^\/[A-Za-z][\w:.-]*(?=\s|$)/
// /lemo-mod 的回复按 Markdown 画：照抄用户打的字（名字、风格名、不认的词）时，ASCII 标点前加反斜杠，
// 画出来还是原样的字，不会变成链接、粗体
const mdEsc = (text: string) => text.replace(/[!-\/:-@\[-`{-~]/g, '\\$&')
// 这一轮的步数和工具数：每向模型发一次请求算一步
let curSteps = 0
let curTools = 0
let registerTimer: { cancel: () => void } | null = null

// 编号也存进 $.store，每个会话一个键（rows:<会话 id>）：会话状态只在这个进程里，恢复旧会话时是空的。
// 恢复的会话里消息 id 不变（--fork-session 另开的一份也不变），lemo-skin 画的时候按 id 用 $.lemo.recall 找回。
// 没存过号的旧会话还是按原文对号
type Kept = { u: Record<string, number>; r: Record<string, number>; t: Record<string, readonly [number, number, number]> }
const KEEP_PREFIX = 'rows:'
const KEEP_ORDER = 'rowsOrder'
// 只留最近这么多个会话、每个会话每种最近这么多行（$.store 整个不能超过 4 MiB：这样最多一百多万字节，平常几十 KB）
const KEEP_SESSIONS = 30
const KEEP_ROWS = 300
let mine: Kept = { u: {}, r: {}, t: {} }
let mineKey = ''
let keepTimer: { cancel: () => void } | null = null
// recall 用：各会话存下来的行，第一次 recall 时读一遍
let keptAll: Promise<Map<string, LemoKept>> | null = null

// 加进系统提示词的固定说明（prompt.compose）：界面上的 T01、T02 是什么。有编号就有这段说明，所以放在核心。
// 不跟语言、风格变，免得提示缓存失效
const NUMBERING_NOTE =
  'About the labels T01, T02, T03… in this interface: the lemo-mod plugins number the messages the user types in this session, in order. ' +
  'T01 is the user\'s first message, T02 the second, and so on; slash commands, reminders and background notifications get no number. ' +
  'When the user mentions a label such as T03, they mean their own third message in this session.'

async function setLang($: EngineInterface, next: LemoLang | null) {
  if (next === null || next === curLang) return
  curLang = next
  await update($, lang, () => next)
  await $.store.set('lang', next)
  scheduleRegister($)
  await retitle($)
}

// 面板开着时换了风格或语言：用同一个 id 再 open 一次，面板标题跟着换（已经开着的不会再开一个）。
// 桌面上不这样做，换成岩彩后面板左上角还是「柠檬实验室」
async function retitle($: EngineInterface) {
  try {
    if ((await $.ui.panes()).some(p => p.id === HUB)) await $.ui.open({ id: HUB, title: await hubTitle() })
  } catch {
    // 换不了标题就算了，下次打开面板时是新的
  }
}

// 记下一行编号，过一会儿统一存（连着来好几行时只存一次）
function keepRow($: EngineInterface, patch: (k: Kept) => void) {
  if (mineKey === '') return
  patch(mine)
  keepTimer?.cancel()
  keepTimer = $.clock.after(1000, () => {
    keepTimer = null
    void saveKept($)
  })
}

async function saveKept($: EngineInterface) {
  mine = { u: recent(mine.u, KEEP_ROWS), r: recent(mine.r, KEEP_ROWS), t: recent(mine.t, KEEP_ROWS) }
  try {
    await $.store.set(mineKey, mine)
    // 会话多了删最久没存过的。store 的键按名字排（会话 id 是乱的），所以另记一张先后表 rowsOrder；
    // 不在表里的（几个 claude 同时存时漏记的）当最旧的
    const order = ((await $.store.get(KEEP_ORDER)) as string[] | undefined) ?? []
    const all = (await $.store.keys()).filter(k => k.startsWith(KEEP_PREFIX) && k !== mineKey)
    const ranked = [...all.filter(k => !order.includes(k)), ...order.filter(k => all.includes(k)), mineKey]
    const drop = ranked.slice(0, Math.max(0, ranked.length - KEEP_SESSIONS))
    for (const k of drop) await $.store.delete(k)
    await $.store.set(KEEP_ORDER, ranked.slice(drop.length))
  } catch {
    // 存不上只影响以后恢复这个会话时的编号
  }
}

// 这个会话自己的键；接着同一个会话（--resume 不另开）时，接上之前存的
async function loadMine($: EngineInterface) {
  const id = await $.session.id().catch(() => '')
  mineKey = id === '' ? '' : KEEP_PREFIX + id
  if (mineKey === '') return
  const v = (await $.store.get(mineKey).catch(() => undefined)) as Partial<Kept> | undefined
  mine = { u: { ...(v?.u ?? {}) }, r: { ...(v?.r ?? {}) }, t: { ...(v?.t ?? {}) } }
}

// 「行为」页的静音、朗读开关（没装 lemo-sound、lemo-voice 时才有）。和 $.lemo.set 一样存进 $.store，换个会话还在
async function setMuted($: EngineInterface, v: boolean) {
  curMuted = v
  await update($, muted, () => v)
  await $.store.set('muted', v)
}

async function setSpeech($: EngineInterface, v: boolean) {
  curSpeech = v
  await update($, speech, () => v)
  await $.store.set('speech', v)
}

async function setStyle($: EngineInterface, id: string): Promise<boolean> {
  const raw = STYLES[id]
  if (raw === undefined) return false
  const next = named(raw, curNicks[id])
  curStyle = next
  await update($, style, () => next)
  await $.store.set('style', id)
  await loadIcon($)
  // 命令描述里带着风格名，换了要重新登记
  scheduleRegister($)
  await retitle($)
  return true
}

// 给当前风格起名字；空的就恢复原名。返回存下的名字（null = 恢复了原名），名字太长返回 false
async function setNick($: EngineInterface, text: string): Promise<string | null | false> {
  // 换行、制表、花括号（占位符的记号）都不要，连着的空白并成一个
  const nick = text.replace(/[{}\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (width(nick) > NICK_MAX) return false
  const id = curStyle.id
  const { [id]: _old, ...rest } = curNicks
  curNicks = nick === '' ? rest : { ...rest, [id]: nick }
  await $.store.set('nicks', curNicks)
  const raw = STYLES[id]
  if (raw !== undefined) {
    curStyle = named(raw, curNicks[id])
    const next = curStyle
    await update($, style, () => next)
  }
  // 命令描述、面板标题里都有名字
  scheduleRegister($)
  await retitle($)
  return nick === '' ? null : nick
}

async function loadIcon($: EngineInterface) {
  let png: string | null = null
  if (curStyle.icon !== null) {
    try {
      png = (await $.fs.read(`${$.plugin.root}/${curStyle.icon}`, { as: 'bytes' })).base64
    } catch {
      png = null
    }
  }
  await update($, icon, () => png)
}

// 系统的语言设置（POSIX 的顺序：LC_ALL、LC_MESSAGES、LANG，取第一个有值的）：zh 开头的用中文，别的、没设的用英文。
// 只在还没记过语言时用，记过就照记下的；用户发了普通消息照样跟着消息走。
// macOS 上不少中文用户终端的 LANG 是 en_US，会先看到英文，发一条中文消息就变回来
async function systemLang($: EngineInterface): Promise<LemoLang> {
  const all = await $.env.get('LC_ALL').catch(() => undefined)
  const messages = await $.env.get('LC_MESSAGES').catch(() => undefined)
  const base = await $.env.get('LANG').catch(() => undefined)
  const v = [all, messages, base].find(x => x !== undefined && x !== '') ?? ''
  return /^zh/i.test(v) ? 'zh' : 'en'
}

async function loadPrefs($: EngineInterface) {
  const savedLang = await $.store.get('lang')
  curLang = savedLang === 'zh' || savedLang === 'en' ? savedLang : await systemLang($)
  const savedNicks = await $.store.get('nicks')
  if (typeof savedNicks === 'object' && savedNicks !== null && !Array.isArray(savedNicks)) {
    curNicks = Object.fromEntries(Object.entries(savedNicks).filter((x): x is [string, string] => typeof x[1] === 'string' && x[1] !== ''))
  }
  const savedStyle = await $.store.get('style')
  const raw = typeof savedStyle === 'string' ? STYLES[savedStyle] : undefined
  curStyle = named(raw ?? STYLES[DEFAULT_STYLE] ?? Object.values(STYLES)[0]!, curNicks[raw?.id ?? DEFAULT_STYLE])
  const savedMuted = await $.store.get('muted')
  if (typeof savedMuted === 'boolean') curMuted = savedMuted
  const savedSpeech = await $.store.get('speech')
  if (typeof savedSpeech === 'boolean') curSpeech = savedSpeech
  const savedNote = await $.store.get('note')
  if (typeof savedNote === 'boolean') curNote = savedNote
  const savedOk = await $.store.get('safeOk')
  await update($, safeOk, () => savedOk === true)
  // 先写一遍：别的 mod 读 lemo-core 的状态时，没写过的值读到的是 undefined
  await update($, lang, () => curLang)
  await update($, style, () => curStyle)
  await update($, muted, () => curMuted)
  await update($, speech, () => curSpeech)
}

// Claude Code 的主题是浅色还是深色（/config 里的 theme）。终端卡片的底色跟着它选
async function refreshTheme($: EngineInterface) {
  try {
    const row = (await $.config.list()).find(r => r.key === 'theme')
    const v = typeof row?.value === 'string' ? row.value : ''
    const t: LemoTheme = /^dark/.test(v) ? 'dark' : /^light/.test(v) ? 'light' : null
    await update($, theme, () => t)
  } catch {
    // 读不到主题就不加底色
  }
}

// ---------- 桌面 App 的明暗 ----------
// 插件接口里没有 App 的明暗（App 切到暗色，$.config 读到的仍是 Claude Code 自己的主题）。
// App 把用户选的主题记在它自己的设置文件里：只在桌面会话里读，只读、不存、不发；读不到就当亮色，照原来的样子画。
// 选了「跟随系统」时看 macOS 的外观：系统是深色时，系统设置里有 AppleInterfaceStyle 这一项，浅色时没有。
// App 里换了明暗，几秒内跟上（每 3 秒看一次，变了才重画）
const DESK_CONFIG = '/Library/Application Support/Claude/config.json'
const MAC_PREFS = '/Library/Preferences/.GlobalPreferences.plist'
// 二进制 plist 里键名「AppleInterfaceStyle」（19 个字母）的写法：0x5F 0x10 0x13 再跟字母。
// 另一个键 AppleInterfaceStyleSwitchesAutomatically 长度不同，不会对上
const MAC_DARK_KEY = [0x5f, 0x10, 0x13, ...[...'AppleInterfaceStyle'].map(ch => ch.charCodeAt(0))]
let curDesk: LemoTheme = null

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, '')
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let n = 0
  for (let i = 0; i + 1 < clean.length; i += 4) {
    const v = [0, 1, 2, 3].map(k => B64.indexOf(clean[i + k] ?? 'A'))
    const x = ((v[0] ?? 0) << 18) | ((v[1] ?? 0) << 12) | ((v[2] ?? 0) << 6) | (v[3] ?? 0)
    for (const [k, shift] of [[1, 16], [2, 8], [3, 0]] as const) if (i + k < clean.length && n < out.length) out[n++] = (x >> shift) & 0xff
  }
  return out
}

/** macOS 现在是不是深色外观：系统设置文件（二进制或 XML 的 plist）里有没有 AppleInterfaceStyle 这一项 */
function macDark(bytes: Uint8Array): boolean {
  const head = String.fromCharCode(...bytes.slice(0, 8))
  if (head.startsWith('<?xml')) return new TextDecoder().decode(bytes).includes('<key>AppleInterfaceStyle</key>')
  outer: for (let i = 0; i + MAC_DARK_KEY.length <= bytes.length; i++) {
    for (let k = 0; k < MAC_DARK_KEY.length; k++) if (bytes[i + k] !== MAC_DARK_KEY[k]) continue outer
    return true
  }
  return false
}

async function refreshDesk($: EngineInterface) {
  const surfaces = await $.session.surfaces().catch(() => [] as readonly string[])
  if (!surfaces.includes('desktop')) return
  const home = await $.env.get('HOME').catch(() => undefined)
  if (home === undefined || home === '') return
  let mode: unknown = undefined
  let found = false
  try {
    mode = (JSON.parse(await $.fs.read(`${home}${DESK_CONFIG}`)) as { userThemeMode?: unknown }).userThemeMode
    found = true
  } catch {
    // App 的设置文件读不到：当亮色
  }
  let v: LemoTheme = mode === 'dark' ? 'dark' : mode === 'light' ? 'light' : null
  // 没写明亮或暗（选了跟随系统，或者从没改过主题，App 默认跟随系统）：看 macOS 的外观
  if (v === null && found) {
    try {
      v = macDark(fromBase64((await $.fs.read(`${home}${MAC_PREFS}`, { as: 'bytes' })).base64)) ? 'dark' : 'light'
    } catch {
      // 系统设置读不到：当亮色
    }
  }
  if (v === curDesk) return
  curDesk = v
  await update($, desk, () => v)
}

// ---------- 安全 ----------

// 安全页顶上的网页手册（GitHub Page）。只是一个链接，点了才打开，不自动开浏览器
const MANUAL_URL = 'https://lemomo-ai.github.io/lemo-mod/'
// 没按「我看完了」之前，横条上那个红胶囊的 id
const SAFE_BADGE = 'lemo-safe'
// 安全页上分类的先后
const KIND_ORDER: readonly LemoCapKind[] = ['look', 'sound', 'speech', 'file', 'cost', 'prompt', 'tool', 'act', 'net']

// 读一遍用户自己的设置，只看和 mod 重叠的几项。设置里什么都有（环境变量也在），所以只取这几项、不存、不发出去
async function scanSettings($: EngineInterface) {
  let found: LemoScan = { statusLine: false, spinnerVerbs: false, notif: null, outputStyle: null, theme: null }
  const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null)
  try {
    const set = await $.settings.read()
    found = {
      ...found,
      statusLine: set.statusLine !== undefined && set.statusLine !== null,
      spinnerVerbs: set.spinnerVerbs !== undefined && set.spinnerVerbs !== null,
      notif: str(set.preferredNotifChannel),
      outputStyle: str(set.outputStyle),
    }
  } catch {
    // 读不到设置就当没有重叠
  }
  try {
    found = { ...found, theme: str((await $.config.list()).find(r => r.key === 'theme')?.value) }
  } catch {
    // 读不到主题
  }
  await update($, scan, () => found)
}

// lemo-core 自己在能力清单里的几行：提示音、朗读、编号说明（都默认关）
function coreCaps(): LemoCap[] {
  const both = (k: 'sound' | 'speech' | 'note') => ({
    title: { zh: STR.zh.safe.cap[k].title, en: STR.en.safe.cap[k].title },
    desc: { zh: STR.zh.safe.cap[k].desc, en: STR.en.safe.cap[k].desc },
  })
  return [
    { mod: 'lemo-core', id: 'sound', kind: 'sound', on: !curMuted, preview: true, ...both('sound') },
    { mod: 'lemo-core', id: 'speech', kind: 'speech', on: curSpeech, preview: true, ...both('speech') },
    { mod: 'lemo-core', id: 'note', kind: 'prompt', on: curNote, ...both('note') },
  ]
}

// 开会话时：没按过「我看完了」就弹安全页（终端不够宽时面板等着，横条上的红胶囊和提示告诉用户怎么打开）；
// 按过了就在横条上写一行「已开：…」，不悄悄开着
async function greet($: EngineInterface) {
  const s = STR[curLang]
  if (!(await read($, safeOk))) {
    await $.lemo.badge({ id: SAFE_BADGE, text: { zh: STR.zh.safe.pending, en: STR.en.safe.pending }, tone: 'red' })
    await $.lemo.notice({ text: s.safe.pending, tone: 'red', ms: 10000 })
    await openHub($, 'safe')
    return
  }
  const on = (await $.lemo.caps({})).filter(c => c.on && c.kind !== 'look' && c.manual !== true)
  if (on.length > 0) await $.lemo.notice({ text: fill(s.safe.on, { list: on.map(c => c.title[curLang]).join(s.sep) }), tone: 'ink', ms: 8000 })
}

async function confirmSafe($: EngineInterface) {
  await update($, safeOk, () => true)
  await $.store.set('safeOk', true)
  await $.lemo.badge({ id: SAFE_BADGE, text: null, tone: 'red' })
}

// /lemo-mod 的命令提示：拼上各 mod 报到时说的词。mod 陆续报到，等一会儿再统一登记一次。
// immediate：Claude 干活时输入 /lemo-mod 也马上执行（打开面板、开番茄钟），不用等这一轮结束
function scheduleRegister($: EngineInterface) {
  registerTimer?.cancel()
  registerTimer = $.clock.after(200, () => {
    registerTimer = null
    void registerCommand($)
  })
}

// /lemo-mod 登记时的说明和提示：说明带风格名，提示拼上已经报到的 mod 说的词（按现在的语言）
function commandSpec(list: readonly LemoModInfo[]) {
  const s = STR[curLang]
  const extra = list.flatMap(m => m.commands?.[curLang] ?? [])
  const hint = [...extra, curLang === 'zh' ? '风格' : 'style'].join(' | ')
  const name = word({ st: curStyle, lang: curLang }, 'lemo-core.title', s.title)
  return { name: 'lemo-mod', description: fill(s.paren, { a: s.describe, b: name }), argumentHint: `[${hint}]`, immediate: true as const }
}

// 马上登记一次（不等计时器），返回登记的说明和提示，开会话时拿它看读完设置后要不要再登记
async function registerCommand($: EngineInterface): Promise<string> {
  const spec = commandSpec(await read($, mods))
  try {
    await $.command.register(spec)
  } catch {
    // 登记不上就沿用上一次的提示
  }
  return JSON.stringify(spec)
}

async function hubTitle(): Promise<string> {
  return word({ st: curStyle, lang: curLang }, 'lemo-core.title', STR[curLang].title)
}

// asked：用户自己输 /lemo-mod 打开的。桌面 App 里光标在输入框时，点面板的第一下只用来把焦点挪到面板（要点两次），
// 所以这时请 App 把焦点给面板，打开后第一下就能点中（App 只在输入框是空的时候给）。会话开头自动弹的安全页不要焦点，免得抢走用户打字的键盘；
// 终端照旧：焦点留在输入框，ctrl+x Tab 进面板
async function openHub($: EngineInterface, at?: LemoTab, asked = false) {
  if (at !== undefined) await update($, tab, () => at)
  const ss = asked ? await $.session.surfaces().catch(() => []) : []
  const focus = ss.includes('desktop') && !ss.includes('terminal')
  await $.ui.open({ id: HUB, title: await hubTitle(), ...(focus ? { focus: true as const } : {}) })
}

// 恢复旧会话时，新进程的编号从 0 开始。按对话记录里用户发的文字重新数一遍，接上原来的号。
// 斜杠命令、系统插入的内容（都以 < 开头）、压缩摘要和 lemo-watch 发的提醒不算
async function restoreNumbers($: EngineInterface) {
  if ((await read($, seq)) > 0) return
  const rows = await $.session.messages()
  let n = 0
  const texts: Record<string, number> = {}
  // 同一句话发过不止一次（两次「你好」）：按先后记下每次的号，画的时候按先后对（不然都标成最后那次的号）
  const order: Record<string, number[]> = {}
  // Claude 的回复也按文字对上属于第几条：恢复的会话里回复的 id 都不认识了，不补的话回复标签没有编号
  const replyTexts: Record<string, number> = {}
  for (const r of rows) {
    if (r.role === 'assistant') {
      const k = replyKey(r.text)
      if (n > 0 && k !== '') replyTexts[k] = n
      continue
    }
    if (r.role !== 'user') continue
    const t = r.text.trim()
    if (t === '' || t.startsWith('<') || t.startsWith(REMIND_MARK) || t.startsWith('This session is being continued')) continue
    n += 1
    texts[t] = n
    order[t] = [...(order[t] ?? []), n]
  }
  if (n === 0) return
  const dupes = Object.fromEntries(Object.entries(order).filter(([, ns]) => ns.length > 1))
  await update($, seq, () => n)
  await update($, numbers, m => ({
    ...m,
    texts: recent({ ...texts, ...m.texts }),
    ...(Object.keys(dupes).length > 0 ? { dupes: recent(dupes) } : {}),
  }))
  await update($, replies, m => ({ ids: m.ids, texts: recent({ ...replyTexts, ...m.texts }) }))
}

async function tick($: EngineInterface) {
  await update($, frame, f => f + 1)
  const now = await $.clock.now()
  // 对一下再清，在同一次写里完成：中间有 mod 写了新提示，不能把新的也清掉
  if ((await read($, notice)) !== null) await update($, notice, cur => (cur !== null && now >= cur.until ? null : cur))
}

export const register: Register = on => {
  // ---------- 公共方法 $.lemo ----------
  // 校验规定：engine.create 里拿到的 $（这里叫 $b）不能当参数传给别的函数，只能就地写 $b.noun.event(...)。
  // 所以这里不用 update() 这类帮手，读改写都直接调 $b.state
  on('engine.create', async (_$, e, next) => {
    const $b = await next(e)
    const LANG = { plugin: 'lemo-core', key: 'lang' } as const
    const MODS = { plugin: 'lemo-core', key: 'mods' } as const
    const TAB = { plugin: 'lemo-core', key: 'tab' } as const
    const NOTICE = { plugin: 'lemo-core', key: 'notice' } as const
    const BADGES = { plugin: 'lemo-core', key: 'badges' } as const
    const MUTED = { plugin: 'lemo-core', key: 'muted' } as const
    const SPEECH = { plugin: 'lemo-core', key: 'speech' } as const
    const UNFOLD = { plugin: 'lemo-core', key: 'unfold' } as const
    const TAGS = { plugin: 'lemo-core', key: 'tags' } as const
    const CAPS_REV = { plugin: 'lemo-core', key: 'capsRev' } as const

    // /lemo-mod 的命令提示要拼上各 mod 的词；mod 陆续报到，等一会儿再统一登记一次，更新提示。
    // 命令本身在开会话时就登记好了（见 session.start），不靠这里：新会话第一条就发 /lemo-mod 也认得
    const reRegister = () => {
      registerTimer?.cancel()
      registerTimer = $b.clock.after(200, () => {
        registerTimer = null
        void (async () => {
          const list = (await $b.state.get(MODS)).value ?? []
          await $b.command.register(commandSpec(list)).catch(() => undefined)
        })()
      })
    }

    const SAFEOK = { plugin: 'lemo-core', key: 'safeOk' } as const
    // 用风格的语音念：按顺序试风格里的语音，没装的会被拒绝，就换下一个；都没有就用系统默认语音
    // preview：试听（不看朗读开关）。不是试听的，每次试之前也看开关：等上一个语音被拒的时候关掉了，就不再试
    const speak = (text: string, preview: boolean) => {
      const gen = speakGen
      const may = () => gen === speakGen && (preview || curSpeech)
      void (async () => {
        for (const voice of curStyle.voices[curLang]) {
          if (!may()) return
          try {
            await $b.audio.speak(text, { voice })
            return
          } catch {
            // 没装这个语音
          }
        }
        if (!may()) return
        await $b.audio.speak(text).catch(() => undefined)
      })()
    }

    const lemo: Lemo = {
      style: async () => curStyle,
      lang: async () => curLang,
      join: async info => {
        // 版本对不上（别的 mod 同时在写）就重读再写，最多 50 次
        for (let i = 0; i < 50; i++) {
          const cur = await $b.state.get(MODS)
          const list = [...(cur.value ?? []).filter(m => m.mod !== info.mod), info]
          if ((await $b.state.set(MODS, list, { ifVersion: cur.version })).isSet) break
        }
        reRegister()
      },
      open: async ({ tab: at }) => {
        if (at !== undefined) await $b.state.set(TAB, at)
        await $b.ui.open({ id: HUB, title: word({ st: curStyle, lang: curLang }, 'lemo-core.title', STR[curLang].title) })
      },
      play: async ({ sound, gain, preview }) => {
        if (curMuted && preview !== true) return
        void $b.audio.play({ asset: curStyle.sounds[sound] }, { gain: gain ?? 1 }).catch(() => undefined)
      },
      say: async ({ text, preview }) => {
        // 朗读有自己的开关（安全页「朗读」），和提示音分开
        if (preview !== true && !curSpeech) return
        speak(text, preview === true)
      },
      notice: async ({ text, tone, ms }) => {
        const life = ms ?? 5000
        const until = (await $b.clock.now()) + life
        await $b.state.set(NOTICE, { text, tone, until })
        $b.ui.toast(text, { timeoutMs: life })
      },
      badge: async b => {
        // 版本对不上（别的 mod 同时在写）就重读再写，最多 50 次
        for (let i = 0; i < 50; i++) {
          const cur = await $b.state.get(BADGES)
          const rest = (cur.value ?? []).filter(x => x.id !== b.id)
          if ((await $b.state.set(BADGES, b.text === null ? rest : [...rest, b], { ifVersion: cur.version })).isSet) break
        }
      },
      set: async o => {
        if (o.muted !== undefined) {
          curMuted = o.muted
          await $b.state.set(MUTED, o.muted)
          await $b.store.set('muted', o.muted)
        }
        if (o.speech !== undefined) {
          curSpeech = o.speech
          await $b.state.set(SPEECH, o.speech)
          await $b.store.set('speech', o.speech)
        }
        if (o.unfold !== undefined) await $b.state.set(UNFOLD, o.unfold)
        // 声音、朗读卡片上改的开关，安全页那两行也要跟着重画
        if (o.muted !== undefined || o.speech !== undefined) await $b.state.set(CAPS_REV, ((await $b.state.get(CAPS_REV)).value ?? 0) + 1)
      },
      tag: async ({ n, kind }) => {
        // 版本对不上（别的 mod 同时在写）就重读再写，最多 50 次
        for (let i = 0; i < 50; i++) {
          const cur = await $b.state.get(TAGS)
          if ((await $b.state.set(TAGS, recent({ ...(cur.value ?? {}), [String(n)]: kind }), { ifVersion: cur.version })).isSet) break
        }
      },
      // 各 mod 挂 on('lemo.command') 接自己的词；走到这里就是谁都不认，交回 /lemo-mod 的 hook 自己处理
      command: async () => null,
      recall: async ({ id }) => {
        if (keptAll === null) {
          keptAll = (async () => {
            const all = new Map<string, LemoKept>()
            try {
              for (const k of await $b.store.keys()) {
                if (!k.startsWith(KEEP_PREFIX)) continue
                const v = (await $b.store.get(k)) as Partial<Kept> | undefined
                for (const [uuid, n] of Object.entries(v?.u ?? {})) all.set(uuid, { ...all.get(uuid), u: n })
                for (const [uuid, n] of Object.entries(v?.r ?? {})) all.set(uuid, { ...all.get(uuid), r: n })
                for (const [uuid, t] of Object.entries(v?.t ?? {})) all.set(uuid, { ...all.get(uuid), t })
              }
            } catch {
              // 读不到就当没存过
            }
            return all
          })()
        }
        return (await keptAll).get(id) ?? null
      },
      // 各 mod 挂 on('lemo.caps') 把自己的几行接在后面；最底下是 lemo-core 自己的
      // 编号说明照 $.store 报：别的会话里改过，这个会话的安全页也是对的
      caps: async () => {
        const saved = await $b.store.get('note').catch(() => undefined)
        if (typeof saved === 'boolean') curNote = saved
        return coreCaps()
      },
      // 各 mod 挂 on('lemo.toggle') 认自己的；走到这里只剩 lemo-core 自己的几行
      toggle: async ({ mod, id, on: want, preview }) => {
        if (mod !== 'lemo-core') return false
        if (preview === true) {
          if (id === 'sound') void $b.audio.play({ asset: curStyle.sounds.done }, { gain: 1 }).catch(() => undefined)
          else if (id === 'speech') speak(STR[curLang].safe.sample, true)
          else return false
          return true
        }
        if (want === undefined) return false
        if (id === 'sound') {
          curMuted = !want
          await $b.state.set(MUTED, curMuted)
          await $b.store.set('muted', curMuted)
        } else if (id === 'speech') {
          curSpeech = want
          await $b.state.set(SPEECH, want)
          await $b.store.set('speech', want)
        } else if (id === 'note') {
          curNote = want
          await $b.store.set('note', want)
        } else return false
        return true
      },
      // 「全部关闭」：各 mod 挂 on('lemo.off') 关自己的再往下传；最底下关 lemo-core 自己的
      off: async () => {
        speakGen += 1
        curMuted = true
        curSpeech = false
        curNote = false
        await $b.state.set(MUTED, true)
        await $b.state.set(SPEECH, false)
        await $b.store.set('muted', true)
        await $b.store.set('speech', false)
        await $b.store.set('note', false)
        // 关掉了也算看过安全页
        await $b.state.set(SAFEOK, true)
        await $b.store.set('safeOk', true)
      },
    }
    return { ...$b, lemo }
  })

  // ---------- 生命周期 ----------
  on('session.start', async ($, e, next) => {
    // 先登记 /lemo-mod，排在读存档之前：桌面 App 新会话第一条就发 /lemo-mod 时，命令得已经在（不然提示
    // 「isn't a command here」）。这时还没读用户的语言和风格，说明先用默认的；读完不一样再登记一次。
    // 提示里各 mod 的词：已经报到的先带上，后报到的由 $.lemo.join 等 200 毫秒统一更新
    const first = await registerCommand($)
    await loadPrefs($)
    if (JSON.stringify(commandSpec(await read($, mods))) !== first) await registerCommand($)
    await refreshTheme($)
    await scanSettings($)
    // 等各 mod 报到、读完自己的开关，再弹安全页或写「已开：…」。排在编号前面：编号出错也不耽误安全页
    $.clock.after(1500, () => {
      void greet($)
    })
    await loadMine($)
    await restoreNumbers($)
    $.clock.every(1000, () => {
      void tick($)
    })
    // 桌面 App 的明暗：先读一次，之后每 3 秒看一次（只在桌面会话里读）
    await refreshDesk($)
    $.clock.every(3000, () => {
      void refreshDesk($)
    })
    // 不急的放到后面，免得拖慢会话启动
    $.clock.after(0, () => {
      void loadIcon($)
    })
    return next(e)
  })

  // 系统提示词：在最后加一段固定的说明，让 Claude 知道界面上的 T01、T02 指的是用户第几条消息（安全页的开关，默认关）。
  // 系统提示词在会话第一次请求时就定下来了，之后改了也不再发给模型，所以只放不会变的内容
  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    // 默认不加：安全页「附加提示 · 编号说明」打开了才加。
    // 从 $.store 现读：别的会话里关掉了，这个会话的系统提示词还没定的话也不加
    if (e.traits.includes('bare')) return r
    const saved = await $.store.get('note').catch(() => undefined)
    if (typeof saved === 'boolean') curNote = saved
    if (!curNote) return r
    return { ...r, sections: [...r.sections, { id: 'lemo-core:numbering', text: NUMBERING_NOTE, scope: 'session' as const }] }
  })

  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const r = await next(e)
    $.clock.after(0, () => {
      void refreshTheme($)
    })
    return r
  })

  // 用户发消息：跟着换界面语言，记下原文（编号时用）。
  // 斜杠命令不记：命令不进 session.append，原文会留到下一条真消息、借走它的号（桌面上会出现两条「T14 · /lemo-mod」）
  on('prompt.submit', async ($, e, next) => {
    if (NOT_PERSON.has(e.origin.kind)) return next(e)
    const text = e.text.trim()
    slashNext = SLASH.test(text)
    counted = false
    pendingText = slashNext ? '' : text
    // 斜杠命令：加载词在这一轮开始（turn.start）之前就出来了，先把号清掉，头一下不会带着上一条的号。
    // 像 /tmp 这样当消息发出去的，追加进对话记录时照常编号
    if (slashNext && !busy) await update($, turnNo, () => 0)
    await setLang($, detectLang(e.text))
    return next(e)
  })

  // ---------- 消息编号 ----------
  // 用户本人发出的每条消息记一个号。斜杠命令、插件和后台通知发来的不算。
  // 号存在会话状态里，mod 热重载、上下文压缩都不会重新数；新开会话从 T01 开始
  on('session.append', { door: 'prompt' }, async ($, e, next) => {
    const o = e.origin
    if (e.agentId !== undefined || o.kind === 'model' || o.kind === 'tool') return next(e)
    // 提醒、助手交回、后台通知这类发进主对话的：接下来的回复不带号
    if (NOT_PERSON.has(o.kind)) {
      await update($, turnNo, () => 0)
      return next(e)
    }
    if (e.message.isMeta) return next(e)
    const n = (await read($, seq)) + 1
    await update($, seq, () => n)
    await update($, turnNo, () => n)
    counted = true
    // 每一段文字都记下来（桌面会在用户的话前后附上别的内容），再加上 prompt.submit 时记下的原文
    const keys = e.message.content
      .map(b => ('text' in b && typeof b.text === 'string' ? b.text.trim() : ''))
      .filter(t => t !== '' && !t.startsWith('<'))
    if (pendingText !== '') keys.push(pendingText)
    pendingText = ''
    await update($, numbers, m => ({
      ...m,
      ids: recent({ ...m.ids, [e.uuid]: n }),
      texts: recent({ ...m.texts, ...Object.fromEntries(keys.map(k => [k, n])) }),
    }))
    keepRow($, k => {
      k.u[e.uuid] = n
    })
    return next(e)
  })

  // Claude 的回复记下属于第几条消息。不是用户本人发消息开头的一轮记 0（照样记下，按原文对时不会对到以前同样的回复上）
  on('session.append', { door: 'response' }, async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const n = await read($, turnNo)
    const keys = e.message.content
      .map(b => ('text' in b && typeof b.text === 'string' ? replyKey(b.text) : ''))
      .filter(k => k !== '')
    if ((n > 0 || (await read($, seq)) > 0) && keys.length > 0) {
      await update($, replies, m => ({
        ...m,
        ids: recent({ ...m.ids, [e.uuid]: n }),
        texts: recent({ ...m.texts, ...Object.fromEntries(keys.map(k => [k, n])) }),
      }))
      keepRow($, k => {
        k.r[e.uuid] = n
      })
    }
    return next(e)
  })

  // 耗时行在对话记录里是一条 turn_duration 通知，界面上画它时的 requestId 就是这条通知的 id。
  // 追加时记下它属于第几条消息、这一轮几步几次工具，mod 重载以后也对得上
  on('session.append', { door: 'notice' }, async ($, e, next) => {
    if (e.agentId === undefined && e.message.name === 'turn_duration') {
      const row: LemoTurnRow = { n: await read($, turnNo), steps: curSteps, tools: curTools }
      await update($, turnRows, m => recent({ ...m, [e.uuid]: row }))
      keepRow($, k => {
        k.t[e.uuid] = [row.n, row.steps, row.tools]
      })
    }
    return next(e)
  })

  // ---------- 每轮统计：每向模型发一次请求算一步 ----------
  on('turn.start', async ($, e, next) => {
    curSteps = 0
    curTools = 0
    // 斜杠命令（skill）开头的一轮：不借用上一条的号。接着上一轮说的（text 为空）不算
    const t = e.text.trim()
    if (!counted && (SLASH.test(t) || (slashNext && t !== ''))) await update($, turnNo, () => 0)
    slashNext = false
    counted = false
    busy = true
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    if (e.agentId === undefined) {
      curSteps += 1
      curTools += r.toolUses.length
    }
    return r
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) busy = false
    if (e.agentId === undefined && !e.isAborted) {
      const done: LemoTurn = { steps: curSteps, tools: curTools, ms: e.durationMs }
      await update($, lastTurn, () => done)
    }
    return next(e)
  })

  // ---------- 命令 /lemo-mod ----------
  // 只有这里接 /lemo-mod：Claude Code 在命令的回复前面写上接这个命令的所有插件名，以前 8 个 mod 都接，
  // 回复前面就是「lemo-pomodoro+lemo-recap+…+lemo-core:」一长串。
  // 现在先用 $.lemo.command 问各 mod（它们挂 on('lemo.command')），认得的词它们自己处理，都不认识才轮到下面。
  // 登记成 immediate：Claude 干活时也马上跑，所以这里和各 mod 的命令都不能假定这一轮停着
  on('command.run', { command: 'lemo-mod' }, async ($, e) => {
    const answer = await $.lemo.command({ args: e.args })
    if (answer !== null) return answer.text === undefined ? {} : { text: answer.text }
    // 命令里的词不改界面语言（「/lemo-mod bg」不该把界面换成英文），语言只跟着用户发的普通消息走
    const args = e.args.trim()
    const s = STR[curLang]
    const { word: w, rest } = cmdWord(args)
    if (w === '') {
      // 只打开面板，不回文字：回一句「已打开」的话，那张卡片会一直留在对话记录里
      await openHub($, undefined, true)
      return {}
    }
    if (w === '风格' || w === 'style') {
      const names = Object.values(STYLES).map(x => fill(s.paren, { a: x.id, b: x.name[curLang] })).join(s.sep)
      if (rest === '') return { text: fill(s.cmd.styleList, { list: names }) }
      // 先拿整段比（风格名可能带空格，比如「Lemo Lab」），对不上再拿第一个词
      const same = (x: (typeof STYLES)[string], t: string) =>
        x.id === t || x.name.zh === t || x.name.en.toLowerCase() === t.toLowerCase() || curNicks[x.id]?.toLowerCase() === t.toLowerCase()
      const first = rest.split(/\s+/)[0] ?? ''
      const hit = Object.values(STYLES).find(x => same(x, rest)) ?? Object.values(STYLES).find(x => same(x, first))
      const id = hit === undefined ? rest : hit.id
      if (hit === undefined || !(await setStyle($, hit.id))) return { text: fill(s.cmd.styleUnknown, { id: mdEsc(id), list: names }) }
      return { text: fill(s.cmd.styleSet, { name: hit.name[curLang] }) }
    }
    // 起名：/lemo-mod 起名 豆豆、/lemo-mod name Dodo；不带名字就恢复原名。名字从原文里命令词后面照原样取
    // （cmdWord 会把开头的数字拆走、把英文变小写），「起名豆豆」不带空格也认
    const nickWord = NICK_WORDS.find(x => w === x || (/^[^a-z]/.test(x) && w.startsWith(x)))
    if (nickWord !== undefined) {
      const text = args.slice(nickWord.length)
      const own = STYLES[curStyle.id]?.name[curLang] ?? curStyle.name[curLang]
      const had = curNicks[curStyle.id]
      const r = await setNick($, text)
      if (r === false) return { text: fill(s.cmd.nickLong, { n: NICK_MAX / 2, m: NICK_MAX }) }
      if (r !== null) return { text: fill(s.cmd.nickSet, { name: own, nick: mdEsc(r) }) }
      return { text: fill(had === undefined ? s.cmd.nickNone : s.cmd.nickReset, { name: own }) }
    }
    const at = TAB_WORDS[w]
    if (at !== undefined) {
      await openHub($, at, true)
      return {}
    }
    const list = await read($, mods)
    // 分页词只列这个会话的界面上有的页（桌面上没有「游戏」页，就不提它）
    const surfaces = await $.session.surfaces().catch(() => ['terminal'])
    const tabs = new Set(surfaces.flatMap(x => visibleTabs(list, x)))
    const known = [
      ...list.flatMap(m => m.commands?.[curLang] ?? []),
      curLang === 'zh' ? '风格' : 'style',
      curLang === 'zh' ? '起名' : 'name',
      ...(Object.keys(STR[curLang].tabs) as LemoTab[]).filter(k => tabs.has(k)).map(k => STR[curLang].tabs[k]),
    ]
    return { text: fill(s.cmd.unknown, { word: mdEsc(w), list: known.join(s.sep) }) }
  })

  // /lemo-mod 的回复画成一张带风格标签的卡片，正文按 Markdown 排（各 mod 回的文字也走这里）
  on('ui.render', { component: 'CommandOutput', props: { command: 'lemo-mod' } }, async ($, e, next) => {
    if (e.props.isErrored || e.props.text.trim() === '') return next(e)
    const lk = await look($)
    const tag = word(lk, 'lemo-core.cmdTag', STR[lk.lang].cmdTag)
    const { Box, Text, Markdown } = $.ui.resolve(e)
    const chip = (
      <Box flexDirection="row">
        <Text backgroundColor={lk.c.accent} color={lk.c.onAccent} bold>{tag}</Text>
      </Box>
    )
    if (e.surface === 'terminal') {
      return (
        <Box flexDirection="column" borderStyle="round" borderColor={lk.c.accent} paddingX={1}>
          {chip}
          <Markdown text={e.props.text} />
        </Box>
      )
    }
    return (
      // 桌面：浅色卡片（暗色 App 换成深色卡片，里面的 Markdown 用 App 的字色，暗色下是浅字）
      <Box flexDirection="column" gap={1} backgroundColor={deskDark(lk) ? lk.c.cardFillDark : lk.c.cardFillLight} borderStyle="round" borderColor={deskDark(lk) ? mix(lk.c.accent, lk.c.cardFillDark, 0.5) : mix(lk.c.accent, '#FFFFFF', 0.6)} paddingX={2} paddingY={1}>
        {chip}
        <Markdown text={e.props.text} />
      </Box>
    )
  })

  // ---------- 统一面板 /lemo-mod：头部、分页、风格、已装的 mod ----------
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const lk = await look($, e.props)
    const s = STR[lk.lang]
    const isTerm = e.surface === 'terminal'
    const list = await read($, mods)
    const shown = visibleTabs(list, e.surface)
    // 自己的报到表读自己的 atom（没人报到时是空表）；各 mod 用 hubTab 算出来的是同一页
    const stored = await read($, tab)
    const at = shown.includes(stored) ? stored : shown[0] ?? 'behave'
    const n = await read($, seq)
    const png = isTerm ? await read($, icon) : null
    const el = $.ui.resolve(e)
    const { Box, Text } = el
    const title = word(lk, 'lemo-core.title', s.title)
    const chip = <Text backgroundColor={lk.c.accent} color={lk.c.onAccent} bold>{` ${title} · ${exp(n)} `}</Text>
    // 装了几个 mod：报到的那些加上 lemo-core 自己（和 README、/plugin 里数的一样，全装是 16 个）
    const modCount = list.length + 1
    const count = modCount === 1 ? s.modsOne : fill(s.modsCount, { n: modCount })
    const sub = <Text color={lk.c.pencil}>{`${s.style.title} ${lk.st.name[lk.lang]} · ${count}`}</Text>

    let head = (
      <Box flexDirection="column">
        <Box flexDirection="row">{chip}</Box>
        {sub}
      </Box>
    )
    if (isTerm && png !== null) {
      const { Image } = $.ui.resolve(e)
      // 终端一格大约宽高 1:2，所以 6 列 × 3 行是方的
      head = (
        <Box flexDirection="row" gap={2} alignItems="flex-start">
          <Image key="icon" source={{ png }} columns={6} rows={3} alt={lk.st.name[lk.lang]} />
          {head}
        </Box>
      )
    }
    if (isTerm && lk.st.bubbles.length > 0) {
      // 点缀从图标上方往上冒（第一行），右上角再飘几颗
      const b = lk.st.bubbles
      head = (
        <Box flexDirection="column">
          <Text color={lk.c.bubble}>{`  ${b[4 % b.length]} `}<Text color={lk.c.bubbleAccent}>{b[0]}</Text></Text>
          <Box flexDirection="row" alignItems="flex-start">
            <Box flexGrow={1}>{head}</Box>
            <Box flexDirection="column" flexShrink={0} alignItems="flex-end">
              <Text color={lk.c.bubble}>{`${b[0]} ${b[2 % b.length]}`}</Text>
              <Text color={lk.c.bubbleAccent}>{`${b[4 % b.length]}  `}</Text>
            </Box>
          </Box>
        </Box>
      )
    }

    const tabs = (
      <Box key="tabs" flexDirection="row" gap={1} flexWrap="wrap">
        {shown.map((id, i) => (
          <Button
            key={`tab-${id}`}
            label={s.tabs[id]}
            {...(id === at ? { variant: 'primary' as const } : sec(e.surface))}
            {...(isTerm ? { hotkey: 'abcde'[i] ?? 'a' } : {})}
            onPress={() => update($, tab, () => id)}
          />
        ))}
      </Box>
    )

    const cards: CardSpec[] = []
    // ---------- 安全页：照能力清单（$.lemo.caps）画，每个 mod 会做的事按分类列出，带开关 ----------
    if (at === 'safe') {
      await read($, capsRev)
      const ok = await read($, safeOk)
      const sc = await read($, scan)
      const caps = await $.lemo.caps({})
      const ss = s.safe
      const L = lk.lang
      const ink = inkOf(lk, e.surface)
      const { Link } = $.ui.resolve(e)
      const keep = (t: string) => (isTerm ? cjkKeep(t) : t)
      // 终端里说明文字先按面板宽度断好行（英文词不拆、标点不放行首）；桌面照原样交给 App 排
      const cols = cardCols(e.props.bodyColumns)
      const dim = (t: string, key: string, w = cols) => (isTerm ? para({ Box, Text }, t, w, key) : <Text key={key} dimColor>{t}</Text>)
      const bump = () => update($, capsRev, v => v + 1)
      const dk = await read($, desk)
      const found: string[] =
        sc === null
          ? [ss.scanBusy]
          : [
              ...(sc.statusLine ? [ss.scanStatus] : []),
              ...(sc.spinnerVerbs ? [ss.scanSpinner] : []),
              ...(sc.notif === null ? [] : [fill(ss.scanNotif, { v: ss.notifNames[sc.notif] ?? sc.notif })]),
              ...(sc.outputStyle === null ? [] : [fill(ss.scanStyle, { v: sc.outputStyle })]),
            ]
      if (sc !== null && found.length === 0) found.push(ss.scanNone)
      if (sc !== null) found.push(fill(ss.scanTheme, { v: sc.theme ?? '—' }))
      if (e.surface === 'desktop') found.push(fill(ss.scanDesk, { v: dk === 'dark' ? ss.desk.dark : dk === 'light' ? ss.desk.light : ss.desk.unknown }))
      cards.push({
        id: 'safe-head',
        title: ss.title,
        desc: ss.promise,
        cols,
        buttons: [
          ...(ok ? [] : [<Button key="safe-ok" label={ss.ok} variant="primary" onPress={() => confirmSafe($)} />]),
          <Button
            key="safe-off"
            label={ss.allOff}
            {...sec(e.surface)}
            onPress={async () => {
              await $.lemo.off({})
              await confirmSafe($)
              await bump()
            }}
          />,
        ],
        extra: (
          <Box flexDirection="column">
            <Text {...ink}>
              <Link href={MANUAL_URL} label={ss.manual} />
            </Text>
            {dim(ss.allOffDesc, 'safe-off-desc')}
            <Box marginTop={1} flexDirection="column">
              <Text bold {...ink}>{keep(ss.scanTitle)}</Text>
              {found.map((t, i) => dim(`· ${t}`, `safe-scan-${i}`))}
            </Box>
            {ok ? <Box marginTop={1}>{dim(ss.okDone, 'safe-done')}</Box> : null}
          </Box>
        ),
      })
      KIND_ORDER.forEach((k, i) => {
        const rows = caps.filter(c => c.kind === k && c.manual !== true)
        if (rows.length === 0) return
        cards.push({
          id: `safe-${k}`,
          order: 10 + i * 5,
          title: ss.kinds[k],
          desc: ss.kindDesc[k],
          cols,
          extra: (
            <Box flexDirection="column" gap={1}>
              {rows.map(c => {
                const head = (
                  <Text bold {...ink}>
                    {c.title[L]}
                    <Text bold={false} color={c.on ? lk.c.ink : lk.c.pencil}>{`  ${c.on ? ss.stateOn : ss.stateOff}`}</Text>
                    <Text bold={false} color={lk.c.pencil}>{`  ${c.mod}`}</Text>
                  </Text>
                )
                const btns = (
                  <Box flexDirection="row" gap={1} flexShrink={0}>
                    {c.preview === true ? (
                      <Button key={`cap-try-${c.mod}-${c.id}`} label={ss.listen} {...sec(e.surface)} onPress={() => $.lemo.toggle({ mod: c.mod, id: c.id, preview: true })} />
                    ) : null}
                    <Button
                      key={`cap-sw-${c.mod}-${c.id}`}
                      label={c.on ? ss.turnOff : ss.turnOn}
                      {...sec(e.surface)}
                      onPress={async () => {
                        await $.lemo.toggle({ mod: c.mod, id: c.id, on: !c.on })
                        await bump()
                      }}
                    />
                  </Box>
                )
                // 终端：按钮放在名字那一行右边，说明占满整行（窄栏里中文说明和按钮挤一行断得很怪）。
                // 桌面照原来的排法（亮色样子冻结）
                return isTerm ? (
                  <Box key={`cap-${c.mod}-${c.id}`} flexDirection="column">
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" gap={2}>
                      <Box flexShrink={1}>{head}</Box>
                      {btns}
                    </Box>
                    {dim(c.desc[L], `cap-d-${c.mod}-${c.id}`)}
                  </Box>
                ) : (
                  <Box key={`cap-${c.mod}-${c.id}`} flexDirection="row" justifyContent="space-between" alignItems="center" gap={2}>
                    <Box flexDirection="column" flexShrink={1}>
                      {head}
                      {dim(c.desc[L], `cap-d-${c.mod}-${c.id}`)}
                    </Box>
                    {btns}
                  </Box>
                )
              })}
            </Box>
          ),
        })
      })
      const manual = caps.filter(c => c.manual === true)
      if (manual.length > 0) {
        cards.push({
          id: 'safe-manual',
          order: 95,
          title: ss.manualTitle,
          desc: ss.manualDesc,
          cols,
          // 和上面的开关行一样：名字一行（开关行写「已开」的位置写它会做的事），说明另起一行
          extra: (
            <Box flexDirection="column" gap={1}>
              {manual.map(c => (
                <Box key={`cap-m-${c.mod}-${c.id}`} flexDirection="column">
                  <Text bold {...ink}>
                    {c.title[L]}
                    <Text bold={false} color={lk.c.ink}>{`  ${ss.kinds[c.kind]}`}</Text>
                    <Text bold={false} color={lk.c.pencil}>{`  ${c.mod}`}</Text>
                  </Text>
                  {dim(c.desc[L], `cap-md-${c.mod}-${c.id}`)}
                </Box>
              ))}
            </Box>
          ),
        })
      }
    }
    if (at === 'behave') {
      const cur = lk.st.id
      cards.push({
        id: 'core-style',
        title: s.style.title,
        desc: s.style.desc,
        extra: (
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            {Object.values(STYLES).map(x => (
              <Button
                key={`style-${x.id}`}
                label={x.name[lk.lang]}
                {...(x.id === cur ? { variant: 'primary' as const } : sec(e.surface))}
                onPress={() => setStyle($, x.id)}
              />
            ))}
          </Box>
        ),
      })
      // 起名：给当前风格起个名字，面板标题、横条、各 mod 的提示里都用它（每个风格各记各的）。
      // 存了以后换一个 key，引擎就当成新的输入框，把刚打的字清掉
      const nick = curNicks[cur]
      const own = STYLES[cur]?.name[lk.lang] ?? lk.st.name[lk.lang]
      // 手机端没有输入框（元素表里没有 Input），只能用命令起名
      const { Input } = e.surface === 'mobile' ? { Input: null } : $.ui.resolve(e)
      cards.push({
        id: 'core-name',
        title: s.nick.title,
        desc: `${fill(s.nick.desc, { name: own })}${nick === undefined ? '' : fill(s.nick.now, { nick })}`,
        ...(nick === undefined ? {} : { buttons: <Button key="core-name-reset" label={s.nick.reset} {...sec(e.surface)} onPress={() => setNick($, '')} /> }),
        extra: Input === null ? null : (
          <Input
            key={`core-name-in-${cur}-${nick ?? ''}`}
            placeholder={s.nick.placeholder}
            submitLabel={s.nick.save}
            value=""
            onSubmit={value => {
              void setNick($, value)
            }}
          />
        ),
      })
      // 静音、朗读开关平时在 lemo-sound、lemo-voice 的卡片里。没装它们、但装了会出声的 mod（比如单装番茄钟）时，
      // 在这里给一张，不然关不掉到点的铃声和朗读。装了大合集时这张不出现
      const has = (id: string) => list.some(m => m.mod === id)
      const makes = (what: 'sound' | 'speech') => list.some(m => m.uses?.includes(what) === true)
      const needMute = !has('lemo-sound') && (makes('sound') || makes('speech'))
      const needSpeech = !has('lemo-voice') && makes('speech')
      if (needMute || needSpeech) {
        const isMuted = await read($, muted)
        const isSpeech = await read($, speech)
        cards.push({
          id: 'core-sound',
          title: s.sound.title,
          desc: fill(s.sound.desc, { speech: makes('speech') ? s.sound.withSpeech : '' }),
          buttons: [
            ...(needMute ? [<Button key="core-mute" label={isMuted ? s.sound.unmute : s.sound.mute} {...sec(e.surface)} onPress={() => setMuted($, !isMuted)} />] : []),
            ...(needSpeech ? [<Button key="core-speech" label={isSpeech ? s.sound.speechOn : s.sound.speechOff} {...sec(e.surface)} onPress={() => setSpeech($, !isSpeech)} />] : []),
          ],
        })
      }
      const others = list.filter(m => m.surfaces === undefined || m.surfaces.includes(e.surface))
      // mod 一多，说明会把「行为」页撑得很长、开关卡片挤到下面，所以默认只列名字，按「展开说明」再展开
      // （桌面上这张卡片本来只有四五行，展开的长列表会改了桌面的样子）
      const open = await read($, modsOpen)
      const keep = (t: string) => (isTerm ? cjkKeep(t) : t)
      cards.push({
        id: 'core-mods',
        title: s.mods.title,
        desc: others.length === 0 ? s.mods.none : s.mods.desc,
        ...(others.length > 0
          ? { buttons: <Button key="core-mods-more" label={open ? s.mods.less : s.mods.more} {...sec(e.surface)} onPress={() => update($, modsOpen, v => !v)} /> }
          : {}),
        extra:
          others.length === 0 ? null : !open ? (
            <Text color={lk.c.pencil}>{others.map(m => keep(m.title[lk.lang])).join(' · ')}</Text>
          ) : (
            <Box flexDirection="column">
              {others.map(m => {
                const items = m.always?.[lk.lang] ?? []
                return (
                  <Box key={`mod-${m.mod}`} flexDirection="column">
                    <Text bold {...inkOf(lk, e.surface)}>{`${m.title[lk.lang]}  `}<Text bold={false} color={lk.c.pencil}>{m.mod}</Text></Text>
                    {items.map((t, i) => (
                      <Box key={`al-${m.mod}-${i}`} flexDirection="row">
                        <Box flexShrink={0}>
                          <Text dimColor>{'  · '}</Text>
                        </Box>
                        <Box flexShrink={1}>
                          <Text dimColor>{keep(t)}</Text>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )
              })}
            </Box>
          ),
      })
    }

    // 头部：终端里左右各留 2 格，上面空 1 行（第一行右边是面板自带的 ✕），和卡片之间空 1 行；桌面面板自己有边距。
    // 桌面上装了 lemo-meter 时，最上面是它画的数据卡（标题、编号、用量），这里就只画分页
    const meterOnTop = !isTerm && list.some(m => m.mod === 'lemo-meter' && (m.surfaces === undefined || m.surfaces.includes(e.surface)))
    const top = (
      <Box key="core-head" flexDirection="column" gap={1} {...(isTerm ? { paddingX: 2, paddingTop: 1 } : {})}>
        {meterOnTop ? null : head}
        {tabs}
        {isTerm ? <Text dimColor>{fill(s.keys, { last: 'abcde'[shown.length - 1] ?? 'a' })}</Text> : null}
      </Box>
    )
    // 自己的卡片也走 hubWrap：顺序号和别的 mod 的卡片一起排
    return hubWrap(el, lk, e.surface, top, cards)
  })
}
