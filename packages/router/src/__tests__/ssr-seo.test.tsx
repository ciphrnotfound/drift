import { describe, expect, test } from 'vitest'
import { localFont } from '@drift/font'
import { renderToHTML } from '../ssr'
import type { RouteConfig } from '@drift/types'

function Home() {
  return <main>Home</main>
}

describe('router SSR SEO', () => {
  test('returns server-rendered head HTML with metadata and fonts', async () => {
    const font = localFont({ family: 'Inter', src: '/fonts/inter.woff2' })
    const routes: RouteConfig[] = [{
      id: '/',
      path: '/',
      filePath: 'pages/index.drift',
      component: 'Home',
      componentInstance: Home,
      layout: null,
      dataLoader: null,
      children: [],
      params: [],
      isDynamic: false,
      isCatchAll: false,
      metadata: {
        type: 'MetadataBlock',
        title: 'Drift SEO',
        description: 'Server-rendered SEO',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
          source: '',
        },
      },
    }]

    const result = await renderToHTML('/', routes, [], {}, {
      fonts: [font],
      siteUrl: 'https://drift.dev',
    })

    expect(result.head).toContain('<title>Drift SEO</title>')
    expect(result.head).toContain('<meta name="description" content="Server-rendered SEO">')
    expect(result.head).toContain('/fonts/inter.woff2')
    expect(result.metadata).toMatchObject({
      title: 'Drift SEO',
      description: 'Server-rendered SEO',
    })
  })
})
