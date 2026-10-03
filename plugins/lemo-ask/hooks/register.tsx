// lemo-ask：Claude 向你提问（AskUserQuestion）时，在弹窗上面加一行抬头：强调色底的「? 提问 · T03」，
// 后面一句「2 个问题，选好再继续」。弹窗本身照引擎画，选项和按键都是原来的。
// 别的 mod 用 $.ui.ask 弹出的问题（比如番茄钟到点）走的是同一个弹窗，也会带上这行抬头。
// 安全页一行外观，装上就开，有开关；关了弹窗照原样

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { exp, fill, word } from './shared/lemo'
import { STR } from './i18n'

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

// 抬头开关：外观，装上就开。存进 $.store（键 look，全局记住），开会话时读回来；弹窗读它，一改就重画
const lookOn = atom({ plugin: 'lemo-ask', key: 'lookOn' } as const, true)

type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-ask',
      title: { zh: STR.zh.name, en: STR.en.name },
      tabs: [],
      always: { zh: [STR.zh.always], en: [STR.en.always] },
    })
    try {
      const saved = await $.store.get('look')
      if (typeof saved === 'boolean') await update($, lookOn, () => saved)
    } catch {
      // 读不到存档就照默认（开）
    }
    return next(e)
  })

  // 弹窗本身（桌面上是原生弹窗）不让换，只能在外面加东西：返回的树里必须正好包含一次 next(e) 的结果。
  // 终端、桌面上抬头都出现在弹窗上方，方向键和回车照常能选
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    // 安全页上关了：不加抬头，原样交给里层
    if (!(await read($, lookOn))) return next(e)
    const drawn = await next(e)
    const lk = await look($)
    const S = STR[lk.lang]
    const n = e.props.questions.length
    const { Box, Text } = $.ui.resolve(e)
    // 强调色只做底色（浅色终端上黄字看不清），上面的字用 onAccent
    const tag = fill(S.tag, { title: word(lk, 'lemo-ask.title', S.title), no: exp(await seqOf($)) })
    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Text backgroundColor={lk.c.accent} color={lk.c.onAccent} bold>{` ${tag} `}</Text>
          <Text color={lk.c.pencil}>{`  ${n === 1 ? S.one : fill(S.many, { n })}`}</Text>
        </Box>
        {drawn}
      </Box>
    )
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------

  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    const row: Cap = {
      mod: 'lemo-ask',
      id: 'look',
      kind: 'look',
      title: { zh: STR.zh.cap.title, en: STR.en.cap.title },
      desc: { zh: STR.zh.cap.desc, en: STR.en.cap.desc },
      on: await read($, lookOn),
    }
    return { value: [...(r.value ?? []), row] }
  })

  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-ask') return next(e)
    const want = e.on
    if (e.id !== 'look' || want === undefined) return { value: false }
    await update($, lookOn, () => want)
    await $.store.set('look', want)
    return { value: true }
  })

  // 「全部关闭」只关外观以外的；提问弹窗的抬头是外观，没有要关的，往下传
  on('lemo.off', async ($, e, next) => next(e))
}
