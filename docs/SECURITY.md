# Drift Security Model

Drift 0.1 is a public alpha. Treat grammar and framework APIs as unstable, but do not treat security boundaries as optional.

## Server Boundary

- Import secrets and request handlers from `@drift/server`; its browser export fails closed.
- Read secrets with `serverEnv()`. Never place private values in `VITE_*`, route metadata, loader hydration data, or client bundles.
- Mutating actions default to `POST`, same-origin checks, a 1 MiB body limit, supported content-type validation, and sanitized errors.
- Authentication establishes identity. Every protected action must also provide an `authorize` callback for the requested resource.
- Loader data is serialized into HTML. Return only fields safe for the browser and escape output through Drift hydration helpers.

## Deployment

`drift build --target vercel` emits static Build Output API v3 output. Static builds contain no server secrets. For Vercel Functions, wrap a Drift request handler with `createVercelHandler` from `@drift/server/vercel` and export the returned Fetch-standard object.

## Reporting

Do not open a public issue for an undisclosed vulnerability. Until a private security address is established for the project, do not present Drift as production-stable or suitable for regulated workloads.
