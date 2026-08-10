import type { DriftFont, FontPreload } from '@drift/font'
import type { MetadataBlock } from '@drift/types'

export interface DriftSEO {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  robots?: string
  viewport?: string
  themeColor?: string
  og?: Record<string, string>
  twitter?: Record<string, string>
  alternates?: Array<{ href: string; hrefLang: string }>
  jsonLd?: unknown | unknown[]
}

export interface RenderHeadOptions {
  metadata?: MetadataBlock | DriftSEO | null
  fonts?: DriftFont[]
  preloads?: FontPreload[]
  defaultTitle?: string
  siteUrl?: string
}

export function renderHead(options: RenderHeadOptions = {}): string {
  const metadata = normalizeMetadata(options.metadata)
  const tags: string[] = []

  tags.push('<meta charset="utf-8">')
  tags.push(`<meta name="viewport" content="${escapeAttr(metadata.viewport || 'width=device-width, initial-scale=1')}">`)

  const title = metadata.title || options.defaultTitle
  if (title) tags.push(`<title>${escapeHtml(title)}</title>`)
  if (metadata.description) tags.push(meta('description', metadata.description))
  if (metadata.keywords?.length) tags.push(meta('keywords', metadata.keywords.join(', ')))
  if (metadata.robots) tags.push(meta('robots', metadata.robots))
  if (metadata.themeColor) tags.push(meta('theme-color', metadata.themeColor))

  const canonical = absoluteUrl(metadata.canonical, options.siteUrl)
  if (canonical) tags.push(`<link rel="canonical" href="${escapeAttr(canonical)}">`)

  for (const alternate of metadata.alternates || []) {
    tags.push(`<link rel="alternate" hreflang="${escapeAttr(alternate.hrefLang)}" href="${escapeAttr(absoluteUrl(alternate.href, options.siteUrl) || alternate.href)}">`)
  }

  const og = withOpenGraphDefaults(metadata, canonical)
  for (const [key, value] of Object.entries(og)) {
    tags.push(metaProperty(`og:${key}`, value))
  }

  for (const [key, value] of Object.entries(metadata.twitter || {})) {
    tags.push(meta(`twitter:${key}`, value))
  }

  const preloads = [
    ...(options.fonts || []).flatMap(font => font.preload),
    ...(options.preloads || []),
  ]
  for (const preload of dedupePreloads(preloads)) {
    tags.push(renderPreload(preload))
  }

  const jsonLd = Array.isArray(metadata.jsonLd) ? metadata.jsonLd : metadata.jsonLd ? [metadata.jsonLd] : []
  for (const item of jsonLd) {
    tags.push(`<script type="application/ld+json">${escapeScriptJson(item)}</script>`)
  }

  return tags.join('\n')
}

export function metadataToHead(metadata: MetadataBlock | DriftSEO, options: Omit<RenderHeadOptions, 'metadata'> = {}): string {
  return renderHead({ ...options, metadata })
}

export function mergeMetadata(...items: Array<MetadataBlock | DriftSEO | null | undefined>): DriftSEO {
  return items.reduce<DriftSEO>((merged, item) => {
    if (!item) return merged
    const normalized = normalizeMetadata(item)
    return {
      ...merged,
      ...normalized,
      keywords: normalized.keywords || merged.keywords,
      og: { ...merged.og, ...normalized.og },
      twitter: { ...merged.twitter, ...normalized.twitter },
      alternates: normalized.alternates || merged.alternates,
      jsonLd: normalized.jsonLd || merged.jsonLd,
    }
  }, {})
}

function normalizeMetadata(metadata?: MetadataBlock | DriftSEO | null): DriftSEO {
  if (!metadata) return {}
  return {
    ...metadata,
    keywords: Array.isArray(metadata.keywords) ? metadata.keywords : undefined,
  } as DriftSEO
}

function withOpenGraphDefaults(metadata: DriftSEO, canonical?: string): Record<string, string> {
  const og: Record<string, string> = { ...(metadata.og || {}) }
  if (metadata.title && !og.title) og.title = metadata.title
  if (metadata.description && !og.description) og.description = metadata.description
  if (canonical && !og.url) og.url = canonical
  return og
}

function meta(name: string, content: string): string {
  return `<meta name="${escapeAttr(name)}" content="${escapeAttr(content)}">`
}

function metaProperty(property: string, content: string): string {
  return `<meta property="${escapeAttr(property)}" content="${escapeAttr(content)}">`
}

function renderPreload(link: FontPreload): string {
  const attrs = [
    `rel="${escapeAttr(link.rel)}"`,
    `href="${escapeAttr(link.href)}"`,
    `as="${escapeAttr(link.as)}"`,
    link.type ? `type="${escapeAttr(link.type)}"` : '',
    link.crossOrigin ? 'crossorigin' : '',
  ].filter(Boolean)
  return `<link ${attrs.join(' ')}>`
}

function dedupePreloads(preloads: FontPreload[]): FontPreload[] {
  const seen = new Set<string>()
  return preloads.filter((preload) => {
    const key = `${preload.rel}:${preload.href}:${preload.as}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function absoluteUrl(url: string | undefined, siteUrl?: string): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//.test(url)) return url
  if (!siteUrl) return url
  return `${siteUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;')
}

function escapeScriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
