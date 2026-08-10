# @drift/server

Server-only request primitives for Drift. The browser export fails immediately, helping prevent secrets and privileged code from entering a client bundle.

```ts
import { defineAction, serverEnv } from '@drift/server'

export const createProject = defineAction(async (input, context) => {
  const databaseUrl = serverEnv('DATABASE_URL', { required: true })
  return { requestId: context.requestId, input, configured: Boolean(databaseUrl) }
}, {
  parse(value) {
    if (!value || typeof value !== 'object') throw new Error('Expected an object')
    return value
  },
  authorize(context) {
    return context.locals.userId ? true : false
  },
})
```

Mutation actions default to `POST`, a 1 MB body limit, same-origin checks when an `Origin` header is present, JSON/form/text parsing, no-store error responses, and explicit authorization callbacks.

Vercel Node.js Functions use the same Web Request/Response contract:

```ts
import { createVercelHandler } from '@drift/server/vercel'
import { createProject } from './actions/create-project'

export default createVercelHandler(createProject)
```
