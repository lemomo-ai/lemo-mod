// lemo-recap：会话小结。另外问一次模型（$.model.fork），把这次会话到目前为止做了什么总结成三行，
// 不占对话轮次；显示在统一面板「常用」页的「小结」卡片里，写好后可以一键复制。
// /lemo-mod 总结（recap）也能开始写，并打开面板。
// 不把小结填进输入框（$.prompt.fill）：会冲掉输入框里打了一半的字，要接着做直接跟 Claude 说就行。
// 压缩上下文前把小结存进笔记那件事不在这里，归 lemo-todo
// 小结会花用量（用主模型把整段对话读一遍），但只在用户点了「写小结」、输入了命令以后才写，
// 在「安全」页列为「手动触发」（manual），没有开关。装上时什么都不做

import { atom, read, update } from 'claude-code'
import type { EngineInterface, ModelForkResult, Register, RenderSurface } from 'claude-code'

import type { LemoRecap, LemoRecapWhy } from '../types'
import { STR, WORDS } from './i18n'
import type { RecapStrings } from './i18n'
import { HUB, cmdWord, fill, hubWrap, plainLines, sec, steady, word } from './shared/lemo'

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

const IDLE: LemoRecap = { status: 'idle', text: '', at: null }
// 小结放在会话状态里：mod 热重载不丢，面板读它会订阅，写好了自动重画
const recap = atom({ plugin: 'lemo-recap', key: 'recap' } as const, IDLE)

// 这个模块正在写一份小结：写的时候再按不重复开写。模块变量热重载后清零，
// 万一重载打断了正在写的那份、状态停在 busy，按「写小结」还能重新开始
let running = false
// 「全部关闭」按一次加一：排进定时器、还没开始写的那份，开始前看到它变了就不写（已经发出去的请求不收回）
let offGen = 0

// 能力清单的一行（类型从 lemo-core 的合约里取）
type Cap = Awaited<ReturnType<EngineInterface['lemo']['caps']>>[number]

// 安全页上的一行：「手动触发」，没有开关（on 总是 false）。不带风格味道（安全页要一眼看懂）
function recapCaps(): Cap[] {
  return [
    {
      mod: 'lemo-recap',
      id: 'recap',
      kind: 'cost',
      manual: true,
      on: false,
      title: { zh: STR.zh.cap.title, en: STR.en.cap.title },
      desc: { zh: STR.zh.cap.desc, en: STR.en.cap.desc },
    },
  ]
}

// 去掉控制字符（只留换行和制表）；模型偶尔不听话写长了，截一下
function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 4000)
}

// 13：基于当前会话另外问一次模型，不占对话轮次。
// fork 带着主线最后一次请求的系统提示词和对话记录，前面那段从提示缓存里取
async function writeRecap($: EngineInterface) {
  const lk = await look($)
  const S = STR[lk.lang]
  await update($, recap, (): LemoRecap => ({ status: 'busy', text: '', at: null }))
  let r: ModelForkResult
  try {
    r = await $.model.fork({ prompt: S.prompt })
  } catch (err) {
    // 按类型说明 fork 总会给结果、不会抛错；万一抛了也不要停在「生成中…」
    const at = await $.clock.now()
    const detail = err instanceof Error ? err.message : String(err)
    await update($, recap, (): LemoRecap => ({ status: 'error', text: detail, at, why: 'thrown' }))
    return
  }
  const at = await $.clock.now()
  if (r.isAnswered) {
    const text = tidy(r.text)
    if (text !== '') {
      await update($, recap, (): LemoRecap => ({ status: 'done', text, at }))
      await $.lemo.notice({ text: word(lk, 'lemo-recap.done', S.done), tone: 'ink' })
      await $.lemo.play({ sound: 'done' })
      return
    }
    await update($, recap, (): LemoRecap => ({ status: 'error', text: '', at, why: 'empty-reply' }))
    return
  }
  // 新会话还没有第一条回复、或者刚 /clear 过：没有东西可总结，模型也没被调用
  if (r.reason === 'nothing-to-fork') {
    await update($, recap, (): LemoRecap => ({ status: 'error', text: '', at, why: 'nothing' }))
    return
  }
  // 存原因的键和引擎给的原文，画的时候按当前语言拼（换了语言也跟着变）
  const why: LemoRecapWhy = r.reason
  const detail = r.reason === 'api-error' ? `${r.error}${r.status === null ? '' : ` ${r.status}`}` : ''
  await update($, recap, (): LemoRecap => ({ status: 'error', text: detail, at, why }))
}

/** 没写成时卡片上的那句话，按当前语言拼。旧版本存的是拼好的 text（没有 why），照样显示 */
function errorText(S: RecapStrings, r: LemoRecap): string {
  if (r.why === undefined) return r.text
  if (r.why === 'nothing') return S.nothing
  if (r.why === 'thrown') return fill(S.fail, { why: r.text })
  const why = r.text === '' ? S.why[r.why] : `${S.why[r.why]} ${r.text}`
  return fill(S.fail, { why })
}

// 放到定时器里跑：命令或按钮这次调用结束后，小结还要接着写（不然命令返回时可能被一起停掉）
function startRecap($: EngineInterface) {
  if (running) return
  running = true
  const gen = offGen
  $.clock.after(0, () => {
    if (gen !== offGen) {
      running = false
      return
    }
    void writeRecap($).finally(() => {
      running = false
    })
  })
}

// 一键复制小结（$.ui.copy），复制到按按钮的那个界面的剪贴板
async function copyRecap($: EngineInterface, surface: RenderSurface) {
  const r = await read($, recap)
  if (r.status !== 'done') return
  const lk = await look($)
  const S = STR[lk.lang]
  // 按钮里是 void 调用，抛错没人接；当成「被系统拒绝」，照样出提示
  const res = await $.ui.copy({ text: r.text, surface }).catch(() => ({ isCopied: false, reason: 'refused' }) as const)
  if (res.isCopied) await $.lemo.notice({ text: word(lk, 'lemo-recap.copied', S.copied), tone: 'ink' })
  else await $.lemo.notice({ text: fill(S.copyFail, { why: S.copyWhy[res.reason] }), tone: 'red' })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.lemo.join({
      mod: 'lemo-recap',
      // 会放音效：没装 lemo-sound 时，lemo-core 在「行为」页给出开关
      uses: ['sound'],
      title: { zh: STR.zh.join, en: STR.en.join },
      tabs: ['main'],
      commands: { zh: ['总结'], en: ['recap'] },
    })
    // 热重载会重新跑 session.start：状态（在宿主那里）还是「生成中…」，模块变量 running 却清零了，
    // 说明正在写的那份被重载打断了，不会再有结果。改成「生成失败（已中断）」，免得卡片一直停在撰写中
    const cur = await read($, recap)
    if (cur.status === 'busy' && !running) {
      const at = await $.clock.now()
      await update($, recap, (): LemoRecap => ({ status: 'error', text: '', at, why: 'aborted' }))
    }
    return next(e)
  })

  // ---------- 安全页：能力清单。只有「手动触发」的一行，没有开关 ----------
  on('lemo.caps', async ($, e, next) => {
    const r = await next(e)
    return { value: [...(r.value ?? []), ...recapCaps()] }
  })

  on('lemo.toggle', async ($, e, next) => (e.mod === 'lemo-recap' ? { value: false } : next(e)))

  // 「全部关闭」：没有开关要关；排着还没开始写的小结不写了
  on('lemo.off', async ($, e, next) => {
    offGen += 1
    return next(e)
  })

  // /lemo-mod 总结（recap）：开始写，打开面板「常用」页，回一句话。别的词交给里层
  on('lemo.command', async ($, e, next) => {
    const { word: w } = cmdWord(e.args)
    if (!WORDS.has(w)) return next(e)
    // 命令里的词不换界面语言：回复用当前语言
    const lk = await look($)
    startRecap($)
    await $.lemo.open({ tab: 'main' })
    return { value: { text: word(lk, 'lemo-recap.start', STR[lk.lang].start) } }
  })

  // 统一面板「常用」页的「小结」卡片。小结画成纯文字（plainLines：链接不能点，字色跟面板正文），写好后可以复制
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    if ((await hubTab($, e.surface)) !== 'main') return inner
    const lk = await look($, e.props)
    const S = STR[lk.lang]
    const r = await read($, recap)
    const el = $.ui.resolve(e)
    const { Box, Text } = el
    const body =
      r.status === 'idle'
        ? null
        : r.status === 'busy'
          ? <Text color={lk.c.ink}>{S.busy}</Text>
          : r.status === 'error'
            ? <Text color={lk.c.red}>{errorText(S, r)}</Text>
            : (
              <Box flexDirection="column" gap={1}>
                {plainLines(el, lk, e.surface, r.text, 'recap-text')}
                <Box flexDirection="row" gap={1} flexWrap="wrap">
                  <Button key="recap-copy" label={S.copy} {...sec(e.surface)} onPress={press => void copyRecap($, press.surface)} />
                </Box>
              </Box>
            )
    return hubWrap(el, lk, e.surface, inner, [
      {
        id: 'recap-card',
        title: word(lk, 'lemo-recap.title', S.title),
        desc: S.desc,
        buttons: <Button key="recap-write" label={r.status === 'done' ? S.again : S.write} variant="primary" onPress={() => startRecap($)} />,
        extra: body,
      },
    ])
  })
}
