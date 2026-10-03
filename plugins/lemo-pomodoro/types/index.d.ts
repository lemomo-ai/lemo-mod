// lemo-pomodoro 的状态合约（会话状态 $.state 的类型）。不 import 任何东西，自己就能独立成立。

/** 正在走的是哪种计时：专注，还是专注完的休息 */
export type LemoPomodoroKind = 'focus' | 'rest'

/** 正在走的计时：到点的时间（毫秒）和种类 */
export type LemoPomodoroTimer = { end: number; kind: LemoPomodoroKind }

declare module 'claude-code' {
  interface PluginState {
    'lemo-pomodoro': {
      /** 正在走的计时；没在计时是 null */
      timer: LemoPomodoroTimer | null
      /** 桌面上到点后等用户选「接下来」：刚结束的是哪种计时；不用选是 null */
      choice: LemoPomodoroKind | null
    }
  }
}
