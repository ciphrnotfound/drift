import { afterEach, describe, expect, test } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateRoutes } from '../generator'

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe('filesystem loader convention', () => {
  test('associates a colocated loader module with its route', () => {
    const directory = mkdtempSync(join(tmpdir(), 'drift-routes-'))
    directories.push(directory)
    writeFileSync(join(directory, 'index.drift'), 'component Index { render { <main /> } }')
    writeFileSync(join(directory, 'index.loader.ts'), 'export const loader = () => ({ ready: true })')

    const [route] = generateRoutes(directory)
    expect(route?.dataLoader).toMatchObject({
      functionName: 'loader',
      params: ['context'],
      returnType: 'unknown',
      filePath: join(directory, 'index.loader.ts'),
    })
  })
})
