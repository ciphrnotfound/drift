# @drift/font

`@drift/font` is Drift's `next/font`-style typography layer. It creates stable font class names, CSS variables, preload metadata, and generated CSS for local or Google fonts.

## Local Fonts

```ts
import { localFont } from '@drift/font'

export const sans = localFont({
  family: 'Inter',
  variable: '--font-sans',
  src: [
    { path: '/fonts/inter-roman.woff2', weight: '100 900' },
    { path: '/fonts/inter-italic.woff2', weight: '100 900', style: 'italic' },
  ],
})
```

Use it:

```tsx
<main className={sans.className}>...</main>
```

Or with variables:

```css
body {
  font-family: var(--font-sans);
}
```

## Google Fonts

```ts
import { googleFont } from '@drift/font'

export const geist = googleFont({
  family: 'Geist Sans',
  weights: [400, 500, 700],
  variable: '--font-sans',
})
```

## Emitting CSS

```ts
import { getFontCSS, renderFontLinks } from '@drift/font'

const css = getFontCSS()
const links = renderFontLinks()
```

Apps can write `css` into their global stylesheet and inject `links` into the document head during SSR.

## Drift Config

```ts
export default {
  fonts: {
    strategy: 'self-hosted',
    display: 'swap',
    preload: true,
    variablePrefix: '--font',
  },
}
```
