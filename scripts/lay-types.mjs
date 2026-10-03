// 给还没被引擎加载过的 mod 铺上类型文件，好让 tsc 能检查它。
// 正常情况下引擎每次从文件夹加载 mod 时会自己铺（.claude-plugin/types/），这个脚本只是开发时的捷径：
// 从一个已经铺好的 mod 复制引擎的类型，再放上 lemo-core 的合约。
//   node scripts/lay-types.mjs lemo-todo
import { cpSync, existsSync, mkdirSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mod = process.argv[2]
if (mod === undefined) {
  console.error('usage: node scripts/lay-types.mjs <mod>')
  process.exit(1)
}
const from = readdirSync(join(root, 'plugins'))
  .filter(m => m !== mod)
  .map(m => join(root, 'plugins', m, '.claude-plugin', 'types'))
  .find(p => existsSync(join(p, 'lemo-core', 'index.d.ts')))
if (from === undefined) {
  console.error('no mod has laid types yet: load the plugins folder once in a session (claude --plugin-dir plugins)')
  process.exit(1)
}
const to = join(root, 'plugins', mod, '.claude-plugin', 'types')
mkdirSync(to, { recursive: true })
for (const d of ['claude-code', 'claude-code-tools', 'claude-code-mcp', 'tsconfig.json']) cpSync(join(from, d), join(to, d), { recursive: true })
// 引擎自己铺的依赖合约是指向 lemo-core 的链接，本来就是最新的，不用再复制
const contract = join(root, 'plugins', 'lemo-core', 'types', 'index.d.ts')
const dest = join(to, 'lemo-core', 'index.d.ts')
if (!existsSync(dest) || realpathSync(dest) !== realpathSync(contract)) {
  mkdirSync(join(to, 'lemo-core'), { recursive: true })
  cpSync(contract, dest)
}
console.log(`laid types into plugins/${mod}/.claude-plugin/types`)
