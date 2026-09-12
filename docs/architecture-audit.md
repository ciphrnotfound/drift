# Drift Architecture Audit

Status: initial audit, September 2026

This document records the repository shape before application graph work. It is an implementation guide, not a claim that the future runtime already exists.

## Current Architecture

Drift is a pnpm TypeScript monorepo. The existing product is a frontend compiler and framework prototype with a React-compatible output path.

- `packages/compiler` lexes and parses the `.drift` UI syntax, resolves tokens, generates JSX, CSS, motion output, and metadata sidecars.
- `packages/types` owns the shared AST, route, style, motion, configuration, token, and compiler error types.
- `packages/style`, `packages/tokens`, `packages/motion`, and `packages/motion-runtime` provide the current styling, token, and interaction layers.
- `packages/router` provides file-based route generation, lazy route loading, loaders, client navigation, prefetching, scroll restoration, route errors, SSR HTML, hydration data, and metadata updates.
- `packages/seo` renders server-ready head tags, canonical URLs, social metadata, JSON-LD, robots, and related output.
- `packages/font` provides the `next/font`-style Google and local font layer.
- `packages/vite-plugin` transforms `.drift` files inside Vite, injects generated CSS, watches tokens/routes, and exposes the development error overlay.
- `packages/cli` owns `create`, `dev`, `build`, `export`, `vercel`, and `doctor`. It currently delegates production bundling to Vite.
- `packages/server` contains server response helpers and Vercel output support, but there is no Rust server or general application runtime.
- `packages/ui` contains React UI primitives. It is useful ecosystem support, not yet a graph-aware design system runtime.
- `example-app` is the principal demo. It uses a React application shell and a polished landing/product site, while the `.drift` pages demonstrate the existing compiler and route discovery path.
- `e2e`, package test folders, and Vitest cover compiler syntax, output generation, routing, SSR, SEO, CLI scaffolding, styling, motion, and accessibility. The full route-to-runtime vertical slice does not exist yet.

The current build graph is file-oriented: Vite asks for modules, the compiler emits component artifacts, and the router separately discovers route files. The system has useful local caches and lazy imports, but no shared semantic representation connecting a route to its action, service, resource, policy, or execution environment.

## Keep / Evolve / Deprecate Assessment

### KEEP

- TypeScript as the current implementation language and public integration surface.
- The existing compiler pipeline, AST types, diagnostics, style/token/motion generators, and React output.
- The route generator and client router behavior, especially lazy imports, prefetching, cancellation, history, SSR, and hydration.
- Vite integration and the CLI workflow for existing `.drift` projects.
- SEO, font, UI, and motion packages where their APIs remain independently useful.
- Package-level tests, end-to-end fixtures, open-source metadata, and the current deployment paths.

### EVOLVE

- Add a semantic graph beside the existing syntax AST. DIR should describe application behavior without replacing the parser immediately.
- Extend the CLI with real graph inspection and architectural checks.
- Introduce TypeScript-first declarations for routes, actions, services, policies, and resources while keeping `.drift` as an optional UI DSL during migration.
- Make compiler and router outputs consume graph facts where that reduces duplicate discovery.
- Add a Rust workspace only after the TypeScript graph contract and one end-to-end fixture are stable.
- Move from runtime-only conventions toward explicit, statically inspectable boundaries and capabilities.

### DEPRECATE

- Treating `.drift` as the required language for all application logic.
- Scattered regex and file conventions as the long-term source of application architecture.
- Marketing roadmap features such as native server execution, Boa Cells, or hardened isolation as if they were shipped.

### REMOVE LATER

- Duplicate route, metadata, and loader discovery once graph-backed discovery has equivalent coverage.
- Any generated or compatibility code that exists only to preserve an obsolete application model after migration guidance is available.

## Gap Analysis

The repository does not yet have:

- a DIR schema or versioned graph package;
- TypeScript application declarations for actions, services, resources, and policies;
- graph generation and deterministic JSON output;
- compiled dependency resolution or cycle diagnostics;
- a Rust workspace, Rust HTTP kernel, or Rust-owned runtime lifecycle;
- typed generated client/server action boundaries;
- enforceable capabilities or execution Cells;
- a graph-aware `drift explain`, `drift check`, or `drift inspect` command;
- a full route → action → service → resource integration test;
- a benchmark harness for compiler, graph, runtime, and startup paths.

The first milestone should therefore prove representation and inspection before attempting Boa integration or a Rust rewrite.

## Proposed Repository Architecture

### Immediate

```text
packages/
  graph/                 # DIR types, discovery, deterministic serialization
  compiler/              # existing syntax compiler; later emits DIR facts
  cli/                   # drift graph and later drift check/explain
  router/                # existing route runtime; later consumes graph facts
  vite-plugin/           # existing dev/build integration
```

Add `packages/graph` because the application graph is a shared semantic contract used by the CLI, compiler, editor tooling, and eventually the Rust bridge. Keep it small and dependency-free.

### Later

```text
crates/
  drift-ir
  drift-kernel
  drift-runtime
  drift-boa
  drift-native

packages/
  drift
  runtime-node
  ts-plugin
  devtools

examples/
  hello
  services
  actions
  cells
  fullstack
```

These boundaries should be created only when a working vertical slice requires them.

## V0 Architecture

```text
TypeScript declarations or existing route files
        ↓
static discovery and compiler analysis
        ↓
versioned DIR graph
        ↓
deterministic JSON and diagnostics
        ↓
drift graph / future drift check
        ↓
Rust runtime kernel
        ↓
Boa Cell for controlled execution
```

The first implementation only needs the top four layers. A graph that can represent current routes and future TypeScript declarations is more valuable than an untestable placeholder Rust runtime.

## Implementation Plan

1. Add `@drift/graph` with versioned node and edge types, deterministic sorting, project discovery, and JSON serialization.
2. Add `drift graph` with human-readable and `--json` output. Acceptance: the existing example app produces stable route/page/component nodes without changing its build.
3. Add TypeScript declaration discovery for explicit `route`, `action`, `service`, `policy`, and `resource` calls. Acceptance: a fixture produces nodes and supported relationships with file locations.
4. Add compiled dependency validation and cycle diagnostics. Acceptance: missing and cyclic dependencies fail with actionable paths.
5. Add a small route → action → service fixture and generate a graph from it. Acceptance: the graph is tested as an end-to-end artifact.
6. Define the DIR handoff contract for a future Rust crate. Acceptance: the JSON schema/version is documented and stable.
7. Add the Rust HTTP kernel only when the graph and TypeScript boundary are real. Acceptance: one route can execute through the kernel with tests.
8. Add a controlled Boa Cell after the runtime boundary exists. Acceptance: the Cell has declared capabilities and tests that prove denied access; no sandbox claims before enforcement exists.

## GitHub / Open Source Plan

The repository already contains `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`, `CHANGELOG.md`, deployment documentation, and multiple test guides. The next maintenance improvements are:

- document the available, experimental, and planned status of the new graph/runtime work;
- add architecture docs for the graph, DIR, runtime, capabilities, and Cells as those features become real;
- add CI checks for all package tests and, later, Rust format, Clippy, and tests;
- add small examples instead of making the landing demo carry the whole story;
- create real GitHub issues for graph schema, discovery, cycle checks, CLI output, and the first vertical slice;
- keep commits and PRs focused on one architectural change.

No cloud platform, full ORM, hardened sandbox, full Node replacement, or complete Next/Nest replacement belongs in the first milestone.
