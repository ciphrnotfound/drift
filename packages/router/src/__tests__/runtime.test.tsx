import { describe, expect, test } from 'vitest'
import type { LayoutConfig, RouteConfig } from '@drift/types'
import { useLoader } from '../hooks'
import { matchRoute } from '../Router'
import {
  RouteError,
  deserializeRouteError,
  executeRouteLoaders,
  isRouteError,
  preloadRouteMatch,
  serializeRouteError,
} from '../runtime'
import { createHydrationScript, serializeHydrationData } from '../hydration'
import { renderToHTML } from '../ssr'

function route(overrides: Partial<RouteConfig> = {}): RouteConfig {
  return { id: 'product', path: '/products/[id]', component: 'Product', ...overrides }
}

describe('route runtime', () => {
  test('executes layout and route loaders in order with request context', async () => {
    const calls: string[] = []
    const layout: LayoutConfig = {
      id: 'root',
      name: 'root',
      filePath: 'layouts/root.drift',
      component: 'RootLayout',
      dataLoader: null,
      loader: async ({ url, signal }) => {
        expect(signal.aborted).toBe(false)
        calls.push(`layout:${url.searchParams.get('view')}`)
        return { shell: true }
      },
      parent: null,
      children: [],
    }
    const config = route({
      layout: 'root',
      loader: ({ params, request }) => {
        calls.push(`route:${params.id}:${request.method}`)
        return { id: params.id }
      },
    })
    const match = matchRoute('/products/42', [config], [layout])!
    const data = await executeRouteLoaders(match, { url: new URL('https://drift.dev/products/42?view=full') })

    expect(calls).toEqual(['layout:full', 'route:42:GET'])
    expect(data).toEqual({ 'layout:root': { shell: true }, 'route:product': { id: '42' } })
  })

  test('aborts stale loader work', async () => {
    const controller = new AbortController()
    const config = route({ loader: async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      return { late: true }
    } })
    const match = matchRoute('/products/1', [config])!
    const pending = executeRouteLoaders(match, {
      url: new URL('https://drift.dev/products/1'),
      signal: controller.signal,
    })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  test('loads a lazy route module once for prefetch and loader execution', async () => {
    let imports = 0
    const config = route({
      lazy: async () => {
        imports++
        return { component: () => null, loader: ({ params }) => ({ id: params.id }) }
      },
    })
    const match = matchRoute('/products/7', [config])!
    await preloadRouteMatch(match)
    const data = await executeRouteLoaders(match, { url: new URL('https://drift.dev/products/7') })
    expect(imports).toBe(1)
    expect(data['route:product']).toEqual({ id: '7' })
  })

  test('round-trips typed route errors', () => {
    const restored = deserializeRouteError(serializeRouteError(new RouteError(401, 'Unauthorized', { reason: 'session' })))
    expect(isRouteError(restored)).toBe(true)
    expect(restored).toMatchObject({ status: 401, statusText: 'Unauthorized', data: { reason: 'session' } })
  })
})

describe('SSR hydration', () => {
  test('renders loader data on the server and emits a safe hydration payload', async () => {
    function Product() {
      const data = useLoader<{ name: string }>()
      return <main>{data.name}</main>
    }

    const config = route({
      componentInstance: Product,
      loader: ({ params }) => ({ name: `Product ${params.id}` }),
    })
    const result = await renderToHTML('/products/9?from=search', [config])

    expect(result.status).toBe(200)
    expect(result.html).toContain('Product 9')
    expect(result.data['route:product']).toEqual({ name: 'Product 9' })
    expect(result.hydrationScript).toContain('/products/9?from=search')
  })

  test('renders a route error boundary with the correct HTTP status', async () => {
    function Boundary({ error }: { error: unknown }) {
      return <main>{isRouteError(error) ? `${error.status} ${error.statusText}` : 'Failed'}</main>
    }
    const config = route({
      componentInstance: () => <main>Hidden</main>,
      errorComponent: Boundary,
      loader: () => { throw new RouteError(404, 'Product missing') },
    })
    const result = await renderToHTML('/products/nope', [config])
    expect(result.status).toBe(404)
    expect(result.html).toContain('404 Product missing')
    expect(result.hydrationScript).toContain('__driftRouteError')
  })

  test('escapes script-breaking data', () => {
    const payload = { path: '/', data: { value: '</script><script>alert(1)</script>' } }
    expect(serializeHydrationData(payload)).not.toContain('</script>')
    expect(createHydrationScript(payload)).toContain('type="application/json"')
  })
})
