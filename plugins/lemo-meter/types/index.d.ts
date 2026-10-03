// lemo-meter 的状态合约：横条、状态栏和面板卡片读这些值，读了会订阅，一改自动重画。

/** 这次会话的用量：上下文占了多少、五小时额度用了多少、花了多少钱。读不到的是 null */
export type LemoMeterUsage = { ctx: number | null; quota: number | null; usd: number | null }

/** 联网查新版本的结果。文字在画的时候按当前语言拼，所以这里只存数据 */
export type LemoMeterLatest = {
  status: 'idle' | 'busy' | 'done' | 'error'
  /** npm 上的最新版本 */
  newest: string
  /** 正在用的版本 */
  mine: string
  isNewer: boolean
  /** 没查到的原因 */
  why: string
}

declare module 'claude-code' {
  interface PluginState {
    'lemo-meter': {
      usage: LemoMeterUsage
      /** 每轮结束记一次上下文百分比，只留最近 24 个，画走势用 */
      history: readonly number[]
      /** 当前 git 分支（读 .git/HEAD，不跑 git），不是 git 仓库时为 null */
      branch: string | null
      latest: LemoMeterLatest
      /** 横条开着吗（安全页的开关，外观，默认开；存进 $.store 全局记住，开会话时读回来） */
      bandOn: boolean
      /** 用户按过的状态栏开关；没按过是 null，照 lemo-core 的扫描：用户自己设了状态栏就不开 */
      statusPref: boolean | null
    }
  }
}
