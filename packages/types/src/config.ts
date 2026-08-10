// Configuration Types

export interface DriftConfig {
  siteUrl?: string
  seo?: {
    defaultTitle?: string
  }
  compiler?: {
    target?: 'es5' | 'es2015' | 'es2020' | 'esnext'
    jsx?: 'react' | 'react-jsx'
    sourceMaps?: boolean
    minify?: boolean
  }
  styles?: {
    scoping?: 'component' | 'file' | 'global'
    prefix?: string
    extractCSS?: boolean
    optimizeCSS?: boolean
    criticalCSS?: boolean
    responsiveStrategy?: 'mobile-first' | 'desktop-first'
  }
  fonts?: {
    strategy?: 'self-hosted' | 'external'
    display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
    preload?: boolean
    variablePrefix?: string
  }
  breakpoints?: {
    [name: string]: number
  }
  motion?: {
    reducedMotion?: 'disable' | 'simplify' | 'respect'
    defaultDuration?: number
    defaultEasing?: string
  }
  router?: {
    basePath?: string
    trailingSlash?: boolean
    caseSensitive?: boolean
  }
  build?: {
    outDir?: string
    assetsDir?: string
    publicPath?: string
    sourcemap?: boolean
  }
  dev?: {
    port?: number
    host?: string
    open?: boolean
    https?: boolean
  }
  ssr?: {
    enabled?: boolean
    prerender?: string[]
    streaming?: boolean
  }
}

export interface ResolvedDriftConfig extends Required<DriftConfig> {
  root: string
  cacheDir: string
}
