// lemo-mod 风格：左边选风格，右边两个窗口（终端实拍、桌面 App 仿真）。每个风格的数据在 data/<id>.json，用到时才取。
// 选中的风格记在地址 #<id>（styles.html#lemon-lab）；明暗、语言跟顶栏走（base.js），分页只在页面里。
(function () {
  const LIST = window.STYLES || []
  const $ = id => document.getElementById(id)
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const still = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches } catch (_) { return false } })()

  const T = {
    zh: { title: '风格', count: n => `${n} 套 · 终端和桌面 App`, term: '终端', desk: '桌面 App', mark: '标出 mod 画的', pickLabel: '选风格',
      light: '明', dark: '暗', tabs: { main: '常用', behave: '行为', bg: '后台', safe: '安全' }, loading: '载入中…', failed: '没载入，刷新试试', missing: '这一页没有截图' },
    en: { title: 'Styles', count: n => `${n} styles · terminal and desktop app`, term: 'Terminal', desk: 'Desktop app', mark: 'Show mod parts', pickLabel: 'Pick a style',
      light: 'Light', dark: 'Dark', tabs: { main: 'Main', behave: 'Behavior', bg: 'Background', safe: 'Safety' }, loading: 'Loading…', failed: 'Did not load. Refresh to try again', missing: 'No shot for this page' },
  }
  const TABS = ['main', 'behave', 'bg', 'safe']
  const root = document.documentElement
  const sysDark = () => root.dataset.theme === 'dark' || (!root.dataset.theme && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)
  const v = { id: null, lang: root.lang === 'en' ? 'en' : 'zh', mode: sysDark() ? 'dark' : 'light', tab: 'main', data: null }
  const cache = {}

  // 像素小画：16×10，几帧轮流（每帧 0.5 秒，和桌面横条一样）；anim=false 只画第一帧
  function spriteSvg(sprite, cls, anim) {
    const frames = still || !anim ? sprite.frames.slice(0, 1) : sprite.frames
    const n = frames.length
    const g = frames.map((f, i) => {
      let rects = ''
      f.forEach((row, y) => [...row].forEach((ch, x) => {
        const c = sprite.palette[ch]
        if (c) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c}"/>`
      }))
      const a = n > 1 ? `<animate attributeName="opacity" values="${frames.map((_, j) => (j === i ? 1 : 0)).join(';')}" calcMode="discrete" dur="${n * 0.5}s" repeatCount="indefinite"/>` : ''
      return `<g opacity="${i === 0 ? 1 : 0}">${a}${rects}</g>`
    }).join('')
    return `<svg class="${cls}" viewBox="0 0 16 10" shape-rendering="crispEdges" aria-hidden="true">${g}</svg>`
  }
  // 没有小画的风格（素色）：强调色和主色两块色卡
  const swatch = (c, cls) => `<span class="${cls} sw" aria-hidden="true"><b style="background:${c.accent}"></b><b style="background:${c.ink}"></b></span>`
  const icon = (s, cls, anim) => (s.sprite ? spriteSvg(s.sprite, cls, anim) : swatch(s.colors, cls))

  function seg(el, items, cur, onPick) {
    el.innerHTML = items.map(([val, label]) => `<button type="button" data-v="${val}" aria-pressed="${val === cur}">${esc(label)}</button>`).join('')
    el.onclick = e => {
      const b = e.target.closest('button[data-v]')
      if (!b) return
      onPick(b.dataset.v)
    }
  }
  const press = (el, cur) => el.querySelectorAll('button[data-v]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === cur)))

  // ---------- 左边：风格列表（窄屏变成一排横滑） ----------
  $('list').innerHTML = LIST.map(s => `<a class="item" href="#${s.id}" data-id="${s.id}">${icon(s, 'ico', false)}<span class="nm"><b>${esc(s.name.zh)}</b><small>${esc(s.name.en)}</small></span></a>`).join('')

  function chrome() {
    const t = T[v.lang]
    root.lang = v.lang === 'zh' ? 'zh' : 'en'
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t[el.dataset.t] })
    $('count').textContent = t.count(LIST.length)
    document.querySelectorAll('#list .item').forEach(a => {
      const s = LIST.find(x => x.id === a.dataset.id)
      a.querySelector('.nm b').textContent = v.lang === 'zh' ? s.name.zh : s.name.en
      a.querySelector('.nm small').textContent = v.lang === 'zh' ? s.name.en : s.name.zh
    })
    seg($('term-tabs'), TABS.map(k => [k, t.tabs[k]]), v.tab, k => setTab(k))
  }
  function setTab(k) {
    v.tab = k
    press($('term-tabs'), k)
    drawTerm()
    drawPane()
  }

  // ---------- 右边：标题、试听 ----------
  function head(s) {
    $('art').innerHTML = icon(s, 'big', true)
    $('name').textContent = v.lang === 'zh' ? s.name.zh : s.name.en
    $('name-en').textContent = v.lang === 'zh' ? s.name.en : s.name.zh
    const c = s.colors
    $('strip').innerHTML = ['accent', 'ink', 'grid', 'pencil', 'red', 'bubble', 'bubbleAccent', 'deskCardFill', 'cardFillDark'].map(k => `<i style="background:${c[k]}"></i>`).join('')
  }
  const PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1.5v7l6-3.5z"/></svg>'
  let audio = null
  function sounds() {
    const P = v.data
    if (!P) { $('sounds').innerHTML = ''; return }
    $('sounds').innerHTML = ['tick', 'done', 'deny'].filter(k => P.sounds[k]).map(k => `<button type="button" data-play="${k}">${PLAY}<span>${esc(P.soundNames[v.lang][['tick', 'done', 'deny'].indexOf(k)])}</span></button>`).join('')
  }
  $('sounds').addEventListener('click', e => {
    const b = e.target.closest('button[data-play]')
    if (!b || !v.data) return
    try {
      if (audio) { audio.pause(); document.querySelectorAll('#sounds .on').forEach(x => x.classList.remove('on')) }
      audio = new Audio(v.data.sounds[b.dataset.play])
      b.classList.add('on')
      audio.onended = () => b.classList.remove('on')
      audio.play().catch(() => b.classList.remove('on'))
    } catch (_) { b.classList.remove('on') }
  })

  // ---------- 两个窗口：一样宽。终端按宽度定字号让整屏铺满；桌面按真 App 一比一（1492×952）画再缩放 ----------
  const DESK_W = 1492, DESK_H = 952
  let cols = 0
  function fit() {
    const W = $('stage').clientWidth
    const z = Math.min(1, Math.max(0.24, W / DESK_W))
    $('desk-win').style.zoom = String(z)
    // 终端窗口和桌面窗口一样高（桌面按 1492×952 缩放）。终端整屏放进窗口、不出滚动条：
    // 先按宽度定字号，再量一下，高了或宽了就按比例缩小（10-03 用户：两边一样高，右边不要滚动条）
    $('term-win').style.height = `${Math.round(DESK_H * z)}px`
    const pre = $('term-shot').querySelector('pre')
    if (!pre || !cols) return
    const box = $('term-shot')
    // 实拍是固定的 150 列 × 44 行（和桌面窗口同比例，见 build.py 开头）。字号按宽度定（先用 100px 量出每列多宽），
    // 行高再微调到正好填满高度（1.25 上下浮动一点，看不出来），这样左右、上下都不留白、不出滚动条；
    // 窗口太矮、行高要压到 1.1 以下时才缩字号
    const padX = 24, padY = 24
    pre.style.lineHeight = '1.25'
    pre.style.fontSize = '100px'
    const per = (pre.offsetWidth - padX) / 100
    const rows = pre.textContent.split('\n').length
    let fs = Math.max(2, (box.clientWidth - padX - 0.5) / per)
    let lh = (box.clientHeight - padY - 0.5) / (rows * fs)
    if (lh < 1.1) { lh = 1.1; fs = (box.clientHeight - padY - 0.5) / (rows * lh) }
    if (lh > 1.45) lh = 1.45
    pre.style.fontSize = `${fs.toFixed(3)}px`
    pre.style.lineHeight = lh.toFixed(4)
  }
  function drawTerm() {
    const P = v.data
    $('term-win').classList.toggle('light', v.mode === 'light')
    if (!P) return
    const t = ((P.term[v.mode] || {})[v.lang] || {})[v.tab]
    cols = t ? t.cols : 0
    $('term-shot').innerHTML = t ? `<pre>${t.html}</pre>` : `<p class="empty">${esc(T[v.lang].missing)}</p>`
    fit()
  }
  const part = (mod, inner, tag = 'div') => `<${tag} class="mod-part" data-mod="${esc(mod)}">${inner}</${tag}>`
  const md = t => t.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/`(.+?)`/g, '<code>$1</code>')}</p>`).join('')
  function drawChat() {
    const P = v.data
    if (!P) return
    const cv = P.conv[v.mode][v.lang]
    const user = i => {
      const full = cv.users[i], ask = cv.asks[i]
      const pre = full.endsWith(ask) ? full.slice(0, full.length - ask.length) : ''
      return `<div class="msg-user">${pre ? part('lemo-skin', esc(pre.trim()), 'span') + ' ' : ''}${esc(ask)}</div>`
    }
    const reply = i => `<div class="msg-ai">${cv.labels[i] ? part('lemo-skin', window.renderDesk(cv.labels[i])) : ''}${md(cv.replies[i])}</div>`
    const lot = cv.lot ? part('lemo-lot', window.renderDesk(cv.lot)) : ''
    const g0 = cv.groups[0] ? part('lemo-skin', window.renderDesk(cv.groups[0])) : ''
    const g1 = cv.groups[1] ? part('lemo-skin', window.renderDesk(cv.groups[1])) : ''
    $('desk-chat').innerHTML = user(0) + `<div class="tg"><div class="tg-head">Used 2 tools ›</div>${g0}${lot}</div>` + reply(0) +
      user(1) + `<div class="tg"><div class="tg-head">Read login.css ›</div>${g1}</div>` + reply(1)
    $('chat-title').textContent = cv.asks[0]
    $('desk-status').textContent = cv.status || ''
    $('pane-title').textContent = cv.paneTitle || ''
    const sc = $('desk-scroll')
    sc.scrollTop = sc.scrollHeight
  }
  function drawPane() {
    const P = v.data
    if (!P) return
    $('desk-pane').innerHTML = window.renderDesk(P.desk[v.mode][v.lang][v.tab])
  }
  function drawDesk() {
    const P = v.data
    $('desk-win').classList.toggle('dark', v.mode === 'dark')
    window.setDeskMode(v.mode)
    if (!P) return
    $('desk-band').innerHTML = P.band[v.mode][v.lang] ? window.renderDesk(P.band[v.mode][v.lang]) : ''
    drawChat()
    drawPane()
  }
  function draw() {
    const s = LIST.find(x => x.id === v.id)
    if (s) head(s)
    sounds()
    drawTerm()
    drawDesk()
  }
  // 面板里的分页按钮可以点，和终端窗口上的分页一起换
  $('desk-pane').addEventListener('click', e => {
    const b = e.target.closest('[data-key^="tab-"]')
    if (!b) return
    const k = b.dataset.key.slice(4)
    if (TABS.includes(k)) setTab(k)
  })
  $('desk-mark').addEventListener('change', e => $('desk-win').classList.toggle('mark', e.target.checked))

  // ---------- 选风格 ----------
  function loading(text) {
    $('term-shot').innerHTML = `<p class="empty">${esc(text)}</p>`
    $('desk-chat').innerHTML = ''
    $('desk-pane').innerHTML = ''
    $('desk-band').innerHTML = ''
  }
  async function select(id) {
    if (!LIST.some(s => s.id === id)) id = LIST[0].id
    if (id === v.id && v.data) return
    v.id = id
    v.data = cache[id] || null
    document.querySelectorAll('#list .item').forEach(a => {
      const on = a.dataset.id === id
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current')
      const s = LIST.find(x => x.id === a.dataset.id)
      if (s.sprite) a.querySelector('.ico').outerHTML = icon(s, 'ico', on)
    })
    const cur = document.querySelector('#list .item[aria-current]')
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    if (!v.data) {
      draw()
      loading(T[v.lang].loading)
      try {
        const r = await fetch(`data/${id}.json`)
        if (!r.ok) throw new Error(String(r.status))
        cache[id] = await r.json()
      } catch (_) {
        if (v.id === id) loading(T[v.lang].failed)
        return
      }
      if (v.id !== id) return
      v.data = cache[id]
    }
    draw()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const sc = $('desk-scroll'); sc.scrollTop = sc.scrollHeight; fit() })
  }
  const fromHash = () => decodeURIComponent((location.hash || '').slice(1))
  window.addEventListener('hashchange', () => select(fromHash()))
  window.addEventListener('resize', fit)
  // 顶栏换语言、换明暗：页面和两个窗口一起换
  document.addEventListener('lemo:lang', e => { v.lang = e.detail; chrome(); draw() })
  document.addEventListener('lemo:theme', e => { v.mode = e.detail; draw() })
  try { new ResizeObserver(fit).observe($('stage')) } catch (_) { /* 没有就靠 resize */ }

  chrome()
  select(fromHash())
})()
