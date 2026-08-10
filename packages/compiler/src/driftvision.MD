# Drift

> The React framework that thinks in motion, speaks in tokens, and ships in one language.

```bash
npx create-drift-app my-project
cd my-project
drift dev
```

---

## What is Drift?

Drift is a fullstack React framework with its own compiled language. You write `.drift` files. The compiler produces optimized CSS, typed React components, server functions, and a production-ready web app — with zero configuration and no assembly required.

The problem Drift solves is not a missing feature. It's a missing layer. The modern React stack is not a framework — it's a procurement exercise. You pick Tailwind, then Framer Motion, then CVA for variants, then Style Dictionary for tokens, then Next.js for routing, then GSAP for scroll animations, then a gesture library, then wire them all together and pray they agree. Every boundary between these tools is friction. Every update is a negotiation. Every new hire has to learn your specific assembly.

Drift replaces the assembly with a single coherent language. One syntax. One compiler. One mental model.

---

## The Language

Drift uses curly-brace syntax that feels immediately familiar to any React developer. The only new thing you learn is the `style {}` block. Everything else — JSX, props, conditionals, async data — is exactly what you already know.

**Syntax rules:**
- Curly braces for all blocks
- No semicolons
- No colons on property values — `bg $color.ember` not `bg: $color.ember`
- Tokens prefixed with `$` — always
- States are nested blocks — `hover {}`, `press {}`, `focus {}`
- Comments with `//`
- Strings use `"` only when needed

```drift
// components/Button.drift

style Button {
  layout   row center gap($space.2)
  bg       $color.ember
  text     $type.sm bold white
  radius   $radius.pill
  pad      $space.2 $space.5
  cursor   pointer

  enter    fade rise(4px)   snap   140ms

  hover {
    bg     $color.ember.dark
    rise   2px
  }

  press {
    shrink 0.97
  }

  // Size variants
  sm {
    text   $type.xs
    pad    $space.1 $space.3
  }

  lg {
    text   $type.md
    pad    $space.3 $space.7
  }

  // Visual variants
  ghost {
    bg       transparent
    border   1px $color.ember
    text     $type.sm bold $color.ember
  }

  danger {
    bg   $color.red
  }
}

render Button({ label, icon, variant = "default", size = "default", onClick }) {
  <button onClick={onClick}>
    {icon && <Icon name={icon} />}
    <span>{label}</span>
  </button>
}
```

Usage is one line of JSX. Variants are props. No `className` switching, no `cva()`, no `clsx`.

```jsx
<Button label="Get started" size="lg" />
<Button label="Delete" variant="danger" icon="trash" />
<Button label="Learn more" variant="ghost" />
```

---

## Design Tokens

Your entire design system lives in one file — `drift.tokens`. Colors, spacing, typography, easing, shadows, borders. Every token is typed and available everywhere with `$token.path` syntax.

Drift auto-generates full color scales from two seed values. You define the range endpoints — Drift builds the 50 through 950 steps.

```drift
// drift.tokens

tokens {
  color {
    ember   #F07040 → #5A1A08    // auto: 50 through 950
    moss    #5A8A3C → #1A3A0E
    tide    #3A9E82 → #0A3028
    red     #E84040 → #5A0A0A
    surface #1A1A1E → #0A0A0C
  }

  space    4 8 12 16 24 32 48 64 96 128
  radius   { sm: 4  md: 8  lg: 14  xl: 22  pill: 999 }
  duration { fast: 120ms  base: 240ms  slow: 400ms  crawl: 800ms }

  ease {
    spring   cubic(0.34, 1.56, 0.64, 1)    // bouncy overshoot — buttons, cards
    snap     cubic(0.20, 0.00, 0.00, 1)    // instant start, smooth land — menus
    exhale   cubic(0.40, 0.00, 0.20, 1)    // slow out — exits, fades
    breathe  cubic(0.45, 0.05, 0.40, 0.95) // symmetric — loops, pulses
    float    cubic(0.16, 1.00, 0.30, 1)    // dramatic ease-out — hero entrances
  }

  shadow {
    sm   0 1px 3px rgba(0,0,0,0.3)
    md   0 4px 16px rgba(0,0,0,0.4)
    lg   0 12px 40px rgba(0,0,0,0.5)
  }

  type {
    xs   12px / 1.5
    sm   14px / 1.6
    md   16px / 1.7
    lg   20px / 1.6
    xl   24px / 1.4
    2xl  32px / 1.2
  }
}
```

TypeScript types for every token are auto-generated at build time. Your editor knows every valid `$token.path` and will autocomplete and error-check them.

---

## Animation

Drift treats animation as describing **states and transitions**, not keyframe percentages. `enter`, `exit`, `hover`, `press`, `scroll`, `drag` are first-class properties — not plugins.

Every animation automatically respects `prefers-reduced-motion` at the compiler level. You never think about it.

```drift
// motions/shared.drift

// Scroll-triggered reveal with stagger
motion revealOnScroll {
  when     scroll(40%)
  enter    fade rise(20px)   float   320ms
  stagger  children 80ms
}

// Sequenced hero entrance
motion heroEntrance {
  step   Logo      enter   delay(0ms)
  step   Nav       enter   delay(80ms)
  step   Headline  enter   delay(160ms)
  step   Subtext   enter   delay(240ms)
  step   CTA       enter   delay(320ms)
}

// Cursor-following magnetic hover
motion magneticHover {
  track    cursor
  strength 0.3
  radius   120px
}

// Looping animations
motion shimmer {
  loop   x(-100% → 100%)           1.4s   linear
}

motion pulse {
  loop   scale(1 → 1.03 → 1)       2s     breathe
}

motion breathe {
  loop   opacity(0.6 → 1 → 0.6)    2s     breathe
}
```

Applying a motion is one line — in the style block or as a JSX prop:

```drift
style Hero {
  apply revealOnScroll
}
```

```jsx
<Card motion="pulse" />
<Hero motion="heroEntrance" />
<Button motion="magneticHover" />
```

**Built-in easing curves:**

| Name      | Feel                                       |
|-----------|--------------------------------------------|
| `spring`  | Bouncy overshoot — buttons, cards          |
| `snap`    | Instant start, smooth land — menus, drawers|
| `exhale`  | Slow out — exits, fades                    |
| `breathe` | Symmetric in-out — loops, pulses           |
| `float`   | Dramatic ease-out — hero entrances         |
| `linear`  | Constant speed — progress bars, loaders    |

**Layout shorthands:**

| Keyword      | Expands to                                            |
|--------------|-------------------------------------------------------|
| `row`        | `display: flex; flex-direction: row`                  |
| `col`        | `display: flex; flex-direction: column`               |
| `grid(N)`    | `display: grid; grid-template-columns: repeat(N, 1fr)`|
| `center`     | `align-items: center; justify-content: center`        |
| `stack`      | `position: relative` + children `position: absolute` |
| `rise(Npx)`  | `transform: translateY(-Npx)` + transition            |
| `fall(Npx)`  | `transform: translateY(Npx)` + transition             |
| `shrink(N)`  | `transform: scale(N)` + transition                    |
| `grow(N)`    | `transform: scale(N)` + transition                    |

---

## Routing

Drift uses file-based routing. The filesystem is the router. No configuration, no route registration.

```
pages/
├── index.drift           →  /
├── about.drift           →  /about
├── blog/
│   ├── index.drift       →  /blog
│   └── [slug].drift      →  /blog/:slug
├── dashboard/
│   ├── index.drift       →  /dashboard
│   └── settings.drift    →  /dashboard/settings
└── [...catchall].drift   →  /*
```

Every page file has four optional blocks:

```drift
// pages/blog/[slug].drift

page BlogPost {
  path     "/blog/:slug"
  layout   RootLayout
  transition  fade

  // Runs on the server only. Never ships to the client.
  server load({ params }) {
    const post = await db.posts.findBySlug(params.slug)
    if (!post) return Response.notFound()
    return { post }
  }

  // Generates <head> tags from loaded data
  meta({ post }) {
    title        post.title
    description  post.excerpt
    og:image     post.coverImage
  }

  // Loading state while server load() resolves
  loading {
    <PostSkeleton />
  }

  // Error state — receives code and message
  error({ code, message }) {
    if (code == 404) {
      <NotFound />
    } else {
      <ErrorPage message={message} />
    }
  }

  // Your React JSX — receives whatever load() returned
  render({ post }) {
    <article>
      <h1>{post.title}</h1>
      <PostBody content={post.content} />
    </article>
  }
}
```

**Layouts** wrap pages and chain data downward:

```drift
// layouts/DashboardLayout.drift

layout DashboardLayout {
  extends RootLayout

  server load({ req }) {
    const user = await auth.getUser(req)
    if (!user) return Response.redirect("/login")
    return { user }
  }

  render({ children, user }) {
    <div class="dashboard">
      <Sidebar user={user} />
      <main>{children}</main>
    </div>
  }
}
```

Data from parent layouts flows down to child pages automatically. A page inside `DashboardLayout` receives `user` in its `render()` without any extra wiring.

**Middleware** handles auth and access control globally:

```drift
// middleware.drift

middleware {
  matcher   ["/dashboard/*", "/api/*"]

  run({ req, next }) {
    const user = await auth.getUser(req)
    if (!user) return Response.redirect("/login")
    return next({ user })
  }
}
```

**Page transitions** are defined once in config and referenced by name:

```drift
// drift.config.ts

transitions {
  fade {
    exit   fade fall(8px)     exhale   160ms
    enter  fade rise(12px)    float    280ms
  }

  slide {
    exit   x(-100%)   snap     200ms
    enter  x(100%)    spring   320ms
  }
}
```

```drift
page Dashboard {
  transition  slide
  layout      DashboardLayout
}
```

---

## Fullstack

Drift is a fullstack framework. Frontend, server data loading, API routes, and middleware all live in the same codebase in the same language.

**API routes** live in `api/` and follow the same file-based convention:

```drift
// api/posts/[id].drift

route GET {
  handler async({ params }) {
    const post = await db.posts.findById(params.id)
    if (!post) return Response.notFound({ message: "Post not found" })
    return Response.ok(post)
  }
}

route POST {
  handler async({ body }) {
    const post = await db.posts.create(body)
    return Response.created(post)
  }
}

route DELETE {
  handler async({ params, req }) {
    await auth.requireUser(req)
    await db.posts.delete(params.id)
    return Response.noContent()
  }
}
```

The compiler knows which code is server-only. It never leaks to the client bundle. No `"use server"` directives scattered through your files. The boundary is the block — if it's inside `server {}` or a `route {}`, it's server-only. Period.

---

## AI — First-Class Language Primitives

This is where Drift goes somewhere no other framework has gone. Instead of AI being a dev tool you bolt on, Drift introduces `ai:` as a first-class namespace in the language itself.

The compiler knows which blocks are static, which are dynamic, and which are generative. It handles streaming, loading states, fallbacks, and caching automatically. You declare intent. Drift handles the wiring.

```drift
// components/ProductCard.drift

render ProductCard({ product, user }) {
  <div>
    <h2>{product.name}</h2>

    // Generates on-brand copy from structured data
    ai:describe {
      context   product.specs
      tone      $brand.voice
      length    short
      fallback  product.description
    }

    // Swaps content based on user context
    ai:personalize {
      based-on   user.browsing_history
      swap       hero_image
      fallback   product.defaultImage
    }

    // Streaming chat interface — one line
    ai:chat {
      context    product
      prompt     "You are a helpful product expert for {product.name}"
      style      inline
    }
  </div>
}
```

**All `ai:` primitives:**

```drift
// Generate copy from data using your brand voice
ai:describe {
  context    data.specs
  tone       $brand.voice      // pulled from your token system
  length     short | medium | long
  fallback   data.description  // shown if AI is unavailable
}

// Personalize content per user
ai:personalize {
  based-on   user.history
  swap       component_name
  fallback   default_component
}

// Stream structured data from AI
ai:generate {
  prompt     "Generate 5 related products for {product.name}"
  schema     ProductSchema     // typed output — no hallucinated shapes
  render     (items) => items.map(item => <ProductCard {...item} />)
  loading    <SkeletonGrid />
}

// Inline chat — product assistant, support, anything
ai:chat {
  context    any_data
  prompt     "system prompt here"
  style      inline | modal | sidebar
  history    true | false
}

// AI-powered search with semantic understanding
ai:search {
  index      products          // what to search
  render     (results) => <ResultsList results={results} />
  empty      <NoResults />
}

// Classify and route user input
ai:classify {
  input      user.message
  options    ["question", "complaint", "purchase", "other"]
  on:question  <FAQResponse />
  on:complaint <SupportFlow />
  on:purchase  <CheckoutFlow />
}

// Generate motion from a description
ai:motion {
  feel       "fast and confident"
  target     CTA
  // compiles to your token-aware easing system
}
```

**Why this is different from just calling an API**

Every other framework makes AI your problem. You write the fetch call, handle streaming, manage loading state, deal with errors, parse the output, render the result. You do this for every component, every page, every feature — and nothing knows about anything else.

Drift's `ai:` blocks are compiled. The compiler knows your component tree, your token system, your brand voice. It generates optimized, streaming-ready, type-safe code from a three-line declaration. And because `ai:` is part of the language, tooling — autocomplete, type checking, error messages — all work automatically.

The `schema` field on `ai:generate` is important. By binding AI output to a typed schema, you eliminate the entire class of "AI returned something unexpected" bugs. The compiler generates validation and retries automatically.

---

## Features That Don't Exist Elsewhere

Beyond the core language, Drift ships with capabilities that no other framework has thought to build.

---

### Visual Regression as a Build Step

Every component has a visual contract. When you run `drift build`, Drift renders every component in every variant at every breakpoint, diffs them against the last accepted screenshots, and fails the build if anything changed unexpectedly. No separate Percy or Chromatic setup. No CI configuration. It's built into the compiler.

```bash
drift build
# ✓ Token resolution
# ✓ Style extraction
# ✓ Motion codegen
# ✗ Visual regression — Button.ghost changed at mobile breakpoint
#   Run `drift accept` to approve changes
```

---

### Token-Aware Linting

Because Drift knows your entire token system, it can lint for token violations at compile time. Using a hardcoded hex color instead of `$color.ember`? Build warning. Using `padding: 13px` instead of a spacing token? Build warning. Consistency is enforced by the compiler, not by code review.

```bash
drift lint
# ⚠ Button.drift:12 — hardcoded color #E84040. Did you mean $color.red?
# ⚠ Card.drift:8  — raw value 13px. Nearest token: $space.3 (12px)
```

---

### Brand Voice as a Token

Your tone of voice lives in `drift.tokens` alongside your colors and spacing. Every `ai:describe` block pulls from it automatically. Change your brand voice in one place — every AI-generated piece of copy in your entire app updates.

```drift
tokens {
  brand {
    voice      "Direct, warm, technically precise. Never corporate."
    persona    "A senior engineer who genuinely wants to help."
    avoid      "Synergy, leverage, circle back, touch base."
  }
}
```

---

### Responsive Motion

Most frameworks let you write responsive styles. None let you write responsive motion. Drift does.

```drift
motion heroEntrance {
  desktop {
    step   Headline  enter  rise(24px)  float  320ms
    stagger children 80ms
  }

  mobile {
    step   Headline  enter  fade  exhale  200ms
    stagger children 40ms
  }
}
```

On mobile, you get a simpler, faster, battery-friendly animation. On desktop, you get the full choreographed sequence. One motion block. The compiler handles the breakpoint split.

---

### Component Performance Budgets

You set a render budget per component. The compiler measures it and warns if you exceed it.

```drift
style HeavyDashboard {
  perf {
    budget   16ms     // one frame at 60fps
    warn-at  12ms
  }
}
```

---

### Live Token Preview

The VSCode extension shows every `$token.path` as an inline preview — color swatches, spacing rulers, easing curve previews. You see the token value without leaving the editor. Change a token in `drift.tokens` and every preview updates in real time across every file.

---

### Zero-Config Internationalization

Drift treats i18n as a compiler concern, not an application concern.

```drift
render HeroHeadline({ locale }) {
  <h1>
    i18n:text {
      en  "Build without limits."
      fr  "Construisez sans limites."
      de  "Bauen Sie ohne Grenzen."
    }
  </h1>
}
```

The compiler generates separate bundles per locale. No runtime translation library. No JSON files to manage separately. The strings live in the component that uses them.

---

### Drift Studio — Visual Token Editor

A browser-based GUI that reads and writes your `drift.tokens` file in real time. Adjust a color scale with a visual picker. Tweak an easing curve on an interactive bezier editor. Preview spacing changes across your whole component library simultaneously. Save — and the changes land in your file, ready to commit.

Not a design tool. Not Figma. A developer tool that understands your token system and lets you tune it with your hands, not your keyboard.

---

## Deployment

Drift compiles to standard React + CSS. Deployment is the existing ecosystem — nothing new to learn.

```bash
drift build    # produces /dist — standard React app
drift deploy   # detects your platform and runs the right CLI
```

**Platforms:**
- **Vercel** — first-class target. Push to GitHub, done. `drift deploy` wraps `vercel deploy`.
- **Netlify** — build command `drift build`, publish dir `dist`.
- **Cloudflare Pages** — static-first output deploys perfectly to the edge.
- **Self-hosted** — Docker image included. Any VPS, any cloud provider.
- **Node server** — for SSR and API routes, Drift outputs a standard Hono/Express server.

---

## Compiler Pipeline

```
.drift files
    │
    ▼
Drift Parser          tokenizes .drift syntax → AST
    │
    ▼
Token Resolver        injects $token values → CSS variables + TS types
    │
    ▼
Style Extractor       style blocks → scoped CSS modules + variant classes
    │
    ▼
Motion Codegen        motion blocks → Web Animations API + prefers-reduced-motion guards
    │
    ▼
AI Codegen            ai: blocks → streaming-ready server functions + typed schemas
    │
    ▼
JSX Transformer       render blocks → typed React components
    │
    ▼
Route Builder         pages/ → file-based router + layouts + data loaders
    │
    ▼
API Builder           api/ → serverless functions or Express routes
    │
    ▼
Visual Regression     renders all components → diffs against last accepted screenshots
    │
    ▼
Output Bundle         static CSS + React components + server runtime + type declarations
```

A Vite plugin at its core. No webpack config. No Babel plugins.

---

## Project Structure

```
my-app/
├── drift.tokens              global design system — colors, space, type, easing, brand voice
├── drift.config.ts           breakpoints, fonts, AI provider, plugins
├── middleware.drift           auth, redirects, global guards
│
├── pages/
│   ├── index.drift           → /
│   ├── about.drift           → /about
│   └── dashboard/
│       ├── index.drift       → /dashboard
│       └── settings.drift    → /dashboard/settings
│
├── api/
│   ├── posts/
│   │   ├── index.drift       → GET /api/posts
│   │   └── [id].drift        → GET/POST/DELETE /api/posts/:id
│   └── auth/
│       └── [...].drift       → /api/auth/*
│
├── layouts/
│   ├── RootLayout.drift
│   └── DashboardLayout.drift
│
├── components/
│   ├── Button.drift
│   ├── Card.drift
│   └── Nav.drift
│
├── motions/
│   └── shared.drift          reusable named sequences
│
└── assets/
    ├── fonts/
    └── images/
```

---

## Ecosystem

Every package works standalone. Use `drift/motion` in an existing React project. Use `drift/tokens` with Tailwind. But together they form the complete framework.

| Package         | What it does                                              |
|-----------------|-----------------------------------------------------------|
| `drift`         | Core CLI, compiler, dev server                            |
| `drift/style`   | Scoped, variant-aware, token-driven styling engine        |
| `drift/motion`  | Enter/exit, gestures, scroll triggers, sequences          |
| `drift/router`  | File-based routing, layouts, data loading                 |
| `drift/tokens`  | Token parser, scale generator, TypeScript types           |
| `drift/ai`      | ai: primitive runtime, streaming, schema validation       |
| `drift/ui`      | Optional headless components pre-styled in Drift syntax   |
| `drift/studio`  | Visual token editor — browser-based, writes to your files |
| `drift/cli`     | `create-drift-app`, `drift dev`, `drift build`, `drift deploy` |

---

## Compared to the Existing Stack

| Capability               | Assembled stack                        | Drift                                   |
|--------------------------|----------------------------------------|-----------------------------------------|
| Styling                  | Tailwind + CSS Modules                 | `drift/style`                           |
| Animation                | Framer Motion + CSS transitions        | `drift/motion`                          |
| Design tokens            | Style Dictionary + manual config       | `drift.tokens`                          |
| Component variants       | CVA + clsx + manual types              | Built into `style {}` blocks            |
| Routing                  | Next.js / Remix                        | `drift/router`                          |
| Responsive styles        | Tailwind breakpoint prefixes           | `mobile {}` / `tablet {}` blocks        |
| Scroll animation         | GSAP ScrollTrigger                     | `when scroll(%)` in motion blocks       |
| Gesture animation        | Custom hooks + libraries               | `track cursor`, `drag`, `on(swipe)`     |
| TypeScript types         | Manual or separately generated         | Auto-generated from tokens + components |
| AI-generated copy        | Custom fetch + prompt + parse + render | `ai:describe {}`                        |
| AI personalization       | Custom everything                      | `ai:personalize {}`                     |
| Page transitions         | Fighting the router + Framer           | `transition slide` on the page block    |
| Visual regression        | Percy / Chromatic — separate setup     | Built into `drift build`                |
| Token linting            | Custom ESLint rules — if you write them| Built into the compiler                 |
| i18n                     | next-intl / react-i18next              | `i18n:text {}` compiled per locale      |
| Responsive motion        | Not possible                           | `desktop {}` / `mobile {}` in motions   |
| Brand voice              | Prompt strings scattered everywhere    | `$brand.voice` token                    |

---

## Roadmap

### v0.1 — Language Foundation
- Drift parser and AST
- `drift/tokens` — token file parser, CSS variable output, TypeScript types, auto-generated color scales
- `drift/style` — scoped styles, variant blocks, responsive blocks, token linting

### v0.2 — Motion
- `drift/motion` — enter/exit, hover/press, named sequences, scroll triggers
- Built-in easing library
- Stagger system
- `prefers-reduced-motion` automatic wrapping
- Responsive motion blocks

### v0.3 — Framework
- `drift/router` — file-based routing, layouts, data loading
- `page {}`, `render {}`, `server load()` block compilation
- Vite plugin
- `api/` directory — serverless API routes
- Middleware

### v0.4 — AI Primitives
- `drift/ai` — `ai:describe`, `ai:generate`, `ai:chat`, `ai:search`, `ai:classify`
- Schema-bound AI output with automatic validation
- Streaming support out of the box
- Brand voice token integration

### v0.5 — Tooling
- VSCode extension — syntax highlighting, token autocomplete, inline previews
- `drift/studio` — visual token editor
- Visual regression as a build step
- Source maps for debugging compiled output
- `create-drift-app` CLI

### v1.0 — Production
- Stable compiler API with semver guarantees
- Plugin system for language extensions
- Server components and edge runtime support
- `drift/ui` — headless component library
- Performance budgets
- Zero-config i18n

---

## Honest Scope

This is a language design document, not a shipping product. Here is what holds up and where the real engineering work begins.

**What's solid:** The syntax design is coherent and well-motivated. The token system solves a real pain point. Named easing curves are immediately usable. The assembled-stack problem is correctly diagnosed. The `ai:` primitive model is genuinely new and genuinely valuable if executed well.

**What's hard:** The parser and AST alone is 3–6 months of serious work. SSR, source maps, and good error messages in a custom language are each substantial engineering problems. The VSCode extension needs its own language server. Ecosystem trust takes years.

**The honest build order:** Ship `drift/tokens` and `drift/style` first. These are self-contained, immediately useful alongside any existing React setup, and validate the token syntax without requiring a full compiler. Use the adoption from those packages to fund the rest. Each stage should earn users before the next begins.

---

## The Name

**Drift** — the motion of water finding its path. Effortless on the surface. Powerful underneath. The feeling you want when building: that things just *flow*.

The file extension is `.drift`.  
The CLI is `drift`.  
The community is the current.

---

*This document is the source of truth for the Drift language and framework vision. Everything built under the Drift name should serve one goal: make it so easy to build remarkable web experiences that the only limit is imagination.*