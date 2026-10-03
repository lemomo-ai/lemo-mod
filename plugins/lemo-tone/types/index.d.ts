// lemo-tone 的状态合约：三个开关。简短模式、口吻存进 $.store（全局记住，换个会话、换个项目都还在），
// 会话开始时读回来；装上时都关着。voiceOff 只在这个会话里。
// 校验器按字面读 PluginState 里的键，所以键要直接写在 'lemo-tone' 下面，不能换成一个类型名

/** 一个开关：true 是打开 */
export type LemoToneSwitch = boolean

declare module 'claude-code' {
  interface PluginState {
    'lemo-tone': {
      /** 简短模式：每条消息请 Claude 三句话内回答 */
      brief: LemoToneSwitch
      /** 口吻：每条回复开头一行说看了什么，结尾一行写结论 */
      voice: LemoToneSwitch
      /** 刚关掉口吻：下一条消息附一句「已经关了」，附过就清掉 */
      voiceOff: LemoToneSwitch
    }
  }
}
