# @drift/vite-plugin

Vite plugin for the Drift framework. Enables seamless integration of `.drift` files into your Vite-powered projects with hot module replacement (HMR), token file watching, and error overlay support.

## Features

- ✅ **`.drift` File Transformation**: Automatically compiles `.drift` files to React components and CSS
- ✅ **Hot Module Replacement (HMR)**: Instant updates when `.drift` files change
- ✅ **Token File Watching**: Recompiles all files when `drift.tokens` changes
- ✅ **Error Overlay**: Displays compilation errors in the browser with file location and suggestions
- ✅ **Source Maps**: Full source map support for debugging
- ✅ **CSS Extraction**: Automatically extracts and injects scoped CSS

## Installation

```bash
pnpm add -D @drift/vite-plugin
```

## Usage

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import drift from '@drift/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    drift({
      // Optional: custom path to drift.tokens file
      tokensPath: './drift.tokens',
      
      // Optional: enable source maps (default: true in dev, false in prod)
      sourceMaps: true,
    }),
  ],
})
```

## Options

### `tokensPath`

- **Type**: `string`
- **Default**: `'./drift.tokens'`

Path to your `drift.tokens` file relative to the project root. The plugin will watch this file and recompile all `.drift` files when it changes.

### `sourceMaps`

- **Type**: `boolean`
- **Default**: `true` in development, `false` in production

Enable or disable source map generation for compiled `.drift` files.

### `tokenRegistry`

- **Type**: `TokenRegistry`
- **Default**: `undefined`

Provide a custom token registry instead of loading from a file. Useful for programmatic token generation.

## How It Works

### File Resolution

The plugin handles `.drift` file imports:

```typescript
import { Button } from './Button.drift'
import { Card } from '@/components/Card.drift'
```

### Transformation Pipeline

1. **Parse**: `.drift` files are parsed into an AST
2. **Token Resolution**: Design tokens are resolved from `drift.tokens`
3. **Style Extraction**: Scoped CSS is generated
4. **Motion Codegen**: Animation code is generated using Framer Motion
5. **JSX Transform**: Drift syntax is transformed to React JSX
6. **Output**: TypeScript component + CSS are returned to Vite

### Hot Module Replacement

The plugin provides intelligent HMR:

- **`.drift` file changes**: Only the changed file is recompiled
- **`drift.tokens` changes**: All files using tokens are recompiled
- **Error recovery**: Errors are displayed in the browser overlay

### Error Handling

Compilation errors are displayed in Vite's error overlay with:

- File path and location (line/column)
- Descriptive error message
- Code snippet highlighting the error
- Suggestions for fixes (when available)

## Example Project Structure

```
my-drift-app/
├── src/
│   ├── components/
│   │   ├── Button.drift
│   │   └── Card.drift
│   ├── pages/
│   │   └── Home.drift
│   └── main.tsx
├── drift.tokens
├── vite.config.ts
└── package.json
```

## Development

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
```

## Requirements

- Vite 5.x or higher
- Node.js 18.x or higher
- TypeScript 5.x or higher (for type definitions)

## Related Packages

- `@drift/compiler` - Core Drift compiler
- `@drift/tokens` - Token system
- `@drift/types` - TypeScript type definitions

## License

MIT
