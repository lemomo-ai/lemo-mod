// lemo-recap 的状态合约。小结只记在这个会话的状态里（不进 $.store）：换个会话就是另一段对话，旧小结没有意义

/** 小结写到哪一步：还没写、正在写、写好了、没写成 */
export type LemoRecapStatus = 'idle' | 'busy' | 'done' | 'error'

/**
 * 一份小结。at 是写好（或失败）的时间，毫秒。
 * status 为 error 时：why 是原因的键（nothing 还没有对话可总结、empty-reply、aborted、api-error、thrown），
 * text 是引擎给的原文细节（可能为空）。画的时候再按当前语言拼成一句，换了语言也跟着变
 */
export type LemoRecap = { status: LemoRecapStatus; text: string; at: number | null; why?: LemoRecapWhy }

export type LemoRecapWhy = 'nothing' | 'empty-reply' | 'aborted' | 'api-error' | 'thrown'

declare module 'claude-code' {
  interface PluginState {
    'lemo-recap': { recap: LemoRecap }
  }
}
