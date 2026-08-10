# Compatibility

The machine-readable support contract is in [`compatibility.json`](../compatibility.json). Drift 0.1 currently gates Node 18, 20, and 22 with React 18 and Vite 6.4.3 or newer.

Tailwind CSS 3 works as an option when `tailwind: true` is set in the Drift Vite plugin and a `tailwind.config.*` file exists. Drift-generated styles are placed in `@layer drift`; `tw` and `className` remain ordinary class hooks. Tailwind 4, React 19, Firefox, and WebKit are compatibility candidates, not guarantees yet.

Lucide, Hugeicons, shadcn/ui components, Supabase, and Firebase use standard ESM imports. The compiler preserves named imports and aliases so the host bundler can tree-shake them. Compatibility with an import shape does not imply a native service adapter or server-side secret handling.
