import { copyFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const node = process.execPath
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc')
const vitest = join(root, 'node_modules', 'vitest', 'vitest.mjs')
const tsup = join(root, 'node_modules', 'tsup', 'dist', 'cli-default.js')
const playwright = join(root, 'node_modules', '@playwright', 'test', 'cli.js')
const budgets = join(root, 'scripts', 'check-budgets.mjs')
const scaffoldSmoke = join(root, 'scripts', 'scaffold-smoke.mjs')

const packageNames = [
  'types',
  'compiler',
  'font',
  'motion',
  'motion-runtime',
  'router',
  'server',
  'seo',
  'style',
  'tokens',
  'ui',
  'vite-plugin',
  'cli',
]

function run(label, args, cwd = root) {
  process.stdout.write(`\n[release] ${label}\n`)

  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(node, args, { cwd, stdio: 'inherit' })
    child.on('error', rejectRun)
    child.on('exit', (code) => {
      if (code === 0) resolveRun()
      else rejectRun(new Error(`${label} failed with exit code ${code ?? 'unknown'}`))
    })
  })
}

async function runBatches(items, size, execute) {
  for (let index = 0; index < items.length; index += size) {
    await Promise.all(items.slice(index, index + size).map(execute))
  }
}

async function typecheck() {
  const projects = [
    ...packageNames.map((name) => ({ name, config: join(root, 'packages', name, 'tsconfig.json') })),
    { name: 'example-app', config: join(root, 'example-app', 'tsconfig.json') },
  ]

  await runBatches(projects, 1, ({ name, config }) =>
    run(`typecheck ${name}`, [tsc, '-p', config, '--noEmit'])
  )
}

async function test() {
  await run('test suite', [vitest, 'run'])
}

async function e2e() {
  await run('browser end-to-end suite', [playwright, 'test'])
}

async function checkBudgets() {
  await run('bundle budgets', [budgets])
}

async function build() {
  const levels = [
    ['types', 'motion-runtime'],
    ['style', 'tokens', 'font', 'motion', 'ui', 'router', 'seo', 'server'],
    ['compiler'],
    ['vite-plugin'],
    ['cli'],
  ]

  for (const level of levels) {
    await runBatches(level, 2, (name) =>
      run(`build ${name}`, [tsup], join(root, 'packages', name))
    )
  }

  copyFileSync(
    join(root, 'packages', 'ui', 'src', 'styles.css'),
    join(root, 'packages', 'ui', 'dist', 'styles.css')
  )
  await run(
    'build example-app',
    [join(root, 'packages', 'cli', 'dist', 'cli.js'), 'build'],
    join(root, 'example-app')
  )
  await run('generated app deployment smoke', [scaffoldSmoke])
}

const requested = new Set(process.argv.slice(2))
const runAll = requested.size === 0

try {
  if (runAll || requested.has('--typecheck')) await typecheck()
  if (runAll || requested.has('--test')) await test()
  if (runAll || requested.has('--build')) await build()
  if (runAll || requested.has('--budgets')) await checkBudgets()
  if (runAll || requested.has('--e2e')) await e2e()
  process.stdout.write('\n[release] All requested checks passed.\n')
} catch (error) {
  console.error(`\n[release] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
