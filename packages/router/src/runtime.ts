import type {
  LayoutConfig,
  RouteConfig,
  RouteLoader,
  RouteLoaderContext,
  RouteMatch,
  RouteModule,
} from '@drift/types'

export interface LoadRouteDataOptions {
  url: URL
  signal?: AbortSignal
  request?: Request
}

export class RouteError extends Error {
  readonly status: number
  readonly statusText: string
  readonly data: unknown

  constructor(status: number, statusText: string, data?: unknown) {
    super(`${status} ${statusText}`)
    this.name = 'RouteError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

const moduleCache = new WeakMap<object, RouteModule>()
const modulePromises = new WeakMap<object, Promise<RouteModule>>()

export function isRouteError(error: unknown): error is RouteError {
  return error instanceof RouteError
}

export function serializeRouteError(error: unknown): Record<string, unknown> {
  if (isRouteError(error)) {
    return { __driftRouteError: true, status: error.status, statusText: error.statusText, data: error.data }
  }
  return {
    __driftRouteError: false,
    name: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error),
  }
}

export function deserializeRouteError(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if (record.__driftRouteError === true) {
    return new RouteError(Number(record.status) || 500, String(record.statusText || 'Route error'), record.data)
  }
  const error = new Error(String(record.message || 'Route error'))
  error.name = String(record.name || 'Error')
  return error
}

export async function preloadRouteMatch(match: RouteMatch): Promise<void> {
  await Promise.all([
    ...match.layouts.map(layout => loadDefinitionModule(layout)),
    loadDefinitionModule(match.route),
  ])
}

export async function executeRouteLoaders(
  match: RouteMatch,
  options: LoadRouteDataOptions
): Promise<Record<string, unknown>> {
  const signal = options.signal || new AbortController().signal
  const request = options.request || new Request(options.url, { method: 'GET', signal })
  const data: Record<string, unknown> = {}

  throwIfAborted(signal)

  for (const layout of match.layouts) {
    const module = await loadDefinitionModule(layout)
    const loader = module.loader || layout.loader
    if (loader) {
      data[`layout:${layout.id}`] = await runLoader(loader, {
        params: match.params,
        request,
        url: options.url,
        signal,
        routeId: layout.id,
      })
    } else if (layout.dataLoader) {
      throw missingLoaderError('layout', layout.id, layout.dataLoader.functionName)
    }
  }

  const routeModule = await loadDefinitionModule(match.route)
  const routeLoader = routeModule.loader || match.route.loader
  if (routeLoader) {
    data[`route:${match.route.id}`] = await runLoader(routeLoader, {
      params: match.params,
      request,
      url: options.url,
      signal,
      routeId: match.route.id,
    })
  } else if (match.route.dataLoader) {
    throw missingLoaderError('route', match.route.id, match.route.dataLoader.functionName)
  }

  return data
}

export function getRouteComponent(route: RouteConfig): any {
  return getDefinitionComponent(route)
}

export function getLayoutComponent(layout: LayoutConfig): any {
  return getDefinitionComponent(layout)
}

export function getErrorComponent(match: RouteMatch | null): any {
  if (!match) return undefined
  const routeModule = moduleCache.get(match.route)
  if (routeModule?.ErrorBoundary || match.route.errorComponent) {
    return routeModule?.ErrorBoundary || match.route.errorComponent
  }

  for (let index = match.layouts.length - 1; index >= 0; index--) {
    const layout = match.layouts[index]!
    const layoutModule = moduleCache.get(layout)
    if (layoutModule?.ErrorBoundary || layout.errorComponent) {
      return layoutModule?.ErrorBoundary || layout.errorComponent
    }
  }
  return undefined
}

export function clearRouteModuleCache(definition?: RouteConfig | LayoutConfig): void {
  if (!definition) return
  moduleCache.delete(definition)
  modulePromises.delete(definition)
}

async function runLoader(loader: RouteLoader, context: RouteLoaderContext): Promise<unknown> {
  throwIfAborted(context.signal)
  try {
    const result = await loader(context)
    throwIfAborted(context.signal)
    return result
  } catch (error) {
    if (context.signal.aborted) throw abortError()
    throw error
  }
}

function getDefinitionComponent(definition: RouteConfig | LayoutConfig): any {
  if (definition.componentInstance) return definition.componentInstance
  const cached = moduleCache.get(definition)
  if (cached) return cached.component || cached.default
  if (definition.lazy) throw loadDefinitionModule(definition)
  return undefined
}

async function loadDefinitionModule(definition: RouteConfig | LayoutConfig): Promise<RouteModule> {
  const cached = moduleCache.get(definition)
  if (cached) return cached

  const pending = modulePromises.get(definition)
  if (pending) return pending

  const promise = definition.lazy
    ? definition.lazy().then(module => normalizeModule(module, definition))
    : Promise.resolve(normalizeModule({}, definition))

  modulePromises.set(definition, promise)
  try {
    const module = await promise
    moduleCache.set(definition, module)
    return module
  } finally {
    modulePromises.delete(definition)
  }
}

function normalizeModule(module: RouteModule, definition: RouteConfig | LayoutConfig): RouteModule {
  return {
    ...module,
    component: module.component || module.default || definition.componentInstance,
    loader: module.loader || definition.loader,
    ErrorBoundary: module.ErrorBoundary || definition.errorComponent,
  }
}

function missingLoaderError(kind: 'route' | 'layout', id: string, exportName: string): RouteError {
  return new RouteError(500, 'Loader export missing', {
    kind,
    id,
    exportName,
    message: `${kind} "${id}" declares a loader but does not export "${exportName}".`,
  })
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw abortError()
}

function abortError(): Error {
  const error = new Error('Route loading was aborted')
  error.name = 'AbortError'
  return error
}
