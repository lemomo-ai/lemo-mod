// lemo-skin 的状态合约：每处换皮的画法都读它，读了会订阅，一改自动重画。

/** 安全页上「消息样式」开着吗（外观，装上就开） */
export type LemoSkinLook = boolean

declare module 'claude-code' {
  interface PluginState {
    'lemo-skin': {
      /** 存进 $.store（键 look，全局记住），开会话时读回来 */
      lookOn: LemoSkinLook
    }
  }
}
