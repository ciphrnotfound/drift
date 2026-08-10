import type { RouteConfig, LayoutConfig, DataLoaderConfig, RouteParam } from '@drift/types'
import * as path from 'path'
import * as fs from 'fs'

/**
 * Generate routes from pages directory structure
 */
export function generateRoutes(pagesDir: string): RouteConfig[] {
  if (!fs.existsSync(pagesDir)) {
    return []
  }

  const files = scanDirectory(pagesDir, pagesDir)
  const routes: RouteConfig[] = []

  files.forEach((file) => {
    const route = fileToRoute(file, pagesDir)
    if (route) {
      routes.push(route)
    }
  })

  return sortRoutesBySpecificity(routes)
}

/**
 * Recursively scan directory for .drift files
 */
function scanDirectory(dir: string, baseDir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, baseDir))
    } else if (entry.isFile() && entry.name.endsWith('.drift')) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Convert a file path to a route configuration
 */
function fileToRoute(filePath: string, pagesDir: string): RouteConfig | null {
  // Remove pages directory prefix and file extension
  const relativePath = path.relative(pagesDir, filePath).replace(/\.drift$/, '')
  
  // Convert file path to URL path
  let urlPath = relativePath
    .replace(/\\/g, '/') // Windows path separator
    .replace(/\/index$/, '') // index.drift -> /
    .replace(/^\//, '') // Remove leading slash
    .split('/')
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .join('/')

  if (!urlPath) {
    urlPath = '/'
  } else if (urlPath === 'index') {
    urlPath = '/'
  } else {
    urlPath = '/' + urlPath
  }

  // Parse dynamic segments
  const params = parseDynamicSegments(urlPath)
  const isDynamic = params.some((p) => p.type !== 'static')
  const isCatchAll = params.some((p) => p.type === 'catchAll' || p.type === 'optionalCatchAll')

  // Generate component name from file path
  const componentName = path
    .basename(filePath, '.drift')
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(.)/, (m) => m.toUpperCase())

  return {
    id: urlPath,
    path: urlPath,
    filePath,
    component: componentName,
    layout: null,
    dataLoader: parseDataLoader(filePath),
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

      // Optional catch-all segment: [[...param]]
      if (segment.startsWith('[[...') && segment.endsWith(']]')) {
        params.push({
          name: segment.slice(5, -2),
          type: 'optionalCatchAll',
          position: index,
        })
      } else if (paramName.startsWith('...')) {
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
function sortRoutesBySpecificity(routes: RouteConfig[]): RouteConfig[] {
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

/**
 * Build layout hierarchy from layouts directory
 */
export function buildLayoutHierarchy(layoutsDir: string): LayoutConfig[] {
  if (!fs.existsSync(layoutsDir)) {
    return []
  }

  const files = scanDirectory(layoutsDir, layoutsDir)
  const layouts: LayoutConfig[] = []

  files.forEach((file) => {
    const layout = fileToLayout(file, layoutsDir)
    if (layout) {
      layouts.push(layout)
    }
  })

  // Build parent-child relationships
  return buildLayoutTree(layouts)
}

/**
 * Convert a file path to a layout configuration
 */
function fileToLayout(filePath: string, layoutsDir: string): LayoutConfig | null {
  const relativePath = path.relative(layoutsDir, filePath).replace(/\.drift$/, '')
  
  // Layout name from file path
  const layoutName = relativePath.replace(/\\/g, '/').replace(/^\//, '')
  
  // Generate component name
  const componentName = path
    .basename(filePath, '.drift')
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(.)/, (m) => m.toUpperCase()) + 'Layout'

  // Determine parent layout from directory structure
  const parentPath = path.dirname(relativePath)
  const parent = parentPath && parentPath !== '.' ? parentPath.replace(/\\/g, '/') : null

  return {
    id: layoutName,
    name: layoutName,
    filePath,
    component: componentName,
    dataLoader: parseDataLoader(filePath),
    parent,
    children: [],
  }
}

/**
 * Build layout tree with parent-child relationships
 */
function buildLayoutTree(layouts: LayoutConfig[]): LayoutConfig[] {
  const layoutMap = new Map<string, LayoutConfig>()
  
  // Create map for quick lookup
  layouts.forEach((layout) => {
    layoutMap.set(layout.id, layout)
  })

  // Build parent-child relationships
  layouts.forEach((layout) => {
    if (layout.parent) {
      const parent = layoutMap.get(layout.parent)
      if (parent) {
        parent.children.push(layout.id)
      }
    }
  })

  return layouts
}

/**
 * Associate routes with layouts based on directory structure
 */
export function associateRoutesWithLayouts(
  routes: RouteConfig[],
  layouts: LayoutConfig[]
): RouteConfig[] {
  const layoutMap = new Map<string, LayoutConfig>()
  
  layouts.forEach((layout) => {
    layoutMap.set(layout.id, layout)
  })

  return routes.map((route) => {
    // Find matching layout based on route path
    const layoutName = findLayoutForRoute(route.path, layoutMap)
    return {
      ...route,
      layout: layoutName,
    }
  })
}

/**
 * Find the most specific layout for a route
 */
function findLayoutForRoute(
  routePath: string,
  layoutMap: Map<string, LayoutConfig>
): string | null {
  const segments = routePath.split('/').filter((s) => s)
  
  // Try to find layout from most specific to least specific
  for (let i = segments.length; i >= 0; i--) {
    const layoutPath = segments.slice(0, i).join('/')
    
    // Try exact match
    if (layoutMap.has(layoutPath)) {
      return layoutPath
    }
    
    // Try with _layout suffix
    const layoutWithSuffix = layoutPath ? `${layoutPath}/_layout` : '_layout'
    if (layoutMap.has(layoutWithSuffix)) {
      return layoutWithSuffix
    }
  }
  
  return null
}

/**
 * Parse data loader exports from a file
 */
export function parseDataLoader(filePath: string): DataLoaderConfig | null {
  if (!fs.existsSync(filePath)) {
    return null
  }

  const withoutExtension = filePath.replace(/\.drift$/, '')
  const sidecar = [
    `${withoutExtension}.loader.ts`,
    `${withoutExtension}.loader.tsx`,
    `${withoutExtension}.loader.mjs`,
    `${withoutExtension}.loader.js`,
  ].find(candidate => fs.existsSync(candidate))

  if (sidecar) {
    return {
      functionName: 'loader',
      params: ['context'],
      returnType: 'unknown',
      filePath: sidecar,
    }
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Simple regex to detect loader export
  // In a real implementation, this would use proper AST parsing
  const loaderMatch = content.match(/export\s+(?:async\s+)?function\s+loader\s*\(/i)
  
  if (loaderMatch) {
    return {
      functionName: 'loader',
      params: ['params'], // Simplified - would parse actual params
      returnType: 'any', // Simplified - would infer from TypeScript
      filePath,
    }
  }
  
  return null
}

/**
 * Generate loader execution order (parent before child)
 */
export function generateLoaderExecutionOrder(
  route: RouteConfig,
  layouts: LayoutConfig[]
): DataLoaderConfig[] {
  const loaders: DataLoaderConfig[] = []
  
  // Collect layout loaders from root to leaf
  if (route.layout) {
    const layoutChain = getLayoutChain(route.layout, layouts)
    layoutChain.forEach((layout) => {
      if (layout.dataLoader) {
        loaders.push(layout.dataLoader)
      }
    })
  }
  
  // Add route loader last
  if (route.dataLoader) {
    loaders.push(route.dataLoader)
  }
  
  return loaders
}

/**
 * Get layout chain from root to leaf
 */
function getLayoutChain(layoutId: string, layouts: LayoutConfig[]): LayoutConfig[] {
  const layoutMap = new Map<string, LayoutConfig>()
  layouts.forEach((layout) => {
    layoutMap.set(layout.id, layout)
  })
  
  const chain: LayoutConfig[] = []
  let current = layoutMap.get(layoutId)
  
  while (current) {
    chain.unshift(current)
    current = current.parent ? layoutMap.get(current.parent) : undefined
  }
  
  return chain
}
