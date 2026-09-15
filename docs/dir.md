# Drift Intermediate Representation

DIR is the serialized boundary between Drift's TypeScript analysis and its future Rust runtime. It represents application semantics, not TypeScript syntax.

The current `0.1` schema intentionally mirrors the graph emitted by `drift graph --json`:

- graph version and project root
- typed nodes with stable IDs and source locations
- typed edges describing relationships

`crates/drift-ir` validates the artifact before it reaches the runtime. Version mismatches, duplicate IDs, missing edge endpoints, and route collisions fail before the kernel starts.

DIR is experimental. The schema will only gain a new version when changes cannot remain backward compatible.
