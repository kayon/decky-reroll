// Runs the tests of the pure logic of the plugin (src/lib/*.ts) with node:test
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = mkdtempSync(join(tmpdir(), 'reroll-tests-'))

// the modules the tests need, and only modules without framework imports
const modules = ['src/classes.ts', 'src/lib/candidates.ts', 'src/lib/multi.ts', 'src/lib/timeout.ts', 'src/lib/gradient.ts']

for (const file of modules) {
  const source = readFileSync(join(root, file), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  // node needs the extension of relative imports
  const js = outputText.replace(/from '(\.\.?\/[^']+)'/g, "from '$1.js'")
  const target = join(out, file.replace(/\.ts$/, '.js'))
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, js)
}
writeFileSync(join(out, 'package.json'), JSON.stringify({ type: 'module' }))

const testsDir = join(out, 'tests')
mkdirSync(testsDir)
for (const name of readdirSync(join(root, 'tests')).filter(n => n.endsWith('.test.mjs'))) {
  cpSync(join(root, 'tests', name), join(testsDir, name))
}

const result = spawnSync(process.execPath, ['--test', testsDir], { stdio: 'inherit' })
rmSync(out, { recursive: true, force: true })
process.exit(result.status ?? 1)
