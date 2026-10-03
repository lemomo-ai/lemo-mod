// 测试用的「假 lemo-core」：每个 lemo mod 的测试把它当成内联插件一起加载，
//   test('…', { plugins: [testCore] }, async ($, on) => { … })
// 这样 mod 调 $.lemo.xxx 有人接。只在仓库的 shared/ 里改，然后跑 node scripts/sync-shared.mjs。
//
// 内联插件的 register 不能用到这个文件里别的东西（引擎把它当成独立的插件加载），所以数据都写在函数里面。
// 想看 mod 调了哪些方法，用下面的 lemoCalls($)。要换界面语言，用 testSay($, 'say hi')（当成用户发了这条消息）。
// 统一面板默认显示「常用」页；要看别的页，先 await $.command.run({ command: 'lemo-mod', args: '后台' } as never)。
// notice、badge、set、tag 和真核心一样写进 lemo-core 的状态；seq、numbers 这些编号它不记，要用就在测试里
// 挂 on('state.get', { plugin: 'lemo-core', key: 'seq' }, async () => ({ value: { value: 3, version: 1 } }))。
// 它不画面板、也不答引擎的事件：测试自己用 engineBottom(on) 替引擎答最底层（见下面）。

import type { On, PluginState } from 'claude-code'
import type { Plugin } from 'claude-code/testing'

type Badge = PluginState['lemo-core']['badges'][number]
type Tone = Badge['tone']

export const testCore: Plugin = {
  name: 'lemo-core',
  register(on) {
    const style = {
      id: 'lemon-lab',
      name: { zh: '柠檬实验室', en: 'Lemo Lab' },
      colors: {
        ink: '#6F8FE0', grid: '#7FA3CC', pencil: '#8A9099', accent: '#F2CF1D', onAccent: '#1B1D1F', red: '#E0524A',
        inkDark: '#2F4F96', chip: '#E9EFFA', bubble: '#8FB3D9', bubbleAccent: '#E2B714',
        cardFillLight: '#FFFBEA', cardFillDark: '#262A31', deskCardFill: '#F7F9FC', deskCardBorder: '#E4ECF6',
      },
      bubbles: ['°', '∘ °', '○'],
      sprite: { palette: { w: '#8FB3D9', l: '#F2CF1D' }, frames: [['.ww.', 'wllw'], ['.ww.', 'wlow']] },
      motif: 'flask' as const,
      icon: null,
      sounds: { tick: 'tick.wav', done: 'done.wav', deny: 'deny.wav' },
      voices: { zh: [], en: [] },
      words: {},
    }
    let lang: 'zh' | 'en' = 'zh'
    // mod 调过的 $.lemo 方法按顺序记在这里，测试用 lemoCalls($) 取回
    const calls: { op: string; input: unknown }[] = []
    on('command.run', { command: 'lemo-test-calls' }, async () => ({ text: JSON.stringify(calls) }))
    // 模拟用户发了一条普通消息：和真核心一样，按这段文字换界面语言（/lemo-mod 后面的词不换语言）。
    // 判断规则和真核心的 detectLang 一样（plugins/lemo-core/hooks/i18n.ts）：路径、网址、参数、反引号里的代码不算
    on('command.run', { command: 'lemo-test-say' }, async ($, e) => {
      const plain = e.args.replace(/`[^`]*`/g, ' ').replace(/\S*[/\\.@:]\S*/g, ' ').replace(/(^|\s)-\S*/g, ' ')
      const cjk = (plain.match(/[㐀-鿿豈-﫿]/g) ?? []).length
      const latin = (plain.match(/[A-Za-z]/g) ?? []).length
      if (cjk === 0 && latin === 0) return {}
      const found = cjk >= 3 || cjk * 3 >= latin ? 'zh' : 'en'
      if (found !== lang) {
        lang = found
        await $.state.set({ plugin: 'lemo-core', key: 'lang' }, found)
      }
      return {}
    })
    on('engine.create', async (_$, e, next) => {
      const $b = await next(e)
      const lemo = {
        style: async () => style,
        lang: async () => lang,
        join: async () => undefined,
        open: async ({ tab }: { tab?: 'safe' | 'main' | 'behave' | 'bg' | 'game' }) => {
          if (tab !== undefined) await $b.state.set({ plugin: 'lemo-core', key: 'tab' }, tab)
        },
        play: async () => undefined,
        say: async () => undefined,
        // 下面几个和真的 lemo-core 一样写进状态，读这些状态的 mod（横条、开关按钮）在测试里能看到效果
        notice: async ({ text, tone, ms }: { text: string; tone: Tone; ms?: number }) => {
          await $b.state.set({ plugin: 'lemo-core', key: 'notice' }, { text, tone, until: (await $b.clock.now()) + (ms ?? 5000) })
        },
        badge: async (b: Badge) => {
          const cur = (await $b.state.get({ plugin: 'lemo-core', key: 'badges' })).value ?? []
          const rest = cur.filter(x => x.id !== b.id)
          await $b.state.set({ plugin: 'lemo-core', key: 'badges' }, b.text === null ? rest : [...rest, b])
        },
        set: async (o: { muted?: boolean; speech?: boolean; unfold?: boolean }) => {
          if (o.muted !== undefined) await $b.state.set({ plugin: 'lemo-core', key: 'muted' }, o.muted)
          if (o.speech !== undefined) await $b.state.set({ plugin: 'lemo-core', key: 'speech' }, o.speech)
          if (o.unfold !== undefined) await $b.state.set({ plugin: 'lemo-core', key: 'unfold' }, o.unfold)
        },
        tag: async ({ n, kind }: { n: number; kind: string }) => {
          const cur = (await $b.state.get({ plugin: 'lemo-core', key: 'tags' })).value ?? {}
          await $b.state.set({ plugin: 'lemo-core', key: 'tags' }, { ...cur, [String(n)]: kind })
        },
        // 和真核心一样：走到这里就是各 mod 都不认这个词；存下来的编号假核心没有
        command: async () => null,
        recall: async () => null,
        // 能力清单、安全页的开关、「全部关闭」：各 mod 挂 on('lemo.caps' / 'lemo.toggle' / 'lemo.off')，走到这里就是到底了
        caps: async () => [] as never[],
        toggle: async () => false,
        off: async () => undefined,
      }
      // 每个方法外面包一层记录（style、lang 这类读取也记，测试按 op 过滤）
      const logged = Object.fromEntries(
        Object.entries(lemo).map(([op, fn]) => [op, async (input: never) => {
          calls.push({ op, input })
          return (fn as (i: never) => Promise<unknown>)(input)
        }]),
      ) as typeof lemo
      return { ...$b, lemo: logged }
    })
    // 切换统一面板的分页：测试里 await $.command.run({ command: 'lemo-mod', args: '后台' } as never)。
    // 和真核心一样先用 $.lemo.command 问各 mod（它们挂 on('lemo.command')），认的词它们处理，不认的才到下面
    on('command.run', { command: 'lemo-mod' }, async ($, e) => {
      const answer = await $.lemo.command({ args: e.args })
      if (answer !== null) return answer.text === undefined ? {} : { text: answer.text }
      const w = e.args.trim().split(/\s+/)[0] ?? ''
      const tab = ({ 安全: 'safe', safety: 'safe', 常用: 'main', main: 'main', 行为: 'behave', behave: 'behave', 后台: 'bg', bg: 'bg', 游戏: 'game', game: 'game' } as const)[w as '常用']
      if (tab !== undefined) await $.state.set({ plugin: 'lemo-core', key: 'tab' }, tab)
      return {}
    })
  },
}

/**
 * 测试里替引擎答最底层。假核心和要测的 mod 都调 next(e) 往下问，测试里没有真引擎，
 * 不答就报「no implementation」。画东西的事件一律答「引擎原样」，几个生命周期事件给最简单的答复。
 * 测试想换某一处的答复，在调这个之前先挂自己的 on(...)（同一层先挂的在外层）。
 */
export function engineBottom(on: On): void {
  on('ui.render', async () => ({ type: 'engine', ref: 0 }) as const)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  on('turn.complete', async () => ({ text: '' }))
}

/**
 * 取回 mod 调过的 $.lemo 方法（按顺序），比如
 *   expect((await lemoCalls($)).filter(c => c.op === 'notice')).toEqual([{ op: 'notice', input: { text: '…', tone: 'red' } }])
 */
export async function lemoCalls($: { command: { run: (e: never) => Promise<unknown> } }): Promise<{ op: string; input: unknown }[]> {
  const r = (await $.command.run({ command: 'lemo-test-calls', args: '' } as never)) as { text?: string }
  return JSON.parse(r.text ?? '[]') as { op: string; input: unknown }[]
}

/**
 * 当成用户发了一条普通消息，界面语言跟着它换（和真核心一样；/lemo-mod 后面的词不换语言），比如
 *   await testSay($, 'say hi in one word')   // 换成英文
 */
export async function testSay($: { command: { run: (e: never) => Promise<unknown> } }, text: string): Promise<void> {
  await $.command.run({ command: 'lemo-test-say', args: text } as never)
}
