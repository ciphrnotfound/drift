# @drift/cli

Command-line interface for the Drift framework.

## Installation

```bash
npm install -g @drift/cli
# or
pnpm add -g @drift/cli
# or
yarn global add @drift/cli
```

## Commands

### create-drift-app

Create a new Drift application with a single command.

```bash
create-drift-app my-app
```

**Options:**

- `-t, --template <template>` - Template to use: `minimal`, `default`, or `full` (default: `default`)
- `--npm` - Use npm as package manager
- `--yarn` - Use yarn as package manager
- `--pnpm` - Use pnpm as package manager (default if available)

**Templates:**

- **minimal**: Single page with basic styling
- **default**: Multiple pages, routing, components, and animations
- **full**: Complete setup with layouts, data loading, and motion sequences

**Example:**

```bash
# Create with default template
create-drift-app my-app

# Create with minimal template
create-drift-app my-app --template minimal

# Create with full template and yarn
create-drift-app my-app --template full --yarn
```

### drift dev

Start the development server with hot module replacement.

```bash
drift dev
```

**Options:**

- `-p, --port <port>` - Port to run the dev server on (default: `3000`)
- `-h, --host <host>` - Host to bind the dev server to (default: `localhost`)
- `--open` - Open browser on server start
- `--https` - Use HTTPS

**Example:**

```bash
# Start dev server on default port
drift dev

# Start on custom port
drift dev --port 8080

# Start and open browser
drift dev --open

# Start with HTTPS
drift dev --https
```

### drift build

Build the application for production with optimizations.

```bash
drift build
```

**Options:**

- `--out-dir <dir>` - Output directory (default: `dist`)
- `--sourcemap` - Generate source maps
- `--minify` - Minify output (default: `true`)

**Features:**

- Minified CSS and JavaScript
- Code splitting for optimal loading
- Static HTML generation for routes
- Build statistics and bundle size reporting

**Example:**

```bash
# Build with defaults
drift build

# Build with source maps
drift build --sourcemap

# Build to custom directory
drift build --out-dir build
```

### drift export

Export the application as a static site for deployment to static hosting services.

```bash
drift export
```

**Options:**

- `--out-dir <dir>` - Output directory (default: `out`)
- `--base-path <path>` - Base path for URLs (default: `/`)

**Features:**

- Static HTML generation for all routes
- CSS extraction into static files
- Static asset copying
- 404.html generation
- Support for dynamic routes with known paths

**Example:**

```bash
# Export with defaults
drift export

# Export to custom directory
drift export --out-dir public

# Export with custom base path
drift export --base-path /my-app
```

## Configuration

All commands respect the `drift.config.ts` file in your project root. See the [configuration documentation](https://drift-framework.dev/docs/configuration) for details.

## Project Structure

A typical Drift project created with `create-drift-app` has the following structure:

```
my-app/
├── src/
│   ├── pages/           # Route pages
│   ├── components/      # Reusable components
│   ├── layouts/         # Layout components (optional)
│   ├── motions/         # Motion sequences (optional)
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── drift.config.ts      # Drift configuration
├── drift.tokens         # Design tokens
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json
└── index.html
```

## Development Workflow

1. **Create a new project:**
   ```bash
   create-drift-app my-app
   cd my-app
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Build for production:**
   ```bash
   pnpm build
   ```

4. **Export as static site:**
   ```bash
   pnpm export
   ```

## Requirements

- Node.js >= 18.0.0
- npm, yarn, or pnpm

## License

MIT
