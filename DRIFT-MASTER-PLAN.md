# Drift Master Plan

You are now the principal engineer, systems architect, compiler engineer, framework engineer, and open-source maintainer responsible for evolving the existing Drift repository into a serious production-grade open-source project.

You already have access to the Drift codebase. Do not create a disconnected replacement project and do not blindly rewrite the repository.

Your job is to understand what already exists, preserve useful work, identify what should be deprecated or redesigned, and incrementally evolve Drift into the architecture described below.

# PRODUCT VISION

Drift is no longer merely a frontend language or React-oriented framework.

Drift should become:

**A compiled TypeScript application runtime powered by Rust.**

Core positioning:

> Write TypeScript. Drift runs the system.

Longer positioning:

> Drift turns routes, services, actions, workers, resources, policies, UI, and native code into a single statically understood application graph, then securely executes each part in the appropriate runtime.

Drift should take inspiration from:

- Next.js
- NestJS
- Boa
- Rust
- TypeScript
- modern compiler architecture
- capability-based security systems
- application runtimes
- static analysis
- developer tooling

Do not clone any one of them.

The purpose is to combine their strongest architectural ideas into something that has its own reason to exist.

# THE FUNDAMENTAL IDEA

The central abstraction of Drift is the:

## Drift Application Graph

A Drift application should be statically representable as a graph containing concepts such as:

- routes
- pages
- layouts
- actions
- loaders
- services
- providers
- resources
- policies
- middleware
- databases
- caches
- queues
- workers
- cron jobs
- streams
- WebSockets
- secrets
- execution cells
- native Rust functions
- client components
- server components

Example:
```text
Route
 ↓
Loader
 ↓
Service
 ├── Database
 ├── Cache
 └── Provider

Action
 ↓
Policy
 ↓
BillingService
 ↓
StripeCell
```

The compiler/runtime should understand these relationships rather than treating the application as an arbitrary collection of files.

This application graph should eventually power:

- dependency injection
- compilation
- validation
- security
- observability
- deployment planning
- runtime execution
- architecture visualization
- debugging
- agent/tooling integration

# MAIN DEVELOPER LANGUAGE

TypeScript must be the primary developer-facing language.

Do not require users to learn an unnecessary custom programming language.

Existing `.drift` work should be carefully audited.

Useful ideas can remain, migrate, or eventually become an optional UI DSL, but the core application framework should use standard TypeScript/TSX wherever practical.

An example future developer experience could look approximately like:
```ts
import {
  service,
  action,
  route,
  policy,
  resource
} from "drift";

const db = resource.postgres("main");

@service()
export class UsersService {
  constructor(private db: typeof db) {}

  async getUser(id: string) {
    return this.db.users.find(id);
  }
}

const authenticated = policy(async ctx => {
  return ctx.auth.user !== null;
});

export const getUser = action({
  input: UserInput,

  policy: authenticated,

  async run({ id, use }) {
    return use(UsersService).getUser(id);
  }
});
```

This syntax is illustrative.

Do not blindly copy it.

Design APIs based on TypeScript ergonomics, static analyzability, editor support, performance, and implementation feasibility.

# DRIFT INTERMEDIATE REPRESENTATION

Design a real internal representation.

Working name:

**DIR — Drift Intermediate Representation**

The compiler should eventually convert supported application declarations into DIR.

DIR should represent application semantics rather than TypeScript syntax.

Possible node categories:
```text
Application
Module
Route
Page
Layout
Action
Loader
Service
Provider
Resource
Database
Cache
Queue
Job
Schedule
Policy
Middleware
Stream
Cell
Secret
NativeFunction
ClientBoundary
ServerBoundary
```

Relationships might include:
```text
depends_on
calls
reads
writes
protects
contains
executes_in
publishes_to
subscribes_to
requires_secret
requires_network
requires_resource
```

Do not over-engineer DIR initially.

Start with the smallest representation necessary for the first vertical slice.

It must be:

- serializable
- deterministic
- inspectable
- testable
- versionable
- suitable for tooling

Eventually this should make possible:
```bash
drift graph
drift graph --json
drift explain <node>
```

# RUST RUNTIME

Rust should form the systems/runtime layer of Drift.

Do not use Rust merely for marketing.

Rust should own areas where it creates meaningful benefits.

Potential responsibilities include:

- HTTP server
- routing
- runtime orchestration
- execution scheduling
- resource management
- connection pools
- tracing
- telemetry
- process supervision
- execution cells
- permissions
- native extension loading
- IPC
- concurrency
- worker management
- runtime lifecycle

TypeScript should remain the language in which most Drift applications are written.

Think of the architecture approximately as:
```text
TypeScript application
        ↓
Compiler / analyzer
        ↓
Drift IR
        ↓
Rust Drift Kernel
        ↓
Execution environments
```

# MULTIPLE EXECUTION ENVIRONMENTS

Architect Drift so application code can eventually execute in different domains.

Potential execution targets:
```text
client
server
worker
isolate
native
edge
durable
```

Do not implement all of them immediately.

Architect for extensibility.

Possible future directives or metadata could express intent such as:
```text
client
server
worker
isolate
native
```

Do not copy Next.js directives mechanically.

Find an API that fits Drift.

# BOA

Boa should have a meaningful role.

Do not attempt to immediately replace Node.js or support the entire npm ecosystem through Boa.

Use Boa initially for controlled JavaScript execution.

Introduce the concept of:

## Drift Cells

A Cell is an isolated workload executed under controlled capabilities.

Conceptual API:
```ts
export const paymentProcessor = cell({
  permissions: {
    network: ["api.stripe.com"],
    secrets: ["STRIPE_SECRET"],
    database: ["billing"],
    filesystem: false
  },

  timeout: "5s",
  memory: "64mb",

  async run(input) {
    // logic
  }
});
```

Again, syntax is illustrative.

The important idea is:

**code only receives explicitly declared capabilities.**

The runtime should ultimately be able to enforce restrictions such as:

- allowed network hosts
- allowed secrets
- allowed databases/resources
- filesystem access
- environment access
- memory
- execution timeout

Boa should power these restricted execution environments where possible.

Node compatibility may coexist with Boa.

Possible architecture:
```text
Drift Runtime
├── Node compatibility runtime
├── Boa isolate runtime
├── Native Rust runtime
└── WASM runtime later
```

# CAPABILITY-BASED SECURITY

This is one of Drift's strongest potential differentiators.

Resources and permissions should be part of the application graph.

Example conceptual service:
```ts
service({
  resources: {
    db: ["users"],
    network: [],
    secrets: []
  }
})
```

A billing service might instead declare:
```text
database: billing
network: api.stripe.com
secret: STRIPE_SECRET
```

The Drift compiler should eventually validate capabilities statically where possible.

The runtime should enforce them dynamically where necessary.

This means architecture and security use the same dependency graph.

# COMPILED DEPENDENCY INJECTION

Take inspiration from NestJS providers and modules, but do not simply recreate runtime reflection-based DI.

Drift should pursue:

## AOT / compiled dependency injection

Given something such as:
```ts
class BillingService {
  constructor(
    private users: UsersService,
    private stripe: StripeService
  ) {}
}
```

Drift should be capable of constructing a dependency graph ahead of runtime.

The compiler should eventually detect:

- missing dependencies
- circular dependencies
- invalid provider scopes
- incompatible execution environments
- missing resources
- missing capabilities
- invalid secret access
- invalid native dependencies

Do not use decorators unless they genuinely improve the implementation and developer experience.

Evaluate:

- decorators
- explicit functions
- static factory definitions
- TypeScript metadata
- AST analysis

Choose based on maintainability and static analysis.

# TYPED SERVER BOUNDARIES

Drift should understand client/server boundaries strongly enough that developers should not need to manually duplicate:

- API route definitions
- DTOs
- fetch wrappers
- validation logic
- RPC clients

A server action should eventually generate its safe client boundary automatically.

The application graph should understand:
```text
browser
 ↓
typed generated boundary
 ↓
action
 ↓
service
 ↓
resource
```

Preserve validation at trust boundaries.

Never rely on TypeScript types as runtime validation.

# NATIVE RUST PROVIDERS

Eventually allow performance-sensitive functionality to be implemented in Rust.

Concept:
```rust
#[drift::provider]
pub fn hash_password(input: PasswordInput) -> PasswordHash {
    ...
}
```

Then expose a generated TypeScript interface:
```ts
import { hashPassword } from "@drift/native/auth";
```

Drift should own the bridge and type generation.

Do not prioritize this before the core runtime/compiler architecture works.

# OBSERVABILITY

Because Drift understands the application graph, observability should eventually map directly onto it.

For example:
```bash
drift explain checkout
```

could eventually provide:
```text
POST /checkout
 ↓
authenticated
 ↓
CheckoutService
 ├── CartService
 │   └── Redis
 ├── OrdersRepository
 │   └── PostgreSQL
 └── PaymentService
     └── StripeCell

execution:
browser → server → isolate

resources:
orders database
redis
STRIPE_SECRET

external network:
api.stripe.com
```

A future UI could combine:

- architecture
- dependencies
- runtime traces
- latency
- error rates
- deployment location
- permissions
- resource access

Do not build the full observability platform now.

But ensure the architecture does not make this impossible later.

# AGENT-FIRST TOOLING

Drift should become unusually easy for coding agents to understand.

Because the application has a structured graph, expose machine-readable commands.

Eventually:
```bash
drift graph --json
drift explain <node> --json
drift inspect
```

The output should make it possible for Codex, Claude, ChatGPT, Cursor, or other agents to understand the application's architecture without scanning the entire repository.

Do not make "AI" the core marketing pitch.

This should simply be an excellent consequence of the architecture.

# INITIAL IMPLEMENTATION TARGET

Do NOT try to build the whole vision immediately.

The first major milestone should prove the architecture.

Target approximately this vertical slice:

1. TypeScript application declarations
2. static analysis/compiler layer
3. minimal Drift IR
4. application graph generation
5. compiled dependency resolution
6. Rust HTTP/runtime kernel
7. typed actions
8. one Boa-backed execution Cell
9. `drift graph`
10. high-quality tests and examples

If these ten pieces work together coherently, Drift already becomes interesting.

# REPOSITORY AUDIT FIRST

Before making architectural changes:

1. inspect the entire existing repository
2. understand workspace structure
3. understand compiler architecture
4. identify packages/crates
5. understand CLI implementation
6. understand existing `.drift` parsing
7. inspect React integration
8. inspect routing
9. inspect testing
10. inspect build tooling
11. inspect current public API
12. inspect examples
13. inspect README and documentation
14. inspect Git history where useful
15. identify functionality worth preserving

Produce an internal architecture summary before beginning major implementation.

Do not delete existing work merely because the new vision is different.

Classify existing code into:
```text
KEEP
EVOLVE
DEPRECATE
REMOVE LATER
```

Avoid unnecessary churn.

# MONOREPO / REPOSITORY ARCHITECTURE

Assess whether the current structure is sufficient.

A future architecture might conceptually contain packages such as:
```text
crates/
  drift-kernel
  drift-runtime
  drift-boa
  drift-ir
  drift-native

packages/
  drift
  compiler
  cli
  runtime-node
  ts-plugin
  devtools

examples/
  hello-drift
  fullstack
  cells
  services

docs/
```

This is NOT an instruction to immediately create all these folders.

Only create packages when their boundaries are justified.

Prefer fewer coherent packages over premature fragmentation.

# ENGINEERING QUALITY

Treat Drift like a project intended to eventually have thousands of GitHub stars and external contributors.

Code should be:

- readable
- strongly typed
- modular
- documented
- testable
- deterministic where possible
- explicit
- idiomatic in the relevant language

Avoid:

- giant files
- mystery abstractions
- duplicated implementations
- speculative abstractions
- excessive macros
- unnecessary unsafe Rust
- reflection-heavy magic
- hidden global state
- magic conventions that cannot be statically explained

When introducing an abstraction, it should solve a concrete architectural problem.

# PERFORMANCE

Do not prematurely optimize.

However, benchmark important runtime paths.

Eventually benchmark:

- HTTP overhead
- action invocation
- DI resolution
- graph loading
- Cell startup
- Cell execution
- TypeScript→Rust bridge
- cold startup
- memory overhead

Create reproducible benchmark tooling when performance work begins.

Do not publish misleading benchmark claims.

# ERROR EXPERIENCE

Compiler and runtime errors must be excellent.

Bad:
```text
dependency resolution failed
```

Good:
```text
Drift could not construct BillingService.

BillingService
└── requires StripeService
    └── requires secret STRIPE_SECRET

STRIPE_SECRET is not available in this execution environment.

Declared at:
src/billing/stripe.ts:12

Used by:
POST /checkout
```

Error quality should be considered a product feature.

# CLI

The Drift CLI should eventually feel extremely polished.

Potential commands:
```bash
drift dev
drift build
drift start
drift graph
drift explain
drift inspect
drift check
drift doctor
```

Do not implement commands without real functionality behind them.

`drift check` should eventually perform static architectural validation.

`drift graph` should output the application graph.

Support:
```bash
drift graph --json
```

before investing heavily in fancy visualization.

# DEV SERVER

Long-term developer experience should support:

- fast startup
- incremental compilation
- dependency graph updates
- meaningful errors
- Rust runtime reload
- TypeScript reload
- tracing
- Cell reload
- minimal unnecessary restart

Do not prioritize perfect HMR before architecture correctness.

# TESTING STRATEGY

Every important subsystem needs tests.

Include:

## TypeScript

- compiler tests
- graph generation tests
- public API tests
- CLI tests
- integration tests
- type tests

## Rust

- unit tests
- runtime tests
- permission tests
- concurrency tests
- error handling tests

## End-to-end

Create small fixture applications demonstrating:
```text
route → action → service
```

then:
```text
route → action → service → Cell
```

Tests should verify the entire chain.

Do not fake core functionality simply to make tests green.

# OPEN SOURCE REQUIREMENTS

Drift is an open-source repository.

Treat repository quality as part of the product.

The repo should eventually contain a polished:
```text
README.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE
CHANGELOG.md or release strategy
```

And GitHub configuration such as:
```text
.github/
  ISSUE_TEMPLATE/
  workflows/
  pull_request_template.md
```

Possible issue templates:

- bug report
- feature request
- proposal / RFC
- documentation issue

Do not create bureaucratic contributor processes.

Make contributing easy.

# README

The README should quickly answer:

1. What is Drift?
2. Why does it exist?
3. Why not Next.js/NestJS/Encore/etc.?
4. What currently works?
5. What is experimental?
6. How do I run it?
7. What does the architecture look like?
8. Where is the roadmap?
9. How can I contribute?

Do not claim functionality that does not exist.

Clearly distinguish:
```text
AVAILABLE
EXPERIMENTAL
PLANNED
```

Never market roadmap items as shipped features.

# DOCUMENTATION

Create architecture documentation that explains concepts rather than merely APIs.

Potential docs:
```text
docs/
  architecture.md
  application-graph.md
  compiler.md
  runtime.md
  cells.md
  capabilities.md
  contributing/
```

Important decisions should be recorded as lightweight ADRs or RFCs where appropriate.

Examples:
```text
rfcs/
  0001-application-graph.md
  0002-drift-ir.md
  0003-execution-cells.md
```

Do not RFC every trivial change.

Use RFCs for decisions that fundamentally shape Drift.

# GITHUB ISSUES

Use GitHub issues as an actual engineering backlog.

Break large roadmap work into understandable issues.

Good example:
```text
Epic: Minimal Drift Application Graph

- Define v0 DIR schema
- Parse service declarations
- Parse action declarations
- Build dependency graph
- Detect dependency cycles
- Serialize graph as JSON
- Implement `drift graph`
```

Issues should include:

- motivation
- scope
- expected behavior
- non-goals
- acceptance criteria

Label them meaningfully.

Possible labels:
```text
compiler
runtime
rust
typescript
boa
cli
DX
documentation
good first issue
help wanted
RFC
breaking
```

Do not create fake activity or hundreds of useless issues.

# GOOD FIRST ISSUES

Because this is open source, intentionally create real contribution surfaces.

Good first issues should actually be small.

Examples:

- improve an error message
- add a graph JSON fixture
- document an existing subsystem
- add a CLI flag
- test cycle detection
- improve examples
- validate resource names

Do not label major architectural work `good first issue`.

# CI

Set up high-quality GitHub Actions.

At minimum over time:

- formatting
- linting
- TypeScript type checking
- Rust formatting
- Clippy
- Rust tests
- TS tests
- integration tests
- build verification

Use dependency caching sensibly.

Do not make CI unnecessarily complicated.

Do not allow failing checks to silently pass.

# SECURITY

Because Drift may execute application code, treat security seriously from the beginning.

Create `SECURITY.md`.

For Cells and runtime isolation:

- never claim sandbox security before it has been properly audited
- clearly document threat models
- distinguish logical isolation from hardened security boundaries
- avoid unsafe execution assumptions
- validate all host bindings
- use allowlists rather than blocklists where possible

A capability system must be enforceable, not decorative.

# VERSIONING

Drift should initially be clearly experimental.

Use semantic versioning when releases begin.

Breaking changes are acceptable early, but they should be intentional and documented.

Do not pretend API stability before it exists.

# CHANGE MANAGEMENT

Never make enormous unexplained commits.

Work in coherent changes.

Examples:
```text
feat(ir): introduce minimal application graph schema

feat(compiler): discover services and actions

feat(cli): add drift graph command

feat(runtime): introduce Rust HTTP kernel

feat(cells): execute minimal Boa cell

docs(architecture): document application graph
```

Each commit should represent a meaningful unit.

Do not write useless commit messages such as:
```text
update
fix stuff
changes
wip
```

# BRANCHING

Do not work directly on the default branch for major architecture work unless explicitly instructed.

Prefer feature branches such as:
```text
feat/application-graph
feat/drift-ir
feat/rust-runtime
feat/boa-cells
```

Keep branches focused enough to review.

# PULL REQUESTS

Even if you are the primary implementation agent, structure major work as if another maintainer needs to review it.

PR descriptions should include:
```text
What changed

Why

Architecture impact

Testing

Screenshots/output where relevant

Known limitations

Follow-up work
```

Large architectural PRs must explain design decisions.

# BACKWARD COMPATIBILITY

Do not destroy current Drift functionality unnecessarily.

If the existing frontend language or compiler contains useful technology, reuse it.

Potentially frame the existing system as:

- legacy frontend DSL
- experimental UI compiler
- optional layer
- source of reusable compiler infrastructure

But make decisions based on the actual code after inspection.

If a breaking change is justified:

1. explain why
2. document it
3. provide migration guidance where practical

# EXAMPLES

Maintain extremely small examples.

The first example should feel almost trivial.

Example progression:
```text
examples/hello
examples/services
examples/actions
examples/cells
examples/fullstack
```

Do not use one giant demo as the only documentation.

# FIRST MAJOR DEMO

Eventually create a demonstration app proving:
```text
Browser
 ↓
typed action
 ↓
compiled service dependency
 ↓
Rust runtime
 ↓
Boa Cell
```

Example:
```text
POST /checkout
 ↓
CheckoutAction
 ↓
BillingService
 ↓
FraudCell
```

Then:
```bash
drift graph
```

should show this architecture.

That vertical slice is more important than having 100 incomplete features.

# NON-GOALS FOR V0

Do not initially build:

- a cloud deployment platform
- Kubernetes management
- full database ORM
- complete queue system
- production-grade edge runtime
- visual IDE
- proprietary hosting
- complete Next.js replacement
- complete NestJS replacement
- complete npm-on-Boa compatibility
- production hardened sandbox claims
- distributed scheduler
- every deployment provider

Keep focus.

# ARCHITECTURAL PRINCIPLE

Every feature should answer:

> Does this strengthen Drift's application graph, runtime model, security model, or developer experience?

If not, question why it belongs in the core.

# DIFFERENTIATION

Drift must not become:

> Next.js rewritten in Rust.

It must not become:

> NestJS but faster.

It must not become:

> another Bun.

It must not become:

> another JavaScript runtime.

It must not become:

> another frontend DSL.

The differentiation is:

**Drift statically understands the entire application's architecture and uses that understanding to compile, validate, secure, execute, inspect, and eventually deploy it.**

That is the core.

# HOW YOU SHOULD WORK

Operate autonomously but carefully.

For each major area:

1. inspect existing implementation
2. understand implications
3. design smallest viable architecture
4. implement
5. test
6. run formatting/linting
7. update docs
8. review your own diff
9. remove unnecessary complexity
10. commit coherently

Do not ask me to approve every minor implementation decision.

Make strong engineering decisions yourself.

However, do not silently make irreversible product-level changes without documenting the reasoning.

# SELF-REVIEW

Before considering a feature finished, inspect the diff as a senior maintainer.

Ask:

- Is this simpler than it needs to be?
- Is there unnecessary abstraction?
- Is the public API coherent?
- Does this fit the application graph?
- Is it testable?
- Are errors understandable?
- Does documentation match reality?
- Did we accidentally break existing behavior?
- Would an external contributor understand this?
- Would I approve this PR if somebody else submitted it?

Fix problems before moving on.

# DO NOT FAKE IMPLEMENTATIONS

Never create placeholder architecture and present it as completed functionality.

Bad:
```ts
function executeInBoa(code) {
  return eval(code);
}
```

and claiming Boa Cells work.

Bad:
```rust
// TODO sandbox
```

while documentation claims permissions are enforced.

If functionality is not implemented, explicitly mark it as planned.

Trustworthiness matters.

# FIRST TASK

Begin by auditing the repository.

Do not immediately rewrite anything.

Produce:

## 1. Current Architecture

Explain:

- repository structure
- compiler
- runtime
- CLI
- frontend layer
- routing
- packages/crates
- testing
- existing abstractions

## 2. Keep / Evolve / Deprecate Assessment

Classify major existing pieces.

## 3. Gap Analysis

Compare existing Drift with the new architecture.

## 4. Proposed Repository Architecture

Show what should change immediately versus later.

## 5. V0 Architecture

Define the smallest credible implementation containing:
```text
TypeScript declarations
        ↓
compiler
        ↓
DIR
        ↓
application graph
        ↓
Rust runtime
        ↓
Boa Cell
```

## 6. Implementation Plan

Break work into small phases with concrete acceptance criteria.

## 7. GitHub/Open-Source Plan

Audit:

- README
- CONTRIBUTING
- LICENSE
- SECURITY
- issue templates
- CI
- examples
- documentation
- roadmap

Improve missing areas where appropriate.

After the audit, begin implementing the smallest end-to-end vertical slice.

Do not attempt the entire roadmap simultaneously.

# DESIRED RESULT

Drift should eventually be a repository where an experienced engineer opens the README and immediately understands:

> This isn't another web framework.

Then they inspect the code and realize the implementation is real.

The project should demonstrate serious ability across:

- Rust
- TypeScript
- compiler engineering
- AST/static analysis
- JavaScript runtimes
- framework architecture
- dependency graphs
- security
- developer experience
- runtime engineering
- open-source maintenance

Build Drift like it deserves to become a real ecosystem, not merely a portfolio demo.
