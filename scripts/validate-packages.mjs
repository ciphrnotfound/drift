import { mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
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

function run(command, args, cwd) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd, shell: process.platform === 'win32' })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', rejectRun)
    child.on('exit', (code) => {
      if (code === 0) resolveRun({ stdout, stderr })
      else rejectRun(new Error(`${command} ${args.join(' ')} failed:\n${stdout}${stderr}`))
    })
  })
}

function exportedPaths(manifest) {
  const paths = new Set()
  for (const field of ['main', 'module', 'types']) {
    if (typeof manifest[field] === 'string') paths.add(manifest[field])
  }
  for (const target of Object.values(manifest.bin || {})) paths.add(target)

  function visit(value) {
    if (typeof value === 'string') {
      paths.add(value)
      return
    }
    if (value && typeof value === 'object') Object.values(value).forEach(visit)
  }
  visit(manifest.exports)
  return [...paths]
}

const scratch = await mkdtemp(join(tmpdir(), 'drift-pack-'))

try {
  for (const folder of packageFolders) {
    const cwd = join(root, 'packages', folder)
    const destination = join(scratch, folder)
    await mkdir(destination)
    await run('pnpm', ['pack', '--pack-destination', destination], cwd)

    const files = await readdir(destination)
    const archive = join(destination, files.find((file) => file.endsWith('.tgz')))
    const unpacked = join(destination, 'unpacked')
    await mkdir(unpacked)
    await run('tar', ['-xzf', archive, '-C', unpacked], root)

    const packageRoot = join(unpacked, 'package')
    const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
    const serialized = JSON.stringify(manifest)
    if (serialized.includes('workspace:')) {
      throw new Error(`${manifest.name} contains an unresolved workspace dependency`)
    }
    if (!manifest.license || !manifest.repository || !manifest.publishConfig) {
      throw new Error(`${manifest.name} is missing public release metadata`)
    }

    for (const relativePath of exportedPaths(manifest)) {
      await stat(join(packageRoot, relativePath))
    }

    console.log(`[pack] ${manifest.name}@${manifest.version} is valid (${basename(archive)})`)
  }
} finally {
  await rm(scratch, { recursive: true, force: true })
}

console.log('[pack] All package tarballs passed validation.')
