import * as fs from 'node:fs'
import * as path from 'node:path'

export interface VercelOutputOptions {
  rootDir: string
  staticDir: string
  frameworkVersion?: string
  server?: {
    entry: string
    runtime?: string
  }
}

interface VercelBuildOutputConfig {
  version: 3
  framework: { version: string }
  routes: Array<Record<string, unknown>>
}

/** Emit Vercel Build Output API v3 artifacts from a completed Drift client build. */
export async function emitVercelOutput(options: VercelOutputOptions): Promise<string> {
  const source = path.resolve(options.rootDir, options.staticDir)
  const outputRoot = path.join(options.rootDir, '.vercel', 'output')
  const staticOutput = path.join(outputRoot, 'static')

  if (!fs.existsSync(path.join(source, 'index.html'))) {
    throw new Error(`Vercel output requires ${path.join(source, 'index.html')}`)
  }

  await fs.promises.rm(outputRoot, { recursive: true, force: true })
  await fs.promises.mkdir(outputRoot, { recursive: true })
  await fs.promises.cp(source, staticOutput, {
    recursive: true,
    filter: sourcePath => !options.server || path.resolve(sourcePath) !== path.join(source, 'index.html'),
  })

  if (options.server) {
    const functionDir = path.join(outputRoot, 'functions', 'render.func')
    if (!fs.existsSync(options.server.entry)) {
      throw new Error(`Vercel SSR output requires server entry ${options.server.entry}`)
    }

    await fs.promises.mkdir(functionDir, { recursive: true })
    await fs.promises.cp(path.dirname(options.server.entry), functionDir, { recursive: true })
    await fs.promises.rename(path.join(functionDir, path.basename(options.server.entry)), path.join(functionDir, 'index.js'))
    await fs.promises.writeFile(path.join(functionDir, 'package.json'), '{"type":"module"}\n', 'utf8')
    await fs.promises.writeFile(path.join(functionDir, '.vc-config.json'), `${JSON.stringify({
      runtime: options.server.runtime || 'nodejs22.x',
      handler: 'index.js',
      launcherType: 'Nodejs',
      shouldAddSourcemapSupport: true,
    }, null, 2)}\n`, 'utf8')
  }

  const config: VercelBuildOutputConfig = {
    version: 3,
    framework: { version: options.frameworkVersion || '0.1.0' },
    routes: [
      {
        src: '/assets/(.*)',
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
          'x-content-type-options': 'nosniff',
        },
        continue: true,
      },
      {
        src: '/(.*)',
        headers: {
          'referrer-policy': 'strict-origin-when-cross-origin',
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'SAMEORIGIN',
        },
        continue: true,
      },
      { handle: 'filesystem' },
      options.server ? { src: '/.*', dest: '/render' } : { src: '/.*', dest: '/index.html' },
    ],
  }

  await fs.promises.writeFile(
    path.join(outputRoot, 'config.json'),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8'
  )

  return outputRoot
}
