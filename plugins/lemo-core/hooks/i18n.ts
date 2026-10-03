// lemo-core 自己的文字（中性的默认文字；带风格味道的放在风格包 words/lemo-core.ts，按同样的键覆盖）

import type { LemoLang } from '../types'

// 路径、网址、文件名、命令参数、反引号里的代码不算：「/Users/…/TEST.md 读一下这个文件」是中文
export function detectLang(text: string): LemoLang | null {
  const plain = text.replace(/`[^`]*`/g, ' ').replace(/\S*[/\\.@:]\S*/g, ' ').replace(/(^|\s)-\S*/g, ' ')
  const cjk = (plain.match(/[㐀-鿿豈-﫿]/g) ?? []).length
  const latin = (plain.match(/[A-Za-z]/g) ?? []).length
  if (cjk === 0 && latin === 0) return null
  // 写了三个以上汉字就是中文用户，哪怕句子里夹着命令和英文术语
  return cjk >= 3 || cjk * 3 >= latin ? 'zh' : 'en'
}

const zh = {
  title: 'lemo-mod',
  cmdTag: ' lemo-mod ',
  modsCount: '{n} 个 mod',
  modsOne: '1 个 mod',
  tabs: { main: '常用', behave: '行为', bg: '后台', game: '游戏', safe: '安全' },
  // {last}：最后一页的键（有几页就到几，比如四页是 d）
  keys: 'ctrl+x Tab 进入面板 · a–{last} 换页 · 数字键按按钮 · Esc 返回',
  style: { title: '风格', desc: '一键切换所有 lemo mod 的风格', current: '当前' },
  mods: { title: '已装的 mod', desc: '各 mod 的作用 · 会做事的开关都在「安全」页', more: '展开说明', less: '收起', none: '暂无其他 lemo mod · 全部安装：/plugin install lemo-mod@lemo-mod', noAlways: '（无自动行为）' },
  empty: '本页暂无内容',
  // 没装 lemo-sound、lemo-voice 时「行为」页的开关卡片。{speech} 是下面的 withSpeech（有 mod 会朗读时）或空
  sound: { title: '声音', desc: '播放 mod 的提示音{speech}', withSpeech: '和到点朗读', mute: '静音', unmute: '取消静音', speechOn: '朗读：开', speechOff: '朗读：关' },
  // 起名卡片。{name} 是风格自己的名字，{nick} 是起的名字
  nick: { title: '起名', desc: '给「{name}」起名，用在面板、横条和提示里 · 每套风格分开记', now: ' · 现在叫「{nick}」', placeholder: '输入名字，回车保存', save: '保存', reset: '恢复原名' },
  // 安全页。kinds 是能力清单的分类；cap 是 lemo-core 自己那几行
  safe: {
    title: '安全',
    promise: '不改你的权限设置：Claude 何时问你、能否执行，都按你自己的设置。除外观外，以下各项安装时全部关闭，按需打开',
    manual: '完整手册（网页）',
    scanTitle: '你的相关设置（仅本机读取，不保存，不发给 Claude）',
    scanStatus: '已有自己的状态栏 → lemo-meter 状态栏默认关闭',
    scanSpinner: '已自定义转圈文字 → lemo-spinner 默认关闭',
    scanNotif: '通知方式：{v}',
    scanStyle: '输出风格：{v}',
    scanTheme: '主题：{v}',
    /** 只在桌面上显示：App 自己的明暗（读 App 记在本机的设置），{v} 是下面 desk 里的一个 */
    scanDesk: '桌面 App：{v}（面板随之切换深浅）· 每 3 秒读一次 App 的设置文件，只取明暗；这个文件里还有 App 的登录缓存',
    desk: { dark: '暗色', light: '亮色', unknown: '未读到，按亮色显示' },
    /** 通知方式的内部值换成人话；没列的照原样显示 */
    notifNames: { auto: '自动', iterm2: 'iTerm2 通知', iterm2_with_bell: 'iTerm2 通知加响铃', terminal_bell: '终端响铃', kitty: 'kitty 通知', ghostty: 'Ghostty 通知', notifications_disabled: '已关闭通知' } as Readonly<Record<string, string>>,
    scanNone: '没有与 lemo-mod 重叠的设置',
    scanBusy: '正在读取设置…',
    ok: '我看完了',
    okDone: '已确认 · 随时输入 /lemo-mod 安全 修改',
    allOff: '全部关闭',
    allOffDesc: '「全部关闭」：关闭外观以外的所有功能，并取消进行中的提醒和番茄钟',
    pending: '未完成安全确认：输入 /lemo-mod 安全',
    on: '已开启：{list} · 在 /lemo-mod 安全 中修改',
    turnOn: '打开',
    turnOff: '关闭',
    stateOn: '已开',
    stateOff: '已关',
    listen: '试听',
    manualTitle: '手动触发',
    manualDesc: '仅在点按钮或输入命令时执行，无需开关',
    kinds: { look: '外观', sound: '音效', speech: '朗读', file: '写文件', cost: '额外用量', prompt: '附加提示', tool: '新增工具', act: '代你操作', net: '联网' },
    kindDesc: {
      look: '只改显示，安装即开启',
      sound: '播放提示音',
      speech: '用系统语音朗读',
      file: '在你的电脑上写文件',
      cost: '额外调用模型，计入你的用量',
      prompt: '在发给 Claude 的消息后附加要求（你看不到）',
      tool: '给 Claude 增加工具',
      act: '代你给 Claude 发消息，或中止当前这一轮',
      net: '唯一访问外部网站的一项',
    },
    cap: {
      sound: { title: '提示音', desc: '调用工具、一轮结束、限时中止时播放风格音效' },
      speech: { title: '朗读', desc: '长任务结束、番茄钟到点时朗读一句' },
      note: { title: '编号说明', desc: '告诉 Claude 编号 T01、T02 的含义，可直接说「T03」指代 · 下个会话生效' },
    },
    sample: '第三条完成，用时 2 分 15 秒',
  },
  cmd: {
    styleSet: '已切换到「{name}」风格。',
    nickSet: '已将「{name}」改名为「{nick}」。',
    nickReset: '「{name}」已恢复原名。',
    nickNone: '「{name}」尚未起名。用法：/lemo-mod 起名 <名字>',
    nickLong: '名字过长：最多 {n} 个汉字或 {m} 个字母。',
    styleList: '可选的风格：{list}。用法：/lemo-mod 风格 <名字>',
    styleUnknown: '没有「{id}」风格。可选：{list}',
    unknown: '无法识别「{word}」。可用：{list}',
  },
  /** 列举时的分隔和括注 */
  sep: '、',
  paren: '{a}（{b}）',
  describe: 'lemo-mod 面板',
}

export type CoreStrings = typeof zh

const en: CoreStrings = {
  title: 'lemo-mod',
  cmdTag: ' lemo-mod ',
  modsCount: '{n} mods',
  modsOne: '1 mod',
  tabs: { main: 'Main', behave: 'Behavior', bg: 'Background', game: 'Game', safe: 'Safety' },
  keys: 'ctrl+x Tab to enter · a–{last} to switch pages · digits press buttons · Esc to go back',
  style: { title: 'Style', desc: 'Switch the style of every lemo mod at once', current: 'Current' },
  mods: { title: 'Installed mods', desc: 'What each mod does · switches for anything that acts are on the Safety page', more: 'Details', less: 'Hide', none: 'No other lemo mods · install all: /plugin install lemo-mod@lemo-mod', noAlways: '(no automatic behavior)' },
  empty: 'Nothing on this page yet',
  sound: { title: 'Sound', desc: 'Plays mod sounds{speech}', withSpeech: ' and reads aloud when time is up', mute: 'Mute', unmute: 'Unmute', speechOn: 'Speech: on', speechOff: 'Speech: off' },
  nick: { title: 'Name', desc: 'Name "{name}" for the panel, the band and messages · each style keeps its own', now: ' · now called "{nick}"', placeholder: 'Type a name, Enter to save', save: 'Save', reset: 'Reset name' },
  safe: {
    title: 'Safety',
    promise: 'Your permission settings stay as they are: when Claude asks you and what it may run follow your own settings. Apart from looks, everything below is off at install; turn on what you need',
    manual: 'Full manual (web)',
    scanTitle: 'Your related settings (read on this machine only, not stored, not sent to Claude)',
    scanStatus: 'You have your own status line → lemo-meter status line off by default',
    scanSpinner: 'You set your own spinner words → lemo-spinner off by default',
    scanNotif: 'Notifications: {v}',
    scanStyle: 'Output style: {v}',
    scanTheme: 'Theme: {v}',
    scanDesk: "Desktop app: {v} (the panel follows it) · reads the app's settings file every 3 seconds, takes only light or dark; that file also holds the app's sign-in cache",
    desk: { dark: 'dark', light: 'light', unknown: 'not found, shown light' },
    notifNames: { auto: 'automatic', iterm2: 'iTerm2 notifications', iterm2_with_bell: 'iTerm2 notifications with a bell', terminal_bell: 'terminal bell', kitty: 'kitty notifications', ghostty: 'Ghostty notifications', notifications_disabled: 'notifications off' } as Readonly<Record<string, string>>,
    scanNone: 'No settings overlap with lemo-mod',
    scanBusy: 'Reading settings…',
    ok: 'I have read this',
    okDone: 'Confirmed · type /lemo-mod safety any time to change',
    allOff: 'Turn all off',
    allOffDesc: '"Turn all off": turns off everything except looks and cancels a running reminder or focus timer',
    pending: 'Safety check not done yet: type /lemo-mod safety',
    on: 'On: {list} · change in /lemo-mod safety',
    turnOn: 'Turn on',
    turnOff: 'Turn off',
    stateOn: 'on',
    stateOff: 'off',
    listen: 'Listen',
    manualTitle: 'On demand',
    manualDesc: 'Run only when you press a button or type a command · no switch needed',
    kinds: { look: 'Looks', sound: 'Sound', speech: 'Speech', file: 'Writes files', cost: 'Extra usage', prompt: 'Extra prompt', tool: 'Extra tool', act: 'Acts for you', net: 'Network' },
    kindDesc: {
      look: 'Changes only the display; on at install',
      sound: 'Plays sounds',
      speech: 'Reads aloud with the system voice',
      file: 'Writes files on your computer',
      cost: 'Extra model calls, counted in your usage',
      prompt: 'Appends instructions to your messages to Claude (hidden from you)',
      tool: 'Adds a tool for Claude',
      act: 'Sends Claude a message for you, or stops the current turn',
      net: 'The only one that visits an outside website',
    },
    cap: {
      sound: { title: 'Sounds', desc: 'Plays style sounds on tool calls, turn ends and time-limit stops' },
      speech: { title: 'Speech', desc: 'Reads a line aloud when a long task ends or a focus timer is up' },
      note: { title: 'Numbering note', desc: 'Tells Claude what T01, T02 mean, so you can just say "T03" · takes effect next session' },
    },
    sample: 'Message three done in 2 minutes 15 seconds',
  },
  cmd: {
    styleSet: 'Switched to the "{name}" style.',
    nickSet: 'Renamed "{name}" to "{nick}".',
    nickReset: '"{name}" has its original name back.',
    nickNone: '"{name}" has no name yet. Usage: /lemo-mod name <name>',
    nickLong: 'Name too long: at most {n} CJK characters or {m} letters.',
    styleList: 'Styles: {list}. Usage: /lemo-mod style <name>',
    styleUnknown: 'No "{id}" style. Available: {list}',
    unknown: 'Unrecognized "{word}". Available: {list}',
  },
  sep: ', ',
  paren: '{a} ({b})',
  describe: 'lemo-mod panel',
}

export const STR: Record<LemoLang, CoreStrings> = { zh, en }

// 这几个词打开面板的某一页
export const TAB_WORDS: Readonly<Record<string, 'safe' | 'main' | 'behave' | 'bg' | 'game'>> = {
  安全: 'safe', safe: 'safe', safety: 'safe', security: 'safe',
  常用: 'main', main: 'main',
  行为: 'behave', behave: 'behave', behavior: 'behave',
  后台: 'bg', bg: 'bg', background: 'bg',
  游戏: 'game', game: 'game',
}
