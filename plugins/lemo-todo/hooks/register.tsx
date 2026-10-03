// lemo-todo：笔记。统一面板「常用」页一张卡片：输入框写一句回车保存，下面列最近 5 条，换个会话还在。
// 另外压缩上下文以后，可以用小模型（$.model.complete，Haiku）把摘要缩成一句话，也存成一条笔记（「自动摘要」）。
// 自动摘要每次多调一次模型、花用户的用量，所以装上时是关的：开关在笔记卡片上，
// 也列在「安全」页（lemo.caps），两处改的是同一个值，存进 $.store（全局记住）。
// 手动写笔记不进能力清单：不花钱，写的是插件自己的存储，用户自己打的字。
//
// 笔记同时写进会话状态（界面马上重画）和 $.store（换个会话还在）。
// $.store 按插件名存，所有会话共用（lemo-todo 的笔记只在 lemo-todo 的存储里）

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { LemoTodoNote } from '../types'
import { STR } from './i18n'
import { HUB, clip, cmdWord, fill, hubWrap, inkOf, mdhm, sec, steady, word } from './shared/lemo'

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

// 存储里最多留几条、每条最多几个字、面板里显示最近几条
const KEEP = 50
const MAX_LEN = 200
const SHOWN = 5

const notes = atom({ plugin: 'lemo-todo', key: 'notes' } as const, [] as readonly LemoTodoNote[])
// 自动摘要开没开：值存在 $.store 的 compact 键（全局记住），这里放一份给卡片读。装上时关着
const compactOn = atom({ plugin: 'lemo-todo', key: 'compactOn' } as const, false)

// 能力清单的一行（类型从 lemo-core 的合约里取）
type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]
// 安全页上这一行的 id
const CAP_ID = 'compact'

// 笔记存在所有会话共用的 $.store 里。各会话把自己那份整个写回去，后写的会盖掉别的会话刚加的。
// 所以每次先读存储里最新的，加一条再写回去，再同步到这个会话。
// 读和写之间不是原子的：两个会话同一瞬间存笔记（都读到旧的那份、各自加一条写回去），仍可能丢一条。
// 要人在两个会话里几乎同时按回车才会碰上，概率很低，接受
async function addNote($: EngineInterface, text: string) {
  const t = text.trim()
  if (t === '') return
  const note = { at: await $.clock.now(), text: t.slice(0, MAX_LEN) }
  const list = [...parseNotes(await $.store.get('notes')), note].slice(-KEEP)
  await $.store.set('notes', list)
  await update($, notes, () => list)
  await $.lemo.play({ sound: 'tick', gain: 0.7 })
}

// 存储里的东西不一定是这一版写的（手改过、旧版本），只留形状对的
function parseNotes(saved: unknown): LemoTodoNote[] {
  if (!Array.isArray(saved)) return []
  return saved.filter(
    (n): n is LemoTodoNote => typeof n === 'object' && n !== null && typeof n.at === 'number' && typeof n.text === 'string',
  )
}

// 把存储里的笔记读进会话状态：会话开始时一次，用户打开面板时再一次（别的会话加的笔记只写进了存储）
async function loadNotes($: EngineInterface) {
  const list = parseNotes(await $.store.get('notes'))
  if (list.length > 0) await update($, notes, () => list.slice(-KEEP))
}

// 自动摘要的开关：卡片上的按钮、安全页（lemo.toggle）、「全部关闭」（lemo.off）都走这里，会话状态和 $.store 一起改
async function setCompact($: EngineInterface, v: boolean) {
  await update($, compactOn, () => v)
  await $.store.set('compact', v)
}

// 新会话开始：$.store 里存的是 true 才算开
async function loadPrefs($: EngineInterface) {
  const v = (await $.store.get('compact')) === true
  await update($, compactOn, () => v)
}

/**
 * 自动摘要现在开没开：每次从 $.store 现读（所有会话共用一份），会话状态跟着对齐。
 * 别的会话里关掉了、按了「全部关闭」，这个会话也跟着停。读不到就当关着
 */
async function liveCompact($: EngineInterface): Promise<boolean> {
  let v: boolean
  try {
    v = (await $.store.get('compact')) === true
  } catch {
    return false
  }
  if ((await read($, compactOn)) !== v) await update($, compactOn, () => v)
  return v
}

// 安全页上的一行：花哪个模型的用量、写到哪，说清楚。不带风格味道（安全页要一眼看懂）
async function todoCaps($: EngineInterface): Promise<Cap[]> {
  return [
    {
      mod: 'lemo-todo',
      id: CAP_ID,
      kind: 'cost',
      title: { zh: STR.zh.cap.title, en: STR.en.cap.title },
      desc: { zh: STR.zh.cap.desc, en: STR.en.cap.desc },
      // 照 $.store 报：别的会话里改过，这个会话的安全页也是对的
      on: await liveCompact($),
    },
  ]
}

// 压缩上下文以后：用小模型（$.model.complete）把摘要缩成一句话，存成一条笔记
async function noteCompaction($: EngineInterface, summary: string) {
  // 排队等的时候可能关掉了（这个会话、别的会话，或者「全部关闭」）：调模型之前、存笔记之前各看一次
  if (!(await liveCompact($))) return
  const lk = await look($)
  const S = STR[lk.lang]
  let line = clip(summary.replace(/^This session is being continued[^\n]*\n*/, ''), 60)
  try {
    const r = await $.model.complete({ model: 'haiku', prompt: S.compactPrompt + summary.slice(0, 8000), maxTokens: 120 })
    if (r.isAnswered && r.text.trim() !== '') line = r.text.trim()
  } catch {
    // 用摘要开头凑合
  }
  if (!(await liveCompact($))) return
  await addNote($, fill(word(lk, 'lemo-todo.compactNote', S.compactNote), { text: line }))
  await $.lemo.notice({ text: word(lk, 'lemo-todo.compactDone', S.compactDone), tone: 'ink' })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-todo',
      // 会放音效：没装 lemo-sound 时，lemo-core 在「行为」页给出开关
      uses: ['sound'],
      title: { zh: STR.zh.title, en: STR.en.title },
      tabs: ['main'],
      // 没有 always：自动摘要会多调模型，列在安全页上，有开关
    })
    await loadPrefs($)
    await loadNotes($)
    return next(e)
  })

  // ---------- 安全页：能力清单、开关、「全部关闭」 ----------
  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...(await todoCaps($))] }
  })

  on('lemo.toggle', async ($, e, next) => {
    if (e.mod !== 'lemo-todo') return next(e)
    if (e.id !== CAP_ID || e.on === undefined) return { value: false }
    await setCompact($, e.on)
    return { value: true }
  })

  // 存不进去也要往下传（别的 mod 的开关照样关），横条上说一声
  on('lemo.off', async ($, e, next) => {
    try {
      await setCompact($, false)
    } catch {
      await $.lemo.notice({ text: STR[await $.lemo.lang({})].offFail, tone: 'red' }).catch(() => undefined)
    }
    return next(e)
  })

  // 打开面板（/lemo-mod，或 /lemo-mod 常用）时先从存储重读一次笔记，再交给里层（lemo-core 打开面板）。
  // 别的会话加的笔记只写进了共用的存储，不重读的话这个会话的面板上看不到、条数也不变。
  // 不认的词照旧交给里层
  on('lemo.command', async ($, e, next) => {
    const { word: w } = cmdWord(e.args)
    if (w === '' || w === '常用' || w === 'main') await loadNotes($)
    return next(e)
  })

  // 压缩上下文（session.compact）：「自动摘要」开着时，压缩完以后把摘要缩成一句话存进笔记。
  // 预先算的（precompute）还没真的压缩，子 agent 自己的压缩和主对话无关，都不记
  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    if (e.trigger === 'precompute' || e.agentId !== undefined || r.messages === undefined) return r
    if (!(await liveCompact($))) return r
    // 摘要是压缩后对话里的一条消息，取最长的那条
    const summary = r.messages.map(m => m.text).sort((a, b) => b.length - a.length)[0] ?? ''
    if (summary.trim() !== '') {
      // 另外调一次模型要好几秒，放到 hook 外面跑，不拖住压缩
      $.clock.after(0, () => {
        void noteCompaction($, summary)
      })
    }
    return r
  })

  // 统一面板「常用」页：笔记卡片
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    if ((await hubTab($, e.surface)) !== 'main') return inner
    const lk = await look($, e.props)
    const el = $.ui.resolve(e)
    const { Box, Text } = el
    const S = STR[lk.lang]
    const saved = await read($, notes)
    const isCompact = await read($, compactOn)
    const ink = inkOf(lk, e.surface)

    let noteInput = null
    // 手机端没有输入框（元素表里没有 Input），只列笔记
    if (e.surface !== 'mobile') {
      const { Input } = $.ui.resolve(e)
      // 存了一条以后换一个 key，引擎就当成新的输入框，把刚打的字清掉
      // （输入框的字在 hook 重画之前一直是用户打的那些）。条数到上限后不再变，所以连上最后一条的时间
      const last = saved[saved.length - 1]
      // 终端里输入框自己画的标签不带颜色（用终端自己的字色），面板停靠时底是主题画的，深色终端配浅色主题时看不见。
      // 所以终端里标签自己画、设上颜色，输入框不给 label；桌面画原生的，照旧给 label
      const isTerm = e.surface === 'terminal'
      const field = (
        <Input
          key={last === undefined ? 'todo-note' : `todo-note-${saved.length}-${last.at}`}
          {...(isTerm ? {} : { label: S.label })}
          placeholder={word(lk, 'lemo-todo.placeholder', S.placeholder)}
          submitLabel={S.save}
          value=""
          onSubmit={value => {
            void addNote($, value)
          }}
        />
      )
      noteInput = isTerm ? (
        <Box key="todo-note-row" flexDirection="row" gap={1}>
          <Box flexShrink={0}>
            <Text {...ink}>{`${S.label.trim()} :`}</Text>
          </Box>
          <Box flexGrow={1}>{field}</Box>
        </Box>
      ) : (
        field
      )
    }

    // 时间那一列不缩，文字那一列可以换行
    const list =
      saved.length === 0 ? null : (
        <Box key="todo-list" flexDirection="column">
          {saved.slice(-SHOWN).map((n, i) => (
            <Box key={`todo-n${i}`} flexDirection="row" gap={1}>
              <Box flexShrink={0}>
                <Text color={lk.c.pencil}>{mdhm(n.at)}</Text>
              </Box>
              <Box flexShrink={1}>
                <Text {...ink}>{n.text}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      )

    return hubWrap(el, lk, e.surface, inner, [
      {
        id: 'todo-notes',
        title: word(lk, 'lemo-todo.title', S.title),
        desc: fill(S.desc, { n: saved.length }) + S.compactDesc,
        // 自动摘要的开关（和安全页那一行是同一个值）
        buttons: (
          <Button key="todo-compact" label={isCompact ? S.compactOn : S.compactOff} {...sec(e.surface)} onPress={() => setCompact($, !isCompact)} />
        ),
        extra: list === null && noteInput === null ? null : (
          <Box flexDirection="column" gap={1}>
            {list}
            {noteInput}
          </Box>
        ),
      },
    ])
  })
}
