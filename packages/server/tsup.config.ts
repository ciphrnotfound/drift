import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts', 'client-error': 'src/client-error.ts', vercel: 'src/vercel.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node18',
})
