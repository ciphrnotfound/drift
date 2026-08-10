import type { RouteConfig, RouteParam } from '@drift/types'
import * as path from 'path'

/**
 * Generate routes from pages directory structure
 */
export function generateRoutes(pagesDir: string, files: string[]): RouteConfig[] {
  const routes: RouteConfig[] = []

  files.forEach((file) => {
    const route = fileToRoute(file, pagesDir)
    if (route) {
      routes.push(route)
    }
  })

  return routes
}

/**
 * Convert a file path to a route configuration
 */
function fileToRoute(filePath: string, pagesDir: string): RouteConfig | null {
  // Remove pages directory prefix and file extension
  const relativePath = filePath.replace(pagesDir, '').replace(/\.drift$/, '')
  
  // Convert file path to URL path
  let urlPath = relativePath
    .replace(/\\/g, '/') // Windows path separator
    .replace(/\/index$/, '') // index.drift -> /
    .replace(/^\//, '') // Remove leading slash

  if (!urlPath) {
    urlPath = '/'
  } else {
    urlPath = '/' + urlPath
  }

  // Parse dynamic segments
  const params = parseDynamicSegments(urlPath)
  const isDynamic = params.some((p) => p.type === 'dynamic')
  const isCatchAll = params.some((p) => p.type === 'catchAll')

  // Generate component name from file path
  const componentName = path
    .basename(filePath, '.drift')
    .replace(/[^a-zA-Z0-9]/g, '')

  return {
    id: urlPath,
    path: urlPath,
    filePath,
    component: componentName,
    layout: null,
    dataLoader: null,
    children: [],
    params,
    isDynamic,
    isCatchAll,
  }
}

/**
 * Parse dynamic segments from a URL path
 */
function parseDynamicSegments(urlPath: string): RouteParam[] {
  const params: RouteParam[] = []
  const segments = urlPath.split('/').filter((s) => s)

  segments.forEach((segment, index) => {
    // Dynamic segment: [param]
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const paramName = segment.slice(1, -1)

      // Catch-all segment: [...param]
      if (paramName.startsWith('...')) {
        params.push({
          name: paramName.slice(3),
          type: 'catchAll',
          position: index,
        })
      } else {
        params.push({
          name: paramName,
          type: 'dynamic',
          position: index,
        })
      }
    } else {
      params.push({
        name: segment,
        type: 'static',
        position: index,
      })
    }
  })

  return params
}

/**
 * Sort routes by specificity (most specific first)
 */
export function sortRoutesBySpecificity(routes: RouteConfig[]): RouteConfig[] {
  return routes.sort((a, b) => {
    // Static routes before dynamic routes
    if (!a.isDynamic && b.isDynamic) return -1
    if (a.isDynamic && !b.isDynamic) return 1

    // Catch-all routes last
    if (!a.isCatchAll && b.isCatchAll) return -1
    if (a.isCatchAll && !b.isCatchAll) return 1

    // More segments = more specific
    const aSegments = a.path.split('/').length
    const bSegments = b.path.split('/').length
    if (aSegments !== bSegments) return bSegments - aSegments

    // Alphabetical order
    return a.path.localeCompare(b.path)
  })
}
