// 把 shared/ 里的公共代码复制进每个 mod（插件只能读自己文件夹里的文件，所以每个 mod 带一份副本）。
//   node scripts/sync-shared.mjs          复制
//   node scripts/sync-shared.mjs --check  只检查副本和 shared/ 是否一致，不一致就退出 1
//   node scripts/sync-shared.mjs --only lemo-x   只处理一个 mod（几个人同时写不同的 mod 时用，免得互相覆盖）
//
// 三样东西：
//   shared/lemo.tsx        → plugins/<mod>/hooks/shared/lemo.tsx
//   shared/test-core.tsx   → plugins/<mod>/tests/shared/test-core.tsx（lemo-core 自己不要）
//   shared/test-colors.tsx → plugins/<mod>/tests/shared/test-colors.tsx（终端颜色检查，每个 mod 的测试都用）
//   shared/lemo-block.tsx  → 插进 plugins/<mod>/hooks/register.tsx 里 BEGIN、END 两行标记之间
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const onlyAt = process.argv.indexOf('--only')
const only = onlyAt < 0 ? null : process.argv[onlyAt + 1]
const BEGIN = '// ---- lemo-shared BEGIN: 由 scripts/sync-shared.mjs 从 shared/lemo-block.tsx 复制，不要在这里改 ----'
const END = '// ---- lemo-shared END ----'
const COPIES = [
  ['shared/lemo.tsx', 'hooks/shared/lemo.tsx', new Set(['lemo-mod'])],
  ['shared/test-core.tsx', 'tests/shared/test-core.tsx', new Set(['lemo-mod', 'lemo-core'])],
  ['shared/test-colors.tsx', 'tests/shared/test-colors.tsx', new Set(['lemo-mod'])],
]
const block = readFileSync(join(root, 'shared/lemo-block.tsx'), 'utf8')
let bad = 0

function put(path, text, label) {
  const cur = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (cur === text) return
  if (check) {
    console.error(`out of sync: ${label}`)
    bad += 1
    return
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
  console.log(`updated ${label}`)
}

for (const mod of readdirSync(join(root, 'plugins'))) {
  if (only !== null && mod !== only) continue
  if (!existsSync(join(root, 'plugins', mod, '.claude-plugin', 'plugin.json'))) continue
  for (const [from, to, skip] of COPIES) {
    if (skip.has(mod)) continue
    put(join(root, 'plugins', mod, to), readFileSync(join(root, from), 'utf8'), `plugins/${mod}/${to}`)
  }
  const reg = join(root, 'plugins', mod, 'hooks', 'register.tsx')
  if (!existsSync(reg)) continue
  const src = readFileSync(reg, 'utf8')
  const a = src.indexOf(BEGIN)
  const b = src.indexOf(END)
  if (a < 0 || b < a) {
    // 有 register.tsx 却没有两行标记：公共的 look、seqOf、hubTab 插不进去，报出来
    console.error(`missing markers: plugins/${mod}/hooks/register.tsx has no lemo-shared BEGIN/END lines`)
    bad += 1
    continue
  }
  put(reg, src.slice(0, a + BEGIN.length) + '\n' + block + src.slice(b), `plugins/${mod}/hooks/register.tsx (block)`)
}
if (bad > 0) process.exit(1)
