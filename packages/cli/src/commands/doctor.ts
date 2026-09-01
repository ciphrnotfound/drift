import * as fs from 'node:fs'
import * as path from 'node:path'

export type DoctorLevel = 'error' | 'warning' | 'success'

export interface DoctorCheck {
  id: string
  level: DoctorLevel
  message: string
}

export interface DoctorReport {
  root: string
  checks: DoctorCheck[]
  ok: boolean
}

export interface DoctorOptions {
  json?: boolean
  strict?: boolean
}

/** Inspect a Drift project before development, CI, or deployment. */
export async function doctor(options: DoctorOptions = {}): Promise<DoctorReport> {
  const report = await inspectProject(process.cwd())

  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`\nDrift doctor: ${report.root}\n`)
    for (const check of report.checks) {
      const symbol = check.level === 'success' ? '✓' : check.level === 'warning' ? '!' : '✗'
      console.log(`  ${symbol} ${check.message}`)
    }
    console.log(`\n${report.ok ? 'Project is ready for Drift.' : 'Fix the errors above before continuing.'}\n`)
  }

  if (!report.ok || (options.strict && report.checks.some(check => check.level === 'warning'))) {
    process.exitCode = 1
  }

  return report
}

export async function inspectProject(root: string): Promise<DoctorReport> {
  const checks: DoctorCheck[] = []
  const packagePath = path.join(root, 'package.json')
  const configPath = path.join(root, 'drift.config.ts')
  const pagesDir = ['pages', path.join('src', 'pages')]
    .map(candidate => path.join(root, candidate))
    .find(candidate => fs.existsSync(candidate))

  const major = Number(process.versions.node.split('.')[0])
  checks.push(major >= 18
    ? success('node-version', `Node.js ${process.versions.node} is supported`)
    : error('node-version', `Node.js ${process.versions.node} is unsupported; Drift requires Node.js 18 or newer`))

  const packageJson = await readPackageJson(packagePath)
  if (!packageJson) {
    checks.push(error('package-json', 'package.json is missing or invalid'))
  } else {
    checks.push(success('package-json', 'package.json is valid'))
    const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) }
    for (const dependency of ['@drift/cli', '@drift/router', '@drift/vite-plugin']) {
      checks.push(dependencies[dependency]
        ? success(`dependency:${dependency}`, `${dependency} is installed`)
        : error(`dependency:${dependency}`, `${dependency} is missing from package.json`))
    }
  }

  if (fs.existsSync(configPath)) {
    checks.push(success('config', 'drift.config.ts was found'))
    const configSource = await fs.promises.readFile(configPath, 'utf8')
    if (isSSREnabled(configSource)) {
      const serverEntry = path.join(root, 'src', 'entry.server.tsx')
      checks.push(fs.existsSync(serverEntry)
        ? success('ssr-entry', 'SSR is enabled and src/entry.server.tsx was found')
        : error('ssr-entry', 'SSR is enabled but src/entry.server.tsx is missing'))
    }
  } else {
    checks.push(error('config', 'drift.config.ts is missing'))
  }

  if (pagesDir && await containsDriftFile(pagesDir)) {
    checks.push(success('routes', `Drift routes found in ${path.relative(root, pagesDir) || 'pages'}`))
  } else {
    checks.push(warning('routes', 'No .drift route files were found; create pages/index.drift to enable file-based routing'))
  }

  const vercelConfig = path.join(root, 'vercel.json')
  checks.push(fs.existsSync(vercelConfig)
    ? success('vercel-config', 'vercel.json was found')
    : warning('vercel-config', 'No vercel.json found; use `drift build --target vercel` and deploy the generated output'))

  return { root, checks, ok: !checks.some(check => check.level === 'error') }
}

async function readPackageJson(filePath: string): Promise<Record<string, any> | null> {
  try {
    return JSON.parse(await fs.promises.readFile(filePath, 'utf8'))
  } catch {
    return null
  }
}

async function containsDriftFile(directory: string): Promise<boolean> {
  const entries = await fs.promises.readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.drift')) return true
    if (entry.isDirectory() && await containsDriftFile(path.join(directory, entry.name))) return true
  }
  return false
}

function isSSREnabled(config: string): boolean {
  return /ssr\s*:\s*\{[\s\S]*?enabled\s*:\s*true/.test(config)
}

function success(id: string, message: string): DoctorCheck {
  return { id, level: 'success', message }
}

function warning(id: string, message: string): DoctorCheck {
  return { id, level: 'warning', message }
}

function error(id: string, message: string): DoctorCheck {
  return { id, level: 'error', message }
}
