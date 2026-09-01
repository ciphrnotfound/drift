import { afterEach, describe, expect, test } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { inspectProject } from '../commands/doctor'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.promises.rm(root, { recursive: true, force: true })))
})

describe('drift doctor', () => {
  test('accepts a configured project with routes and an SSR entry', async () => {
    const root = await fixture({ ssr: true })
    const report = await inspectProject(root)

    expect(report.ok).toBe(true)
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'ssr-entry', level: 'success' }))
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'routes', level: 'success' }))
  })

  test('reports missing SSR entry and required Drift packages', async () => {
    const root = await fixture({ ssr: true, dependencies: {} })
    const report = await inspectProject(root)

    expect(report.ok).toBe(false)
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'ssr-entry', level: 'error' }))
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'dependency:@drift/cli', level: 'error' }))
  })
})

async function fixture(options: { ssr?: boolean; dependencies?: Record<string, string> } = {}): Promise<string> {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'drift-doctor-'))
  roots.push(root)
  const dependencies = options.dependencies ?? {
    '@drift/cli': '^0.1.0',
    '@drift/router': '^0.1.0',
    '@drift/vite-plugin': '^0.1.0',
  }
  await fs.promises.mkdir(path.join(root, 'pages'), { recursive: true })
  await fs.promises.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', devDependencies: dependencies }))
  await fs.promises.writeFile(path.join(root, 'drift.config.ts'), options.ssr ? 'export default { ssr: { enabled: true } }' : 'export default {}')
  await fs.promises.writeFile(path.join(root, 'pages', 'index.drift'), 'component Home { render { <main /> } }')
  if (options.ssr && Object.keys(dependencies).length > 0) {
    await fs.promises.mkdir(path.join(root, 'src'), { recursive: true })
    await fs.promises.writeFile(path.join(root, 'src', 'entry.server.tsx'), 'export async function render() {}')
  }
  return root
}
