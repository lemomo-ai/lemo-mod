// lemo-mod 首页：以前的画廊链接是 index.html#<风格 id>，现在画廊在 styles.html，带着 # 转过去
(function () {
  const ids = window.STYLE_IDS || []
  const go = () => {
    const id = decodeURIComponent((location.hash || '').slice(1))
    if (id && ids.indexOf(id) >= 0) location.replace('styles.html#' + encodeURIComponent(id))
  }
  go()
  window.addEventListener('hashchange', go)
})()
