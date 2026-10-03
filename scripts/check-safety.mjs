// 安全守则的代码检查（SAFETY.md）：mod 不替用户做权限决定、不改用户的设置、不在用户的电脑上起程序、
// 不盖掉用户输入框里的草稿、只有说好的地方联网。在每个插件的 hooks/ 里找这些写法，找到就不通过。
//   node scripts/check-safety.mjs
// 「刚装上什么都不做」靠每个 mod 测试里的「安全：刚装上……」那一项，这里只看写法。
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// [规则, 正则, 允许出现的插件（空 = 哪里都不许）]
const RULES = [
  ['替用户放行或拒绝工具（权限照用户自己的设置）', /\bdecision\s*:\s*['"](allow|deny)['"]|\bbehavior\s*:\s*['"](allow|deny)['"]|\{\s*deny\s*:/, []],
  ['改用户的设置', /\.config\.set\s*\(|\.settings\.(write|set|update)\s*\(/, []],
  ['在用户的电脑上起程序', /\.process\.(run|spawn|exec)\s*\(/, []],
  ['盖掉用户输入框里的草稿', /prompt\.fill\s*\([^)]*['"]replace['"]/s, []],
  ['联网（只有 lemo-meter 的「查新版本」，用户点了才查）', /\.http\.(fetch|request)\s*\(/, ['lemo-meter']],
  ['读用户的设置（只有 lemo-core 的扫描，只看几项、不存）', /\.settings\.read\s*\(/, ['lemo-core']],
  ['读桌面 App 或系统的设置文件（只有 lemo-core 读桌面 App 的明暗，只读、不存）', /Application Support\/Claude|GlobalPreferences/, ['lemo-core']],
]

// 去掉注释（行注释、块注释），免得说明文字里提到这些写法也报
function code(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

function files(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...files(p))
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) out.push(p)
  }
  return out
}

const plugins = readdirSync(join(root, 'plugins')).filter(m => existsSync(join(root, 'plugins', m, 'hooks')))
const found = []
for (const mod of plugins) {
  for (const f of files(join(root, 'plugins', mod, 'hooks'))) {
    const text = code(readFileSync(f, 'utf8'))
    for (const [rule, re, allowed] of RULES) {
      if (allowed.includes(mod)) continue
      const m = re.exec(text)
      if (m === null) continue
      const line = text.slice(0, m.index).split('\n').length
      found.push(`${relative(root, f)}:${line}  ${rule}：${m[0].replace(/\s+/g, ' ').slice(0, 60)}`)
    }
  }
}
console.log(`${found.length === 0 ? '✔' : '✘'} check-safety（${plugins.length} 个插件）`)
for (const x of found) console.log(`    ${x}`)
process.exit(found.length === 0 ? 0 : 1)
