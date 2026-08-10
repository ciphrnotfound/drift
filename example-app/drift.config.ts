import { defineConfig } from '@drift/compiler'

export default defineConfig({
  siteUrl: 'https://drift-framework.dev',
  seo: {
    defaultTitle: 'Drift - The Frontend Language for Speed, UI, and SEO'
  },
  compiler: {
    sourceMaps: true,
    minify: false // Keep readable for development
  },
  styles: {
    scoping: 'component',
    optimizeCSS: false
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  },
  motion: {
    reducedMotion: 'respect'
  }
})
