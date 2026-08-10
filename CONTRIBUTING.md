# Contributing to Drift

Drift is a public alpha and contributions are welcome. Small, focused pull requests are the easiest to review and stabilize.

## Setup

```bash
corepack enable
pnpm install
pnpm release:check
```

Node.js 18, 20, and 22 are covered by CI. Use pnpm 8.15.0, which is pinned in the root `package.json`.

## Workflow

1. Open an issue for substantial language, compiler, or public API changes.
2. Fork the repository and create a focused branch.
3. Add tests that demonstrate the behavior or regression.
4. Run `pnpm release:check` before opening a pull request.
5. Explain user-visible changes and compatibility impact in the pull request.

## Engineering Guidelines

- Preserve existing language syntax unless a migration is documented.
- Keep generated output deterministic and standards-based.
- Respect reduced-motion preferences and accessibility semantics.
- Do not expose server secrets through client bundles, metadata, or loader hydration data.
- Add dependencies only when they materially improve correctness or maintainability.

## Reporting Security Issues

Do not file public issues for undisclosed vulnerabilities. Follow [SECURITY.md](./SECURITY.md).

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
