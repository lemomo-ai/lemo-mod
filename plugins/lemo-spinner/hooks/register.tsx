// lemo-spinner：Claude 干活时的加载词换成风格里的词（柠檬实验室是「滴定中」「冒泡中」……），后面带上消息编号。
// 每条新消息换一个词，一轮里不变：不按时间换，免得一轮干活中间一直重画。
// 安全页一行外观，有开关。默认照用户自己的设置：用户自己设了转圈文字（spinnerVerbs）就不换
// （lemo-core 的 scan），用户按过开关后照用户的

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { exp, words } from './shared/lemo'

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

// 默认的加载词（风格没写的时候用）
const WORDS = {
  zh: ['思考中', '处理中', '整理中', '推敲中', '检查中', '动手中'],
  en: ['Thinking', 'Working', 'Sorting', 'Weighing', 'Checking', 'Doing'],
}

// 用户看得到的文字：报到时的名字和说明、安全页上的那一行
const STR = {
  zh: {
    title: '加载词',
    always: '加载词换成风格词并附上消息编号（已自定义转圈文字时默认关闭）',
    cap: { title: '加载词', desc: '工作时的加载词换成风格词并附上消息编号 · 已自定义 spinnerVerbs 时默认关闭' },
  },
  en: {
    title: 'Spinner words',
    always: 'Spinner words come from the style, with the message number (off by default if you set your own)',
    cap: { title: 'Spinner words', desc: 'Spinner words while Claude works come from the style, with the message number · off by default if you set spinnerVerbs' },
  },
}

// lemo-core 扫描到的用户设置（只读）：用户自己设了转圈文字，这里默认就不换
const LemoScanRef = { plugin: 'lemo-core', key: 'scan' } as const

// 用户按过的开关（存进 $.store，键 words，全局记住）；没按过是 null，照 lemo-core 的扫描定
const pref = atom({ plugin: 'lemo-spinner', key: 'pref' } as const, null as boolean | null)

type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]

/**
 * 换不换加载词：用户按过开关就照用户的；没按过时，用户自己设了 spinnerVerbs 就不换，没设才换。
 * lemo-core 还没扫完（scan 是 null）先当不换，免得把用户自己的词先盖掉一下（照用户自己的配置来）
 */
async function isOn($: EngineInterface): Promise<boolean> {
  const p = await read($, pref)
  if (p !== null) return p
  const sc = (await $.state.get(LemoScanRef)).value ?? null
  return sc !== null && !sc.spinnerVerbs
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-spinner',
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: [],
      always: { zh: [STR.zh.always], en: [STR.en.always] },
    })
    // 读回存下来的开关；没存过（或读不到存档）照扫描
    try {
      const saved = await $.store.get('words')
      await update($, pref, () => (typeof saved === 'boolean' ? saved : null))
    } catch {
      // 读不到存档就照默认
    }
    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    // 关着（或者照用户自己的转圈文字）就原样交给里层
    if (!(await isOn($))) return next(e)
    const lk = await look($)
    const n = await seqOf($)
    const list = words(lk, 'lemo-spinner.words', WORDS[lk.lang])
    return next({ ...e, props: { ...e.props, word: list[n % list.length] ?? e.props.word, suffix: `… · ${exp(n)}` } })
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------

  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    const row: Cap = {
      mod: 'lemo-spinner',
      id: 'words',
      kind: 'look',
      title: { zh: STR.zh.cap.title, en: STR.en.cap.title },
      desc: { zh: STR.zh.cap.desc, en: STR.en.cap.desc },
      on: await isOn($),
    }
    return { value: [...(r.value ?? []), row] }
  })

  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-spinner') return next(e)
    const want = e.on
    if (e.id !== 'words' || want === undefined) return { value: false }
    await update($, pref, () => want)
    await $.store.set('words', want)
    return { value: true }
  })

  // 「全部关闭」只关外观以外的；加载词是外观，没有要关的，往下传
  on('lemo.off', async ($, e, next) => next(e))
}
