// 测试用：检查终端画出来的东西在「终端底色和 Claude Code 主题对不上」时还看不看得清。
// 由 scripts/sync-shared.mjs 复制到每个 mod 的 tests/shared/test-colors.tsx，只在 shared/ 里改。
//
// 用户的终端可能是深色，Claude Code 的主题却是浅色（或者反过来）。所以：
// - 面板（Pane）停靠在对话旁边（placement dock）时底色是主题画的：里面的字都要设颜色（主题色、风格色或 dimColor），
//   不设就是终端自己的字色，可能和面板底一样浅
// - 面板内嵌在输入框上方（placement inline，窄窗口或不是全屏布局）时没有主题的底，和下一条一样算画在终端底色上
// - 别处（对话、横条、状态栏……）直接画在终端底色上：不能用主题的正文色 'text'（浅色主题下是黑的），用不设颜色（终端自己的字色）或风格色
// - 自己铺了底色的地方（标签、色块）：字色要写风格里的颜色（#RRGGBB），不能用主题色或不设
// 按钮、Markdown、输入框这些由引擎画，不在这里查。桌面不查（桌面画原生的）。
//
//   const ui = await mountChecked($, { ...HUB, surface: 'terminal' })
// 挂上去就查一遍，之后每次 find、press、advance……都再查一遍；有问题直接抛错，测试失败时写清是哪段字。
// 终端面板两种停法都查：照测试给的 placement 查一遍，再换成另一种重画、查一遍、换回来
//
// 桌面（以及手机、VS Code）上挂的是面板（Pane）时，另外查一件事：面板拿到、失去焦点各重画一次，
// 每个按钮的 handle 都不能变。桌面 App 按下鼠标时面板拿到焦点、重画一次，松开时发的是按下前的 handle；
// handle 变了这一下就丢了（第一下点击没反应）。面板里的按钮用 shared/lemo.tsx 的 steady 画就不会变

import type { RenderComponent, RenderSurface } from 'claude-code'
import type { MountTarget, Mounted } from 'claude-code/testing'

type Node = { type?: string; props?: Record<string, unknown>; children?: unknown[] }

const THEME_DARK_OR_LIGHT = new Set(['text', 'inverseText'])
const isHex = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)

/**
 * 查一棵画好的树，返回看不清的那些字（空数组就是没问题）。component 是挂的组件名，
 * Pane 停靠时按面板的规则查，内嵌（placement 是 inline）时按终端底色的规则查
 */
export function colorProblems(root: unknown, component: string, placement: 'dock' | 'inline' = 'dock'): string[] {
  const out: string[] = []
  const pane = component === 'Pane' && placement === 'dock'
  const walk = (n: unknown, fg: { color?: string; dim: boolean }, bg: string | null, inText: boolean): void => {
    if (typeof n === 'string') {
      if (!inText || n.trim() === '') return
      const where = `「${n.trim().slice(0, 30)}」`
      const now = fg.color ?? (fg.dim ? 'dimColor' : '没设')
      if (bg !== null) {
        if (!isHex(fg.color)) out.push(`${where} 画在自己铺的底色 ${bg} 上，字色要写风格里的颜色（现在是 ${now}）`)
      } else if (pane) {
        if (fg.color === undefined && !fg.dim) out.push(`${where} 在面板里没设字色：会用终端自己的字色，深色终端配浅色主题时和面板底一样浅`)
      } else if (fg.color !== undefined && THEME_DARK_OR_LIGHT.has(fg.color)) {
        const how = component === 'Pane' ? '面板内嵌时（窄窗口）没有主题的底，字直接画在终端底色上' : '直接画在终端底色上'
        out.push(`${where} ${how}，却用了主题的「${fg.color}」：深色终端配浅色主题时是黑字（面板里用 inkOf，别处用 bareInk）`)
      }
      return
    }
    if (typeof n !== 'object' || n === null || Array.isArray(n)) {
      if (Array.isArray(n)) for (const c of n) walk(c, fg, bg, inText)
      return
    }
    const e = n as Node
    // 只查自己画的 Box 和 Text；按钮、Markdown、输入框、图片、引擎自己那份都由引擎画
    if (e.type !== 'Box' && e.type !== 'Text') return
    const p = e.props ?? {}
    const nextBg = typeof p.backgroundColor === 'string' ? p.backgroundColor : bg
    const nextFg = e.type === 'Text' ? { color: typeof p.color === 'string' ? p.color : fg.color, dim: p.dimColor === true || fg.dim } : fg
    for (const c of e.children ?? []) walk(c, nextFg, nextBg, inText || e.type === 'Text')
  }
  walk(root, { dim: false }, null, false)
  return out
}

type Mounter = {
  ui: { mount: <P extends RenderSurface, C extends RenderComponent>(target: MountTarget<P, C>) => Promise<Mounted<P, C>> }
}

/** 一棵画好的树里每个按钮的 handle，按「插件/key」记（按钮的处理函数在 press 里，跟着元素走） */
export function buttonHandles(root: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  const walk = (n: unknown): void => {
    if (Array.isArray(n)) {
      for (const c of n) walk(c)
      return
    }
    if (typeof n !== 'object' || n === null) return
    const e = n as Node & { press?: { plugin?: unknown; handle?: unknown } }
    if (e.type === 'Button' && typeof e.press?.handle === 'number') out[`${String(e.press.plugin)}/${String(e.props?.key)}`] = e.press.handle
    for (const c of e.children ?? []) walk(c)
  }
  walk(root)
  return out
}

/** 和 $.ui.mount 一样，另外在终端上查颜色、在桌面面板上查焦点重画后按钮 handle 不变（见文件开头） */
export async function mountChecked<P extends RenderSurface, C extends RenderComponent>($: Mounter, target: MountTarget<P, C>): Promise<Mounted<P, C>> {
  const ui = await $.ui.mount(target)
  const isTerm = (target.surface as string) === 'terminal'
  const isPane = (target.component as string) === 'Pane'
  if (!isTerm && !isPane) return ui
  const drawn = (ui as unknown as { drawn: () => Promise<unknown> }).drawn
  const redraw = (ui as unknown as { redraw: (props?: unknown) => Promise<void> }).redraw
  const read = async (): Promise<unknown> => {
    try {
      return await drawn()
    } catch {
      // 界面拒绝画这棵树：交给测试自己判断
      return undefined
    }
  }
  // 测试自己 redraw 换过 props 时跟着记，焦点检查照最新的 props 切换 isFocused，颜色检查照它换 placement
  let props = (target as unknown as { props: { isFocused?: boolean; placement?: 'dock' | 'inline' } }).props
  const colorOnce = async (placement: 'dock' | 'inline') => {
    const tree = await read()
    if (tree === undefined) return
    const probs = colorProblems(tree, target.component as string, placement)
    const where = isPane ? `，面板${placement === 'inline' ? '内嵌' : '停靠'}` : ''
    if (probs.length > 0) throw new Error(`颜色检查没过（${String(target.plugin)} ${String(target.component)}，终端${where}）：\n${probs.join('\n')}`)
  }
  const colorAudit = async () => {
    const at = props.placement === 'inline' ? 'inline' : 'dock'
    await colorOnce(at)
    if (!isPane) return
    // 面板换到另一种停法重画一次再查，查完换回测试给的 props
    const other = at === 'inline' ? 'dock' : 'inline'
    await redraw.call(ui, { ...props, placement: other })
    try {
      await colorOnce(other)
    } finally {
      await redraw.call(ui, props)
    }
  }
  const focusAudit = async () => {
    const tree = await read()
    if (tree === undefined) return
    const before = buttonHandles(tree)
    await redraw.call(ui, { ...props, isFocused: props.isFocused !== true })
    const flipped = buttonHandles(await read())
    await redraw.call(ui, props)
    const back = buttonHandles(await read())
    const moved = Object.keys(before).filter(k => (k in flipped && flipped[k] !== before[k]) || (k in back && back[k] !== before[k]))
    if (moved.length > 0) {
      throw new Error(`桌面面板拿到、失去焦点重画后，这些按钮换了 handle（${String(target.surface)}）：${moved.join('、')}。面板里的按钮要用 shared/lemo.tsx 的 steady 画，不然桌面上第一下点击会丢`)
    }
  }
  const audit = isTerm ? colorAudit : focusAudit
  await audit()
  // 测试拿到的对象是冻住的，不能用 Proxy 换掉它的方法：照着抄一份，每个动作做完再查一遍
  const out: Record<string, unknown> = {}
  for (let o: object | null = ui; o !== null && o !== Object.prototype; o = Object.getPrototypeOf(o) as object | null) {
    for (const key of Object.getOwnPropertyNames(o)) {
      if (key === 'constructor' || key in out) continue
      const v = (ui as unknown as Record<string, unknown>)[key]
      if (typeof v !== 'function') out[key] = v
      else if (key === 'unmount' || key === 'drawn') out[key] = (v as (...xs: unknown[]) => unknown).bind(ui)
      // 焦点检查要重画两次，只在会改变画面的动作后做；find 这类只读的不做
      else if (!isTerm && (key === 'find' || key === 'findAll')) out[key] = (v as (...xs: unknown[]) => unknown).bind(ui)
      else {
        out[key] = async (...xs: unknown[]) => {
          const r = await (v as (...ys: unknown[]) => Promise<unknown>).apply(ui, xs)
          if (key === 'redraw' && xs[0] !== undefined) props = xs[0] as typeof props
          await audit()
          return r
        }
      }
    }
  }
  return out as unknown as Mounted<P, C>
}
