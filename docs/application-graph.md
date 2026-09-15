# Drift Application Graph

The application graph is Drift's first architectural layer beyond individual component compilation. It gives the compiler and tooling a deterministic view of an application without requiring a runtime to execute arbitrary user code.

## What It Represents

The current graph (`0.1`) includes these node kinds. TypeScript declarations are parsed with the TypeScript compiler API; `.drift` declarations continue to use Drift's existing source conventions.

- application
- module
- route
- page
- component
- action
- loader
- service
- policy
- resource

Modules contain declarations, routes contain pages, and the application contains all discovered modules. Supported action relationships include policy protection and service calls through `use(Service)`.

The graph uses stable IDs, workspace-relative file paths, source line numbers where available, and sorted nodes/edges. That makes output suitable for snapshots, editor integrations, and machine consumers.

## Inspect A Project

From a Drift project:

```bash
drift graph
drift graph --json
drift graph --root ./path/to/project --json
drift check
drift check --json
drift explain route:/
drift explain route:/ --json
```

The human output is optimized for a quick architecture scan. `drift explain <node>` accepts a stable node ID or exact node name and prints its source plus incoming and outgoing relationships. The JSON output is the contract for future graph tooling and is intentionally more stable than the display format.

## Current Boundary

This is discovery, not a complete semantic compiler. It does not execute TypeScript, infer arbitrary function calls, prove capability safety, or replace TypeScript's type checker. Unsupported declarations are left out rather than represented as if they were understood.

That boundary is deliberate. The next layers can evolve the graph into DIR while keeping the initial representation serializable, testable, and honest about what Drift understands.

## Next Graph Milestones

1. Add explicit public TypeScript declaration helpers for services, actions, resources, and policies.
2. Add diagnostics for missing dependencies and dependency cycles.
3. Feed the graph into a Rust runtime planning boundary.
