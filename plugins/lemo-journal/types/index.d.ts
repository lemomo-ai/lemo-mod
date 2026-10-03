// lemo-journal 的状态合约。两个开关的值存在 $.store（全局记住，换个会话还在），会话状态里放一份，面板读它，一改自动重画。
// 装上时两个开关都是关的

/** 日志文件最近几行（面板「日志」卡片显示的） */
export type LemoJournalTail = readonly string[]

declare module 'claude-code' {
  interface PluginState {
    'lemo-journal': {
      tail: LemoJournalTail
      /** 每轮结束往 ~/.claude/lemo-mod/journal.md 记一行（默认关） */
      logOn: boolean
      /** 给每条消息自动贴标签，每条多调一次小模型（默认关） */
      classifyOn: boolean
    }
  }
}
