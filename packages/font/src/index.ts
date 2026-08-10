export type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
export type FontStyle = 'normal' | 'italic' | 'oblique'

export interface FontPreload {
  href: string
  as: 'font' | 'style'
  type?: string
  rel: 'preload' | 'preconnect' | 'stylesheet'
  crossOrigin?: 'anonymous'
}

export interface DriftFont {
  className: string
  variable?: string
  family: string
  style: {
    fontFamily: string
  }
  css: string
  preload: FontPreload[]
}

export interface LocalFontSource {
  path: string
  weight?: string | number
  style?: FontStyle
}

export interface LocalFontOptions {
  src: string | LocalFontSource | LocalFontSource[]
  family?: string
  variable?: `--${string}`
  display?: FontDisplay
  fallback?: string[]
  preload?: boolean
}

export interface GoogleFontOptions {
  family: string
  weights?: Array<string | number>
  styles?: FontStyle[]
  subsets?: string[]
  display?: FontDisplay
  variable?: `--${string}`
  fallback?: string[]
  preload?: boolean
}

const registry = new Map<string, DriftFont>()

export function localFont(options: LocalFontOptions): DriftFont {
  const sources = normalizeLocalSources(options.src)
  const family = options.family || stableFontFamily(sources.map(source => source.path).join('|'))
  const className = `drift-font-${slugify(family)}`
  const display = options.display || 'swap'
  const fallback = options.fallback || ['system-ui', 'sans-serif']
  const fontFamily = quoteFamily(family)

  const faces = sources.map((source) => {
    const format = fontFormat(source.path)
    return [
      '@font-face {',
      `  font-family: ${fontFamily};`,
      `  src: url("${source.path}")${format ? ` format("${format}")` : ''};`,
      `  font-weight: ${source.weight || 400};`,
      `  font-style: ${source.style || 'normal'};`,
      `  font-display: ${display};`,
      '}',
    ].join('\n')
  })

  const stack = [fontFamily, ...fallback].join(', ')
  const css = [
    ...faces,
    `.${className} { font-family: ${stack}; }`,
    options.variable ? `.${className} { ${options.variable}: ${stack}; }` : '',
  ].filter(Boolean).join('\n\n')

  const font: DriftFont = {
    className,
    variable: options.variable,
    family,
    style: { fontFamily: stack },
    css,
    preload: options.preload === false ? [] : sources.map((source) => ({
      rel: 'preload',
      href: source.path,
      as: 'font',
      type: mimeForFont(source.path),
      crossOrigin: 'anonymous',
    })),
  }

  registerFont(font)
  return font
}

export function googleFont(options: GoogleFontOptions): DriftFont {
  const family = options.family
  const className = `drift-font-${slugify(family)}`
  const fallback = options.fallback || ['system-ui', 'sans-serif']
  const href = googleFontHref(options)
  const stack = [quoteFamily(family), ...fallback].join(', ')
  const css = [
    `@import url("${href}");`,
    `.${className} { font-family: ${stack}; }`,
    options.variable ? `.${className} { ${options.variable}: ${stack}; }` : '',
  ].filter(Boolean).join('\n\n')

  const font: DriftFont = {
    className,
    variable: options.variable,
    family,
    style: { fontFamily: stack },
    css,
    preload: options.preload === false ? [] : [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com', as: 'style' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', as: 'style', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href, as: 'style' },
    ],
  }

  registerFont(font)
  return font
}

export function getFontCSS(): string {
  return [...registry.values()].map(font => font.css).join('\n\n')
}

export function getFontPreloads(): FontPreload[] {
  return [...registry.values()].flatMap(font => font.preload)
}

export function resetFontRegistry(): void {
  registry.clear()
}

export function renderFontLinks(fonts: DriftFont[] = [...registry.values()]): string {
  return fonts
    .flatMap(font => font.preload)
    .map((link) => {
      const attrs = [
        `rel="${link.rel}"`,
        `href="${link.href}"`,
        link.as ? `as="${link.as}"` : '',
        link.type ? `type="${link.type}"` : '',
        link.crossOrigin ? 'crossorigin' : '',
      ].filter(Boolean).join(' ')

      return `<link ${attrs}>`
    })
    .join('\n')
}

function registerFont(font: DriftFont): void {
  registry.set(font.className, font)
}

function normalizeLocalSources(src: LocalFontOptions['src']): LocalFontSource[] {
  if (typeof src === 'string') return [{ path: src }]
  if (Array.isArray(src)) return src
  return [src]
}

function googleFontHref(options: GoogleFontOptions): string {
  const family = options.family.replace(/\s+/g, '+')
  const weights = options.weights?.length ? options.weights : [400]
  const styles = options.styles?.length ? options.styles : ['normal']
  const axes = styles.includes('italic') ? 'ital,wght' : 'wght'
  const values = styles.includes('italic')
    ? styles.flatMap(style => weights.map(weight => `${style === 'italic' ? 1 : 0},${weight}`))
    : weights.map(String)
  const subsets = options.subsets?.length ? `&subset=${options.subsets.join(',')}` : ''

  return `https://fonts.googleapis.com/css2?family=${family}:${axes}@${values.join(';')}&display=${options.display || 'swap'}${subsets}`
}

function stableFontFamily(input: string): string {
  return `DriftFont_${hash(input)}`
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'font'
}

function hash(value: string): string {
  let result = 5381
  for (let i = 0; i < value.length; i++) {
    result = (result * 33) ^ value.charCodeAt(i)
  }
  return (result >>> 0).toString(36)
}

function quoteFamily(family: string): string {
  return isGenericFamily(family) ? family : `"${family.replace(/"/g, '\\"')}"`
}

function isGenericFamily(family: string): boolean {
  return [
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-serif',
    'ui-sans-serif',
    'ui-monospace',
    'ui-rounded',
  ].includes(family)
}

function fontFormat(path: string): string {
  if (path.endsWith('.woff2')) return 'woff2'
  if (path.endsWith('.woff')) return 'woff'
  if (path.endsWith('.ttf')) return 'truetype'
  if (path.endsWith('.otf')) return 'opentype'
  return ''
}

function mimeForFont(path: string): string | undefined {
  if (path.endsWith('.woff2')) return 'font/woff2'
  if (path.endsWith('.woff')) return 'font/woff'
  if (path.endsWith('.ttf')) return 'font/ttf'
  if (path.endsWith('.otf')) return 'font/otf'
  return undefined
}
