# Drift SEO and Performance Direction

Drift's goal is to make speed, UI, and SEO first-class language features.

## What Exists Now

- `@drift/font` provides `next/font`-style local and Google font APIs.
- `@drift/seo` renders server-safe head HTML from route metadata.
- Router SSR now returns `head` and `html` separately.
- Compiled `.drift` components with `metadata` blocks emit `.metadata.json` sidecars.
- Font preloads can be passed into SSR and deduped into the document head.

## Basic Usage

```ts
import { googleFont } from '@drift/font'
import { renderToHTML } from '@drift/router'

const sans = googleFont({
  family: 'Geist Sans',
  weights: [400, 600, 700],
  variable: '--font-sans',
})

const result = await renderToHTML('/', routes, layouts, {}, {
  fonts: [sans],
  siteUrl: 'https://example.com',
})

const document = `<!doctype html>
<html>
  <head>${result.head}</head>
  <body><div id="root">${result.html}</div></body>
</html>`
```

## Drift Metadata

```drift
component Home {
  metadata {
    title: "Drift"
    description: "The frontend language for speed, UI, and SEO."
    keywords: "drift, frontend, seo"
  }

  render {
    <main>{children}</main>
  }
}
```

The compiler emits:

- `Home.tsx`
- `Home.css`
- `Home.d.ts`
- `Home.metadata.json`

## Next Targets

- Route manifest should automatically attach metadata sidecars.
- Static export should generate full HTML documents with head tags.
- Add sitemap and robots generation.
- Add image metadata and social-card helpers.
- Add SEO diagnostics: missing title, weak description, missing canonical, missing image alt.
- Add page speed budgets in config.
