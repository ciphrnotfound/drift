# @drift/server

Server-only request primitives for Drift. The browser export fails immediately, helping prevent secrets and privileged code from entering a client bundle.

```ts
import { action, policy, serverEnv } from '@drift/server'

const authenticated = policy(context => Boolean(context.locals.userId))

export const createProject = action({
  policy: authenticated,
  input(value) {
    if (!value || typeof value !== 'object') throw new Error('Expected an object')
    return value as { name: string }
  },
  async run({ input, context }) {
    const databaseUrl = serverEnv('DATABASE_URL', { required: true })
    return { requestId: context.requestId, input, configured: Boolean(databaseUrl) }
  },
})

// Expose createProject.handler from a route or deployment adapter.
```

Mutation actions default to `POST`, a 1 MB body limit, same-origin checks when an `Origin` header is present, JSON/form/text parsing, no-store error responses, and explicit authorization callbacks. `action()` is the graph-aware authoring API; `defineAction()` remains available for lower-level handlers.

Vercel Node.js Functions use the same Web Request/Response contract:

```ts
import { createVercelHandler } from '@drift/server/vercel'
import { createProject } from './actions/create-project'

export default createVercelHandler(createProject)
```
