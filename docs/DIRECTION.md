# Drift Direction

Drift aims to make polished React interfaces easier to build through one component
language for structure, scoped styles, tokens, and motion. Existing React libraries
are part of that workflow. Success means developers can adopt Drift incrementally
and ship an interface with less setup and predictable output.

## Delivery priorities

1. Make generated apps reliable from local development through deployment. Exercise
   actual generated artifacts, hydration, deep links, errors, and route loaders.
2. Make component authoring the strongest feature: useful diagnostics, documented
   syntax, accessible examples, and predictable styling and motion output.
3. Make adoption incremental: document React integration, supported dependency
   versions, upgrade steps, and compatibility limits.
4. Measure performance using reproducible fixtures, including JavaScript and CSS
   sizes, build times, navigation behavior, and layout stability.

SSR and server integrations support these frontend workflows. Expand backend
features when a working application demonstrates the need and the implementation
can be tested across both server requests and client navigation.

## Evidence before claims

Each milestone should include a focused commit, user-facing documentation, and
verification of the behavior it changes. A packaging test does not demonstrate
that a deployed function renders correctly. A declared dependency does not prove
compatibility. Publish these distinctions alongside results.

Drift remains an alpha. Streaming, complete SSR deployment verification, editor
support, and compatibility guarantees require further work. Do not claim overall
superiority to another framework without a defined workload and measured results.
