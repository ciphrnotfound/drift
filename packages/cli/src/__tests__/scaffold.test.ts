import { afterEach, describe, expect, test } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { compile } from '@drift/compiler'
import { scaffoldApp } from '../commands/create-app'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.promises.rm(root, { recursive: true, force: true })))
})

describe('create app scaffold', () => {
  test('generates buildable route locations and valid Drift source', async () => {
    const root = path.join(await fs.promises.mkdtemp(path.join(os.tmpdir(), 'create-drift-')), 'app')
    roots.push(path.dirname(root))
    await scaffoldApp(root, 'full')

    const main = await fs.promises.readFile(path.join(root, 'src', 'main.tsx'), 'utf8')
    const home = await fs.promises.readFile(path.join(root, 'pages', 'index.drift'), 'utf8')
    const layout = await fs.promises.readFile(path.join(root, 'layouts', 'root.drift'), 'utf8')
    const packageJson = JSON.parse(await fs.promises.readFile(path.join(root, 'package.json'), 'utf8'))

    expect(main).toContain("from 'virtual:drift-routes'")
    expect(compile(home, { filename: 'pages/index.drift' }).errors).toEqual([])
    expect(compile(layout, { filename: 'layouts/root.drift' }).errors).toEqual([])
    expect(packageJson.scripts['build:vercel']).toBe('drift build --target vercel')
  })

  test('refuses to overwrite an existing project', async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'create-drift-'))
    roots.push(root)
    await fs.promises.writeFile(path.join(root, 'keep.txt'), 'keep')
    await expect(scaffoldApp(root)).rejects.toThrow('not empty')
  })
})
