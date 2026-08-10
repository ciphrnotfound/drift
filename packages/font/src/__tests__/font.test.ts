import { beforeEach, describe, expect, test } from 'vitest'
import {
  getFontCSS,
  getFontPreloads,
  googleFont,
  localFont,
  renderFontLinks,
  resetFontRegistry,
} from '../index'

describe('@drift/font', () => {
  beforeEach(() => {
    resetFontRegistry()
  })

  test('creates local font CSS, class names, variables, and preloads', () => {
    const inter = localFont({
      family: 'Inter',
      variable: '--font-sans',
      src: [
        { path: '/fonts/inter-roman.woff2', weight: '100 900' },
        { path: '/fonts/inter-italic.woff2', weight: '100 900', style: 'italic' },
      ],
    })

    expect(inter.className).toBe('drift-font-inter')
    expect(inter.variable).toBe('--font-sans')
    expect(inter.style.fontFamily).toContain('"Inter"')
    expect(inter.css).toContain('@font-face')
    expect(inter.css).toContain('font-weight: 100 900;')
    expect(inter.css).toContain('--font-sans')
    expect(inter.preload).toHaveLength(2)
    expect(inter.preload[0]).toMatchObject({
      rel: 'preload',
      href: '/fonts/inter-roman.woff2',
      as: 'font',
      type: 'font/woff2',
    })
  })

  test('creates Google font CSS and preload links', () => {
    const geist = googleFont({
      family: 'Geist Sans',
      weights: [400, 600, 700],
      styles: ['normal', 'italic'],
      variable: '--font-sans',
    })

    expect(geist.className).toBe('drift-font-geist-sans')
    expect(geist.css).toContain('@import url("https://fonts.googleapis.com/css2?family=Geist+Sans:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap")')
    expect(geist.preload).toHaveLength(3)
  })

  test('collects registered CSS and renders link tags', () => {
    localFont({ family: 'Mono', src: '/fonts/mono.woff2' })
    googleFont({ family: 'Inter', weights: [400] })

    expect(getFontCSS()).toContain('drift-font-mono')
    expect(getFontCSS()).toContain('drift-font-inter')
    expect(getFontPreloads()).toHaveLength(4)
    expect(renderFontLinks()).toContain('<link rel="preload" href="/fonts/mono.woff2" as="font" type="font/woff2" crossorigin>')
    expect(renderFontLinks()).toContain('fonts.googleapis.com')
  })
})
