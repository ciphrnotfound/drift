import { afterEach, describe, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { drift } from '../index'

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe('virtual route manifest', () => {
  test('emits lazy route chunks and colocated loader imports', async () => {
    const root = mkdtempSync(join(tmpdir(), 'drift-vite-routes-'))
    directories.push(root)
    mkdirSync(join(root, 'pages'))
    writeFileSync(join(root, 'pages', 'index.drift'), 'component Index { render { <main /> } }')
    writeFileSync(join(root, 'pages', 'index.loader.ts'), 'export const loader = () => ({ ready: true })')

    const plugin = drift()
    const watcher = { add: vi.fn() }
    ;(plugin.configureServer as (server: unknown) => void)?.({ config: { root }, watcher })
    const resolved = (plugin.resolveId as (id: string) => string)('virtual:drift-routes')
    const code = await (plugin.load as (id: string) => Promise<string>)(resolved)

    expect(code).toContain('lazy: async () =>')
    expect(code).toContain("import('./pages/index.drift')")
    expect(code).toContain("import('./pages/index.loader.ts')")
    expect(code).not.toMatch(/^import\s/m)
    expect(code).not.toContain(root)
  })
})
