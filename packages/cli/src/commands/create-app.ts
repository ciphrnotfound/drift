import * as fs from 'node:fs'
import * as path from 'node:path'
import { execFileSync } from 'node:child_process'
import * as readline from 'node:readline'

export type DriftTemplate = 'minimal' | 'default' | 'full'

export interface CreateAppOptions {
  template?: DriftTemplate
  npm?: boolean
  yarn?: boolean
  pnpm?: boolean
  install?: boolean
}

export async function createApp(name: string | undefined, options: CreateAppOptions) {
  const projectName = validateProjectName(name || await promptForProjectName())
  const template = validateTemplate(options.template || 'default')
  const packageManager = detectPackageManager(options)
  const projectDir = path.resolve(process.cwd(), projectName)

  await scaffoldApp(projectDir, template)

  console.log(`\nCreated Drift app ${projectName} with the ${template} template.`)
  if (options.install !== false) {
    console.log(`Installing dependencies with ${packageManager}...`)
    installDependencies(projectDir, packageManager)
  }
  console.log(`\nNext:\n  cd ${projectName}\n  ${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev\n`)
}

export async function scaffoldApp(projectDir: string, template: DriftTemplate = 'default') {
  assertEmptyTarget(projectDir)
  await Promise.all([
    fs.promises.mkdir(path.join(projectDir, 'src'), { recursive: true }),
    fs.promises.mkdir(path.join(projectDir, 'pages'), { recursive: true }),
    fs.promises.mkdir(path.join(projectDir, 'public'), { recursive: true }),
  ])
  if (template === 'full') await fs.promises.mkdir(path.join(projectDir, 'layouts'), { recursive: true })

  const files: Record<string, string> = {
    'package.json': `${JSON.stringify(packageJson(path.basename(projectDir)), null, 2)}\n`,
    'drift.config.ts': driftConfig,
    'drift.tokens': driftTokens,
    'tsconfig.json': `${JSON.stringify(tsConfig, null, 2)}\n`,
    'vite.config.ts': viteConfig,
    'index.html': indexHtml,
    '.gitignore': gitignore,
    'src/main.tsx': mainSource,
    'src/vite-env.d.ts': viteTypes,
    'src/global.css': globalCss,
    'pages/index.drift': homePage,
  }

  if (template !== 'minimal') files['pages/about.drift'] = aboutPage
  if (template === 'full') files['layouts/root.drift'] = rootLayout

  await Promise.all(Object.entries(files).map(async ([relativePath, fileContent]) => {
    const filePath = path.join(projectDir, relativePath)
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
    await fs.promises.writeFile(filePath, fileContent, 'utf8')
  }))
}

function packageJson(name: string) {
  return {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'drift dev',
      build: 'drift build',
      'build:vercel': 'drift build --target vercel',
      export: 'drift export',
    },
    dependencies: {
      '@drift/font': '^0.1.0',
      '@drift/router': '^0.1.0',
      '@drift/server': '^0.1.0',
      '@drift/ui': '^0.1.0',
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'framer-motion': '^10.18.0',
    },
    devDependencies: {
      '@drift/cli': '^0.1.0',
      '@drift/compiler': '^0.1.0',
      '@drift/types': '^0.1.0',
      '@drift/vite-plugin': '^0.1.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.7.0',
      typescript: '^5.3.0',
      vite: '^6.4.3',
    },
  }
}

const driftConfig = `import type { DriftConfig } from '@drift/types'

export default {
  compiler: { target: 'es2020', jsx: 'react-jsx', sourceMaps: true },
  styles: { scoping: 'component', prefix: 'drift' },
  build: { outDir: 'dist', sourcemap: false },
  router: { basePath: '/' },
  dev: { port: 3000, host: 'localhost', open: false },
} satisfies DriftConfig
`

const driftTokens = `colors {
  primary.500: #2563eb
  primary.600: #1d4ed8
  ink: #0f172a
  muted: #475569
  surface: #ffffff
}

spacing {
  scale: 1.5
  base: 4px
}

typography {
  scale: 1.25
  base: 16px
  family.sans: Manrope, ui-sans-serif, system-ui, sans-serif
}

borders {
  radius.sm: 4px
  radius.md: 8px
}
`

const tsConfig = {
  compilerOptions: {
    target: 'ES2020',
    useDefineForClassFields: true,
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
  },
  include: ['src', 'pages', 'layouts'],
}

const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { drift } from '@drift/vite-plugin'

export default defineConfig({
  plugins: [react(), drift({ tokensPath: './drift.tokens' })],
})
`

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="A frontend built with Drift." />
    <title>Drift App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

const gitignore = `node_modules
dist
out
.vercel
.env*
!.env.example
*.log
`

const mainSource = `import React from 'react'
import ReactDOM from 'react-dom/client'
import { Router } from '@drift/router/client'
import { routes, layouts } from 'virtual:drift-routes'
import './global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router routes={routes} layouts={layouts} />
  </React.StrictMode>
)
`

const viteTypes = `/// <reference types="vite/client" />

declare module 'virtual:drift-routes' {
  import type { LayoutConfig, RouteConfig } from '@drift/types'
  export const routes: RouteConfig[]
  export const layouts: LayoutConfig[]
}
`

const globalCss = `* { box-sizing: border-box; }
html { color-scheme: light; font-family: Manrope, ui-sans-serif, system-ui, sans-serif; }
body { margin: 0; color: #0f172a; background: #fff; }
a { color: inherit; }
`

const homePage = `component HomePage {
  metadata {
    title: "Drift App"
    description: "A fast, typed frontend built with Drift."
  }

  style {
    layout: col center
    min-height: 100vh
    pad: $space.6
    text-align: center
  }

  render {
    <main>
      <h1>Welcome to Drift</h1>
      <p>Edit pages/index.drift to start building.</p>
      <a href="/about">Read more</a>
    </main>
  }
}
`

const aboutPage = `component AboutPage {
  metadata {
    title: "About - Drift App"
    description: "Learn about this Drift application."
  }

  style {
    layout: col center
    min-height: 100vh
    pad: $space.6
  }

  render {
    <main>
      <h1>About</h1>
      <p>This route was generated from pages/about.drift.</p>
      <a href="/">Return home</a>
    </main>
  }
}
`

const rootLayout = `component RootLayout {
  props {
    children: ReactNode
  }

  render {
    <div>{children}</div>
  }
}
`

function validateProjectName(name: string): string {
  const trimmed = name.trim()
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(trimmed) || trimmed === '.' || trimmed === '..') {
    throw new Error('Project name may contain letters, numbers, dots, underscores, and dashes.')
  }
  return trimmed
}

function validateTemplate(template: string): DriftTemplate {
  if (!['minimal', 'default', 'full'].includes(template)) throw new Error(`Unknown Drift template: ${template}`)
  return template as DriftTemplate
}

function assertEmptyTarget(projectDir: string) {
  if (!fs.existsSync(projectDir)) return
  if (fs.readdirSync(projectDir).length > 0) throw new Error(`Target directory is not empty: ${projectDir}`)
}

function detectPackageManager(options: CreateAppOptions): 'npm' | 'yarn' | 'pnpm' {
  if (options.npm) return 'npm'
  if (options.yarn) return 'yarn'
  if (options.pnpm) return 'pnpm'
  if (fs.existsSync('yarn.lock')) return 'yarn'
  if (fs.existsSync('package-lock.json')) return 'npm'
  return 'pnpm'
}

function installDependencies(projectDir: string, packageManager: 'npm' | 'yarn' | 'pnpm') {
  try {
    execFileSync(packageManager, ['install'], { cwd: projectDir, stdio: 'inherit', shell: process.platform === 'win32' })
  } catch {
    console.warn(`Dependency installation did not complete. Run ${packageManager} install in ${projectDir}.`)
  }
}

async function promptForProjectName(): Promise<string> {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => prompt.question('Project name: ', answer => {
    prompt.close()
    resolve(answer.trim() || 'my-drift-app')
  }))
}
