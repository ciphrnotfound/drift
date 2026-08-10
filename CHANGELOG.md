# Changelog

All notable Drift changes are documented here. Drift follows Semantic Versioning after `1.0`; during the public alpha, minor releases may include language and API migrations.

## [0.1.0] - 2026-08-10

### Added

- `.drift` component grammar with typed props, render blocks, scoped styles, variants, responsive rules, tokens, and declarative motion
- React and TypeScript output with CSS extraction and declaration generation
- Vite integration with HMR, source diagnostics, and a clickable development error overlay
- File-based routing with layouts, dynamic segments, catch-all routes, lazy chunks, route loaders, cancellation, prefetching, errors, retry, and scroll restoration
- SSR route rendering, metadata, status codes, and XSS-safe loader-data hydration
- Google Fonts integration, preload generation, fallback stacks, and CSS variables through `@drift/font`
- Optional Tailwind CSS layering plus `className` and `tw` interoperability
- Standard React imports for shadcn/ui, Lucide, Hugeicons, Supabase, Firebase, and other ESM libraries
- Secure server actions, middleware, environment access, authorization hooks, request limits, and Vercel handler contracts
- Static export and Vercel Build Output API v3 generation
- `create-drift-app` scaffolding with minimal, default, and full templates
- Chromium navigation, responsive, and accessibility coverage
- CI across Node.js 18, 20, and 22 with production bundle budgets

### Alpha Limitations

- The grammar and public framework APIs are not frozen
- Firefox and WebKit are not yet part of the browser release gate
- Vercel SSR Function bundling still requires explicit application wiring
- Remote Google Fonts are not automatically self-hosted
- Native database adapters are not bundled; official browser and server SDKs remain usable

[0.1.0]: https://github.com/drift-framework/drift/releases/tag/v0.1.0
