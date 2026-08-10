import { afterEach, describe, expect, test } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { emitVercelOutput } from '../commands/vercel'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.promises.rm(root, { recursive: true, force: true })))
})

describe('Vercel deployment output', () => {
  test('emits Build Output API v3 with immutable assets and an SPA fallback', async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'drift-vercel-'))
    roots.push(root)
    await fs.promises.mkdir(path.join(root, 'dist', 'assets'), { recursive: true })
    await fs.promises.writeFile(path.join(root, 'dist', 'index.html'), '<main>Drift</main>')
    await fs.promises.writeFile(path.join(root, 'dist', 'assets', 'app.js'), 'export {}')

    const output = await emitVercelOutput({ rootDir: root, staticDir: 'dist', frameworkVersion: '1.2.3' })
    const config = JSON.parse(await fs.promises.readFile(path.join(output, 'config.json'), 'utf8'))

    expect(config.version).toBe(3)
    expect(config.framework.version).toBe('1.2.3')
    expect(config.routes).toContainEqual({ handle: 'filesystem' })
    expect(config.routes.at(-1)).toEqual({ src: '/.*', dest: '/index.html' })
    expect(await fs.promises.readFile(path.join(output, 'static', 'assets', 'app.js'), 'utf8')).toBe('export {}')
  })

  test('refuses to package a build without an application shell', async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'drift-vercel-'))
    roots.push(root)
    await fs.promises.mkdir(path.join(root, 'dist'))
    await expect(emitVercelOutput({ rootDir: root, staticDir: 'dist' })).rejects.toThrow('index.html')
  })
})
