// lemo-watch 的状态合约。

/** 一个在等的提醒：什么时候到点（毫秒）、当初定的是几秒（提醒文字里要说「N 秒到了」） */
export type LemoWatchRemind = { at: number; sec: number }

declare module 'claude-code' {
  interface PluginState {
    'lemo-watch': {
      /** 在等的提醒；没有是 null。放在会话状态里：热重载后还在，卡片读它会订阅 */
      remind: LemoWatchRemind | null
    }
  }
}
