# Security Policy

## Supported Releases

Drift `0.1.x` is a public alpha. Security fixes are applied to the latest published alpha only. Language and framework APIs may change between alpha releases.

## Reporting a Vulnerability

Please use GitHub's **Security** tab to submit a private vulnerability report. Do not open a public issue before maintainers have had a reasonable opportunity to investigate and release a fix.

Include the affected package and version, reproduction steps, impact, and any proposed mitigation. Avoid including production secrets or personal data in the report.

## Security Boundary

- Keep secrets in `@drift/server`; never expose them through `VITE_*` variables, metadata, or hydrated loader data.
- Mutating actions should keep Drift's same-origin checks, method restrictions, content-type validation, and request-body limits enabled.
- Authentication and authorization are separate. Protected resources must perform an authorization check.
- Drift is not currently represented as suitable for regulated or high-assurance workloads.

More implementation guidance is available in [docs/SECURITY.md](./docs/SECURITY.md).
