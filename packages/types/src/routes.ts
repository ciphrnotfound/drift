// Router System Types

export interface RouteManifest {
  routes: RouteConfig[]
  layouts: LayoutConfig[]
  notFound: string
}

export interface RouteConfig {
  id: string
  path: string
  filePath?: string
  component: string
  componentInstance?: any
  lazy?: RouteModuleLoader
  loader?: RouteLoader
  errorComponent?: any
  layout?: string | null
  dataLoader?: DataLoaderConfig | null
  children?: RouteConfig[]
  params?: RouteParam[]
  isDynamic?: boolean
  isCatchAll?: boolean
  metadata?: import('./ast').MetadataBlock
}

export interface RouteParam {
  name: string
  type: 'static' | 'dynamic' | 'catchAll' | 'optionalCatchAll'
  position: number
}

export interface LayoutConfig {
  id: string
  name: string
  filePath: string
  component: string
  componentInstance?: any
  lazy?: RouteModuleLoader
  loader?: RouteLoader
  errorComponent?: any
  dataLoader: DataLoaderConfig | null
  parent: string | null
  children: string[]
}

export interface DataLoaderConfig {
  functionName: string
  params: string[]
  returnType: string
  filePath?: string
}

export interface RouteLoaderContext {
  params: Record<string, string>
  request: Request
  url: URL
  signal: AbortSignal
  routeId: string
}

export type RouteLoader<T = unknown> = (context: RouteLoaderContext) => T | Promise<T>

export interface RouteModule {
  component?: any
  default?: any
  loader?: RouteLoader
  ErrorBoundary?: any
}

export type RouteModuleLoader = () => Promise<RouteModule>

export interface RouteErrorComponentProps {
  error: unknown
  retry: () => void
}

export interface RouteMatch {
  route: RouteConfig
  params: Record<string, string>
  layouts: LayoutConfig[]
}
