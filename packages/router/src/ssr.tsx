import { renderToString } from 'react-dom/server'
import { matchRoute, Router } from './Router'
import type { RouteConfig, LayoutConfig } from '@drift/types'
import type { DriftFont } from '@drift/font'
import { renderHead } from '@drift/seo'
import { executeRouteLoaders, isRouteError, preloadRouteMatch, serializeRouteError } from './runtime'
import { createHydrationScript } from './hydration'

export interface SSRResult {
  html: string
  head: string
  data: Record<string, any>
  status: number
  hydrationScript: string
  metadata: {
    title?: string
    description?: string
  }
}

export interface SSROptions {
  fonts?: DriftFont[]
  siteUrl?: string
  defaultTitle?: string
  origin?: string
  request?: Request
  hydrationId?: string
}

/**
 * Server-side render a Drift application
 */
export async function renderToHTML(
  path: string,
  routes: RouteConfig[],
  layouts: LayoutConfig[] = [],
  initialData?: Record<string, any>,
  options: SSROptions = {}
): Promise<SSRResult> {
  const url = new URL(path, options.origin || options.siteUrl || 'http://drift.local')
  const match = matchRoute(url.pathname, routes, layouts)
  const matchedRoute = match?.route
  const metadata = matchedRoute?.metadata || null
  const head = renderHead({
    metadata,
    fonts: options.fonts,
    siteUrl: options.siteUrl,
    defaultTitle: options.defaultTitle,
  })

  let status = match ? 200 : 404
  let data = initialData || {}
  let routeError: unknown | undefined
  if (match) {
    try {
      await preloadRouteMatch(match)
      if (initialData === undefined) {
        data = await executeRouteLoaders(match, { url, request: options.request })
      }
    } catch (error) {
      status = isRouteError(error) ? error.status : 500
      routeError = error
    }
  }

  const html = renderToString(
    <Router 
      routes={routes} 
      layouts={layouts} 
      initialPath={path}
      initialData={data}
      initialError={routeError}
    />
  )

  return {
    html,
    head,
    data,
    status,
    hydrationScript: createHydrationScript({
      path: `${url.pathname}${url.search}${url.hash}`,
      data,
      error: routeError ? serializeRouteError(routeError) : undefined,
    }, options.hydrationId),
    metadata: {
      title: metadata?.title,
      description: metadata?.description,
    },
  }
}
