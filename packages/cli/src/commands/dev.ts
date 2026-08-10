import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import drift from '@drift/vite-plugin'
import { loadConfig } from '@drift/compiler'
import * as path from 'path'

interface DevOptions {
  port?: string
  host?: string
  open?: boolean
  https?: boolean
}

/**
 * Start development server with hot reload
 */
export async function dev(options: DevOptions) {
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

    console.log('\x1b[32m🚀 Ignition sequence start...\x1b[0m\n')

    const rootDir = process.cwd()

    // Load Drift configuration
    let driftConfig
    try {
      driftConfig = await loadConfig(rootDir)
      console.log('\x1b[34m✔\x1b[0m Configuration loaded from \x1b[35mdrift.config.ts\x1b[0m')
    } catch (error) {
      console.warn('\x1b[33m⚠️\x1b[0m No drift.config.ts found, using defaults')
      driftConfig = null
    }

    // Parse port from options or config
    const port = options.port
      ? parseInt(options.port, 10)
      : driftConfig?.dev.port || 3000

    const host = options.host || driftConfig?.dev.host || 'localhost'
    const open = options.open || driftConfig?.dev.open || false
    const https = options.https || driftConfig?.dev.https || false

    // Set process env to indicate Drift environment
    process.env.DRIFT_DEV = 'true'

    // Create Vite dev server
    const server = await createServer({
      root: rootDir,
      configFile: false,
      customLogger: {
        info: (msg) => {
          if (msg.includes('Vite') || msg.includes('vite')) return
          console.log(`\x1b[34mℹ\x1b[0m ${msg}`)
        },
        warn: (msg) => {
          if (msg.includes('Vite') || msg.includes('vite')) return
          console.warn(`\x1b[33m⚠️\x1b[0m ${msg}`)
        },
        error: (msg) => {
          // Custom error formatting to remove Vite trace
          const cleanMsg = msg.replace(/\[vite\]/g, '\x1b[34m[drift]\x1b[0m')
            .replace(/vite/gi, 'Drift')
          console.error(`\x1b[31m✘\x1b[0m ${cleanMsg}`)
        },
        warnOnce: (msg) => {
          if (msg.includes('Vite') || msg.includes('vite')) return
          console.warn(`\x1b[33m⚠️\x1b[0m ${msg}`)
        },
        clearScreen: () => {
          // process.stdout.write('\x1Bc')
        },
        hasErrorLogged: () => false,
        hasWarned: false
      },
      plugins: [
        drift({
          tokensPath: path.join(rootDir, 'drift.tokens'),
          sourceMaps: true,
        }),
        react(),
      ],
      server: {
        port,
        host,
        open,
        https: https ? {} : undefined,
        hmr: {
          overlay: false,
        },
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'framer-motion'],
      },
    })

    await server.listen()

    // Clear console for a clean Drift experience
    // process.stdout.write('\x1Bc')
    
    console.log(`
  \x1b[34m██████╗ ██████╗ ██╗███████╗████████╗
  ██╔══██╗██╔══██╗██║██╔════╝╚══██╔══╝
  ██║  ██║██████╔╝██║█████╗     ██║   
  ██║  ██║██╔══██╗██║██╔══╝     ██║   
  ██████╔╝██║  ██║██║██║        ██║   
  ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝\x1b[0m
  \x1b[36mOne language. Infinite surfaces. Unified.\x1b[0m
    `)

    // Display server info
    const protocol = https ? 'https' : 'http'
    console.log('\x1b[32m✔\x1b[0m \x1b[1mDrift\x1b[0m is now cruising at:')
    console.log(`  \x1b[34m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   \x1b[36m${protocol}://${host}:${port}/\x1b[0m`)
    console.log('')
    console.log('\x1b[36m✨ Press \x1b[1m"h"\x1b[0m to see shortcuts or \x1b[1m"q"\x1b[0m to eject.\x1b[0m')
    console.log('')
    
    // Listen for custom Drift commands
    process.stdin.on('data', (data) => {
      const input = data.toString().trim()
      if (input === 'drift') {
        console.log('\n\x1b[34m🌊 Drift Framework v0.1.0\x1b[0m')
        console.log('One language. Infinite surfaces. Unified.\n')
      }
    })
  } catch (error) {
    console.error('❌ Failed to start dev server:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
