import { build as viteBuild } from 'vite'
import react from '@vitejs/plugin-react'
import drift from '@drift/vite-plugin'
import { compile, loadConfig } from '@drift/compiler'
import { generateRoutes } from '@drift/router'
import { renderHead } from '@drift/seo'
import type { MetadataBlock, RouteConfig } from '@drift/types'
import * as path from 'path'
import * as fs from 'fs'

interface ExportOptions {
  outDir?: string
  basePath?: string
}

export async function exportStatic(options: ExportOptions) {
  try {
    console.log('Exporting Drift application as a static site...\n')

    const rootDir = process.cwd()
    const driftConfig = await loadOptionalConfig(rootDir)
    const outDir = options.outDir || driftConfig?.build.outDir || 'out'
    const basePath = options.basePath || driftConfig?.router.basePath || '/'

    console.log('Building application...')
    await viteBuild({
      root: rootDir,
      configFile: false,
      base: basePath,
      plugins: [
        drift({
          tokensPath: path.join(rootDir, 'drift.tokens'),
          sourceMaps: false,
        }),
        react(),
      ],
      build: {
        outDir,
        minify: true,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              motion: ['framer-motion'],
            },
          },
        },
      },
    })

    console.log('\nGenerating route HTML with SEO head tags...')
    const routes = await generateStaticHTML(rootDir, outDir, basePath, driftConfig)

    console.log('\nCopying public assets...')
    await copyStaticAssets(rootDir, outDir)

    console.log('\nGenerating 404 page...')
    await generate404Page(outDir, driftConfig)

    console.log('\nGenerating robots.txt and sitemap.xml...')
    await generateSEOManifests(outDir, routes, driftConfig?.siteUrl)

    console.log('\nStatic export completed successfully.')
    console.log(`Output directory: ${outDir}`)
  } catch (error) {
    console.error('Export failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

async function loadOptionalConfig(rootDir: string): Promise<any | null> {
  try {
    return await loadConfig(rootDir)
  } catch {
    console.warn('No drift.config.ts found, using defaults')
    return null
  }
}

async function generateStaticHTML(
  rootDir: string,
  outDir: string,
  basePath: string,
  driftConfig: any | null
): Promise<RouteConfig[]> {
  const pagesDir = findPagesDir(rootDir)
  if (!pagesDir) {
    console.warn('No pages directory found, skipping route HTML generation')
    return []
  }

  const routes: RouteConfig[] = generateRoutes(pagesDir).map((route: RouteConfig) => ({
    ...route,
    metadata: route.filePath ? extractRouteMetadata(route.filePath) : undefined,
  }))
  const appShell = await readAppShell(outDir, basePath)

  for (const route of routes) {
    if (route.isDynamic || route.isCatchAll) {
      console.log(`Skipping dynamic route: ${route.path}`)
      continue
    }

    const htmlPath = getHTMLPath(outDir, route.path, basePath)
    await writeRouteHTML(htmlPath, route, appShell, driftConfig)
    console.log(`Generated: ${route.path}`)
  }

  return routes
}

function findPagesDir(rootDir: string): string | null {
  const candidates = [
    path.join(rootDir, 'pages'),
    path.join(rootDir, 'src', 'pages'),
  ]
  return candidates.find(candidate => fs.existsSync(candidate)) || null
}

function getHTMLPath(outDir: string, routePath: string, basePath: string): string {
  let cleanPath = routePath
  if (basePath !== '/' && routePath.startsWith(basePath)) {
    cleanPath = routePath.slice(basePath.length)
  }

  if (cleanPath === '/' || cleanPath === '') {
    return path.join(outDir, 'index.html')
  }

  cleanPath = cleanPath.replace(/^\//, '')
  return path.join(outDir, cleanPath, 'index.html')
}

async function readAppShell(outDir: string, basePath: string): Promise<string> {
  const indexPath = path.join(outDir, 'index.html')
  if (fs.existsSync(indexPath)) {
    return fs.promises.readFile(indexPath, 'utf-8')
  }

  return `<!doctype html>
<html lang="en">
  <head></head>
  <body>
    <div id="root"></div>
    <script type="module" src="${basePath}assets/index.js"></script>
  </body>
</html>
`
}

async function writeRouteHTML(
  htmlPath: string,
  route: RouteConfig,
  appShell: string,
  driftConfig: any | null
) {
  await fs.promises.mkdir(path.dirname(htmlPath), { recursive: true })

  const head = renderHead({
    metadata: {
      canonical: route.path,
      ...route.metadata,
    },
    siteUrl: driftConfig?.siteUrl,
    defaultTitle: driftConfig?.seo?.defaultTitle || 'Drift App',
  })
  const html = injectHead(appShell, head)
  await fs.promises.writeFile(htmlPath, html)
}

function injectHead(html: string, head: string): string {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']viewport["'][^>]*>/gi, '')
    .replace(/<meta\s+charset=["'][^"']+["']\s*\/?>/gi, '')

  if (cleaned.includes('</head>')) {
    return cleaned.replace('</head>', `${head}\n  </head>`)
  }

  return cleaned.replace(/<html([^>]*)>/i, `<html$1>\n<head>\n${head}\n</head>`)
}

function extractRouteMetadata(filePath: string): MetadataBlock | undefined {
  try {
    const source = fs.readFileSync(filePath, 'utf-8')
    const result = compile(source, { filename: filePath })
    const metadataFile = result.files.find(file => file.type === 'metadata')
    return metadataFile ? JSON.parse(metadataFile.content) : undefined
  } catch {
    return undefined
  }
}

async function copyStaticAssets(rootDir: string, outDir: string) {
  const publicDir = path.join(rootDir, 'public')
  if (!fs.existsSync(publicDir)) {
    console.log('No public directory found, skipping')
    return
  }

  await copyDirectory(publicDir, outDir)
  console.log('Copied public assets')
}

async function copyDirectory(src: string, dest: string) {
  await fs.promises.mkdir(dest, { recursive: true })

  const entries = await fs.promises.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}

async function generate404Page(outDir: string, driftConfig: any | null) {
  const head = renderHead({
    metadata: {
      title: '404 - Page Not Found',
      description: 'The requested page could not be found.',
      robots: 'noindex',
    },
    siteUrl: driftConfig?.siteUrl,
  })

  const html404 = `<!doctype html>
<html lang="en">
  <head>
${head}
  </head>
  <body>
    <main style="min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a">
      <section style="text-align:center;padding:2rem">
        <h1 style="font-size:4rem;margin:0">404</h1>
        <p style="font-size:1.25rem;color:#475569">Page not found</p>
        <a href="/" style="color:#1d4ed8;font-weight:700">Go back home</a>
      </section>
    </main>
  </body>
</html>
`

  await fs.promises.writeFile(path.join(outDir, '404.html'), html404)
  console.log('Generated 404.html')
}

async function generateSEOManifests(outDir: string, routes: RouteConfig[], siteUrl?: string) {
  const staticRoutes = routes.filter(route => !route.isDynamic && !route.isCatchAll)
  const origin = siteUrl && /^https?:\/\//.test(siteUrl) ? siteUrl.replace(/\/$/, '') : ''

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticRoutes.map(route => `  <url><loc>${origin}${route.path}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')

  const robots = [
    'User-agent: *',
    'Allow: /',
    origin ? `Sitemap: ${origin}/sitemap.xml` : 'Sitemap: /sitemap.xml',
    '',
  ].join('\n')

  await fs.promises.writeFile(path.join(outDir, 'sitemap.xml'), sitemap)
  await fs.promises.writeFile(path.join(outDir, 'robots.txt'), robots)
  console.log('Generated sitemap.xml and robots.txt')
}
