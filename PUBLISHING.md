# Publishing Drift

This document is for maintainers. Drift packages are published from a clean `main` branch in dependency order.

## Prerequisites

- Node.js 18 or newer
- pnpm 8.15.0 through Corepack
- An npm account allowed to publish the `@drift` scope
- npm two-factor authentication configured for package publishing

## Release Gate

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm release:check
pnpm release:pack
```

`release:pack` creates each npm tarball in a temporary directory and verifies that it contains release metadata, valid entrypoints, and no unresolved `workspace:` dependencies.

## Publish

```bash
npm login
npm whoami
pnpm release:publish
```

The publishing script releases packages in dependency order and skips versions that are already present. This makes recovery from an interrupted publish possible without overwriting released artifacts.

If npm requests a one-time password, provide a current authenticator code through the environment for that publish attempt:

```powershell
$env:NPM_OTP = Read-Host 'npm authenticator code'
pnpm release:publish
Remove-Item Env:NPM_OTP
```

For a long multi-package release, a granular npm access token with publish permission and two-factor bypass can avoid rotating codes. Keep it in your user npm configuration or CI secret; never commit it to this repository.

After publishing, create a clean temporary project and verify:

```bash
npm create drift-app@latest drift-smoke
cd drift-smoke
npm run build
npm run build:vercel
```

## Release Tag

```bash
git tag -a v0.1.0 -m "Drift 0.1.0"
git push origin main --follow-tags
```

Update versions, the changelog, compatibility policy, and shipping report together for subsequent releases.
