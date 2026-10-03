// lemo-voice：朗读。主对话的一轮超过 30 秒、没被中断，结束时念一句「第 3 条完成，用时 45 秒。」
// （柠檬实验室风格念「实验3完成，用时45秒。」，句子在风格包 words/lemo-voice.ts）。
// 念不念、用哪个语音都由 lemo-core 的 $.lemo.say 管：关了朗读时不念（朗读有自己的开关，和提示音的静音分开；
// 装上时是关的）；中文按风格里的中文语音念
// （系统默认是英文语音，念中文是一串听不懂的音，所以风格里按顺序写了 Tingting 等中文语音）。
// 统一面板「常用」页一张「朗读」卡片：开关、试听；/lemo-mod 朗读 也是试听。
// 卡片上的开关和安全页「朗读」那一行（lemo-core 的）改的是同一个值，所以这个 mod 不再往能力清单里加行。
// 番茄钟到点的朗读不归这里，lemo-pomodoro 自己调 $.lemo.say

import type { EngineInterface, Register } from 'claude-code'

import { STR } from './i18n'
import { HUB, cmdWord, fill, hubWrap, sec, steady, word } from './shared/lemo'
import type { Look } from './shared/lemo'

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

// lemo-core 的朗读开关（校验规定：状态的引用写在用它的文件里）。画卡片时读它会订阅，lemo-core 一改卡片自动重画
const SpeechRef = { plugin: 'lemo-core', key: 'speech' } as const

/** 一轮超过这么久才念（毫秒）：只给等得久、可能走开了的那一轮报一声 */
const LONG_MS = 30_000

/**
 * 用了多久，念出来的样子：不到一分钟念秒，一分钟以上念分和秒，一小时以上念小时和分
 */
export function spoken(ms: number, lang: Look['lang']): string {
  const all = Math.round(ms / 1000)
  const h = Math.floor(all / 3600)
  const m = Math.floor((all % 3600) / 60)
  const s = all % 60
  if (lang === 'zh') {
    if (h > 0) return m > 0 ? `${h} 小时 ${m} 分` : `${h} 小时`
    if (m > 0) return s > 0 ? `${m} 分 ${s} 秒` : `${m} 分钟`
    return `${s} 秒`
  }
  const unit = (v: number, one: string) => `${v} ${one}${v === 1 ? '' : 's'}`
  if (h > 0) return m > 0 ? `${unit(h, 'hour')} ${unit(m, 'minute')}` : unit(h, 'hour')
  if (m > 0) return s > 0 ? `${unit(m, 'minute')} ${unit(s, 'second')}` : unit(m, 'minute')
  return unit(s, 'second')
}

/**
 * 一轮结束时念的句子：风格里有就用风格的，没有用默认的。{n} 第几条消息，{s} 用了多久（spoken 拼好的「2 分 15 秒」）。
 * n 为 0 时（用户本人还没发过消息，比如新会话里第一轮是提醒引出的）念「第 0 条完成」不像话，换成不带编号的一句
 */
function turnLine(lk: Pick<Look, 'st' | 'lang'>, n: number, ms: number): string {
  const s = spoken(ms, lk.lang)
  if (n <= 0) return fill(word(lk, 'lemo-voice.turnPlain', STR[lk.lang].turnPlain), { s })
  return fill(word(lk, 'lemo-voice.turn', STR[lk.lang].turn), { n, s })
}

/** 试听念的句子：就是一轮结束时真正会念的那句，拿第 3 条、45 秒举例 */
const sampleLine = (lk: Pick<Look, 'st' | 'lang'>) => turnLine(lk, 3, 45_000)

/** 朗读开着吗。lemo-core 还没写过时照它的默认：关（装上时朗读是关的） */
async function isSpeechOn($: EngineInterface): Promise<boolean> {
  return (await $.state.get(SpeechRef)).value ?? false
}

/** 开关朗读：读 lemo-core 现在的开关，反过来写回去（lemo-core 记进 $.store，换个会话还在） */
async function flipSpeech($: EngineInterface) {
  await $.lemo.set({ speech: !(await isSpeechOn($)) })
}

/** 试听：用户自己点的，关了朗读也照样念 */
async function hearSample($: EngineInterface) {
  const lk = await look($)
  await $.lemo.say({ text: sampleLine(lk), preview: true })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // 不写 always：朗读不是外观，装上时是关的，列在安全页 lemo-core 的「朗读」那一行
    await $.lemo.join({
      mod: 'lemo-voice',
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: ['main'],
      commands: { zh: [STR.zh.cmd.word], en: [STR.en.cmd.word] },
    })
    return next(e)
  })

  // 一轮结束：主对话、正常答完（不是被打断、接口出错、拒答）、超过 30 秒才念。子 agent 的一轮不念（主对话会自己再跑一轮）
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId !== undefined || e.reason !== 'answer' || e.durationMs <= LONG_MS) return r
    const lk = await look($)
    await $.lemo.say({ text: turnLine(lk, await seqOf($), e.durationMs) })
    return r
  })

  // /lemo-mod 朗读：试听一句。别的词交给里层（别的 mod、最后是 lemo-core）
  on('lemo.command', async ($, e, next) => {
    const { word: w } = cmdWord(e.args)
    if (w !== STR.zh.cmd.word && w !== STR.en.cmd.word) return next(e)
    // 命令里的词不换界面语言：试听和回复都用当前语言
    const lk = await look($)
    await $.lemo.say({ text: sampleLine(lk), preview: true })
    return { value: { text: STR[lk.lang].cmd.speaking } }
  })

  // 统一面板「常用」页：朗读卡片，开关 + 试听
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    if ((await hubTab($, e.surface)) !== 'main') return inner
    const lk = await look($, e.props)
    const S = STR[lk.lang]
    // 只看朗读开关：朗读和提示音的静音现在是两个开关，静音不管朗读
    const isOn = await isSpeechOn($)
    const el = $.ui.resolve(e)
    return hubWrap(el, lk, e.surface, inner, [
      {
        id: 'voice-main',
        title: word(lk, 'lemo-voice.title', S.title),
        desc: isOn ? S.desc : fill(S.offDesc, { desc: S.desc }),
        buttons: [
          <Button key="voice-speech" label={isOn ? S.on : S.off} {...sec(e.surface)} onPress={() => flipSpeech($)} />,
          <Button key="voice-hear" label={S.hear} {...sec(e.surface)} onPress={() => hearSample($)} />,
        ],
      },
    ])
  })
}
