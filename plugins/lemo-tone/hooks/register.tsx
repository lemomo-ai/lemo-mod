// lemo-tone：说话方式。两个开关，打开后在用户本人发的每条消息后面悄悄附一段要求（用户看不到，模型读得到），不改用户的文字：
// - 简短模式（「常用」页）：这一条请 Claude 三句话内回答，不要列表。打开时横条和状态栏上多一个「简短」胶囊
// - 口吻（「行为」页）：每条回复开头一行说看了什么，结尾一行写结论。柠檬实验室风格是「观察：」「结论：」的实验记录口吻
// 两个开关打开时，输入框右下角的模式标签也多一个。/lemo-mod 简短（brief）也能开关简短模式。
//
// 系统提示词（prompt.compose）在会话第一次请求时就定了，之后改了不再发给模型，
// 所以中途改 Claude 的说话方式只能用 prompt.submit 的 context，每条消息附一次。
// 两个开关装上时都是关的（会往发给 Claude 的内容里加话），列在「安全」页（lemo.caps），
// 那里和卡片上的按钮、/lemo-mod 简短 改的是同一个值，存进 $.store（全局记住）。

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { BRIEF_NOTE, STR, VOICE_OFF_PROMPT, VOICE_PROMPT } from './i18n'
import { HUB, NOT_PERSON, cmdWord, hubWrap, sec, steady, word } from './shared/lemo'
import type { CardSpec, Style } from './shared/lemo'

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

// 简短模式、口吻两个开关记在 $.store 里，换个会话还在；会话状态里放一份给画面读，热重载不清零
const brief = atom({ plugin: 'lemo-tone', key: 'brief' } as const, false)
const voice = atom({ plugin: 'lemo-tone', key: 'voice' } as const, false)
// 刚关掉口吻：下一条消息附一句「已经关了」，不然 Claude 会照着前几条回复的格式继续写（只在这个会话）
const voiceOff = atom({ plugin: 'lemo-tone', key: 'voiceOff' } as const, false)

// 能力清单的一行（类型从 lemo-core 的合约里取）
type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]
type Flag = 'brief' | 'voice'

/** 给模型看的文字：不随界面语言变，固定读风格里 en 那一格（风格包里中英两格写同一段），找不到用默认的中性要求 */
const modelText = (st: Style, key: string, fallback: string) => word({ st, lang: 'en' }, key, fallback)

/** 简短模式的胶囊：打开时中英各给一份（lemo-meter 按当前语言画），关掉时去掉 */
async function briefBadge($: EngineInterface, isOn: boolean) {
  await $.lemo.badge({ id: 'tone-brief', text: isOn ? { zh: STR.zh.brief.badge, en: STR.en.brief.badge } : null, tone: 'grey' })
}

/** 简短模式设成开或关：会话状态、$.store、胶囊一起改。卡片、命令、安全页、「全部关闭」都走这里 */
async function setBrief($: EngineInterface, v: boolean) {
  await update($, brief, () => v)
  await $.store.set('brief', v)
  await briefBadge($, v)
}

/** 开关简短模式，返回开关后的值 */
async function toggleBrief($: EngineInterface): Promise<boolean> {
  const v = !(await read($, brief))
  await setBrief($, v)
  return v
}

/**
 * 口吻设成开或关。从开着变成关掉时记一笔，下一条消息附一句「已经关了」；重新打开就不用附了。
 * 本来就关着（比如刚装上就按「全部关闭」）不记：不然下一条消息会平白多一句话
 */
async function setVoice($: EngineInterface, v: boolean) {
  const was = await read($, voice)
  await update($, voice, () => v)
  await $.store.set('voice', v)
  if (v) await update($, voiceOff, () => false)
  else if (was) await update($, voiceOff, () => true)
}

/** 开关口吻，返回开关后的值 */
async function toggleVoice($: EngineInterface): Promise<boolean> {
  const v = !(await read($, voice))
  await setVoice($, v)
  return v
}

// 安全页上的两行：往哪加什么话，说清楚。不带风格味道（安全页要一眼看懂）
async function toneCaps($: EngineInterface): Promise<Cap[]> {
  const row = (id: Flag, isOn: boolean): Cap => ({
    mod: 'lemo-tone',
    id,
    kind: 'prompt',
    title: { zh: STR.zh.cap[id].title, en: STR.en.cap[id].title },
    desc: { zh: STR.zh.cap[id].desc, en: STR.en.cap[id].desc },
    on: isOn,
  })
  // 照 $.store 报：别的会话里改过，这个会话的安全页也是对的
  const now = await liveTone($)
  return [row('brief', now.isBrief), row('voice', now.isVoice)]
}

/**
 * 两个开关现在的值：每次从 $.store 现读（所有会话共用一份），会话状态和胶囊跟着对齐。
 * 别的会话里关掉了、按了「全部关闭」，这个会话的下一条消息也不再附要求；口吻是从开着变成关掉的，
 * 和 setVoice 一样记一笔，下一条附一句「已经关了」。读不到就当关着（不改会话状态）
 */
async function liveTone($: EngineInterface): Promise<{ isBrief: boolean; isVoice: boolean }> {
  let isBrief: boolean
  let isVoice: boolean
  try {
    isBrief = (await $.store.get('brief')) === true
    isVoice = (await $.store.get('voice')) === true
  } catch {
    return { isBrief: false, isVoice: false }
  }
  if ((await read($, brief)) !== isBrief) {
    await update($, brief, () => isBrief)
    await briefBadge($, isBrief)
  }
  if ((await read($, voice)) !== isVoice) {
    await update($, voice, () => isVoice)
    await update($, voiceOff, () => !isVoice)
  }
  return { isBrief, isVoice }
}

/** 新会话开始：按 $.store 里记着的打开（存的是 true 才算开）；简短模式开着就把胶囊挂上 */
async function loadPrefs($: EngineInterface) {
  const isBrief = (await $.store.get('brief')) === true
  const isVoice = (await $.store.get('voice')) === true
  await update($, brief, () => isBrief)
  await update($, voice, () => isVoice)
  if (isBrief) await briefBadge($, true)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-tone',
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: ['main', 'behave'],
      commands: { zh: ['简短'], en: ['brief'] },
    })
    await loadPrefs($)
    return next(e)
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------
  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...(await toneCaps($))] }
  })

  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-tone') return next(e)
    if (e.on === undefined) return { value: false }
    if (e.id === 'brief') await setBrief($, e.on)
    else if (e.id === 'voice') await setVoice($, e.on)
    else return { value: false }
    return { value: true }
  })

  // 存不进去也要往下传：别的 mod 的开关照样关
  on('lemo.off', async ($, e, next) => {
    try {
      await setBrief($, false)
    } catch {
      // 照样往下传
    }
    try {
      await setVoice($, false)
    } catch {
      // 照样往下传
    }
    return next(e)
  })

  // 用户本人发消息：开关打开时把要求附在 context 里（用户的文字原样不动）。
  // 后台任务通知、别的会话、插件发来的消息（比如 lemo-watch 的提醒）不附，口吻关掉后的那一句也留给用户的下一条
  on('prompt.submit', async ($, e, next) => {
    if (NOT_PERSON.has(e.origin.kind)) return next(e)
    const { isBrief, isVoice } = await liveTone($)
    const justOff = await read($, voiceOff)
    if (!isBrief && !isVoice && !justOff) return next(e)
    const st = await $.lemo.style({})
    const extra: string[] = []
    if (isBrief) extra.push(BRIEF_NOTE)
    if (isVoice) extra.push(modelText(st, 'lemo-tone.voicePrompt', VOICE_PROMPT))
    else if (justOff) {
      extra.push(modelText(st, 'lemo-tone.voiceOffPrompt', VOICE_OFF_PROMPT))
      await update($, voiceOff, () => false)
    }
    // 界面语言跟着这条消息走（lemo-core 在里层改）。语言变了，胶囊上的「简短 / brief」也跟着换
    const before = await $.lemo.lang({})
    const r = await next({ ...e, context: [...(e.context ?? []), ...extra] })
    if (isBrief && (await $.lemo.lang({})) !== before) await briefBadge($, true)
    return r
  })

  // /lemo-mod 简短（brief）：开关简短模式。不认的词交给里层（别的 mod、lemo-core）
  on('lemo.command', async ($, e, next) => {
    const { word: w } = cmdWord(e.args)
    if (w !== '简短' && w !== 'brief') return next(e)
    // 命令里的词不换界面语言：回复用当前语言
    const lang = await $.lemo.lang({})
    const isOn = await toggleBrief($)
    return { value: { text: isOn ? STR[lang].cmd.briefOn : STR[lang].cmd.briefOff } }
  })

  // 模式标签：输入框右下角那几个灰字（focus、memory paused），把打开的开关加在后面。别的 mod 的标签原样留着
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const isBrief = await read($, brief)
    const isVoice = await read($, voice)
    if (!isBrief && !isVoice) return next(e)
    const lk = await look($)
    const S = STR[lk.lang]
    const extra: string[] = []
    if (isBrief) extra.push(S.brief.mode)
    if (isVoice) extra.push(word(lk, 'lemo-tone.voiceMode', S.voice.mode))
    return next({ ...e, props: { ...e.props, modes: [...e.props.modes, ...extra] } })
  })

  // 统一面板：「常用」页一张简短模式卡片，「行为」页一张口吻卡片。两个界面都能用
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    const at = await hubTab($, e.surface)
    if (at !== 'main' && at !== 'behave') return inner
    const lk = await look($, e.props)
    const el = $.ui.resolve(e)
    const S = STR[lk.lang]
    const cards: CardSpec[] = []
    if (at === 'main') {
      const isBrief = await read($, brief)
      cards.push({
        id: 'tone-brief-card',
        title: S.brief.title,
        desc: S.brief.desc,
        buttons: <Button key="tone-brief" label={isBrief ? S.on : S.off} {...sec(e.surface)} onPress={() => toggleBrief($)} />,
      })
    } else {
      const isVoice = await read($, voice)
      cards.push({
        id: 'tone-voice-card',
        title: word(lk, 'lemo-tone.voiceTitle', S.voice.title),
        desc: word(lk, 'lemo-tone.voiceDesc', S.voice.desc),
        buttons: <Button key="tone-voice" label={isVoice ? S.on : S.off} {...sec(e.surface)} onPress={() => toggleVoice($)} />,
      })
    }
    return hubWrap(el, lk, e.surface, inner, cards)
  })
}
