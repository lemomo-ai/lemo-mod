# lemo-mod 安全守则 · Safety rules

[中文](#中文) · [English](#english)

## 中文

lemo-mod 的目标：**装上以后，不出现和你自己的配置冲突的东西。** 先让你知道每个 mod 会做什么，再由你决定开不开。以后加任何新功能，都要先过这份守则。

### 五条原则

1. **不替你做安全决定。** mod 不放行、也不拦截任何工具调用。Claude 问不问你、能不能运行，全照你自己的设置和权限模式。想挡住某类命令（比如 `git push --force`），请在你自己的设置里加一条禁止规则。
2. **只读你的设置，从不改。** 装上后 lemo-core 读一遍你的设置（用户、项目、本地、组织各层合起来），只看和 mod 重叠的几项：状态栏、转圈文字、通知方式、输出风格、主题。在桌面 App 里还会每 3 秒读一次 App 自己的设置文件，只为看明暗（选了「跟随系统」时看 macOS 的外观），让面板卡片跟着换深浅；这个文件里还有 App 的登录缓存，lemo-core 只取明暗这一项。只在本机读，不存，不发给 Claude，不联网。
3. **外观装上就开，其余全部默认关。** 外观是配色、消息编号、横条、转圈文字、提问弹窗的样式，只改画面。会出声、会朗读、会写文件、会多调用模型、会往发给 Claude 的内容里加话、会给 Claude 加工具、会替你发消息或停下一轮、会联网的，装上时一律是关的。
4. **自动做事的都有开关，都在「安全」页；手动的只在你点按钮、输入命令时才做。** `/lemo-mod 安全` 打开。开关全局记住，换项目、换会话都一样。从 GitHub 装的，终端和桌面 App 也共用一份；从本地文件夹加 marketplace 或用 `--plugin-dir` 加载时，桌面 App 会把插件当成另一份，终端和桌面 App 的开关、风格、安全确认各记一份，要各确认一次。只在你点按钮、输入命令时才做的事（总结、提醒、番茄钟、派助手、查新版本）没有开关，也在这一页的「手动触发」里列出来。
5. **和你的配置重叠时，照你的来。** 比如你自己设了状态栏，lemo-meter 的状态栏默认就不开，安全页上写明原因。

### 装好以后

1. 重开 Claude Code（终端或桌面 App）。
2. lemo-core 扫描你的设置。
3. 自动打开面板的「安全」页（终端窄于 144 列时面板会等着，横条上有红色提示：输入 `/lemo-mod 安全`）。
4. 逐项看，声音和朗读可以先试听，想开的就打开。
5. 点「我看完了」。点一次就记住，所有项目、所有会话都算数，重启电脑也不用再点。没点之前，每次开新会话都会弹出这一页。之后每次开会话，横条上写一行「已开启：…」，不会悄悄开着。

### 加新功能时的检查表

- [ ] 它属于哪一类？外观、音效、朗读、写文件、额外用量、附加提示、新增工具、代你操作、联网。不是外观的，默认关。
- [ ] 在能力清单里登记（挂 `lemo.caps`、`lemo.toggle`、`lemo.off`），中英两句说清楚会做什么、碰什么（写哪个文件、花哪个模型的用量）。
- [ ] 开关存进 `$.store`，在安全页上能开能关；「全部关闭」能关掉它。用户自己点开、还在等着到点的事（提醒、番茄钟），「全部关闭」也一起取消。
- [ ] 没有替用户放行或拒绝工具，没有改用户的设置，没有在用户的电脑上起程序，没有盖掉用户输入框里的草稿。
- [ ] 和用户自己的某项设置重叠吗？重叠就默认照用户的，并在 lemo-core 的扫描里加这一项。
- [ ] 在这个 mod 的测试里加「安全：刚装上……」：存档全空时什么都不做，打开开关后才做。
- [ ] 某个界面上做不到或会误导（比如桌面 App 自己更新，不该提示更新命令行版），就在那个界面上隐藏。

### 怎么保证

- **能力清单**：每个 mod 在代码里登记会做什么、属于哪类、默认值。安全页照这张清单画。
- **「刚装上」测试**：每个 mod 的测试里都有一项，存档全空时开会话、聊一轮、压缩一次，确认什么都没发生。
- **扫代码**：`node scripts/check-safety.mjs`（`node scripts/check-all.mjs` 会一起跑）扫几种常见写法：替用户放行或拒绝、改设置、起程序、盖掉草稿、在说好的地方以外联网或读设置，出现就不通过。它只认常见写法，不是保证，换个写法就扫不到，所以还要靠读代码和上面的测试。
- **真机走一遍**：发布前删掉本地配置，照 README 从头装，走一遍安全检查。

## English

The goal of lemo-mod: **after you install it, nothing conflicts with your own setup.** You first see what each mod does, then decide what to turn on. Every new feature has to pass these rules.

### Five rules

1. **No security decisions for you.** Mods never allow or block a tool call. Whether Claude asks you and what it may run follow your own settings and permission mode. To block a kind of command (say `git push --force`), add a deny rule to your own settings.
2. **Your settings are read, never changed.** After install, lemo-core reads your settings once (user, project, local and organization layers merged) and looks only at what overlaps with the mods: status line, spinner words, notification channel, output style, theme. In the desktop app it also reads the app's own settings file every 3 seconds, only for its light or dark choice (or the macOS appearance when the app follows the system), so the panel cards match it; that file also holds the app's sign-in cache, and lemo-core takes only the light or dark value. It reads them on your machine only, does not store them, and does not send them to Claude or anywhere else.
3. **Looks are on from the start; everything else starts off.** Looks are colors, message numbers, the band above the prompt, spinner words and the question dialog style: they only change how things look. Anything that plays sound, reads aloud, writes files, makes extra model calls, adds to what is sent to Claude, gives Claude a tool, sends a message or stops a turn for you, or goes online starts off.
4. **Everything automatic has a switch on the Safety page; on-demand things run only when you press a button or type a command.** Open it with `/lemo-mod safety`. Switches are remembered across projects and sessions. Installed from GitHub, the terminal and the desktop app share them too; when the marketplace is a local folder or the plugins load with `--plugin-dir`, the desktop app loads them as separate plugins, so the terminal and the desktop app each keep their own switches, style and safety confirmation, and you confirm once on each. Things that run only when you press a button or type a command (recap, reminders, pomodoro, the assistant's report, version check) have no switch and are listed there too, under "On demand".
5. **Where your setup overlaps, yours wins.** If you set your own status line, for example, the lemo-meter status line starts off, and the Safety page says why.

### After install

1. Restart Claude Code (terminal or desktop app).
2. lemo-core reads your settings.
3. The panel opens on the Safety page (in a terminal narrower than 144 columns the panel waits; a red note on the band says: type `/lemo-mod safety`).
4. Go through it. Listen to the sounds and the voice first if you like, and turn on what you want.
5. Press "I have read this". Once is enough: it counts for every project and session, and stays after a restart. Until you do, the page opens in every new session. After that, each new session shows one line on the band, "On: …", so nothing stays on quietly.

### Checklist for a new feature

- [ ] Which kind is it: looks, sound, speech, writes files, extra usage, extra prompt, extra tool, acts for you, network? Anything but looks starts off.
- [ ] Register it in the capability list (hook `lemo.caps`, `lemo.toggle`, `lemo.off`) with one sentence in Chinese and English on what it does and touches (which file it writes, whose usage it spends).
- [ ] Its switch is stored in `$.store`, can be turned on and off on the Safety page, and "Turn all off" turns it off. Anything the user started that is still waiting to go off (a reminder, a focus timer) is cancelled by "Turn all off" too.
- [ ] It does not allow or deny tools for the user, change the user's settings, start programs on the user's computer, or overwrite the draft in the user's prompt box.
- [ ] Does it overlap with one of the user's own settings? Then it follows the user's setting by default, and lemo-core's scan learns that setting.
- [ ] Add a "安全：刚装上……" (fresh install) test to the mod: with an empty store it does nothing; it acts only after its switch is turned on.
- [ ] If a surface cannot do it, or it would mislead there (the desktop app updates itself, so it should not suggest updating the command-line version), hide it on that surface.

### How this is enforced

- **Capability list**: each mod registers in code what it does, its kind and its default. The Safety page is drawn from that list.
- **Fresh-install tests**: every mod's tests include one that starts a session, runs a turn and a compaction with an empty store, and checks that nothing happened.
- **Code scan**: `node scripts/check-safety.mjs` (also run by `node scripts/check-all.mjs`) scans for common patterns of allowing or denying for the user, changing settings, starting programs, overwriting the draft, or going online or reading settings outside the places listed in the script, and fails if it finds one. It only catches the common spellings and is not a guarantee, so reading the code and the tests above still matter.
- **A real install**: before a release, delete the local configuration, install from the README, and go through the safety check.
