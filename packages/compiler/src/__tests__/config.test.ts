import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadConfig, getDefaultConfig } from '../config'
import type { DriftConfig } from '@drift/types'

describe('Configuration System', () => {
  let testDir: string

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'drift-config-test-'))
  })

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {
      // Windows can briefly retain imported config files; the OS temp cleaner is the fallback.
    }
  })

  describe('Default Configuration', () => {
    test('returns default configuration values', () => {
      const config = getDefaultConfig()

      expect(config.compiler.target).toBe('es2020')
      expect(config.compiler.jsx).toBe('react-jsx')
      expect(config.compiler.sourceMaps).toBe(true)
      expect(config.compiler.minify).toBe(false)

      expect(config.styles.scoping).toBe('component')
      expect(config.styles.prefix).toBe('drift')
      expect(config.styles.extractCSS).toBe(true)
      expect(config.styles.optimizeCSS).toBe(false)
      expect(config.styles.criticalCSS).toBe(false)

      expect(config.breakpoints.sm).toBe(640)
      expect(config.breakpoints.md).toBe(768)
      expect(config.breakpoints.lg).toBe(1024)
      expect(config.breakpoints.xl).toBe(1280)
      expect(config.breakpoints['2xl']).toBe(1536)

      expect(config.motion.reducedMotion).toBe('respect')
      expect(config.motion.defaultDuration).toBe(300)
      expect(config.motion.defaultEasing).toBe('ease-in-out')

      expect(config.router.basePath).toBe('/')
      expect(config.router.trailingSlash).toBe(false)
      expect(config.router.caseSensitive).toBe(false)

      expect(config.build.outDir).toBe('dist')
      expect(config.build.assetsDir).toBe('assets')
      expect(config.build.publicPath).toBe('/')
      expect(config.build.sourcemap).toBe(false)

      expect(config.dev.port).toBe(3000)
      expect(config.dev.host).toBe('localhost')
      expect(config.dev.open).toBe(false)
      expect(config.dev.https).toBe(false)
    })
  })

  describe('Configuration Loading', () => {
    test('loads configuration from drift.config.ts', async () => {
      const configContent = `
        export default {
          compiler: {
            target: 'esnext',
            minify: true
          },
          dev: {
            port: 4000
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      const config = await loadConfig(testDir)

      expect(config.compiler.target).toBe('esnext')
      expect(config.compiler.minify).toBe(true)
      expect(config.dev.port).toBe(4000)
      // Defaults should still be applied
      expect(config.compiler.jsx).toBe('react-jsx')
      expect(config.styles.scoping).toBe('component')
    })

    test('loads configuration from drift.config.js', async () => {
      const configContent = `
        module.exports = {
          styles: {
            scoping: 'global'
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.js'), configContent)

      const config = await loadConfig(testDir)

      expect(config.styles.scoping).toBe('global')
    })

    test('returns default config when no config file exists', async () => {
      const config = await loadConfig(testDir)

      expect(config.compiler.target).toBe('es2020')
      expect(config.dev.port).toBe(3000)
    })

    test('includes root and cacheDir in resolved config', async () => {
      const config = await loadConfig(testDir)

      expect(config.root).toBe(testDir)
      expect(config.cacheDir).toContain('node_modules')
      expect(config.cacheDir).toContain('.drift')
    })
  })

  describe('Configuration Validation', () => {
    test('validates compiler.target', async () => {
      const configContent = `
        export default {
          compiler: {
            target: 'invalid'
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid target')
      await expect(loadConfig(testDir)).rejects.toThrow('compiler.target')
    })

    test('validates compiler.jsx', async () => {
      const configContent = `
        export default {
          compiler: {
            jsx: 'invalid'
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid jsx mode')
      await expect(loadConfig(testDir)).rejects.toThrow('compiler.jsx')
    })

    test('validates styles.scoping', async () => {
      const configContent = `
        export default {
          styles: {
            scoping: 'invalid'
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid scoping')
      await expect(loadConfig(testDir)).rejects.toThrow('styles.scoping')
    })

    test('validates breakpoint values are positive numbers', async () => {
      const configContent = `
        export default {
          breakpoints: {
            mobile: -100
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid breakpoint value')
      await expect(loadConfig(testDir)).rejects.toThrow('breakpoints.mobile')
    })

    test('validates motion.reducedMotion', async () => {
      const configContent = `
        export default {
          motion: {
            reducedMotion: 'invalid'
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid reducedMotion')
      await expect(loadConfig(testDir)).rejects.toThrow('motion.reducedMotion')
    })

    test('validates motion.defaultDuration is positive', async () => {
      const configContent = `
        export default {
          motion: {
            defaultDuration: -100
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid defaultDuration')
      await expect(loadConfig(testDir)).rejects.toThrow('motion.defaultDuration')
    })

    test('validates router.basePath starts with /', async () => {
      const configContent = `
        export default {
          router: {
            basePath: 'invalid'
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid basePath')
      await expect(loadConfig(testDir)).rejects.toThrow('router.basePath')
    })

    test('validates build.outDir does not contain ..', async () => {
      const configContent = `
        export default {
          build: {
            outDir: '../outside'
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid outDir')
      await expect(loadConfig(testDir)).rejects.toThrow('build.outDir')
    })

    test('validates build.assetsDir does not contain ..', async () => {
      const configContent = `
        export default {
          build: {
            assetsDir: '../outside'
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid assetsDir')
      await expect(loadConfig(testDir)).rejects.toThrow('build.assetsDir')
    })

    test('validates dev.port is in valid range', async () => {
      const configContent = `
        export default {
          dev: {
            port: 99999
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid port')
      await expect(loadConfig(testDir)).rejects.toThrow('dev.port')
    })

    test('validates dev.port is not zero', async () => {
      const configContent = `
        export default {
          dev: {
            port: 0
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow('Invalid port')
      await expect(loadConfig(testDir)).rejects.toThrow('dev.port')
    })
  })

  describe('Configuration Merging', () => {
    test('merges user config with defaults', async () => {
      const configContent = `
        export default {
          compiler: {
            minify: true
          },
          breakpoints: {
            mobile: 320,
            tablet: 768
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      const config = await loadConfig(testDir)

      // User values
      expect(config.compiler.minify).toBe(true)
      expect(config.breakpoints.mobile).toBe(320)
      expect(config.breakpoints.tablet).toBe(768)

      // Default values preserved
      expect(config.compiler.target).toBe('es2020')
      expect(config.compiler.jsx).toBe('react-jsx')
      expect(config.breakpoints.sm).toBe(640)
      expect(config.breakpoints.md).toBe(768)
    })

    test('allows overriding all default breakpoints', async () => {
      const configContent = `
        export default {
          breakpoints: {
            xs: 320,
            sm: 480,
            md: 768,
            lg: 1024,
            xl: 1440
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      const config = await loadConfig(testDir)

      expect(config.breakpoints.xs).toBe(320)
      expect(config.breakpoints.sm).toBe(480)
      expect(config.breakpoints.md).toBe(768)
      expect(config.breakpoints.lg).toBe(1024)
      expect(config.breakpoints.xl).toBe(1440)
    })
  })

  describe('Error Handling', () => {
    test('throws error for invalid config file syntax', async () => {
      const configContent = `
        export default {
          invalid syntax here
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      await expect(loadConfig(testDir)).rejects.toThrow()
    })

    test('handles config file that exports a function', async () => {
      const configContent = `
        export default function() {
          return {
            dev: {
              port: 5000
            }
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      const config = await loadConfig(testDir)
      expect(config.dev.port).toBe(5000)
    })

    test('handles async config function', async () => {
      const configContent = `
        export default async function() {
          return {
            dev: {
              port: 6000
            }
          }
        }
      `
      writeFileSync(join(testDir, 'drift.config.ts'), configContent)

      const config = await loadConfig(testDir)
      expect(config.dev.port).toBe(6000)
    })
  })
})
