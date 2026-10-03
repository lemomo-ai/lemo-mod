// lemo-mod 网站两页共用：顶栏的中/EN、明/暗，复制按钮。
// 语言、明暗记在 localStorage（lemo-mod.lang、lemo-mod.theme）；读不到就默认中文、跟系统明暗。
// 换了以后发事件 lemo:lang / lemo:theme（detail 是 'zh'|'en' / 'light'|'dark'），画廊跟着重画。
(function () {
  const root = document.documentElement
  const store = {
    get: k => { try { return localStorage.getItem(k) } catch (_) { return null } },
    set: (k, v) => { try { localStorage.setItem(k, v) } catch (_) { /* 无痕窗口等：只在本页生效 */ } },
  }
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null
  const lang = () => (root.lang === 'en' ? 'en' : 'zh')
  const theme = () => root.dataset.theme || (mq && mq.matches ? 'dark' : 'light')
  const reflect = () => {
    document.querySelectorAll('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang())))
    document.querySelectorAll('[data-set-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme())))
  }
  const fire = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }))

  function setLang(l) {
    if (l !== 'en') l = 'zh'
    root.lang = l
    store.set('lemo-mod.lang', l)
    reflect()
    fire('lemo:lang', l)
  }
  function setTheme(t) {
    root.dataset.theme = t
    store.set('lemo-mod.theme', t)
    reflect()
    fire('lemo:theme', t)
  }
  document.addEventListener('click', e => {
    const l = e.target.closest('[data-set-lang]')
    if (l) { if (l.dataset.setLang !== lang()) setLang(l.dataset.setLang); return }
    const t = e.target.closest('[data-set-theme]')
    if (t) { if (t.dataset.setTheme !== theme() || !root.dataset.theme) setTheme(t.dataset.setTheme); return }
    const c = e.target.closest('[data-copy]')
    if (c) copy(c)
  })
  if (mq) {
    const onSys = () => { if (!root.dataset.theme) { reflect(); fire('lemo:theme', theme()) } }
    if (mq.addEventListener) mq.addEventListener('change', onSys); else if (mq.addListener) mq.addListener(onSys)
  }

  // 复制：data-copy 指向要复制的元素 id。先用剪贴板；不行就把文字选中，让人自己按 ⌘C / Ctrl+C
  function copy(btn) {
    const el = document.getElementById(btn.dataset.copy)
    if (!el) return
    const text = el.innerText.replace(/\n+$/, '')
    const say = (key, ms) => {
      btn.dataset.state = key
      clearTimeout(btn._t)
      btn._t = setTimeout(() => { delete btn.dataset.state }, ms)
    }
    const select = () => {
      try {
        const r = document.createRange()
        r.selectNodeContents(el)
        const s = getSelection()
        s.removeAllRanges()
        s.addRange(r)
        let ok = false
        try { ok = document.execCommand('copy') } catch (_) { ok = false }
        say(ok ? 'done' : 'select', ok ? 1600 : 3200)
      } catch (_) { say('select', 3200) }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => say('done', 1600), select)
      } else select()
    } catch (_) { select() }
  }

  window.LEMO = { lang, theme, setLang, setTheme }
  reflect()
})()
