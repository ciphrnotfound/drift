# Drift Shipping Readiness

Drift is a deployable public alpha. The language, compiler, frontend runtime, router, static SEO output, secure action primitives, and Vercel static adapter are ready for early adopters. Grammar and framework APIs are not stable enough for a 1.0 compatibility promise.

## Release Gate

Run the same gate used by CI:

```bash
pnpm release:check
```

The gate type-checks all packages, runs unit and integration tests, builds every package and the example app, enforces compressed bundle budgets, and runs Chromium navigation, responsive, metadata, recovery, and axe accessibility tests.

## Completed Alpha Gate

- Route and layout loaders with typed request, URL, params, data, cancellation, and cache contracts.
- Route-level error boundaries, serializable HTTP-style errors, retry, refresh, and sanitized production failures.
- Generated lazy route chunks, intent prefetch, stale-navigation cancellation, and immediate History API commits.
- SSR loader execution, error status propagation, XSS-safe hydration data, and client hydration helpers.
- History scroll restoration, query/hash preservation, 404 recovery, route metadata, and responsive browser tests.
- Server-only environment access, same-origin actions, body limits, input parsing, authorization hooks, middleware, and request IDs.
- Vercel Build Output API v3 artifacts with automatic SSR Function bundling when `ssr.enabled` is set.
- Node 18/20/22 CI, a compatibility manifest, bundle budgets, and serious/critical WCAG automation.

## Before Stable 1.0

- Freeze the `.drift` grammar and publish migration/codemod and deprecation policies.
- Add Firefox and WebKit gates, React 19, Vite 6+, and Tailwind 4 compatibility.
- Self-host Google font files during production builds instead of relying on the Google stylesheet endpoint.
- Complete keyboard/screen-reader conformance for every optional UI primitive.
- Add package provenance, signed releases, changelog automation, private vulnerability reporting, and Linux/macOS/Windows CLI CI.
- Publish reference server integrations for Supabase and Firebase with explicit auth and authorization examples.

## Vercel

From a Drift app:

```bash
drift build --target vercel
vercel deploy --prebuilt
```

This creates `.vercel/output` for a CDN-hosted Drift application with working client routes. When `ssr.enabled` is set in `drift.config.ts`, Drift also bundles `src/entry.server.tsx` into a Node.js Vercel Function and routes document requests through it. API handlers can use `createVercelHandler` from `@drift/server/vercel`.

For a Git-connected Vercel project, set Root Directory to the repository root. The checked-in `vercel.json` builds workspace packages before generating the root `.vercel/output` artifact. Do not set Root Directory to `example-app` for this monorepo deployment.

## Release Claim

Use "deployable public alpha" for 0.1. Do not claim production stability, guaranteed backward compatibility, or superiority to mature frameworks until the stable blockers above are complete and measured independently.
