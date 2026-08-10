# Drift

**A frontend language for structure, scoped styles, motion, routing, and metadata.**

Drift compiles `.drift` components into typed React, optimized CSS, and declarative motion. It includes file-based routing, route loaders, development diagnostics, font loading, design tokens, optional Tailwind CSS integration, static export, and Vercel Build Output API support.

> Drift `0.1` is a public alpha. It is ready for experiments, prototypes, and early adopters, but its language grammar and framework APIs are not yet covered by a 1.0 stability guarantee. Read the [shipping status](./docs/SHIPPING.md) before using it in production.

## Quick Start

Requires Node.js 18 or newer.

```bash
npm create drift-app@latest my-app
cd my-app
npm run dev
```

Build a production bundle:

```bash
npm run build
```

Build and deploy through Vercel's Build Output API:

```bash
npm run build:vercel
npx vercel deploy --prebuilt
```

## A Drift Component

```drift
component ActionButton {
  props {
    label: string
  }

  style {
    display: inline-flex
    align-items: center
    gap: $space.2
    padding: $space.3 $space.5
    border-radius: $border.radius.md
    background: $color.primary.500
    color: $color.surface

    hover {
      background: $color.primary.600
    }
  }

  motion {
    enter { opacity: 0, y: 8, duration: 0.2 }
    hover { y: -2 }
    press { scale: 0.98 }
  }

  render {
    <button type="button">{label}</button>
  }
}
```

The compiler produces:

- A typed React component and TypeScript declarations
- Scoped, optimized CSS with optional Tailwind layer integration
- Framer Motion props generated from the `motion` block
- Helpful compiler diagnostics with source locations and suggestions

## Why Drift

**One component language.** Structure, variants, responsive styles, tokens, and motion live together without hiding the generated web platform output.

**Frontend conventions included.** File-based routes, nested layouts, lazy page chunks, cancellable loaders, metadata, scroll restoration, prefetching, and route-level errors work as framework primitives.

**Use the React ecosystem.** Standard ESM imports are preserved, so Drift components can use shadcn/ui, Lucide, Hugeicons, Supabase, Firebase, and other tree-shakeable React libraries.

**Deployment is portable.** Build a normal Vite application, export static HTML, or emit Vercel Build Output API v3 artifacts.

## Routing

Routes are generated from the `pages` directory:

```text
pages/
|-- index.drift          -> /
|-- about.drift          -> /about
|-- blog/
|   |-- index.drift      -> /blog
|   `-- [slug].drift     -> /blog/:slug
`-- [...catchAll].drift  -> /*
```

Drift routes support nested layouts, typed params, lazy imports, loaders, stale-navigation cancellation, metadata, status codes, SSR data hydration, and client transitions through `Link`.

## Tailwind CSS

Tailwind is optional. Enable it in the Drift Vite plugin:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { drift } from '@drift/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    drift({ tokensPath: './drift.tokens', tailwind: true }),
  ],
})
```

Compiled components accept both `className` and `tw`. Drift styles are emitted in `@layer drift`, allowing Tailwind utilities to override component defaults predictably.

## Fonts

`@drift/font` provides a framework-aware font API with generated preload tags, fallback stacks, CSS variables, and Google Fonts support:

```ts
import { googleFont } from '@drift/font'

export const manrope = googleFont({
  family: 'Manrope',
  weights: [400, 500, 600],
  subsets: ['latin'],
  variable: '--font-manrope',
})
```

Remote Google Fonts are convenient during alpha development. Self-host fonts for stricter privacy, resilience, and production performance requirements.

## Icons and Components

Drift leaves regular ESM imports intact:

```drift
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

component ContinueButton {
  render {
    <Button>Continue <ArrowRight size={16} /></Button>
  }
}
```

This works with Lucide, Hugeicons, shadcn/ui, and other React component libraries without a Drift-specific adapter.

## Packages

| Package | Purpose |
| --- | --- |
| `create-drift-app` | New-project launcher |
| `@drift/cli` | Development, build, export, and Vercel commands |
| `@drift/compiler` | `.drift` parser and compilation pipeline |
| `@drift/vite-plugin` | Vite transforms, HMR, routes, and diagnostics |
| `@drift/router` | File-based router, loaders, metadata, SSR, and hydration |
| `@drift/server` | Secure actions, middleware, environment access, and adapters |
| `@drift/font` | Font loading, preload generation, and CSS variables |
| `@drift/tokens` | Design-token parsing and resolution |
| `@drift/style` | Scoped CSS extraction and optimization |
| `@drift/motion` | Declarative motion code generation |
| `@drift/motion-runtime` | Lightweight Web Animations API primitives |
| `@drift/seo` | Server-renderable metadata generation |
| `@drift/ui` | Optional accessible React primitives |
| `@drift/types` | Shared public TypeScript contracts |

## Local Development

```bash
corepack enable
pnpm install
pnpm release:check
```

The release gate type-checks every package, runs unit and integration tests, builds the packages and example app, creates a fresh app and Vercel artifact, checks bundle budgets, and runs Chromium accessibility and navigation tests.

Useful commands:

```bash
pnpm dev             # Run the example app
pnpm test            # Unit and integration tests
pnpm test:e2e        # Browser tests
pnpm type-check      # TypeScript checks
pnpm build           # Package and example builds
pnpm test:budgets    # Production bundle budgets
```

## Project Status

The current release gate passes 138 unit and integration tests plus 10 browser tests. See:

- [Shipping readiness](./docs/SHIPPING.md)
- [Compatibility policy](./docs/COMPATIBILITY.md)
- [Security model](./SECURITY.md)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)

## License

Drift is available under the [MIT License](./LICENSE).
