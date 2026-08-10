// Drift Vite Plugin - Vite integration
import type { Plugin, ViteDevServer, HmrContext, ModuleNode } from 'vite'
import { transformWithEsbuild } from 'vite'
import { compile, type CompileOptions } from '@drift/compiler'
import { generateRoutes, buildLayoutHierarchy, associateRoutesWithLayouts } from '@drift/router'
import type { TokenRegistry, RouteConfig, LayoutConfig } from '@drift/types'
import { parseTokens } from '@drift/tokens'
import * as fs from 'fs'
import * as path from 'path'
import { overlayScript } from './overlay'

export interface DriftPluginOptions {
  /** Path to drift.tokens file (default: './drift.tokens') */
  tokensPath?: string
  /** Enable source maps (default: true in dev, false in prod) */
  sourceMaps?: boolean
  /** Custom token registry (overrides tokensPath) */
  tokenRegistry?: TokenRegistry
  /**
   * Enable Tailwind CSS integration.
   * - true: auto-detect tailwind.config.* and inject @tailwind directives
   * - false (default): Drift-only styles
   * Requires tailwindcss to be installed in the project.
   */
  tailwind?: boolean
  /**
   * Prefix for Drift-generated scoped class names (default: 'drift')
   */
  classPrefix?: string
}

/**
 * Vite plugin for Drift framework
 * Handles .drift file transformation, HMR, and token file watching
 */
export function drift(options: DriftPluginOptions = {}): Plugin {
  const {
    tokensPath = './drift.tokens',
    sourceMaps,
    tokenRegistry: customTokenRegistry,
    tailwind: tailwindEnabled = false,
    classPrefix = 'drift',
  } = options

  let server: ViteDevServer | undefined
  let tokenRegistry: TokenRegistry | undefined = customTokenRegistry
  let resolvedTokensPath: string | undefined
  let hasTailwind = false

  // Cache for compiled files to track dependencies
  const driftFileCache = new Map<string, Set<string>>()

  const virtualRoutesId = 'virtual:drift-routes'
  const resolvedVirtualRoutesId = '\0' + virtualRoutesId

  return {
    name: 'drift',

    configResolved(config) {
      // Resolve tokens path relative to project root
      if (!customTokenRegistry && tokensPath) {
        resolvedTokensPath = path.resolve(config.root, tokensPath)
      }

      // Detect Tailwind: check for tailwind.config.* or explicit option
      if (tailwindEnabled) {
        const twConfigs = [
          'tailwind.config.js',
          'tailwind.config.ts',
          'tailwind.config.mjs',
          'tailwind.config.cjs',
        ]
        hasTailwind = twConfigs.some(f => fs.existsSync(path.resolve(config.root, f)))
        if (!hasTailwind) {
          console.warn('[drift] tailwind: true but no tailwind.config.* found — Tailwind disabled')
        }
      }
    },

    configureServer(_server) {
      server = _server

      // Watch drift.tokens file for changes
      if (resolvedTokensPath) {
        server.watcher.add(resolvedTokensPath)
      }

      // Watch pages and layouts directories for changes
      const pagesDir = path.resolve(server.config.root, 'pages')
      const layoutsDir = path.resolve(server.config.root, 'layouts')
      if (fs.existsSync(pagesDir)) server.watcher.add(pagesDir)
      if (fs.existsSync(layoutsDir)) server.watcher.add(layoutsDir)
    },

    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: overlayScript,
            injectTo: 'body'
          }
        ]
      }
    },

    // Handle .drift file resolution
    resolveId(id, importer) {
      if (id === virtualRoutesId) {
        return resolvedVirtualRoutesId
      }

      if (id.includes('.drift.css?inline')) {
        return id
      }

      // Handle .drift file imports
      if (id.endsWith('.drift')) {
        // If it's a relative import, resolve it relative to the importer
        if (id.startsWith('.') && importer) {
          const resolved = path.resolve(path.dirname(importer), id)
          return resolved
        }
        // Otherwise, let Vite handle it (for absolute paths, aliases, etc.)
        return null
      }
      return null
    },

    // Transform .drift files
    async transform(code, id) {
      // Only process .drift files
      if (!id.endsWith('.drift')) {
        return null
      }

      try {
        // Load token registry if not already loaded
        if (!tokenRegistry && resolvedTokensPath) {
          tokenRegistry = await loadTokenRegistry(resolvedTokensPath)
        }

        // Compile the .drift file
        const compileOptions: CompileOptions = {
          filename: id,
          sourceMaps: sourceMaps ?? server?.config.command === 'serve',
          tokenRegistry,
          transformOptions: {
            currentFilePath: id,
            basePath: server?.config.root,
          },
        }

        const result = compile(code, compileOptions)

        // Handle compilation errors
        if (!result.success || result.errors.length > 0) {
          const error = result.errors[0]
          if (error) {
            const err = new Error(error.message)
            ;(err as any).loc = {
              file: error.file,
              line: error.location.start.line,
              column: error.location.start.column,
            }
            // Add frame for the overlay
            if (error.snippet) {
              ;(err as any).frame = error.snippet.code
            }
            throw err
          }
          throw new Error('Compilation failed with unknown error')
        }

        // Extract JavaScript and CSS from compilation result
        const jsFile = result.files.find(f => f.type === 'component')
        const cssFile = result.files.find(f => f.type === 'css')

        if (!jsFile) {
          throw new Error(`No component output generated for ${id}`)
        }

        // Track this file in cache for HMR
        driftFileCache.set(id, new Set([id]))
        if (resolvedTokensPath) {
          driftFileCache.get(id)!.add(resolvedTokensPath)
        }

        // Combine JavaScript and CSS
        let transformedCode = jsFile.content

        // Inject Font loading if tokens have fonts
        if (tokenRegistry && tokenRegistry.fonts.size > 0) {
          const fontImports = Array.from(tokenRegistry.fonts.values())
            .filter(f => f.provider === 'google')
            .map(f => {
              const weights = f.weights ? `:${f.weights.join(',')}` : ''
              const family = f.family.replace(/\s+/g, '+')
              return `@import url('https://fonts.googleapis.com/css2?family=${family}${weights}&display=${f.display || 'swap'}');`
            })
            .join('\n')
          
          if (fontImports) {
            // We'll inject this into the CSS virtual module instead for better perf
            // but for now let's just make sure it's available
          }
        }

        // Inject CSS if present
        if (cssFile && cssFile.content.trim()) {
          // Import the CSS as a side effect
          const cssId = `${id}.css`
          transformedCode = `import '${cssId}?inline'\n${transformedCode}`
          
          // Store CSS for virtual module
          ;(this as any).addWatchFile?.(id)
        }

        const js = await transformWithEsbuild(transformedCode, `${id}.tsx`, {
          loader: 'tsx',
          jsx: 'automatic',
          sourcemap: Boolean(sourceMaps ?? server?.config.command === 'serve'),
        })

        return {
          code: js.code,
          map: js.map || jsFile.sourceMap || null,
        }
      } catch (error) {
        // Re-throw with better error formatting
        if (error instanceof Error) {
          this.error(error.message, (error as any).loc)
        }
        throw error
      }
    },

    // Handle hot module replacement
    async handleHotUpdate(ctx: HmrContext) {
      const { file, server, modules } = ctx

      // Handle drift.tokens changes
      if (resolvedTokensPath && file === resolvedTokensPath) {
        // Reload token registry
        tokenRegistry = await loadTokenRegistry(resolvedTokensPath)

        // Find all .drift files and trigger recompilation
        const driftModules: ModuleNode[] = []
        for (const [id] of driftFileCache) {
          const module = server.moduleGraph.getModuleById(id)
          if (module) {
            driftModules.push(module)
          }
        }

        // Invalidate all drift modules
        driftModules.forEach(mod => {
          server.moduleGraph.invalidateModule(mod)
        })

        // Return all drift modules to trigger HMR
        return driftModules
      }

      // Handle .drift file changes
      if (file.endsWith('.drift')) {
        // Invalidate the module
        modules.forEach(mod => {
          server.moduleGraph.invalidateModule(mod)
        })

        // Return modules to trigger HMR
        return modules
      }

      // Let Vite handle other files
      return undefined
    },

    async load(id) {
      if (id === resolvedVirtualRoutesId) {
        const root = server?.config.root || process.cwd()
        const pagesDir = path.resolve(root, 'pages')
        const layoutsDir = path.resolve(root, 'layouts')

        const routes = generateRoutes(pagesDir)
        const layouts = buildLayoutHierarchy(layoutsDir)
        const associatedRoutes = associateRoutesWithLayouts(routes, layouts)

        const routeConfigs: string[] = []
        const layoutConfigs: string[] = []

        // Each route/layout is a real dynamic import so Vite emits independent chunks.
        layouts.forEach((layout: LayoutConfig) => {
          const relativePath = './' + path.relative(root, layout.filePath).replace(/\\/g, '/')
          const loaderPath = layout.dataLoader?.filePath
            ? './' + path.relative(root, layout.dataLoader.filePath).replace(/\\/g, '/')
            : null
          const serialized = { ...layout, filePath: undefined, dataLoader: layout.dataLoader ? { ...layout.dataLoader, filePath: undefined } : null }
          layoutConfigs.push(`{
            ...${JSON.stringify(serialized)},
            lazy: async () => {
              const componentModule = await import('${relativePath}')
              ${loaderPath ? `const loaderModule = await import('${loaderPath}')` : 'const loaderModule = componentModule'}
              return {
                component: componentModule.${layout.component} || componentModule.default,
                loader: loaderModule.${layout.dataLoader?.functionName || 'loader'},
                ErrorBoundary: componentModule.ErrorBoundary
              }
            }
          }`)
        })

        associatedRoutes.forEach((route: RouteConfig) => {
          if (!route.filePath) return

          const relativePath = './' + path.relative(root, route.filePath).replace(/\\/g, '/')
          const loaderPath = route.dataLoader?.filePath
            ? './' + path.relative(root, route.dataLoader.filePath).replace(/\\/g, '/')
            : null
          const serialized = { ...route, filePath: undefined, dataLoader: route.dataLoader ? { ...route.dataLoader, filePath: undefined } : null }
          routeConfigs.push(`{
            ...${JSON.stringify(serialized)},
            lazy: async () => {
              const componentModule = await import('${relativePath}')
              ${loaderPath ? `const loaderModule = await import('${loaderPath}')` : 'const loaderModule = componentModule'}
              return {
                component: componentModule.${route.component} || componentModule.default,
                loader: loaderModule.${route.dataLoader?.functionName || 'loader'},
                ErrorBoundary: componentModule.ErrorBoundary
              }
            }
          }`)
        })

        return `export const routes = [${routeConfigs.join(',\n')}]
export const layouts = [${layoutConfigs.join(',\n')}]
export const manifest = { routes, layouts }`
      }

      // Handle virtual CSS modules for .drift files
      if (id.includes('.drift.css?inline')) {
        const driftFile = id.replace('.css?inline', '')

        try {
          const code = await fs.promises.readFile(driftFile, 'utf-8')
          const result = compile(code, {
            filename: driftFile,
            tokenRegistry,
          })

          const cssFile = result.files.find(f => f.type === 'css')
          if (cssFile) {
            const parts: string[] = []

            // Font imports
            if (tokenRegistry && tokenRegistry.fonts.size > 0) {
              const fontImports = Array.from(tokenRegistry.fonts.values())
                .filter(f => f.provider === 'google')
                .map(f => {
                  const weights = f.weights ? `:${f.weights.join(',')}` : ''
                  const family = f.family.replace(/\s+/g, '+')
                  return `@import url('https://fonts.googleapis.com/css2?family=${family}${weights}&display=${f.display || 'swap'}');`
                })
                .join('\n')
              if (fontImports) parts.push(fontImports)
            }

            // When Tailwind is active, wrap Drift component styles in @layer so
            // Tailwind utility classes (tw prop / className) always win
            if (hasTailwind && cssFile.content.trim()) {
              parts.push(`@layer ${classPrefix} {\n${cssFile.content}\n}`)
            } else if (cssFile.content.trim()) {
              parts.push(cssFile.content)
            }

            return { code: parts.join('\n\n'), map: null }
          }
        } catch (error) {
          // Ignore errors for virtual modules
        }
      }

      return null
    },
  }
}

/**
 * Load token registry from drift.tokens file
 */
async function loadTokenRegistry(tokensPath: string): Promise<TokenRegistry | undefined> {
  try {
    // Check if file exists
    if (!fs.existsSync(tokensPath)) {
      return undefined
    }

    // Read tokens file
    const tokensContent = await fs.promises.readFile(tokensPath, 'utf-8')
    
    // Parse tokens file using @drift/tokens package
    const registry = parseTokens(tokensContent)
    
    return registry
  } catch (error) {
    console.warn(`Failed to load token registry from ${tokensPath}:`, error)
    return undefined
  }
}

export default drift
