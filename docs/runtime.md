# Drift Kernel

`crates/drift-kernel` is an experimental Rust HTTP host for a validated DIR artifact. It is the first executable Rust boundary in Drift, not a replacement for Node.js or a production application server.

Run it against a graph emitted by the TypeScript CLI:

```bash
pnpm drift graph --json > .drift/application-graph.json
cargo run -p drift-kernel -- --graph .drift/application-graph.json
```

The kernel exposes:

- `GET /health` for runtime status and graph counts
- `GET /graph` for the loaded DIR artifact
- `GET /routes` for discovered route nodes

The next runtime work is typed action dispatch and dependency resolution. Cells, permissions, Boa execution, and native providers are explicitly not implemented yet.

The Rust workspace uses the stable Rust toolchain. Run `pnpm rust:check` from the repository root to run formatting, workspace tests, and Clippy.
