// lemo-spinner 的状态合约：加载词读它，读了会订阅，一改自动重画。

/** 用户在安全页按过的「加载词」开关；没按过是 null，照 lemo-core 的扫描：用户自己设了 spinnerVerbs 就不换 */
export type LemoSpinnerPref = boolean | null

declare module 'claude-code' {
  interface PluginState {
    'lemo-spinner': {
      /** 存进 $.store（键 words，全局记住），开会话时读回来 */
      pref: LemoSpinnerPref
    }
  }
}
