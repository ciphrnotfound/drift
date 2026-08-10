import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const otp = process.env.NPM_OTP || process.env.NPM_CONFIG_OTP || ''
const packageFolders = [
  'types',
  'motion-runtime',
  'font',
  'style',
  'tokens',
  'motion',
  'seo',
  'server',
  'router',
  'ui',
  'compiler',
  'vite-plugin',
  'cli',
  'create-drift-app',
]

function run(command, args, cwd = root, capture = false) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd,
      shell: process.platform === 'win32',
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    })
    let output = ''
    if (capture) {
      child.stdout.on('data', (chunk) => { output += chunk })
      child.stderr.on('data', (chunk) => { output += chunk })
    }
    child.on('error', rejectRun)
    child.on('exit', (code) => {
      if (code === 0) resolveRun(output.trim())
      else rejectRun(new Error(capture ? output.trim() : `${command} exited with ${code}`))
    })
  })
}

try {
  const user = await run('npm', ['whoami'], root, true)
  console.log(`[publish] Authenticated as ${user}`)
} catch {
  console.error('[publish] npm authentication is required. Run `npm login` and retry.')
  process.exit(1)
}

for (const folder of packageFolders) {
  const cwd = join(root, 'packages', folder)
  const manifest = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))
  const spec = `${manifest.name}@${manifest.version}`

  try {
    await run('npm', ['view', spec, 'version'], root, true)
    console.log(`[publish] ${spec} already exists; skipping.`)
    continue
  } catch {
    // A missing version is the normal path for a new release.
  }

  console.log(`[publish] Publishing ${spec}...`)
  const publishArgs = ['publish', '--access', 'public', '--no-git-checks']
  if (otp) publishArgs.push('--otp', otp)
  await run('pnpm', publishArgs, cwd)
}

console.log('[publish] All Drift packages are available on npm.')
