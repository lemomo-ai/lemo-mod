// 一次检查所有 mod：公共代码副本是否同步，然后每个 mod 跑 validate、tsc、test。
//   node scripts/check-all.mjs            全部
//   node scripts/check-all.mjs lemo-todo  只查一个（可以写多个）
// 类型检查要先铺好类型（引擎加载过一次，或 node scripts/lay-types.mjs <mod>）。
import { execFile } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const all = readdirSync(join(root, 'plugins')).filter(m => existsSync(join(root, 'plugins', m, '.claude-plugin', 'plugin.json')))
const mods = process.argv.length > 2 ? process.argv.slice(2) : all
const bunx = join(homedir(), '.bun', 'bin', 'bunx')
// 锁定 TypeScript 版本（本机缓存的就是这一版），不每次取最新的
const TS = 'typescript@7.0.2'
const tsc = existsSync(bunx) ? [bunx, ['-p', TS, 'tsc', '-p', '.']] : ['npx', ['-y', '-p', TS, 'tsc', '-p', '.']]

async function step(cmd, args, cwd) {
  try {
    const { stdout, stderr } = await run(cmd, args, { cwd, maxBuffer: 1 << 24 })
    return { ok: true, out: `${stdout}${stderr}` }
  } catch (err) {
    return { ok: false, out: `${err.stdout ?? ''}${err.stderr ?? ''}${err.stdout || err.stderr ? '' : String(err)}` }
  }
}

const sync = await step('node', [join(root, 'scripts', 'sync-shared.mjs'), '--check'], root)
console.log(`${sync.ok ? '✔' : '✘'} sync-shared --check`)
if (!sync.ok) console.log(sync.out)

let failed = sync.ok ? 0 : 1

// 安全守则的代码检查（SAFETY.md）：不替用户做权限决定、不改设置、不起程序……
const safety = await step('node', [join(root, 'scripts', 'check-safety.mjs')], root)
process.stdout.write(safety.out)
if (!safety.ok) failed += 1

// marketplace.json 要列出每个插件，说明和各自 plugin.json 里的一样（/plugin 里看到的是 marketplace 的说明）
const market = JSON.parse(readFileSync(join(root, '.claude-plugin', 'marketplace.json'), 'utf8'))
const listed = new Map(market.plugins.map(p => [p.name, p]))
const drift = all.flatMap(m => {
  const own = JSON.parse(readFileSync(join(root, 'plugins', m, '.claude-plugin', 'plugin.json'), 'utf8'))
  const entry = listed.get(m)
  if (entry === undefined) return [`${m} is not in marketplace.json`]
  if (entry.source !== `./plugins/${m}`) return [`${m}: source should be ./plugins/${m}`]
  if (entry.description !== own.description) return [`${m}: description differs from its plugin.json`]
  return []
})
console.log(`${drift.length === 0 ? '✔' : '✘'} marketplace.json`)
for (const d of drift) console.log(`    ${d}`)
failed += drift.length

// tsc 一个一个跑：bunx 每次都重新装 typescript，几个 mod 同时装会抢同一个临时目录，tsc 随机报找不到
let tscTurn = Promise.resolve()
function tscOne(dir) {
  const p = tscTurn.then(() => step(tsc[0], tsc[1], dir))
  tscTurn = p.then(() => undefined)
  return p
}

const results = await Promise.all(mods.map(async mod => {
  const dir = join(root, 'plugins', mod)
  const out = []
  const v = await step('claude', ['plugin', 'validate', dir], root)
  out.push({ name: 'validate', ...v })
  const hasHooks = existsSync(join(dir, 'tsconfig.json'))
  if (hasHooks) out.push({ name: 'tsc', ...(await tscOne(dir)) })
  const hasTests = existsSync(join(dir, 'tests'))
  if (hasTests) out.push({ name: 'test', ...(await step('claude', ['plugin', 'test', dir], root)) })
  return { mod, out }
}))

for (const { mod, out } of results) {
  const bad = out.filter(s => !s.ok)
  const test = out.find(s => s.name === 'test')
  const count = test === undefined ? '' : ` (${(/(\d+) pass/.exec(test.out) ?? [, '?'])[1]} pass)`
  console.log(`${bad.length === 0 ? '✔' : '✘'} ${mod}: ${out.map(s => `${s.name}${s.ok ? '' : ' ✘'}`).join(', ')}${count}`)
  for (const s of bad) console.log(s.out.split('\n').map(l => `    ${l}`).join('\n'))
  failed += bad.length
}
process.exit(failed === 0 ? 0 : 1)
