import { describe, expect, test } from 'vitest'
import { localFont } from '@drift/font'
import { mergeMetadata, renderHead } from '../index'

describe('@drift/seo', () => {
  test('renders server SEO tags with safe escaping and OG defaults', () => {
    const head = renderHead({
      siteUrl: 'https://drift.dev',
      metadata: {
        title: 'Drift <Fast>',
        description: 'Best speed, UI, and SEO',
        canonical: '/docs',
        themeColor: '#2563eb',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Drift',
          unsafe: '</script>',
        },
      },
    })

    expect(head).toContain('<meta charset="utf-8">')
    expect(head).toContain('<title>Drift &lt;Fast&gt;</title>')
    expect(head).toContain('<link rel="canonical" href="https://drift.dev/docs">')
    expect(head).toContain('<meta property="og:title" content="Drift &lt;Fast&gt;">')
    expect(head).toContain('<meta property="og:url" content="https://drift.dev/docs">')
    expect(head).toContain('\\u003c/script>')
  })

  test('renders and dedupes font preloads', () => {
    const sans = localFont({ family: 'Inter', src: '/fonts/inter.woff2' })
    const head = renderHead({
      fonts: [sans],
      preloads: [sans.preload[0]!],
    })

    expect(head.match(/\/fonts\/inter\.woff2/g)).toHaveLength(1)
    expect(head).toContain('rel="preload"')
    expect(head).toContain('as="font"')
  })

  test('merges metadata from layouts and pages', () => {
    const metadata = mergeMetadata(
      { title: 'Base', og: { site_name: 'Drift' } },
      { title: 'Page', description: 'Page description', og: { type: 'article' } }
    )

    expect(metadata).toMatchObject({
      title: 'Page',
      description: 'Page description',
      og: {
        site_name: 'Drift',
        type: 'article',
      },
    })
  })
})
