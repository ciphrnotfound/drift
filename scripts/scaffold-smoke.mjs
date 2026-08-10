import { existsSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const parent = join(root, 'example-app')
const name = 'drift-release-smoke'
const target = join(parent, name)
const cli = join(root, 'packages', 'cli', 'dist', 'cli.js')

if (!target.startsWith(`${parent}${process.platform === 'win32' ? '\\' : '/'}`)) {
  throw new Error('Refusing to create a scaffold smoke project outside example-app')
}

rmSync(target, { recursive: true, force: true })

try {
  run([cli, 'create', name, '--template', 'full', '--no-install'], parent)
  run([cli, 'build', '--target', 'vercel'], target)

  const configPath = join(target, '.vercel', 'output', 'config.json')
  if (!existsSync(configPath)) throw new Error('Generated app did not emit Vercel output')
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  if (config.version !== 3) throw new Error('Generated app emitted an unsupported Vercel output version')
  console.log('[scaffold] generated app build and Vercel output passed')
} finally {
  rmSync(target, { recursive: true, force: true })
}

function run(args, cwd) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`Scaffold command failed with exit code ${result.status}`)
}
