// lemo-guard 的状态合约。

/** 超时自动停（限时）的选项：不停，或者几秒（存进 $.store 的就是这个值；没存过是不停） */
export type LemoGuardTimeout = 'off' | '30' | '120' | '300'

declare module 'claude-code' {
  interface PluginState {
    'lemo-guard': {
      /**
       * 「超时自动停」选过几次（「行为」页的卡片、安全页的开关、「全部关闭」都算）。值本身不用：选项存在 $.store
       * （所有会话共用），面板读它只是为了订阅——这个会话里一选，面板就重画
       */
      picks: number
    }
  }
}
