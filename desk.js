// 把 mod 画出来的桌面界面（engine 的元素树：Box、Text、Button、Svg……）排成网页。
// 布局按元素树原样排（flex），按钮、输入框、下拉框是桌面 App 自己的样子，这里是近似。
(function () {
  // 间距单位照用户真 App 截图量的（10-03）：内边距、外边距一格 8px（卡片 paddingX 2 = 16px、paddingY 1 = 8px），
  // gap 一格 10px（面板卡片之间 gap 2 = 20px）
  const U = 8
  const G = 10
  // App 自己的字色：元素树里写主题色名（text）或 dimColor 的字，照 App 的明暗取（暗色是 10-03 照真 App 截图量的）
  const THEMES = {
    light: { text: '#141413', dim: '#52514E', muted: '#52514E' },
    dark: { text: '#ECEBE8', dim: '#C3C2B7', muted: '#C3C2B7' },
  }
  let THEME = THEMES.light
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const color = c => (typeof c !== 'string' ? null : /^#/.test(c) ? c : THEME[c] || null)
  const px = v => (typeof v === 'number' ? `${v * U}px` : typeof v === 'string' ? v : null)

  function boxStyle(p) {
    const s = ['display:flex', `flex-direction:${p.flexDirection || 'row'}`, 'min-width:0']
    if (p.display === 'none') s.push('display:none')
    const gap = p.gap ?? null
    if (gap !== null) s.push(`gap:${gap * G}px`)
    if (p.rowGap != null) s.push(`row-gap:${p.rowGap * G}px`)
    if (p.columnGap != null) s.push(`column-gap:${p.columnGap * G}px`)
    const side = (k, css) => { if (p[k] != null) s.push(`${css}:${p[k] * U}px`) }
    if (p.padding != null) s.push(`padding:${p.padding * U}px`)
    if (p.paddingX != null) s.push(`padding-left:${p.paddingX * U}px;padding-right:${p.paddingX * U}px`)
    if (p.paddingY != null) s.push(`padding-top:${p.paddingY * U}px;padding-bottom:${p.paddingY * U}px`)
    side('paddingTop', 'padding-top'); side('paddingBottom', 'padding-bottom'); side('paddingLeft', 'padding-left'); side('paddingRight', 'padding-right')
    if (p.margin != null) s.push(`margin:${p.margin * U}px`)
    side('marginTop', 'margin-top'); side('marginBottom', 'margin-bottom'); side('marginLeft', 'margin-left'); side('marginRight', 'margin-right')
    if (p.marginX != null) s.push(`margin-left:${p.marginX * U}px;margin-right:${p.marginX * U}px`)
    if (p.marginY != null) s.push(`margin-top:${p.marginY * U}px;margin-bottom:${p.marginY * U}px`)
    if (p.backgroundColor) s.push(`background:${color(p.backgroundColor) || p.backgroundColor}`)
    if (p.borderStyle) s.push(`border:1px solid ${color(p.borderColor) || '#E0E0DF'}`, `border-radius:${p.borderStyle === 'round' ? 12 : 2}px`)
    if (p.width != null) s.push(`width:${typeof p.width === 'number' ? p.width * U + 'px' : p.width}`)
    if (p.minWidth != null) s.push(`min-width:${px(p.minWidth)}`)
    if (p.height != null && typeof p.height === 'number') s.push(`height:${p.height * U}px`)
    if (p.alignItems) s.push(`align-items:${p.alignItems}`)
    if (p.alignSelf) s.push(`align-self:${p.alignSelf}`)
    if (p.justifyContent) s.push(`justify-content:${p.justifyContent}`)
    if (p.flexWrap) s.push(`flex-wrap:${p.flexWrap}`)
    if (p.flexGrow != null) s.push(`flex-grow:${p.flexGrow}`)
    if (p.flexShrink != null) s.push(`flex-shrink:${p.flexShrink}`)
    return s.join(';')
  }
  function textStyle(p) {
    const s = []
    const c = color(p.color)
    if (c) s.push(`color:${c}`)
    else if (p.dimColor) s.push(`color:${THEME.dim}`)
    if (p.backgroundColor) s.push(`background:${color(p.backgroundColor) || p.backgroundColor}`, 'padding:0 .2em', 'border-radius:3px')
    if (p.bold) s.push('font-weight:600')
    if (p.italic) s.push('font-style:italic')
    if (p.underline) s.push('text-decoration:underline')
    if (p.strikethrough) s.push('text-decoration:line-through')
    return s.join(';')
  }
  function md(text) {
    return String(text).split(/\n{2,}/).map(par => `<p>${esc(par).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n/g, '<br>')}</p>`).join('')
  }
  function node(n, inText) {
    if (n == null) return ''
    if (typeof n === 'string' || typeof n === 'number') return esc(n)
    if (Array.isArray(n)) return n.map(c => node(c, inText)).join('')
    const p = n.props || {}
    const kids = n.children || []
    switch (n.type) {
      case 'Box':
        return `<div class="d-box" style="${boxStyle(p)}">${kids.map(c => node(c, false)).join('')}</div>`
      case 'Text':
        return `<span class="${inText ? 'd-t' : 'd-text'}" style="${textStyle(p)}">${kids.map(c => node(c, true)).join('')}</span>`
      case 'Button': {
        const v = p.plain ? 'plain' : p.variant === 'primary' ? 'primary' : 'secondary'
        return `<span class="d-btn d-${v}${p.dimColor ? ' d-dim' : ''}"${p.key ? ` data-key="${esc(p.key)}"` : ''}>${esc(p.label ?? kids.join(''))}</span>`
      }
      case 'Svg': {
        const h = typeof p.height === 'number' ? `height:${p.height}px;` : ''
        return `<div class="d-svg" style="${h}">${String(p.source || '')}</div>`
      }
      case 'Select': {
        const opts = (p.options || []).map(o => `<option${o.value === p.value ? ' selected' : ''}>${esc(o.label)}</option>`).join('')
        return `<label class="d-select">${p.label ? `<span>${esc(p.label)}</span>` : ''}<select disabled>${opts}</select></label>`
      }
      case 'Input':
        return `<label class="d-input">${p.label ? `<span>${esc(p.label)}</span>` : ''}<input disabled placeholder="${esc(p.placeholder || '')}"><span class="d-btn d-secondary">${esc(p.submitLabel || '↵')}</span></label>`
      case 'Markdown':
        return `<div class="d-md">${md(p.text ?? kids.join(''))}</div>`
      case 'Link':
        return `<a class="d-link">${esc(p.label ?? p.href ?? '')}</a>`
      case 'Image':
        return p.source && p.source.png ? `<img class="d-img" alt="" src="data:image/png;base64,${p.source.png}">` : ''
      default:
        return ''
    }
  }
  window.renderDesk = tree => node(tree, false)
  window.setDeskMode = mode => { THEME = THEMES[mode] || THEMES.light }
})()
