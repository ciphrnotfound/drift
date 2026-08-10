const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const packagesDir = path.join(root, 'packages')
const repository = process.env.DRIFT_REPOSITORY || 'https://github.com/drift-framework/drift.git'
const repositoryPage = repository.replace(/\.git$/, '')

const keywords = [
  'drift',
  'react',
  'frontend',
  'framework',
  'compiler',
  'routing',
  'styling',
  'animation',
  'design-tokens',
  'vite',
]

for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const manifestPath = path.join(packagesDir, entry.name, 'package.json')
  if (!fs.existsSync(manifestPath)) continue

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.license = 'MIT'
  manifest.author = 'Drift contributors'
  manifest.repository = {
    type: 'git',
    url: repository,
    directory: `packages/${entry.name}`,
  }
  manifest.bugs = { url: `${repositoryPage}/issues` }
  manifest.homepage = `${repositoryPage}#readme`
  manifest.engines = { node: '>=18.0.0' }
  manifest.publishConfig = { access: 'public' }
  manifest.keywords = [...new Set([...(manifest.keywords || []), ...keywords])]

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Updated ${manifest.name}`)
}
