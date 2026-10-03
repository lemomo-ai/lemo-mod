// lemo-assistant 的状态合约（$.state 的类型）。

/**
 * 助手这一趟的状态：idle 还没派过，busy 在干活，done 交回了报告，error 没派出去或没交回内容。
 * text 是报告正文，或者出错时显示的那句话；agentId 是派出去的子 agent 的 id，等它交回时靠它对上号
 */
export type LemoAssistantHelper = { status: 'idle' | 'busy' | 'done' | 'error'; text: string; agentId: string | null; error?: LemoAssistantError }

/**
 * 出错时的原因，画的时候再按当前语言拼成一句（存成拼好的话，换了语言还是旧语言）。
 * kind：fail 没派出去，empty 跑完了没交回内容；why：auto（自动模式的审核没放行）、no-start（什么也没启动），
 * 或者引擎给的原文（截短）；filled：总是 false，派不出去时不把请求填进输入框（会盖掉草稿）
 */
export type LemoAssistantError = { kind: 'fail' | 'empty'; why: string; filled: boolean }

declare module 'claude-code' {
  interface PluginState {
    'lemo-assistant': {
      helper: LemoAssistantHelper
      /** Claude 能不能派它（agent.offer）；关着时只有面板能派。值存在 $.store（全局记住），装上时关着 */
      offer: boolean
    }
  }
}
