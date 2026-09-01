import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const exampleApp = join(root, 'example-app')
const node = process.execPath
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const cli = join(root, 'packages', 'cli', 'dist', 'cli.js')

function run(command, args, cwd = root, shell = false) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell,
    })
    child.on('error', rejectRun)
    child.on('exit', (code) => {
      if (code === 0) resolveRun()
      else rejectRun(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`))
    })
  })
}

// Build workspace dependencies first so the CLI and compiler exist before the app compiles.
await run(pnpm, ['-r', '--sort', '--if-present', 'run', 'build'], root, process.platform === 'win32')
await run(node, [cli, 'build', '--target', 'vercel'], exampleApp)

const rootOutput = join(root, '.vercel', 'output')
await rm(rootOutput, { recursive: true, force: true })
await mkdir(dirname(rootOutput), { recursive: true })
await cp(join(exampleApp, '.vercel', 'output'), rootOutput, { recursive: true })
console.log(`[vercel] Build Output API artifact ready at ${rootOutput}`)
