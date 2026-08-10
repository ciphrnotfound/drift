# Design Document: Drift Framework

## Overview

Drift is a full-stack React framework that reimagines web development by unifying styling, animation, and structure into a single indentation-based language. The framework compiles .drift files into optimized CSS, typed React components, and production-ready web applications.

### Core Philosophy

1. **Unified Language**: One syntax for structure, style, and motion
2. **Animation First**: Treat animation as a first-class citizen, not an afterthought
3. **Token-Driven**: Design tokens built into the foundation
4. **Zero Config**: Sensible defaults with escape hatches for customization
5. **Type Safety**: Full TypeScript integration throughout

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Developer Input                         │
│  .drift files + drift.tokens + drift.config.ts              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Drift Compiler Pipeline                    │
│                                                              │
│  Parser → Token Resolver → Style Extractor → Motion Codegen │
│         → JSX Transformer → Route Builder → Output Bundle   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Output Artifacts                        │
│  React Components + CSS + TypeScript Types + Routes         │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Vite as Build Foundation**: Leverage Vite's plugin system for fast development and optimized production builds
2. **Indentation-Based Syntax**: Reduce visual noise and enforce consistent structure
3. **Compile-Time Resolution**: Resolve tokens and generate types at build time for zero runtime overhead
4. **Scoped Styles by Default**: Automatic CSS scoping prevents naming conflicts
5. **Framer Motion Integration**: Use battle-tested animation library under the hood

## Architecture

### Compiler Pipeline

The Drift compiler transforms source files through a multi-stage pipeline:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Parser  │───▶│  Token   │───▶│  Style   │───▶│  Motion  │
│          │    │ Resolver │    │Extractor │    │ Codegen  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                       │
                                                       ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Output  │◀───│  Route   │◀───│   JSX    │◀───│          │
│  Bundle  │    │ Builder  │    │Transform │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

#### Stage 1: Parser

Transforms .drift files into an Abstract Syntax Tree (AST).

**Input**: Raw .drift file content
**Output**: AST representing component structure, styles, motion, and render logic

**Key Responsibilities**:
- Tokenize indentation-based syntax
- Build hierarchical AST structure
- Track source locations for error reporting
- Validate basic syntax rules

#### Stage 2: Token Resolver

Resolves design token references to their final values.

**Input**: AST + drift.tokens file
**Output**: AST with resolved token values

**Key Responsibilities**:
- Parse drift.tokens file into token registry
- Resolve token references (including nested references)
- Generate TypeScript types for tokens
- Detect circular token dependencies
- Generate scale values for spacing/typography

#### Stage 3: Style Extractor

Extracts style declarations and generates scoped CSS.

**Input**: AST with resolved tokens
**Output**: AST + CSS output + scoped class names

**Key Responsibilities**:
- Generate unique scoped class names
- Extract base styles, variants, and responsive blocks
- Generate CSS with proper specificity
- Handle variant combinations
- Generate media queries for responsive blocks

#### Stage 4: Motion Codegen

Generates animation code from motion declarations.

**Input**: AST with style information
**Output**: AST with motion code + animation imports

**Key Responsibilities**:
- Generate Framer Motion animation props
- Handle enter/exit animations
- Generate gesture handlers
- Resolve motion sequence imports
- Apply easing curves from tokens

#### Stage 5: JSX Transformer

Transforms Drift render blocks into React JSX.

**Input**: AST with styles and motion
**Output**: AST with JSX representation

**Key Responsibilities**:
- Convert Drift syntax to JSX
- Apply scoped class names
- Inject motion props
- Handle component imports
- Generate prop spreading

#### Stage 6: Route Builder

Generates routing configuration from file structure.

**Input**: All compiled components + pages directory structure
**Output**: Route configuration + layout hierarchy

**Key Responsibilities**:
- Scan pages directory
- Generate route paths from file names
- Build layout hierarchy
- Generate data loading orchestration
- Handle dynamic segments

#### Stage 7: Output Bundle

Generates final output artifacts.

**Input**: Compiled ASTs + route configuration
**Output**: React components + CSS files + TypeScript types

**Key Responsibilities**:
- Generate .tsx files for components
- Generate .css files with optimizations
- Generate .d.ts type definition files
- Generate route manifest
- Apply production optimizations

### Package Architecture

Drift is organized as a monorepo with focused packages:

```
drift/
├── packages/
│   ├── compiler/          # Core compilation pipeline
│   ├── tokens/            # Token system
│   ├── style/             # Style engine
│   ├── motion/            # Motion engine
│   ├── router/            # File-based routing
│   ├── cli/               # CLI tools
│   ├── ui/                # Optional base components
│   └── vite-plugin/       # Vite integration
```

#### @drift/compiler

Core compilation pipeline orchestrating all transformation stages.

**Exports**:
- `compile(source: string, options: CompileOptions): CompileResult`
- `parse(source: string): AST`
- `print(ast: AST): string`
- `CompilerError` class

#### @drift/tokens

Token parsing, resolution, and type generation.

**Exports**:
- `parseTokens(source: string): TokenRegistry`
- `resolveToken(name: string, registry: TokenRegistry): ResolvedValue`
- `generateTokenTypes(registry: TokenRegistry): string`
- `generateScale(base: number, ratio: number, steps: number): number[]`

#### @drift/style

Scoped styling with variants and responsive support.

**Exports**:
- `extractStyles(ast: AST, tokens: TokenRegistry): StyleResult`
- `generateScopedClassName(component: string, element?: string): string`
- `generateCSS(styles: StyleResult): string`
- `optimizeCSS(css: string): string`

#### @drift/motion

Animation code generation using Framer Motion.

**Exports**:
- `generateMotionProps(motionBlock: MotionAST): MotionProps`
- `resolveMotionSequence(name: string): MotionSequence`
- `generateGestureHandlers(gestures: GestureAST[]): GestureHandlers`

#### @drift/router

File-based routing with layouts and data loading.

**Exports**:
- `generateRoutes(pagesDir: string): RouteConfig[]`
- `buildLayoutHierarchy(layouts: Layout[]): LayoutTree`
- `Router` component
- `Link` component
- `useParams()` hook
- `useLoader()` hook

#### @drift/cli

Command-line interface for project management.

**Commands**:
- `create-drift-app <name>` - Create new project
- `drift dev` - Start development server
- `drift build` - Build for production
- `drift export` - Export static site

#### @drift/ui

Optional headless base components.

**Exports**:
- `Button`, `Input`, `Select`, `Modal`, etc.
- Pre-built with accessibility
- Fully stylable with Drift

#### @drift/vite-plugin

Vite plugin integrating Drift into the build process.

**Exports**:
- `drift(options?: DriftPluginOptions): Plugin`

## Components and Interfaces

### AST Structure

The Abstract Syntax Tree represents the parsed structure of a Drift file.

```typescript
interface DriftAST {
  type: 'DriftFile'
  imports: ImportDeclaration[]
  tokens: TokenDeclaration[]
  components: ComponentDeclaration[]
  motions: MotionSequenceDeclaration[]
  sourceMap: SourceMap
}

interface ComponentDeclaration {
  type: 'Component'
  name: string
  props: PropDeclaration[]
  styles: StyleBlock
  motion: MotionBlock | null
  render: RenderBlock
  location: SourceLocation
}

interface StyleBlock {
  type: 'StyleBlock'
  base: StyleRule[]
  variants: VariantDeclaration[]
  responsive: ResponsiveBlock[]
  location: SourceLocation
}

interface MotionBlock {
  type: 'MotionBlock'
  enter: AnimationDeclaration | null
  exit: AnimationDeclaration | null
  gestures: GestureDeclaration[]
  sequences: MotionSequenceReference[]
  location: SourceLocation
}

interface RenderBlock {
  type: 'RenderBlock'
  elements: JSXElement[]
  location: SourceLocation
}
```

### Token System

Design tokens are parsed into a registry with resolution support.

```typescript
interface TokenRegistry {
  colors: Map<string, ColorToken>
  spacing: Map<string, SpacingToken>
  typography: Map<string, TypographyToken>
  easing: Map<string, EasingToken>
  shadows: Map<string, ShadowToken>
  borders: Map<string, BorderToken>
}

interface ColorToken {
  name: string
  value: string | TokenReference
  resolved: string
}

interface TokenReference {
  type: 'TokenReference'
  path: string[]  // e.g., ['colors', 'primary', '500']
}

interface ResolvedToken {
  name: string
  value: string
  dependencies: string[]
}
```

### Style System

Styles are extracted and scoped with variant support.

```typescript
interface StyleResult {
  componentName: string
  scopedClassName: string
  baseStyles: CSSRule[]
  variants: VariantStyle[]
  responsive: ResponsiveStyle[]
  cssOutput: string
}

interface VariantStyle {
  name: string
  values: Map<string, CSSRule[]>
  defaultValue?: string
}

interface ResponsiveStyle {
  breakpoint: string
  minWidth: number
  rules: CSSRule[]
}

interface CSSRule {
  property: string
  value: string
  important: boolean
}
```

### Motion System

Motion declarations are transformed into Framer Motion props.

```typescript
interface MotionProps {
  initial?: MotionValue
  animate?: MotionValue
  exit?: MotionValue
  whileHover?: MotionValue
  whileTap?: MotionValue
  whileFocus?: MotionValue
  whileDrag?: MotionValue
  drag?: boolean | 'x' | 'y'
  dragConstraints?: DragConstraints
  onDragStart?: EventHandler
  onDragEnd?: EventHandler
}

interface MotionValue {
  [property: string]: string | number
}

interface MotionSequence {
  name: string
  params: MotionParam[]
  keyframes: Keyframe[]
}
```

### Router System

Routes are generated from file structure with layout support.

```typescript
interface RouteConfig {
  path: string
  component: string
  layout: string | null
  dataLoader: string | null
  children: RouteConfig[]
  params: RouteParam[]
}

interface RouteParam {
  name: string
  type: 'static' | 'dynamic' | 'catchAll'
}

interface Layout {
  name: string
  component: string
  dataLoader: string | null
  parent: string | null
}
```

### CLI System

The CLI provides commands for project management.

```typescript
interface CLICommand {
  name: string
  description: string
  options: CLIOption[]
  handler: (args: CLIArgs) => Promise<void>
}

interface CLIOption {
  name: string
  alias?: string
  description: string
  type: 'string' | 'boolean' | 'number'
  default?: any
}

interface ProjectScaffold {
  name: string
  directory: string
  template: 'minimal' | 'default' | 'full'
  packageManager: 'npm' | 'yarn' | 'pnpm'
}
```

## Data Models

### AST Node Types

Complete type definitions for all AST nodes:

```typescript
// Base node with source location tracking
interface ASTNode {
  type: string
  location: SourceLocation
}

interface SourceLocation {
  start: Position
  end: Position
  source: string
}

interface Position {
  line: number
  column: number
  offset: number
}

// Import declarations
interface ImportDeclaration extends ASTNode {
  type: 'ImportDeclaration'
  source: string
  specifiers: ImportSpecifier[]
}

interface ImportSpecifier {
  imported: string
  local: string
}

// Component structure
interface ComponentDeclaration extends ASTNode {
  type: 'Component'
  name: string
  props: PropDeclaration[]
  styles: StyleBlock
  motion: MotionBlock | null
  render: RenderBlock
}

interface PropDeclaration extends ASTNode {
  type: 'PropDeclaration'
  name: string
  propType: TypeAnnotation
  optional: boolean
  defaultValue?: Expression
}

interface TypeAnnotation {
  kind: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'union' | 'custom'
  value: string
}

// Style declarations
interface StyleBlock extends ASTNode {
  type: 'StyleBlock'
  base: StyleRule[]
  variants: VariantDeclaration[]
  responsive: ResponsiveBlock[]
}

interface StyleRule extends ASTNode {
  type: 'StyleRule'
  property: string
  value: string | TokenReference
  important: boolean
}

interface VariantDeclaration extends ASTNode {
  type: 'VariantDeclaration'
  name: string
  values: VariantValue[]
  defaultValue?: string
}

interface VariantValue extends ASTNode {
  type: 'VariantValue'
  name: string
  styles: StyleRule[]
}

interface ResponsiveBlock extends ASTNode {
  type: 'ResponsiveBlock'
  breakpoint: string
  styles: StyleRule[]
}

// Motion declarations
interface MotionBlock extends ASTNode {
  type: 'MotionBlock'
  enter: AnimationDeclaration | null
  exit: AnimationDeclaration | null
  gestures: GestureDeclaration[]
  sequences: MotionSequenceReference[]
}

interface AnimationDeclaration extends ASTNode {
  type: 'AnimationDeclaration'
  properties: AnimationProperty[]
  duration?: number
  delay?: number
  easing?: string | TokenReference
}

interface AnimationProperty {
  name: string
  from?: string | number
  to: string | number
}

interface GestureDeclaration extends ASTNode {
  type: 'GestureDeclaration'
  gesture: 'hover' | 'press' | 'focus' | 'drag' | 'scroll'
  animation: AnimationDeclaration
  constraints?: GestureConstraints
}

interface GestureConstraints {
  axis?: 'x' | 'y'
  bounds?: { top?: number; right?: number; bottom?: number; left?: number }
}

interface MotionSequenceReference extends ASTNode {
  type: 'MotionSequenceReference'
  name: string
  params: Record<string, any>
}

// Render block
interface RenderBlock extends ASTNode {
  type: 'RenderBlock'
  elements: JSXElement[]
}

interface JSXElement extends ASTNode {
  type: 'JSXElement'
  tag: string
  props: JSXAttribute[]
  children: (JSXElement | JSXText | JSXExpression)[]
  selfClosing: boolean
}

interface JSXAttribute {
  name: string
  value: string | Expression
}

interface JSXText extends ASTNode {
  type: 'JSXText'
  value: string
}

interface JSXExpression extends ASTNode {
  type: 'JSXExpression'
  expression: string
}

interface Expression {
  raw: string
  // Simplified - full expression parsing would be more complex
}
```

### Token Data Models

```typescript
// Token registry structure
interface TokenRegistry {
  colors: Map<string, ColorToken>
  spacing: Map<string, SpacingToken>
  typography: Map<string, TypographyToken>
  easing: Map<string, EasingToken>
  shadows: Map<string, ShadowToken>
  borders: Map<string, BorderToken>
}

interface BaseToken {
  name: string
  category: string
  description?: string
}

interface ColorToken extends BaseToken {
  category: 'color'
  value: string | TokenReference
  resolved: string  // Hex, RGB, or HSL
}

interface SpacingToken extends BaseToken {
  category: 'spacing'
  value: number | string | TokenReference
  resolved: string  // px, rem, em, etc.
  scale?: number[]  // Generated scale values
}

interface TypographyToken extends BaseToken {
  category: 'typography'
  fontSize?: string | TokenReference
  fontWeight?: string | number | TokenReference
  lineHeight?: string | number | TokenReference
  letterSpacing?: string | TokenReference
  fontFamily?: string | TokenReference
  resolved: TypographyResolved
}

interface TypographyResolved {
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  fontFamily: string
}

interface EasingToken extends BaseToken {
  category: 'easing'
  value: string | number[] | TokenReference
  resolved: string  // CSS easing function or cubic-bezier
}

interface ShadowToken extends BaseToken {
  category: 'shadow'
  value: string | ShadowValue | TokenReference
  resolved: string  // CSS box-shadow value
}

interface ShadowValue {
  x: number
  y: number
  blur: number
  spread: number
  color: string | TokenReference
  inset?: boolean
}

interface BorderToken extends BaseToken {
  category: 'border'
  width?: string | number | TokenReference
  style?: string | TokenReference
  color?: string | TokenReference
  radius?: string | number | TokenReference
  resolved: BorderResolved
}

interface BorderResolved {
  width: string
  style: string
  color: string
  radius: string
}

interface TokenReference {
  type: 'TokenReference'
  path: string[]  // e.g., ['colors', 'primary', '500']
}
```

### Style Data Models

```typescript
// Compiled style output
interface CompiledStyles {
  componentName: string
  scopedClassName: string
  css: string
  variants: CompiledVariant[]
  responsive: CompiledResponsive[]
  classNames: Map<string, string>
}

interface CompiledVariant {
  name: string
  values: Map<string, string>  // value name -> class name
  defaultValue?: string
}

interface CompiledResponsive {
  breakpoint: string
  minWidth: number
  className: string
  rules: CSSRule[]
}

interface CSSRule {
  property: string
  value: string
  important: boolean
}

// CSS optimization metadata
interface CSSOptimizationResult {
  original: string
  optimized: string
  removedRules: number
  mergedRules: number
  sizeBefore: number
  sizeAfter: number
}
```

### Motion Data Models

```typescript
// Compiled motion output
interface CompiledMotion {
  componentName: string
  imports: string[]  // Framer Motion imports needed
  props: MotionPropsCode
  handlers: GestureHandlerCode[]
}

interface MotionPropsCode {
  initial?: string  // Code string for initial prop
  animate?: string
  exit?: string
  whileHover?: string
  whileTap?: string
  whileFocus?: string
  whileDrag?: string
  drag?: string
  dragConstraints?: string
  transition?: string
}

interface GestureHandlerCode {
  event: string  // e.g., 'onDragStart'
  handler: string  // Code string for handler function
}

// Motion sequence definition
interface MotionSequence {
  name: string
  params: MotionParam[]
  keyframes: Keyframe[]
  defaultDuration: number
  defaultEasing: string
}

interface MotionParam {
  name: string
  type: 'number' | 'string' | 'boolean'
  defaultValue?: any
}

interface Keyframe {
  offset: number  // 0-1
  properties: Record<string, string | number>
  easing?: string
}
```

### Route Data Models

```typescript
// Route configuration
interface RouteManifest {
  routes: RouteConfig[]
  layouts: LayoutConfig[]
  notFound: string  // Path to 404 component
}

interface RouteConfig {
  id: string
  path: string  // URL path pattern
  filePath: string  // File system path
  component: string  // Component name
  layout: string | null
  dataLoader: DataLoaderConfig | null
  children: RouteConfig[]
  params: RouteParam[]
  isDynamic: boolean
  isCatchAll: boolean
}

interface RouteParam {
  name: string
  type: 'static' | 'dynamic' | 'catchAll'
  position: number
}

interface LayoutConfig {
  id: string
  name: string
  filePath: string
  component: string
  dataLoader: DataLoaderConfig | null
  parent: string | null
  children: string[]  // Layout IDs
}

interface DataLoaderConfig {
  functionName: string
  params: string[]
  returnType: string
}

// Runtime route matching
interface RouteMatch {
  route: RouteConfig
  params: Record<string, string>
  layouts: LayoutConfig[]
}
```

### Configuration Data Models

```typescript
// drift.config.ts structure
interface DriftConfig {
  // Compiler options
  compiler?: {
    target?: 'es5' | 'es2015' | 'es2020' | 'esnext'
    jsx?: 'react' | 'react-jsx'
    sourceMaps?: boolean
    minify?: boolean
  }
  
  // Style options
  styles?: {
    scoping?: 'component' | 'file' | 'global'
    prefix?: string
    extractCSS?: boolean
    optimizeCSS?: boolean
    criticalCSS?: boolean
  }
  
  // Responsive breakpoints
  breakpoints?: {
    [name: string]: number  // e.g., { mobile: 640, tablet: 768, desktop: 1024 }
  }
  
  // Motion options
  motion?: {
    reducedMotion?: 'disable' | 'simplify' | 'respect'
    defaultDuration?: number
    defaultEasing?: string
  }
  
  // Router options
  router?: {
    basePath?: string
    trailingSlash?: boolean
    caseSensitive?: boolean
  }
  
  // Build options
  build?: {
    outDir?: string
    assetsDir?: string
    publicPath?: string
    sourcemap?: boolean
  }
  
  // Dev server options
  dev?: {
    port?: number
    host?: string
    open?: boolean
    https?: boolean
  }
}

// Validated and normalized config
interface ResolvedDriftConfig extends Required<DriftConfig> {
  root: string
  cacheDir: string
}
```

### Compilation Output Models

```typescript
// Complete compilation result
interface CompilationResult {
  success: boolean
  files: CompiledFile[]
  errors: CompilerError[]
  warnings: CompilerWarning[]
  stats: CompilationStats
}

interface CompiledFile {
  path: string
  content: string
  type: 'component' | 'css' | 'types' | 'route'
  sourceMap?: SourceMap
}

interface CompilerError {
  message: string
  file: string
  location: SourceLocation
  code: string
  suggestions: string[]
}

interface CompilerWarning {
  message: string
  file: string
  location: SourceLocation
}

interface CompilationStats {
  duration: number
  filesProcessed: number
  linesOfCode: number
  cssSize: number
  jsSize: number
}

interface SourceMap {
  version: number
  sources: string[]
  names: string[]
  mappings: string
  sourcesContent: string[]
}


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Parse-Print Round Trip

*For any* valid Drift file, parsing it into an AST, then printing the AST back to a string, then parsing again should produce an equivalent AST structure.

**Validates: Requirements 1.1, 1.4, 1.5**

### Property 2: Invalid Input Error Reporting

*For any* invalid Drift file, the compiler should return an error that includes the file path, line number, column number, and a descriptive message explaining the issue.

**Validates: Requirements 1.2, 17.1, 17.2**

### Property 3: Token Resolution Completeness

*For any* token reference in any context (styles, animations, or direct usage), if the token exists in the registry, it should resolve to its final value, and if it doesn't exist, it should return an error identifying the missing token.

**Validates: Requirements 2.3, 2.4, 3.3, 5.6**

### Property 4: Token Scale Generation

*For any* base value and ratio, generating a scale should produce a sequence of values where each value equals the previous value multiplied by the ratio.

**Validates: Requirements 2.5**

### Property 5: Scoped Class Name Uniqueness

*For any* set of components, each component should generate a unique scoped class name that doesn't collide with other components.

**Validates: Requirements 3.1**

### Property 6: Style Extraction Completeness

*For any* component with style declarations, all style rules should appear in the generated CSS output with the correct scoped class name.

**Validates: Requirements 3.2**

### Property 7: Variant Style Application

*For any* component with variants, applying a variant should result in the variant's styles being applied in addition to or overriding the base styles, and when multiple variants conflict on the same property, the last specified variant's value should win.

**Validates: Requirements 3.4, 4.1, 4.2, 4.3**

### Property 8: Responsive Media Query Generation

*For any* responsive block with a breakpoint, the generated CSS should include a media query with the correct min-width or max-width based on the configured responsive strategy.

**Validates: Requirements 3.5, 15.1, 15.2, 15.3**

### Property 9: Default Variant Application

*For any* component with a variant that has a default value, when no variant value is specified, the default value's styles should be applied.

**Validates: Requirements 4.5**

### Property 10: Animation Lifecycle Code Generation

*For any* component with enter or exit animations, the generated code should include Framer Motion props for initial, animate, and exit that correspond to the animation declarations.

**Validates: Requirements 5.1, 5.2**

### Property 11: Gesture Animation Support

*For any* component with gesture animations (hover, press, focus, drag, scroll, pinch, rotate), the generated code should include the appropriate Framer Motion gesture props.

**Validates: Requirements 5.3, 5.4**

### Property 12: Animation Sequence Timing

*For any* animation sequence with timing and easing specifications, the generated code should include transition props with the correct duration and easing values.

**Validates: Requirements 5.5**

### Property 13: Motion Sequence Import Resolution

*For any* motion sequence defined in the motions directory, components should be able to import and use it, and the generated code should include the sequence's animation properties.

**Validates: Requirements 6.1, 6.3**

### Property 14: Motion Sequence Parameterization

*For any* parameterized motion sequence, passing different parameter values should result in different animation configurations in the generated code.

**Validates: Requirements 6.2**

### Property 15: File-Based Route Generation

*For any* file structure in the pages directory, the router should generate routes where the URL path matches the file path structure, with dynamic segments correctly identified from bracket notation.

**Validates: Requirements 7.1, 7.2**

### Property 16: Layout Hierarchy Preservation

*For any* nested file structure with layouts, the router should maintain parent-child relationships where child routes inherit their parent's layout.

**Validates: Requirements 7.3, 8.2**

### Property 17: Catch-All Route Matching

*For any* catch-all route definition, it should match all paths that don't match more specific routes.

**Validates: Requirements 7.4**

### Property 18: Data Loader Execution Order

*For any* route or layout with a data loading function, the loader should execute before the component renders, and parent layout loaders should execute before child route loaders.

**Validates: Requirements 7.5, 8.4**

### Property 19: Layout Content Passing

*For any* route wrapped by a layout, the route's content should be passed to the layout as children.

**Validates: Requirements 8.3**

### Property 20: Component Export Generation

*For any* Drift component, the compiler should generate a typed React component export with CSS imports and TypeScript prop types that include all defined props and variant props.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 21: Import Path Resolution

*For any* component that imports another component, the compiler should resolve the import path to the correct file location.

**Validates: Requirements 9.4, 16.1**

### Property 22: Component Composition

*For any* component that uses child components, the compiler should generate code that correctly passes props, children, and spread props to the child components.

**Validates: Requirements 16.2, 16.3, 16.4**

### Property 23: File Change Recompilation

*For any* file change during development, the dev server should recompile the changed file and trigger hot reload, and if the changed file is drift.tokens, all files using tokens should be recompiled.

**Validates: Requirements 11.2, 11.3**

### Property 24: Error Display in Development

*For any* compilation error during development, the error should be displayed in the browser console with the file path, location, and descriptive message.

**Validates: Requirements 11.4**

### Property 25: Configurable Server Port

*For any* configured port value, the dev server should start on that port.

**Validates: Requirements 11.5**

### Property 26: CSS Optimization

*For any* production build, the generated CSS should be minified, have unused rules removed, and have duplicate rules merged, resulting in smaller output than the unoptimized version.

**Validates: Requirements 12.2, 19.1, 19.2, 19.3**

### Property 27: JavaScript Bundle Optimization

*For any* production build with multiple routes, the generated JavaScript should be split into separate bundles for each route to enable code splitting.

**Validates: Requirements 12.3**

### Property 28: Static HTML Generation

*For any* route without dynamic data dependencies, the build process should generate static HTML for that route.

**Validates: Requirements 12.4**

### Property 29: Build Statistics Output

*For any* production build, the CLI should output statistics including bundle sizes for CSS and JavaScript.

**Validates: Requirements 12.5**

### Property 30: Static Export Asset Handling

*For any* static export, all CSS should be extracted into static files and all static assets should be copied to the output directory.

**Validates: Requirements 13.2, 13.3**

### Property 31: Dynamic Route Static Generation

*For any* dynamic route with known paths provided, the export command should generate static HTML for each known path.

**Validates: Requirements 13.4**

### Property 32: TypeScript Type Generation Completeness

*For any* Drift file with components, tokens, routes, or data loaders, the compiler should generate TypeScript declaration files that include types for all props, variants, tokens, route parameters, and data loader return values.

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

### Property 33: Responsive Block Conflict Resolution

*For any* component with multiple responsive blocks that define the same property, the styles should be applied in breakpoint order from smallest to largest (mobile-first) or largest to smallest (desktop-first) based on configuration.

**Validates: Requirements 15.4**

### Property 34: Error Suggestions

*For any* compilation error involving an undefined token or invalid syntax, the error message should include suggestions for corrections or similar valid names.

**Validates: Requirements 17.3, 17.4**

### Property 35: Error Code Snippet Display

*For any* compilation error, the error message should include a code snippet that highlights the error location.

**Validates: Requirements 17.5**

### Property 36: Configuration Loading and Validation

*For any* drift.config.ts file, the framework should load the configuration and validate all values, reporting errors for invalid values and applying valid configurations to breakpoints, output directories, and optimization levels.

**Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**

### Property 37: Critical CSS Extraction

*For any* production build, the style engine should generate critical CSS for above-the-fold content and support extracting CSS into separate files.

**Validates: Requirements 19.4, 19.5**

### Property 38: GPU-Accelerated Animation Generation

*For any* animation involving position or visibility changes, the generated code should prefer GPU-accelerated properties (transform and opacity) and include will-change hints for animated properties.

**Validates: Requirements 20.1, 20.2, 20.3**

### Property 39: Reduced Motion Support

*For any* animation when prefers-reduced-motion is enabled, the motion engine should either disable the animation or simplify it based on configuration.

**Validates: Requirements 20.4, 20.5**



## Error Handling

### Error Categories

Drift errors are categorized by severity and stage:

1. **Parse Errors**: Syntax errors in .drift files
2. **Token Errors**: Undefined or circular token references
3. **Style Errors**: Invalid CSS properties or values
4. **Motion Errors**: Invalid animation configurations
5. **Route Errors**: Invalid file structure or route conflicts
6. **Type Errors**: TypeScript type generation failures
7. **Build Errors**: Compilation or optimization failures
8. **Runtime Errors**: Errors during development server or production runtime

### Error Structure

All errors follow a consistent structure:

```typescript
interface DriftError {
  code: string              // Error code (e.g., 'DRIFT001')
  severity: 'error' | 'warning'
  message: string           // Human-readable description
  file: string              // File path where error occurred
  location: SourceLocation  // Line and column numbers
  snippet: CodeSnippet      // Code context around error
  suggestions: string[]     // Possible fixes
  documentation: string     // Link to docs
}

interface CodeSnippet {
  code: string              // Source code excerpt
  highlight: {              // Range to highlight
    start: Position
    end: Position
  }
  context: number           // Lines of context (default: 2)
}
```

### Error Recovery Strategies

#### Parse Errors

- **Strategy**: Fail fast with detailed location information
- **Recovery**: None - parsing must succeed before continuing
- **User Action**: Fix syntax and retry
- **Example**: Missing indentation, invalid token syntax

#### Token Errors

- **Strategy**: Collect all token errors before failing
- **Recovery**: None - all tokens must resolve
- **User Action**: Define missing tokens or fix circular references
- **Suggestions**: Fuzzy match similar token names
- **Example**: `colors.primry` → suggest `colors.primary`

#### Style Errors

- **Strategy**: Skip invalid rules, continue with valid ones
- **Recovery**: Partial - generate CSS for valid rules
- **User Action**: Fix invalid properties or values
- **Warnings**: Invalid properties generate warnings, not errors
- **Example**: `color: invalidValue` → warn and skip

#### Motion Errors

- **Strategy**: Skip invalid animations, continue with valid ones
- **Recovery**: Partial - generate code for valid animations
- **User Action**: Fix animation configuration
- **Example**: Invalid easing function → use default easing

#### Route Errors

- **Strategy**: Collect all route conflicts before failing
- **Recovery**: None - routes must be unambiguous
- **User Action**: Rename files to resolve conflicts
- **Example**: `[id].drift` and `[slug].drift` in same directory

#### Type Errors

- **Strategy**: Generate types for valid constructs, skip invalid ones
- **Recovery**: Partial - generate what's possible
- **User Action**: Fix type generation issues
- **Example**: Circular type reference → break cycle

#### Build Errors

- **Strategy**: Fail build, report all errors
- **Recovery**: None - build must succeed
- **User Action**: Fix all compilation errors
- **Example**: Minification failure, bundle size exceeded

### Error Reporting

#### Development Mode

- Display errors in browser overlay with:
  - Full error message and code snippet
  - Stack trace for runtime errors
  - Suggestions for fixes
  - Link to documentation
- Log errors to terminal with colors and formatting
- Preserve error state until fixed

#### Production Build

- Fail build on any error
- Output error summary with counts by category
- Generate error report file for CI/CD
- Exit with non-zero status code

#### Error Codes

Errors are assigned unique codes for documentation:

- `DRIFT001-099`: Parse errors
- `DRIFT100-199`: Token errors
- `DRIFT200-299`: Style errors
- `DRIFT300-399`: Motion errors
- `DRIFT400-499`: Route errors
- `DRIFT500-599`: Type errors
- `DRIFT600-699`: Build errors
- `DRIFT700-799`: Runtime errors

### Error Prevention

#### Static Analysis

- Validate token references before compilation
- Check for route conflicts before generation
- Verify import paths exist
- Detect circular dependencies

#### Type Checking

- Generate TypeScript types early in pipeline
- Use types to validate prop usage
- Check variant combinations are valid
- Verify data loader return types match usage

#### Linting

- Provide ESLint plugin for Drift files
- Warn about common mistakes
- Suggest best practices
- Enforce style guide

## Testing Strategy

### Dual Testing Approach

Drift uses both unit testing and property-based testing for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs and document expected behavior through examples. Property tests verify general correctness across a wide range of inputs through randomization.

### Property-Based Testing

#### Framework Selection

- **JavaScript/TypeScript**: Use `fast-check` library
- **Minimum Iterations**: 100 runs per property test
- **Shrinking**: Enable automatic counterexample shrinking
- **Seeding**: Support deterministic replay with seeds

#### Property Test Structure

Each property test must:

1. Reference the design document property number
2. Use a comment tag: `// Feature: drift-framework, Property {N}: {property text}`
3. Generate random inputs using fast-check arbitraries
4. Assert the property holds for all generated inputs
5. Run minimum 100 iterations

Example:

```typescript
// Feature: drift-framework, Property 1: Parse-Print Round Trip
test('parse-print round trip preserves AST structure', () => {
  fc.assert(
    fc.property(
      validDriftFileArbitrary(),
      (driftSource) => {
        const ast1 = parse(driftSource)
        const printed = print(ast1)
        const ast2 = parse(printed)
        expect(ast2).toEqual(ast1)
      }
    ),
    { numRuns: 100 }
  )
})
```

#### Arbitrary Generators

Create custom arbitraries for Drift-specific types:

- `validDriftFileArbitrary()`: Generate valid .drift files
- `tokenRegistryArbitrary()`: Generate token registries
- `componentASTArbitrary()`: Generate component ASTs
- `styleBlockArbitrary()`: Generate style blocks
- `motionBlockArbitrary()`: Generate motion blocks
- `routeStructureArbitrary()`: Generate file structures

### Unit Testing

#### Test Organization

Organize tests by package and functionality:

```
packages/
├── compiler/
│   ├── __tests__/
│   │   ├── parser.test.ts
│   │   ├── printer.test.ts
│   │   └── compiler.test.ts
├── tokens/
│   ├── __tests__/
│   │   ├── parser.test.ts
│   │   ├── resolver.test.ts
│   │   └── types.test.ts
├── style/
│   ├── __tests__/
│   │   ├── extractor.test.ts
│   │   ├── scoping.test.ts
│   │   └── optimization.test.ts
└── ...
```

#### Unit Test Focus Areas

1. **Specific Examples**: Document expected behavior with concrete examples
2. **Edge Cases**: Test boundary conditions (empty input, maximum values, etc.)
3. **Error Conditions**: Verify error handling for invalid inputs
4. **Integration Points**: Test interactions between components
5. **Regression Tests**: Prevent previously fixed bugs from returning

#### Example Unit Tests

```typescript
describe('Token Parser', () => {
  test('parses color token with hex value', () => {
    const input = 'colors.primary: #3b82f6'
    const result = parseToken(input)
    expect(result).toEqual({
      category: 'color',
      name: 'primary',
      value: '#3b82f6'
    })
  })

  test('returns error for invalid hex color', () => {
    const input = 'colors.primary: #xyz'
    expect(() => parseToken(input)).toThrow('Invalid hex color')
  })

  test('handles empty input', () => {
    expect(() => parseToken('')).toThrow('Empty token definition')
  })
})
```

### Integration Testing

#### End-to-End Compilation

Test complete compilation pipeline:

1. Create test .drift files
2. Run full compilation
3. Verify output artifacts (React components, CSS, types)
4. Check generated code is valid and runnable

#### CLI Testing

Test CLI commands in isolated environments:

1. Create temporary project directories
2. Execute CLI commands
3. Verify file system changes
4. Clean up after tests

#### Dev Server Testing

Test development server functionality:

1. Start dev server programmatically
2. Make requests to server
3. Modify files and verify hot reload
4. Shut down server cleanly

### Performance Testing

#### Compilation Speed

- Measure compilation time for various project sizes
- Set performance budgets (e.g., <100ms for small files)
- Track performance over time
- Identify bottlenecks with profiling

#### Bundle Size

- Measure output bundle sizes
- Set size budgets for CSS and JavaScript
- Verify code splitting reduces initial load
- Track size changes in CI/CD

#### Memory Usage

- Monitor memory during compilation
- Test with large projects (1000+ components)
- Verify no memory leaks in dev server
- Profile memory usage patterns

### Continuous Integration

#### Test Execution

- Run all tests on every commit
- Separate fast unit tests from slow integration tests
- Run property tests with fixed seeds for reproducibility
- Fail build on any test failure

#### Coverage Requirements

- Minimum 80% code coverage for core packages
- 100% coverage for critical paths (parser, token resolver)
- Track coverage trends over time
- Require tests for new features

#### Cross-Platform Testing

- Test on Linux, macOS, and Windows
- Test with Node.js LTS versions
- Test with different package managers (npm, yarn, pnpm)
- Verify consistent behavior across platforms

### Test Data Management

#### Fixtures

Maintain test fixtures for common scenarios:

- `fixtures/valid/`: Valid .drift files for testing
- `fixtures/invalid/`: Invalid files for error testing
- `fixtures/tokens/`: Token file examples
- `fixtures/projects/`: Complete project structures

#### Snapshot Testing

Use snapshots for generated output:

- AST structure snapshots
- Generated CSS snapshots
- Generated TypeScript code snapshots
- Update snapshots when intentionally changing output

### Testing Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Keep Tests Fast**: Unit tests should run in milliseconds
3. **Make Tests Deterministic**: Avoid flaky tests with proper setup/teardown
4. **Use Descriptive Names**: Test names should explain what is being tested
5. **One Assertion Per Test**: Keep tests focused and easy to debug
6. **Avoid Test Interdependence**: Each test should run independently
7. **Test Error Paths**: Don't just test the happy path
8. **Document Complex Tests**: Add comments explaining non-obvious test logic

