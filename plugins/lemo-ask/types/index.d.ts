// lemo-ask 的状态合约：提问弹窗的抬头读它，读了会订阅，一改自动重画。

/** 安全页上「提问弹窗标题」开着吗（外观，装上就开） */
export type LemoAskLook = boolean

declare module 'claude-code' {
  interface PluginState {
    'lemo-ask': {
      /** 存进 $.store（键 look，全局记住），开会话时读回来 */
      lookOn: LemoAskLook
    }
  }
}
