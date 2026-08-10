import { build as viteBuild } from 'vite'
import react from '@vitejs/plugin-react'
import drift from '@drift/vite-plugin'
import { loadConfig } from '@drift/compiler'
import * as path from 'path'
import * as fs from 'fs'
import { emitVercelOutput } from './vercel'

interface BuildOptions {
  outDir?: string
  sourcemap?: boolean
  minify?: boolean
  target?: 'static' | 'vercel'
}

/**
 * Build for production with optimizations
 */
export async function build(options: BuildOptions) {
  try {
    console.log(`
  \x1b[34m██████╗ ██████╗ ██╗███████╗████████╗
  ██╔══██╗██╔══██╗██║██╔════╝╚══██╔══╝
  ██║  ██║██████╔╝██║█████╗     ██║   
  ██║  ██║██╔══██╗██║██╔══╝     ██║   
  ██████╔╝██║  ██║██║██║        ██║   
  ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝\x1b[0m
  \x1b[36mOne language. Infinite surfaces. Unified.\x1b[0m
    `)

    console.log('\x1b[32m🏗️  Preparing production launch...\x1b[0m\n')

    const rootDir = process.cwd()

    // Load Drift configuration
    let driftConfig
    try {
      driftConfig = await loadConfig(rootDir)
      console.log('\x1b[34m✔\x1b[0m Configuration loaded')
    } catch (error) {
      console.warn('\x1b[33m⚠️\x1b[0m No drift.config.ts found, using defaults')
      driftConfig = null
    }

    const outDir = options.outDir || driftConfig?.build.outDir || 'dist'
    const sourcemap = options.sourcemap ?? driftConfig?.build.sourcemap ?? false
    const minify = options.minify ?? driftConfig?.compiler.minify ?? true

    // Run Vite build
    await viteBuild({
      root: rootDir,
      configFile: false,
      plugins: [
        drift({
          tokensPath: path.join(rootDir, 'drift.tokens'),
          sourceMaps: sourcemap,
        }),
        react(),
      ],
      build: {
        outDir,
        sourcemap,
        minify: minify ? 'esbuild' : false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              motion: ['framer-motion'],
            },
          },
        },
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000,
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'framer-motion'],
      },
    })

    // Display build statistics
    console.log('\n\x1b[32m✔\x1b[0m Mission accomplished! \x1b[1mDrift\x1b[0m is ready for deployment.')
    console.log(`\x1b[34m📦\x1b[0m Payload delivered to: \x1b[35m${outDir}\x1b[0m`)

    // Calculate and display bundle sizes
    await displayBuildStats(path.join(rootDir, outDir))

    if (options.target === 'vercel') {
      const vercelOutput = await emitVercelOutput({ rootDir, staticDir: outDir })
      console.log(`\x1b[34mVercel:\x1b[0m ${vercelOutput}`)
      console.log('Deploy with: vercel deploy --prebuilt')
    }
  } catch (error) {
    console.error('❌ Build failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

/**
 * Display build statistics
 */
async function displayBuildStats(outDir: string) {
  try {
    const stats = await calculateBuildStats(outDir)

    console.log('\n📊 Build Statistics:')
    console.log(`   Total size: ${formatBytes(stats.totalSize)}`)
    console.log(`   JavaScript: ${formatBytes(stats.jsSize)} (${stats.jsFiles} files)`)
    console.log(`   CSS: ${formatBytes(stats.cssSize)} (${stats.cssFiles} files)`)
    console.log(`   Assets: ${formatBytes(stats.assetSize)} (${stats.assetFiles} files)`)
    console.log('')
  } catch (error) {
    // Silently fail if we can't calculate stats
  }
}

/**
 * Calculate build statistics
 */
async function calculateBuildStats(outDir: string) {
  const stats = {
    totalSize: 0,
    jsSize: 0,
    jsFiles: 0,
    cssSize: 0,
    cssFiles: 0,
    assetSize: 0,
    assetFiles: 0,
  }

  async function walkDir(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await walkDir(fullPath)
      } else if (entry.isFile()) {
        const stat = await fs.promises.stat(fullPath)
        const size = stat.size

        stats.totalSize += size

        if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
          stats.jsSize += size
          stats.jsFiles++
        } else if (entry.name.endsWith('.css')) {
          stats.cssSize += size
          stats.cssFiles++
        } else if (!entry.name.endsWith('.map') && !entry.name.endsWith('.html')) {
          stats.assetSize += size
          stats.assetFiles++
        }
      }
    }
  }

  if (fs.existsSync(outDir)) {
    await walkDir(outDir)
  }

  return stats
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
