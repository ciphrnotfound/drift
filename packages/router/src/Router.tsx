import {
  Component as ReactComponent,
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import type { LayoutConfig, RouteConfig, RouteMatch } from '@drift/types'
import {
  executeRouteLoaders,
  getErrorComponent,
  getLayoutComponent,
  getRouteComponent,
  isRouteError,
} from './runtime'

export interface NavigateOptions {
  replace?: boolean
  scroll?: boolean
  state?: unknown
}

export interface RouterLocation {
  pathname: string
  search: string
  hash: string
}

export interface RouterContextValue {
  currentRoute: RouteMatch | null
  location: RouterLocation
  pathname: string
  search: string
  hash: string
  navigate: (href: string, options?: NavigateOptions) => void
  replace: (href: string, options?: Omit<NavigateOptions, 'replace'>) => void
  back: () => void
  forward: () => void
  refresh: () => void
  prefetch: (href: string) => Promise<void>
  isNavigating: boolean
  isLoading: boolean
  pendingPath: string | null
  params: Record<string, string>
  loaderData: Record<string, unknown>
  error: unknown | null
  retry: () => void
}

const RouterContext = createContext<RouterContextValue | null>(null)

export interface RouterProps {
  routes: RouteConfig[]
  layouts?: LayoutConfig[]
  notFoundComponent?: ComponentType
  loadingComponent?: ComponentType
  errorComponent?: ComponentType<{ error: unknown; retry: () => void }>
  initialPath?: string
  initialData?: Record<string, unknown>
  initialError?: unknown
}

const DRIFT_HISTORY_KEY = '__drift'

export function Router({
  routes,
  layouts = [],
  notFoundComponent,
  loadingComponent,
  errorComponent,
  initialPath,
  initialData,
  initialError,
}: RouterProps) {
  const [location, setLocation] = useState<RouterLocation>(() => readLocation(initialPath))
  const [loaderData, setLoaderData] = useState<Record<string, unknown>>(initialData || {})
  const [isRouteReady, setIsRouteReady] = useState(initialData !== undefined)
  const [routeError, setRouteError] = useState<unknown | null>(initialError || null)
  const hydratedData = useRef(initialData !== undefined)
  const [isNavigating, setIsNavigating] = useState(false)
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const loaderCache = useRef(new Map<string, Record<string, unknown>>())
  const loaderPromises = useRef(new Map<string, Promise<Record<string, unknown>>>() )
  const scrollPositions = useRef(new Map<string, [number, number]>())
  const navigationId = useRef(0)
  const navigationController = useRef<AbortController | null>(null)

  const routeMatch = useMemo(
    () => matchRoute(location.pathname, routes, layouts),
    [location.pathname, routes, layouts]
  )

  const loadRouteData = useCallback(async (target: RouterLocation, match: RouteMatch, signal?: AbortSignal) => {
    const key = locationKey(target)
    const cached = loaderCache.current.get(key)
    if (cached) return Promise.resolve(cached)

    const data = await executeRouteLoaders(match, { url: locationUrl(target), signal })
    if (!signal?.aborted) loaderCache.current.set(key, data)
    return data
  }, [])

  const prefetch = useCallback(async (href: string) => {
    const target = resolveLocation(href)
    if (!target || loaderCache.current.has(locationKey(target))) return

    const match = matchRoute(target.pathname, routes, layouts)
    if (!match) return

    const key = locationKey(target)
    const pending = loaderPromises.current.get(key)
    if (pending) return pending.then(() => undefined)

    const promise = loadRouteData(target, match).finally(() => loaderPromises.current.delete(key))
    loaderPromises.current.set(key, promise)
    await promise
  }, [routes, layouts, loadRouteData])

  const finishNavigation = useCallback((id: number, pathname: string) => {
    if (navigationId.current !== id) return
    setIsNavigating(false)
    setPendingPath(null)
    dispatchNavigationEvent('drift:navigation-end', pathname)
  }, [])

  const navigate = useCallback((href: string, options: NavigateOptions = {}) => {
    if (typeof window === 'undefined') return

    const targetUrl = new URL(href, window.location.href)
    if (targetUrl.origin !== window.location.origin) {
      window.location.assign(targetUrl.href)
      return
    }

    const target = locationFromUrl(targetUrl)
    const currentHref = `${location.pathname}${location.search}${location.hash}`
    const targetHref = `${target.pathname}${target.search}${target.hash}`
    if (currentHref === targetHref) return
    const currentScroll: [number, number] = [window.scrollX, window.scrollY]

    const id = ++navigationId.current
    navigationController.current?.abort()
    const controller = new AbortController()
    navigationController.current = controller
    setIsNavigating(true)
    setPendingPath(target.pathname)
    setRouteError(null)
    setIsRouteReady(false)
    setLoaderData({})
    dispatchNavigationEvent('drift:navigation-start', target.pathname)
    scrollPositions.current.set(currentHref, currentScroll)
    saveCurrentScroll(currentScroll)

    const historyState = {
      ...(isObject(options.state) ? options.state : {}),
      [DRIFT_HISTORY_KEY]: { key: createHistoryKey(), scroll: [0, 0] },
    }

    if (options.replace) {
      window.history.replaceState(historyState, '', targetHref)
    } else {
      window.history.pushState(historyState, '', targetHref)
    }

    setLocation(target)

    const cached = loaderCache.current.get(locationKey(target))
    if (cached) {
      setLoaderData(cached)
      setIsRouteReady(true)
      afterNextPaint(() => {
        restoreScroll(target, options.scroll !== false)
        finishNavigation(id, target.pathname)
      })
      return
    }

    const match = matchRoute(target.pathname, routes, layouts)
    if (!match) {
      setIsRouteReady(true)
      afterNextPaint(() => {
        restoreScroll(target, options.scroll !== false)
        finishNavigation(id, target.pathname)
      })
      return
    }

    loadRouteData(target, match, controller.signal)
      .then(data => {
        if (navigationId.current === id && !controller.signal.aborted) {
          setLoaderData(data)
          setIsRouteReady(true)
          afterNextPaint(() => {
            restoreScroll(target, options.scroll !== false)
            finishNavigation(id, target.pathname)
          })
        }
      })
      .catch(error => {
        if (error instanceof Error && error.name === 'AbortError') return
        if (navigationId.current === id) {
          setRouteError(error)
          setIsRouteReady(true)
          afterNextPaint(() => {
            restoreScroll(target, options.scroll !== false)
            finishNavigation(id, target.pathname)
          })
        }
      })
  }, [finishNavigation, layouts, loadRouteData, location, routes])

  const replace = useCallback((href: string, options: Omit<NavigateOptions, 'replace'> = {}) => {
    navigate(href, { ...options, replace: true })
  }, [navigate])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    ensureHistoryState()

    const handlePopState = (event: PopStateEvent) => {
      const id = ++navigationId.current
      navigationController.current?.abort()
      const controller = new AbortController()
      navigationController.current = controller
      const next = readLocation()
      setIsNavigating(true)
      setPendingPath(next.pathname)
      setRouteError(null)
      setIsRouteReady(false)
      setLoaderData({})
      setLocation(next)
      const nextHref = `${next.pathname}${next.search}${next.hash}`
      const scroll = scrollPositions.current.get(nextHref) || event.state?.[DRIFT_HISTORY_KEY]?.scroll
      const match = matchRoute(next.pathname, routes, layouts)
      const loaded = match ? loadRouteData(next, match, controller.signal) : Promise.resolve({})
      loaded.then(data => {
        if (!controller.signal.aborted) setLoaderData(data)
      }).catch(error => {
        if (!(error instanceof Error && error.name === 'AbortError')) setRouteError(error)
      }).finally(() => {
        if (controller.signal.aborted) return
        setIsRouteReady(true)
        afterNextPaint(() => {
          if (Array.isArray(scroll)) scrollToPosition(scroll[0] || 0, scroll[1] || 0)
          else restoreScroll(next, true)
          finishNavigation(id, next.pathname)
        })
      })
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.history.scrollRestoration = previousRestoration
    }
  }, [finishNavigation, layouts, loadRouteData, routes])

  useEffect(() => {
    if (!routeMatch) {
      setIsRouteReady(true)
      return
    }
    if (isNavigating) return

    const key = locationKey(location)
    if (hydratedData.current) {
      loaderCache.current.set(key, loaderData)
      hydratedData.current = false
      setIsRouteReady(true)
      return
    }

    const cached = loaderCache.current.get(key)
    if (cached) {
      setLoaderData(cached)
      setIsRouteReady(true)
      return
    }

    const controller = new AbortController()
    navigationController.current = controller
    setIsRouteReady(false)
    setRouteError(null)
    loadRouteData(location, routeMatch, controller.signal).then(data => {
      if (!controller.signal.aborted) {
        setLoaderData(data)
        setIsRouteReady(true)
      }
    }).catch(error => {
      if (error instanceof Error && error.name === 'AbortError') return
      if (!controller.signal.aborted) {
        setRouteError(error)
        setIsRouteReady(true)
      }
    })
    return () => controller.abort()
  }, [isNavigating, loadRouteData, location, refreshKey, routeMatch])

  const retry = useCallback(() => {
    navigationController.current?.abort()
    loaderCache.current.delete(locationKey(location))
    setRouteError(null)
    setIsRouteReady(false)
    setRefreshKey(value => value + 1)
  }, [location])

  const value = useMemo<RouterContextValue>(() => ({
    currentRoute: routeMatch,
    location,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    navigate,
    replace,
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => {
      retry()
    },
    prefetch,
    isNavigating,
    isLoading: !isRouteReady,
    pendingPath,
    params: routeMatch?.params || {},
    loaderData,
    error: routeError,
    retry,
  }), [isNavigating, isRouteReady, loaderData, location, navigate, pendingPath, prefetch, replace, retry, routeError, routeMatch])

  const NotFound = notFoundComponent
  const Loading = loadingComponent
  const ErrorComponent = getErrorComponent(routeMatch) || errorComponent
  const errorView = routeError
    ? ErrorComponent
      ? <ErrorComponent error={routeError} retry={retry} />
      : <DefaultRouteError error={routeError} retry={retry} />
    : null

  return (
    <RouterContext.Provider value={value}>
      <Suspense fallback={Loading ? <Loading /> : null}>
        {errorView || (routeMatch
          ? isRouteReady
            ? <RouteRenderBoundary resetKey={`${locationKey(location)}:${refreshKey}`} onError={setRouteError}><RouteRenderer key={routeMatch.route.id} match={routeMatch} /></RouteRenderBoundary>
            : Loading ? <Loading /> : null
          : NotFound ? <NotFound /> : <DefaultNotFound />)}
      </Suspense>
    </RouterContext.Provider>
  )
}

export function normalizePathname(pathname: string): string {
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  const collapsed = withSlash.replace(/\/{2,}/g, '/')
  if (collapsed.length > 1 && collapsed.endsWith('/')) return collapsed.slice(0, -1)
  return collapsed || '/'
}

export function matchRoute(
  pathname: string,
  routes: RouteConfig[],
  layouts: LayoutConfig[] = []
): RouteMatch | null {
  const normalized = normalizePathname(pathname)
  const rankedRoutes = flattenRoutes(routes).sort((a, b) => routeScore(b.path) - routeScore(a.path))

  for (const route of rankedRoutes) {
    const params = matchPath(normalized, route.path)
    if (params) return { route, params, layouts: getLayoutsForRoute(route, layouts) }
  }
  return null
}

export function matchPath(pathname: string, pattern: string): Record<string, string> | null {
  const pathSegments = splitPath(normalizePathname(pathname))
  const patternSegments = splitPath(normalizePathname(pattern)).filter(segment => !isRouteGroup(segment))
  const params: Record<string, string> = {}
  let pathIndex = 0

  for (let patternIndex = 0; patternIndex < patternSegments.length; patternIndex++) {
    const segment = patternSegments[patternIndex]!
    const pathSegment = pathSegments[pathIndex]

    if (isOptionalCatchAll(segment)) {
      const name = segment.slice(5, -2)
      params[name] = decodeSegments(pathSegments.slice(pathIndex))
      pathIndex = pathSegments.length
      continue
    }

    if (isCatchAll(segment)) {
      if (pathIndex >= pathSegments.length) return null
      const name = segment.slice(4, -1)
      params[name] = decodeSegments(pathSegments.slice(pathIndex))
      pathIndex = pathSegments.length
      continue
    }

    if (isDynamic(segment)) {
      if (pathSegment === undefined) return null
      params[segment.slice(1, -1)] = safeDecode(pathSegment)
      pathIndex++
      continue
    }

    if (segment !== pathSegment) return null
    pathIndex++
  }

  return pathIndex === pathSegments.length ? params : null
}

function readLocation(initialPath?: string): RouterLocation {
  if (initialPath) {
    const url = new URL(initialPath, 'http://drift.local')
    return locationFromUrl(url)
  }
  if (typeof window === 'undefined') return { pathname: '/', search: '', hash: '' }
  return locationFromUrl(new URL(window.location.href))
}

function resolveLocation(href: string): RouterLocation | null {
  try {
    const base = typeof window === 'undefined' ? 'http://drift.local' : window.location.href
    const url = new URL(href, base)
    if (typeof window !== 'undefined' && url.origin !== window.location.origin) return null
    return locationFromUrl(url)
  } catch {
    return null
  }
}

function locationFromUrl(url: URL): RouterLocation {
  return { pathname: normalizePathname(url.pathname), search: url.search, hash: url.hash }
}

function flattenRoutes(routes: RouteConfig[]): RouteConfig[] {
  return routes.flatMap(route => [route, ...flattenRoutes(route.children || [])])
}

function routeScore(pattern: string): number {
  return splitPath(pattern).reduce((score, segment) => {
    if (isRouteGroup(segment)) return score
    if (isOptionalCatchAll(segment)) return score + 1
    if (isCatchAll(segment)) return score + 2
    if (isDynamic(segment)) return score + 4
    return score + 10
  }, 0) + splitPath(pattern).length
}

function splitPath(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

function isRouteGroup(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')')
}

function isDynamic(segment: string): boolean {
  return segment.startsWith('[') && segment.endsWith(']') && !isCatchAll(segment) && !isOptionalCatchAll(segment)
}

function isCatchAll(segment: string): boolean {
  return segment.startsWith('[...') && segment.endsWith(']')
}

function isOptionalCatchAll(segment: string): boolean {
  return segment.startsWith('[[...') && segment.endsWith(']]')
}

function safeDecode(value: string): string {
  try { return decodeURIComponent(value) } catch { return value }
}

function decodeSegments(segments: string[]): string {
  return segments.map(safeDecode).join('/')
}

function getLayoutsForRoute(route: RouteConfig, layouts: LayoutConfig[]): LayoutConfig[] {
  if (!route.layout) return []
  const layoutMap = new Map(layouts.map(layout => [layout.id, layout]))
  const chain: LayoutConfig[] = []
  let current = layoutMap.get(route.layout)
  const visited = new Set<string>()

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    chain.unshift(current)
    current = current.parent ? layoutMap.get(current.parent) : undefined
  }
  return chain
}

function RouteRenderer({ match }: { match: RouteMatch }) {
  let content: ReactNode = <RouteComponent route={match.route} params={match.params} />
  for (let index = match.layouts.length - 1; index >= 0; index--) {
    content = <LayoutComponent layout={match.layouts[index]!}>{content}</LayoutComponent>
  }
  return <>{content}</>
}

function RouteComponent({ route, params }: { route: RouteConfig; params: Record<string, string> }) {
  const Component = getRouteComponent(route)
  if (!Component) return <div data-route={route.id} data-params={JSON.stringify(params)}>Route: {route.component}</div>
  return <Component {...params} />
}

function LayoutComponent({ layout, children }: { layout: LayoutConfig; children: ReactNode }) {
  const Component = getLayoutComponent(layout)
  if (!Component) return <div data-layout={layout.id}><div data-layout-content>{children}</div></div>
  return <Component>{children}</Component>
}

function DefaultNotFound() {
  return <div role="main"><h1>404</h1><p>Page not found.</p></div>
}

function DefaultRouteError({ error, retry }: { error: unknown; retry: () => void }) {
  const title = isRouteError(error) ? `${error.status} ${error.statusText}` : 'Route failed to load'
  const message = error instanceof Error ? error.message : 'An unexpected route error occurred.'
  return <div role="alert"><h1>{title}</h1><p>{message}</p><button type="button" onClick={retry}>Try again</button></div>
}

interface RouteRenderBoundaryProps {
  children: ReactNode
  resetKey: string
  onError: (error: unknown) => void
}

class RouteRenderBoundary extends ReactComponent<RouteRenderBoundaryProps, { error: unknown | null }> {
  state = { error: null as unknown | null }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error)
  }

  componentDidUpdate(previous: RouteRenderBoundaryProps) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    return this.state.error ? null : this.props.children
  }
}

function saveCurrentScroll(scroll: [number, number]) {
  const state = isObject(window.history.state) ? window.history.state : {}
  const drift = isObject(state[DRIFT_HISTORY_KEY]) ? state[DRIFT_HISTORY_KEY] : {}
  window.history.replaceState({ ...state, [DRIFT_HISTORY_KEY]: { ...drift, scroll } }, '')
}

function ensureHistoryState() {
  const state = isObject(window.history.state) ? window.history.state : {}
  if (state[DRIFT_HISTORY_KEY]) return
  window.history.replaceState({ ...state, [DRIFT_HISTORY_KEY]: { key: createHistoryKey(), scroll: [window.scrollX, window.scrollY] } }, '')
}

function restoreScroll(target: RouterLocation, enabled: boolean) {
  if (!enabled) return
  requestAnimationFrame(() => {
    if (target.hash) {
      const element = document.getElementById(safeDecode(target.hash.slice(1)))
      if (element) {
        element.scrollIntoView()
        return
      }
    }
    scrollToPosition(0, 0)
  })
}

function afterNextPaint(callback: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(callback))
}

function scrollToPosition(left: number, top: number) {
  const root = document.documentElement
  const previous = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
  window.scrollTo(left, top)
  root.style.scrollBehavior = previous
}

function dispatchNavigationEvent(name: string, pathname: string) {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return
  window.dispatchEvent(new CustomEvent(name, { detail: { pathname } }))
}

function createHistoryKey(): string {
  return Math.random().toString(36).slice(2, 10)
}

function locationKey(location: RouterLocation): string {
  return `${location.pathname}${location.search}`
}

function locationUrl(location: RouterLocation): URL {
  const origin = typeof window === 'undefined' ? 'http://drift.local' : window.location.origin
  return new URL(`${location.pathname}${location.search}${location.hash}`, origin)
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useRouter must be used within a Router component')
  return context
}
