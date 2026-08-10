import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import type { DriftConfig, ResolvedDriftConfig } from '@drift/types'
import { DriftError, ErrorCode } from './errors'

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<DriftConfig> = {
  siteUrl: '',
  seo: {
    defaultTitle: 'Drift App',
  },
  compiler: {
    target: 'es2020',
    jsx: 'react-jsx',
    sourceMaps: true,
    minify: false,
  },
  styles: {
    scoping: 'component',
    prefix: 'drift',
    extractCSS: true,
    optimizeCSS: false,
    criticalCSS: false,
    responsiveStrategy: 'mobile-first',
  },
  fonts: {
    strategy: 'self-hosted',
    display: 'swap',
    preload: true,
    variablePrefix: '--font',
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  motion: {
    reducedMotion: 'respect',
    defaultDuration: 300,
    defaultEasing: 'ease-in-out',
  },
  router: {
    basePath: '/',
    trailingSlash: false,
    caseSensitive: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    publicPath: '/',
    sourcemap: false,
  },
  dev: {
    port: 3000,
    host: 'localhost',
    open: false,
    https: false,
  },
  ssr: {
    enabled: false,
    prerender: [],
    streaming: false,
  },
}

/**
 * Configuration validation errors
 */
interface ConfigValidationError {
  path: string
  message: string
  suggestions?: string[]
}

/**
 * Load and resolve Drift configuration
 */
export async function loadConfig(rootDir: string): Promise<ResolvedDriftConfig> {
  const configPath = findConfigFile(rootDir)

  let userConfig: DriftConfig = {}

  if (configPath) {
    try {
      userConfig = await loadConfigFile(configPath)
    } catch (error) {
      throw new Error(
        `Failed to load configuration from ${configPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  // Validate configuration
  const errors = validateConfig(userConfig)
  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `  - ${e.path}: ${e.message}`).join('\n')
    throw new Error(`Invalid configuration:\n${errorMessages}`)
  }

  // Merge with defaults
  const resolved = mergeConfig(DEFAULT_CONFIG, userConfig)

  return {
    ...resolved,
    root: rootDir,
    cacheDir: resolve(rootDir, 'node_modules', '.drift'),
  }
}

/**
 * Find configuration file in the root directory
 */
function findConfigFile(rootDir: string): string | null {
  const configFiles = ['drift.config.ts', 'drift.config.js', 'drift.config.mjs']

  for (const file of configFiles) {
    const configPath = resolve(rootDir, file)
    if (existsSync(configPath)) {
      return configPath
    }
  }

  return null
}

/**
 * Load configuration file using dynamic import
 */
async function loadConfigFile(configPath: string): Promise<DriftConfig> {
  if (configPath.endsWith('.ts')) {
    return loadTypeScriptConfigFile(configPath)
  }

  if (configPath.endsWith('.js')) {
    try {
      return resolveConfigExport(nodeRequire(configPath))
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ERR_REQUIRE_ESM') {
        throw error
      }
    }
  }

  try {
    const module = await import(pathToFileURL(configPath).href)
    return resolveConfigExport(module)
  } catch (error) {
    throw new Error(
      `Failed to import config file: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

async function resolveConfigExport(module: unknown): Promise<DriftConfig> {
  const config = (
    module &&
    typeof module === 'object' &&
    'default' in module
      ? (module as { default: unknown }).default
      : module
  )

  return typeof config === 'function'
    ? await (config as () => DriftConfig | Promise<DriftConfig>)()
    : (config as DriftConfig)
}

const nodeRequire = createRequire(pathToFileURL(resolve(process.cwd(), 'package.json')).href)

async function loadTypeScriptConfigFile(configPath: string): Promise<DriftConfig> {
  try {
    const source = readFileSync(configPath, 'utf-8')
      .replace(/import\s+\{\s*defineConfig\s*\}\s+from\s+['"]@drift\/compiler['"];?\s*/g, '')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText
    const code = `const defineConfig = (config) => config;\n${transpiled}`
    const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
    return resolveConfigExport(module)
  } catch (error) {
    throw new Error(
      `Failed to import TypeScript config file: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Validate configuration values
 */
function validateConfig(config: DriftConfig): ConfigValidationError[] {
  const errors: ConfigValidationError[] = []

  // Validate compiler options
  if (config.compiler) {
    if (
      config.compiler.target &&
      !['es5', 'es2015', 'es2020', 'esnext'].includes(config.compiler.target)
    ) {
      errors.push({
        path: 'compiler.target',
        message: `Invalid target "${config.compiler.target}". Must be one of: es5, es2015, es2020, esnext`,
        suggestions: ['es2020', 'esnext'],
      })
    }

    if (config.compiler.jsx && !['react', 'react-jsx'].includes(config.compiler.jsx)) {
      errors.push({
        path: 'compiler.jsx',
        message: `Invalid jsx mode "${config.compiler.jsx}". Must be one of: react, react-jsx`,
        suggestions: ['react-jsx'],
      })
    }
  }

  // Validate styles options
  if (config.styles) {
    if (
      config.styles.scoping &&
      !['component', 'file', 'global'].includes(config.styles.scoping)
    ) {
      errors.push({
        path: 'styles.scoping',
        message: `Invalid scoping "${config.styles.scoping}". Must be one of: component, file, global`,
        suggestions: ['component'],
      })
    }

    if (
      config.styles.responsiveStrategy &&
      !['mobile-first', 'desktop-first'].includes(config.styles.responsiveStrategy)
    ) {
      errors.push({
        path: 'styles.responsiveStrategy',
        message: `Invalid responsiveStrategy "${config.styles.responsiveStrategy}". Must be one of: mobile-first, desktop-first`,
        suggestions: ['mobile-first'],
      })
    }
  }

  if (config.fonts) {
    if (
      config.fonts.strategy &&
      !['self-hosted', 'external'].includes(config.fonts.strategy)
    ) {
      errors.push({
        path: 'fonts.strategy',
        message: `Invalid font strategy "${config.fonts.strategy}". Must be one of: self-hosted, external`,
        suggestions: ['self-hosted'],
      })
    }

    if (
      config.fonts.display &&
      !['auto', 'block', 'swap', 'fallback', 'optional'].includes(config.fonts.display)
    ) {
      errors.push({
        path: 'fonts.display',
        message: `Invalid font display "${config.fonts.display}". Must be one of: auto, block, swap, fallback, optional`,
        suggestions: ['swap'],
      })
    }
  }

  // Validate breakpoints
  if (config.breakpoints) {
    for (const [name, value] of Object.entries(config.breakpoints)) {
      if (typeof value !== 'number' || value < 0) {
        errors.push({
          path: `breakpoints.${name}`,
          message: `Invalid breakpoint value "${value}". Must be a positive number (pixels)`,
        })
      }
    }
  }

  // Validate motion options
  if (config.motion) {
    if (
      config.motion.reducedMotion &&
      !['disable', 'simplify', 'respect'].includes(config.motion.reducedMotion)
    ) {
      errors.push({
        path: 'motion.reducedMotion',
        message: `Invalid reducedMotion "${config.motion.reducedMotion}". Must be one of: disable, simplify, respect`,
        suggestions: ['respect'],
      })
    }

    if (config.motion.defaultDuration !== undefined) {
      if (typeof config.motion.defaultDuration !== 'number' || config.motion.defaultDuration < 0) {
        errors.push({
          path: 'motion.defaultDuration',
          message: `Invalid defaultDuration "${config.motion.defaultDuration}". Must be a positive number (milliseconds)`,
        })
      }
    }
  }

  // Validate router options
  if (config.router) {
    if (config.router.basePath && !config.router.basePath.startsWith('/')) {
      errors.push({
        path: 'router.basePath',
        message: `Invalid basePath "${config.router.basePath}". Must start with "/"`,
        suggestions: [`/${config.router.basePath}`],
      })
    }
  }

  // Validate build options
  if (config.build) {
    if (config.build.outDir && config.build.outDir.includes('..')) {
      errors.push({
        path: 'build.outDir',
        message: `Invalid outDir "${config.build.outDir}". Cannot contain ".."`,
      })
    }

    if (config.build.assetsDir && config.build.assetsDir.includes('..')) {
      errors.push({
        path: 'build.assetsDir',
        message: `Invalid assetsDir "${config.build.assetsDir}". Cannot contain ".."`,
      })
    }
  }

  // Validate dev options
  if (config.dev) {
    if (config.dev.port !== undefined) {
      if (
        typeof config.dev.port !== 'number' ||
        config.dev.port < 1 ||
        config.dev.port > 65535
      ) {
        errors.push({
          path: 'dev.port',
          message: `Invalid port "${config.dev.port}". Must be a number between 1 and 65535`,
        })
      }
    }
  }

  return errors
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(
  defaults: Required<DriftConfig>,
  user: DriftConfig
): Required<DriftConfig> {
  return {
    siteUrl: user.siteUrl ?? defaults.siteUrl,
    seo: {
      ...defaults.seo,
      ...user.seo,
    },
    compiler: {
      ...defaults.compiler,
      ...user.compiler,
    },
    styles: {
      ...defaults.styles,
      ...user.styles,
    },
    fonts: {
      ...defaults.fonts,
      ...user.fonts,
    },
    breakpoints: {
      ...defaults.breakpoints,
      ...user.breakpoints,
    },
    motion: {
      ...defaults.motion,
      ...user.motion,
    },
    router: {
      ...defaults.router,
      ...user.router,
    },
    build: {
      ...defaults.build,
      ...user.build,
    },
    dev: {
      ...defaults.dev,
      ...user.dev,
    },
    ssr: {
      ...defaults.ssr,
      ...user.ssr,
    },
  }
}

/**
 * Create a DriftError for configuration validation failures
 */
export function createConfigError(
  path: string,
  message: string,
  suggestions?: string[]
): DriftError {
  return new DriftError({
    code: ErrorCode.CONFIG_INVALID_VALUE,
    message: `Configuration error at "${path}": ${message}`,
    file: 'drift.config.ts',
    location: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
      source: '',
    },
    suggestions,
  })
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): Required<DriftConfig> {
  return { ...DEFAULT_CONFIG }
}

export function defineConfig(config: DriftConfig): DriftConfig {
  return config
}
