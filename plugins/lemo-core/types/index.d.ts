// lemo-core 的类型合约：其他 lemo mod 在 plugin.json 里依赖 lemo-core，引擎会把这个文件放进它们的
// .claude-plugin/types/lemo-core/，于是 $.lemo 和 lemo-core 的状态在它们那边也有类型。
// 这个文件不 import 任何东西，自己就能独立成立。

/** 界面语言：跟着用户最近一条消息走 */
export type LemoLang = 'zh' | 'en'

/** 一段跟着语言变的文字。数组用在一组随机挑的文字上（加载词、签文） */
export type LemoText = { zh: string | readonly string[]; en: string | readonly string[] }

/** 提示条和横条胶囊的颜色：红是拦截出错，accent 是风格强调色（柠檬实验室是柠檬黄），ink 是普通，grey 是次要 */
export type LemoTone = 'red' | 'accent' | 'ink' | 'grey'

/** 统一面板 /lemo-mod 的分页。safe 是「安全」页：每个 mod 会做的事和开关都列在这里 */
export type LemoTab = 'safe' | 'main' | 'behave' | 'bg' | 'game'

/**
 * 安全页上的分类：外观（只改画面）、音效、朗读、写文件、额外用量（多调模型）、附加提示（往发给 Claude 的内容里加话）、
 * 新增工具（给 Claude 多一个工具）、代你操作（替你发消息、停下一轮）、联网
 */
export type LemoCapKind = 'look' | 'sound' | 'speech' | 'file' | 'cost' | 'prompt' | 'tool' | 'act' | 'net'

/**
 * 能力清单的一行：一个 mod 会做的一件事。安全页照这张清单画。
 * 规矩：除了外观（look），装上时 on 都是 false；manual 的只在用户点了、输入了命令才做，没有开关
 */
export type LemoCap = {
  /** 哪个 mod 的，比如 lemo-journal */
  mod: string
  /** mod 里的 id，$.lemo.toggle 按 mod + id 找到它 */
  id: string
  kind: LemoCapKind
  title: { zh: string; en: string }
  /** 一句话：会做什么，碰到什么（写哪个文件、花什么模型的钱） */
  desc: { zh: string; en: string }
  /** 现在开没开；manual 的总是 false */
  on: boolean
  /** 只在用户点了按钮、输入了命令才做（总结、提醒、番茄钟……），安全页只列出来，没有开关 */
  manual?: boolean
  /** 能试听（声音、朗读）：安全页给「试听」按钮，按下是 $.lemo.toggle({ mod, id, preview: true }) */
  preview?: boolean
}

/**
 * 装上后读一遍用户自己的设置（$.settings.read()，用户、项目、本地、组织各层合起来），只看这几项、不存、不发出去。
 * 和 mod 的功能重叠的，mod 那边默认不开（照用户自己的配置来）
 */
export type LemoScan = {
  /** 用户自己设了状态栏（statusLine）：lemo-meter 的状态栏默认不开 */
  statusLine: boolean
  /** 用户自己设了转圈文字（spinnerVerbs）：lemo-spinner 默认不开 */
  spinnerVerbs: boolean
  /** 用户的通知方式（preferredNotifChannel），没设是 null */
  notif: string | null
  /** 用户的输出风格（outputStyle），没设是 null */
  outputStyle: string | null
  /** /config 里的主题原值（light、dark-daltonized……），读不到是 null。桌面上读到什么，安全页照实写出来 */
  theme: string | null
}

/** 风格里自带的三种音效 */
export type LemoSound = 'tick' | 'done' | 'deny'

/** Claude Code 的主题是浅色还是深色；认不出（比如跟随系统）是 null */
export type LemoTheme = 'light' | 'dark' | null

/**
 * 一个风格：一包数据。功能代码只读这里的值，不写死颜色和带风格味道的文字。
 * 换风格 = 换一包数据。
 */
export type LemoStyle = {
  /** 风格的 id，比如 lemon-lab、plain */
  id: string
  /** 风格的名字，面板头部和风格选择里显示 */
  name: { zh: string; en: string }
  colors: {
    /** 主色：标题、编号、进行中 */
    ink: string
    /** 线条、分隔、路径 */
    grid: string
    /** 次要文字、时间 */
    pencil: string
    /** 强调色：只做底色（浅色终端上黄字看不清）。终端面板卡片左边的竖条也是它 */
    accent: string
    /** 强调色底上的字 */
    onAccent: string
    /** 出错、拦截 */
    red: string
    /** 桌面上的深色字：路径、标题 */
    inkDark: string
    /** 桌面上路径小标签的底色 */
    chip: string
    /** 面板头部的气泡 */
    bubble: string
    /** 强调色的气泡；深色主题下终端卡片左边的竖条用它（比 accent 暗一点） */
    bubbleAccent: string
    /** 浅色卡片底色（桌面上命令回复的卡片用浅色那个）。终端卡片不铺底色（柠檬书脊），深色那个暂时没用到 */
    cardFillLight: string
    cardFillDark: string
    /** 桌面卡片底色和边框 */
    deskCardFill: string
    deskCardBorder: string
  }
  /** 面板头部的小点缀（气泡）；空数组表示不加。卡片标题后面不加 */
  bubbles: readonly string[]
  /** 终端横条左边的像素小画：调色板（字符 → 颜色）和几帧，每帧若干行，每行一样长；没有就是 null */
  sprite: { palette: Readonly<Record<string, string>>; frames: readonly (readonly string[])[] } | null
  /**
   * 桌面横条的主题图案（meter 按它画）：flask 是柠檬实验室的烧瓶（专门画的，带冒泡动画），
   * sprite 是把上面的像素小画放大画上去（几帧轮流），none 是不画
   */
  motif: 'flask' | 'sprite' | 'none'
  /** 面板头部的图标（终端用真图片），lemo-core 里的文件路径；没有就是 null */
  icon: string | null
  /** 音效文件，lemo-core 里的路径 */
  sounds: Readonly<Record<LemoSound, string>>
  /** 朗读用的系统语音，按顺序试，没装的跳过；空数组用系统默认语音 */
  voices: { zh: readonly string[]; en: readonly string[] }
  /**
   * 带风格味道的文字，键是「mod 名.键」，比如 lemo-todo.title。
   * mod 找不到就用自己的默认文字。文字里的 {n}、{name} 这类占位符由 mod 自己替换
   */
  words: Readonly<Record<string, LemoText>>
}

/** 一个 lemo mod 向 lemo-core 报到：面板里显示在哪一页、哪些界面能用、装上就生效的事 */
export type LemoModInfo = {
  /** 插件名，比如 lemo-todo */
  mod: string
  /** 显示名 */
  title: { zh: string; en: string }
  /** 卡片在哪些分页（没有卡片就是空数组） */
  tabs: readonly LemoTab[]
  /** 在哪些界面上有卡片；省略表示所有界面 */
  surfaces?: readonly string[]
  /** 装上就有的外观（安全页上能关），列在面板「已装的 mod」里。会做事的不写在这里，写进能力清单 */
  always?: { zh: readonly string[]; en: readonly string[] }
  /** 这个 mod 在 /lemo-mod 后面认的词，比如「番茄 25」，拼进命令提示 */
  commands?: { zh: readonly string[]; en: readonly string[] }
  /**
   * 这个 mod 会放音效（sound）、会朗读（speech）。没装 lemo-sound、lemo-voice 时，
   * lemo-core 在「行为」页给出静音、朗读开关，免得单装这个 mod 的人关不掉
   */
  uses?: readonly ('sound' | 'speech')[]
}

/** 面板和横条上的一个小胶囊（番茄倒计时、提醒、简短模式……）。text 为 null 表示去掉 */
export type LemoBadge = {
  id: string
  /**
   * 胶囊上的字，null 是去掉。最好中英各给一份：画横条的 mod 按当前语言挑，
   * 计时中途换了语言胶囊也跟着变（只给一段文字就一直是那段）
   */
  text: string | { zh: string; en: string } | null
  tone: LemoTone
  /** 倒计时的结束时间（毫秒）；有它就在文字后面显示剩余时间 */
  endsAt?: number | null
}

/** 横条上的一条提示，until 之后自动消失 */
export type LemoNotice = { text: string; tone: LemoTone; until: number }

/**
 * 消息编号表：按消息 id 和文字各记一份。
 * dupes：恢复旧会话时，原文出现了不止一次的消息（比如两次「你好」），按先后记下各自的号，画的时候按先后对
 */
export type LemoNumbers = {
  ids: Readonly<Record<string, number>>
  texts: Readonly<Record<string, number>>
  dupes?: Readonly<Record<string, readonly number[]>>
}

/**
 * lemo-core 存下来的一行（按对话记录里的消息 id）：用户消息的号（u）、回复的号（r）、耗时行（t：号、步数、工具数）。
 * 恢复旧会话（包括 --fork-session 另开的一份，消息 id 不变）时，会话状态是空的，靠它找回
 */
export type LemoKept = { u?: number; r?: number; t?: readonly [number, number, number] }

/** /lemo-mod 后面的词交给各 mod 处理后的回答：text 是回复的文字（不回文字就省略） */
export type LemoCommandAnswer = { text?: string }

/** 一轮的统计：几步（几次模型请求）、几次工具、用时 */
export type LemoTurn = { steps: number; tools: number; ms: number }

/** 耗时行属于第几条消息、那一轮几步几次工具，按耗时行的 id 记 */
export type LemoTurnRow = { n: number; steps: number; tools: number }

/** 不需要参数的方法也要传一个对象（$ 上的方法都只收一个参数） */
export type LemoEmpty = Readonly<Record<string, never>>

/** $.lemo：lemo-core 给其他 lemo mod 的公共方法 */
export type Lemo = {
  /** 当前风格 */
  style: (input: LemoEmpty) => Promise<LemoStyle>
  /** 当前界面语言。只跟着用户发的普通消息变；/lemo-mod 后面的词不改语言 */
  lang: (input: LemoEmpty) => Promise<LemoLang>
  /** mod 在 session.start 里报到 */
  join: (input: LemoModInfo) => Promise<void>
  /** 打开统一面板，可以指定分页 */
  open: (input: { tab?: LemoTab }) => Promise<void>
  /** 放风格里的音效。静音时不放；preview 为 true 时（用户点试听）照样放 */
  play: (input: { sound: LemoSound; gain?: number; preview?: boolean }) => Promise<void>
  /** 用风格的语音朗读。静音或关了朗读时不念；preview 为 true 时照样念 */
  say: (input: { text: string; preview?: boolean }) => Promise<void>
  /** 横条上出一条提示，同时弹系统提示 */
  notice: (input: { text: string; tone: LemoTone; ms?: number }) => Promise<void>
  /** 加、改、去掉一个胶囊 */
  badge: (input: LemoBadge) => Promise<void>
  /** 改静音、朗读开关（存进 $.store，下次沿用），和「展开工具行」（只在这个会话） */
  set: (input: { muted?: boolean; speech?: boolean; unfold?: boolean }) => Promise<void>
  /** 给第 n 条消息贴标签（自动分类用） */
  tag: (input: { n: number; kind: string }) => Promise<void>
  /**
   * /lemo-mod 后面的词。只有 lemo-core 接 /lemo-mod 命令（Claude Code 会在命令的回复前面写上接这个命令的插件名，
   * 接的插件多了就是一长串）；它先调这个方法问各 mod：mod 挂 on('lemo.command')，认得的词自己处理，
   * 回 { value: { text } }；不认的 next(e) 往下传。都不认就回 null，由 lemo-core 处理（分页词、风格、不认识的词）
   */
  command: (input: { args: string }) => Promise<LemoCommandAnswer | null>
  /** 按对话记录里的消息 id 找 lemo-core 存下来的编号（恢复旧会话时，会话状态里没有）；没有就是 null */
  recall: (input: { id: string }) => Promise<LemoKept | null>
  /**
   * 能力清单：安全页、开会话时的「已开：…」提示都调它。每个 mod 挂 on('lemo.caps')，
   * 先 const r = await next(e)，再 return { value: [...r.value, ...自己的] }。最底下是 lemo-core 自己的几行
   */
  caps: (input: LemoEmpty) => Promise<readonly LemoCap[]>
  /**
   * 安全页上按了某一行的开关（on）或试听（preview）。mod 挂 on('lemo.toggle')：e.mod 是自己的就处理、
   * 回 { value: true }（开关存进 $.store，全局记住）；不是自己的 next(e)。谁都不认回 false
   */
  toggle: (input: { mod: string; id: string; on?: boolean; preview?: boolean }) => Promise<boolean>
  /**
   * 安全页的「全部关闭」：除了外观，每个 mod 把自己的开关都关掉（存进 $.store），再 next(e)。
   * mod 挂 on('lemo.off')
   */
  off: (input: LemoEmpty) => Promise<void>
}

declare module 'claude-code' {
  interface EngineInterface {
    lemo: Lemo
  }
  interface PluginState {
    'lemo-core': {
      style: LemoStyle
      lang: LemoLang
      theme: LemoTheme
      /**
       * 桌面 App 自己的明暗（App 设置里的 Theme），lemo-core 读 App 记在本机的设置文件得来，只在桌面会话里读。
       * 读不到（文件换了地方、不是 macOS）是 null，当亮色画。插件接口里没有这个信号
       */
      desk: LemoTheme
      /** 面板头部图标的 PNG（base64），读不到是 null */
      icon: string | null
      /** 每秒加一，倒计时和小动画读它 */
      frame: number
      tab: LemoTab
      mods: readonly LemoModInfo[]
      notice: LemoNotice | null
      badges: readonly LemoBadge[]
      muted: boolean
      speech: boolean
      /** 装上后扫描到的用户设置（见 LemoScan）；还没扫完是 null */
      scan: LemoScan | null
      /** 用户在安全页按过「我看完了」（存进 $.store，全局）。没按之前每次开会话都弹安全页 */
      safeOk: boolean
      /** 能力清单变了（安全页上开关了什么）就加一，安全页读它，跟着重画 */
      capsRev: number
      /**
       * 「展开工具行」：折叠的工具组不再折叠，每条调用单独一行。lemo-skin 的开关写它，
       * 画工具组的 mod（lemo-skin、lemo-lot）都读它，所以放在核心。没写过时读到 undefined，当作关
       */
      unfold: boolean
      /** 终端面板「已装的 mod」卡片展开了说明（只在这个会话） */
      modsOpen: boolean
      /** 用户本人发了几条消息（T01、T02…） */
      seq: number
      numbers: LemoNumbers
      replies: LemoNumbers
      turnRows: Readonly<Record<string, LemoTurnRow>>
      lastTurn: LemoTurn | null
      /** 第 n 条消息的标签 */
      tags: Readonly<Record<string, string>>
    }
  }
}
