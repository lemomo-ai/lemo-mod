// lemo-todo 的状态合约：这个会话里的笔记（界面读它，一改就重画）。
// 笔记本身存在 $.store（换个会话还在），会话开始时读进来。

/** 一条笔记：什么时候记的（毫秒）、写了什么 */
export type LemoTodoNote = { at: number; text: string }

declare module 'claude-code' {
  interface PluginState {
    'lemo-todo': {
      notes: readonly LemoTodoNote[]
      /** 自动摘要：压缩上下文后用 Haiku 把摘要缩成一句存进笔记。值存在 $.store（全局记住），装上时关着 */
      compactOn: boolean
    }
  }
}
