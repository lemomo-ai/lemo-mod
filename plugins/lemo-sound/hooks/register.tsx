// lemo-sound：音效。调工具时响一声（柠檬实验室叫「嗒」），主对话一轮完成时响一声（「啵叮」）。
// 统一面板「常用」页一张卡片：声音开关（就是 lemo-core 的静音）和三个试听按钮。
// - 声音文件在风格包里，一律走 $.lemo.play；静音时 lemo-core 不放，试听带 preview: true 照样放
// - 静音状态归 lemo-core 管：这里用 $.lemo.set({ muted }) 改，读 lemo-core 的 muted 状态决定按钮文字。
//   装上时是静音的（除了外观都默认关），安全页「声音 · 提示音」那一行和这张卡片的按钮改的是同一个值，
//   所以这个 mod 不再往能力清单里加行
// - 「划掉」（停下）由别的 mod 放（lemo-guard 限时停下一轮时），这里只做试听；朗读和朗读试听归 lemo-voice，朗读有自己的开关

import type { EngineInterface, Register } from 'claude-code'

import { HUB, cmdWord, fill, hubWrap, sec, steady, word } from './shared/lemo'
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

// lemo-core 的静音开关（校验规定：状态的引用要写在用它的文件里）。读它会订阅，静音一改，按钮文字和说明自动跟着变
const MutedRef = { plugin: 'lemo-core', key: 'muted' } as const

type Sound = 'tick' | 'done' | 'deny'

// 调工具的声音放轻一点（0.7）：一轮里会响很多次，试听也用同样的音量
const GAIN: Readonly<Record<Sound, number>> = { tick: 0.7, done: 1, deny: 1 }

/** 现在是不是静音。lemo-core 在 session.start 里先写一遍，还没写时照它的默认：静音（装上时声音是关的） */
async function isMuted($: EngineInterface): Promise<boolean> {
  return (await $.state.get(MutedRef)).value ?? true
}

/** 切换静音（卡片上的按钮），返回切换后是不是静音 */
async function toggleMute($: EngineInterface): Promise<boolean> {
  const v = !(await isMuted($))
  await $.lemo.set({ muted: v })
  return v
}

/** 试听：用户自己点的，静音时也照样放 */
async function hear($: EngineInterface, sound: Sound) {
  await $.lemo.play({ sound, gain: GAIN[sound], preview: true })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // 不写 always：放音效不是外观，装上时是关的，列在安全页 lemo-core 的「提示音」那一行
    await $.lemo.join({
      mod: 'lemo-sound',
      title: { zh: STR.zh.name, en: STR.en.name },
      tabs: ['main'],
      commands: { zh: [STR.zh.cmd.mute, STR.zh.cmd.unmute], en: [STR.en.cmd.mute, STR.en.cmd.unmute] },
    })
    return next(e)
  })

  // 每次调工具响一声（声音关着时 lemo-core 不放），调用本身原样交给里层。
  // 不带 matcher：一个 mod 只能有一个不带 matcher 的 tool.call，这个 mod 也只在这里做这一件事。
  //
  // 「嗒」在 next(e) 之前放，所以会不会和别的 mod 的声音连着响，取决于插件谁在外层：
  //   - lemo-lot 抽签时放「完成」，直接给结果、不调 next。它在外层时走不到这里，只响那一声；
  //     lemo-sound 在外层时会先「嗒」一下，紧接着再响抽签那一声。
  //   - 目前 lot 在外层，所以只响一声。插件顺序不是我们定的，以后变了就会连响两声。
  // 取舍：放到 next 之后「嗒」要等命令跑完才响（一条 Bash 跑一分钟就晚一分钟），
  // 那就不是「开始调工具」的提示了。连响两声只在抽签时发生，接受
  on('tool.call', async ($, e, next) => {
    await $.lemo.play({ sound: 'tick', gain: GAIN.tick })
    return next(e)
  })

  // 一轮完成响一声：只算主对话（子 agent 的一轮 e.agentId 有值）、正常答完的。
  // 用户按停止中断的、接口出错、拒答结束的不响（出错不该听着像「完成」）
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId === undefined && e.reason === 'answer') await $.lemo.play({ sound: 'done', gain: GAIN.done })
    return r
  })

  // /lemo-mod 静音（mute）只关，/lemo-mod 声音（sound）只开。不做切换：装上时就是静音，
  // 切换的话第一次输入「静音」反而把声音打开了。别的词交给里层
  on('lemo.command', async ($, e, next) => {
    const { word: w } = cmdWord(e.args)
    const mute = w === STR.zh.cmd.mute || w === STR.en.cmd.mute
    // 「取消静音 / unmute」也认：用户很自然会这么输入（Claude Code 也会把它猜成下一句）
    if (!mute && w !== STR.zh.cmd.unmute && w !== STR.en.cmd.unmute && w !== '取消静音' && w !== 'unmute') return next(e)
    await $.lemo.set({ muted: mute })
    // 命令里的词不换界面语言：回复用当前语言
    const S = STR[await $.lemo.lang({})]
    return { value: { text: mute ? S.cmd.muted : S.cmd.unmuted } }
  })

  // 统一面板「常用」页：声音卡片。开关按钮在标题行右边（装上时是关的：按钮写「打开」），三个试听按钮在下面一行
  on('ui.render', { component: 'Pane', requestId: HUB }, async ($, e, next) => {
    // 面板按钮用 steady：桌面上面板拿到焦点会再画一次，按钮还是同一个，第一下点击不丢（见 shared/lemo.tsx）。
    // 每次画都先调它，这次不画按钮也调：下一次画才知道哪些按钮上一次画过
    const Button = steady($.ui.resolve(e).Button, e.surface)
    const inner = await next(e)
    if ((await hubTab($, e.surface)) !== 'main') return inner
    const lk = await look($, e.props)
    const muted = await isMuted($)
    const el = $.ui.resolve(e)
    const { Box } = el
    const S = STR[lk.lang]
    const desc = word(lk, 'lemo-sound.desc', S.desc)
    return hubWrap(el, lk, e.surface, inner, [
      {
        id: 'sound-main',
        title: word(lk, 'lemo-sound.title', S.title),
        // 风格的说明多以句号结尾，接「 · 已关闭…」前去掉
        desc: muted ? fill(S.mutedDesc, { desc: desc.replace(/[。.]\s*$/, '') }) : desc,
        buttons: <Button key="sound-mute" label={muted ? S.off : S.on} {...sec(e.surface)} onPress={() => toggleMute($)} />,
        extra: (
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            <Button key="sound-tick" label={word(lk, 'lemo-sound.tick', S.tick)} {...sec(e.surface)} onPress={() => hear($, 'tick')} />
            <Button key="sound-done" label={word(lk, 'lemo-sound.done', S.done)} {...sec(e.surface)} onPress={() => hear($, 'done')} />
            <Button key="sound-deny" label={word(lk, 'lemo-sound.deny', S.deny)} {...sec(e.surface)} onPress={() => hear($, 'deny')} />
          </Box>
        ),
      },
    ])
  })
}
