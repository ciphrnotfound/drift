export interface ServerContext<Locals extends Record<string, unknown> = Record<string, unknown>> {
  request: Request
  url: URL
  params: Readonly<Record<string, string>>
  locals: Readonly<Locals>
  signal: AbortSignal
  requestId: string
}

export interface CreateContextOptions<Locals extends Record<string, unknown>> {
  params?: Record<string, string>
  locals?: Locals
  requestId?: string
}

export type ActionParser<Input> = (value: unknown) => Input | Promise<Input>
export type ActionAuthorization<Locals extends Record<string, unknown>> = (
  context: ServerContext<Locals>
) => boolean | Response | Promise<boolean | Response>

export interface ActionOptions<Input, Locals extends Record<string, unknown>> {
  methods?: string[]
  maxBodyBytes?: number
  origins?: string[]
  csrf?: 'same-origin' | 'off'
  parse?: ActionParser<Input>
  authorize?: ActionAuthorization<Locals>
  onError?: (error: unknown, context: ServerContext<Locals>) => void | Promise<void>
}

export type ServerAction<Input, Output, Locals extends Record<string, unknown>> = (
  input: Input,
  context: ServerContext<Locals>
) => Output | Response | Promise<Output | Response>

export type RequestHandler<Locals extends Record<string, unknown> = Record<string, unknown>> = (
  request: Request,
  options?: CreateContextOptions<Locals>
) => Promise<Response>

export type Middleware<Locals extends Record<string, unknown> = Record<string, unknown>> = (
  context: ServerContext<Locals>,
  next: () => Promise<Response>
) => Response | Promise<Response>

export interface DeploymentAdapter {
  name: string
  serve(handler: RequestHandler): void | Promise<void>
}

const DEFAULT_BODY_LIMIT = 1024 * 1024

export function serverEnv(name: string, options: { required?: boolean } = {}): string | undefined {
  assertServerOnly()
  if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) throw new Error(`Invalid environment variable name: ${name}`)
  const value = process.env[name]
  if (options.required && !value) throw new Error(`Required server environment variable is missing: ${name}`)
  return value
}

export function createServerContext<Locals extends Record<string, unknown> = Record<string, unknown>>(
  request: Request,
  options: CreateContextOptions<Locals> = {}
): ServerContext<Locals> {
  assertServerOnly()
  return Object.freeze({
    request,
    url: new URL(request.url),
    params: Object.freeze({ ...(options.params || {}) }),
    locals: Object.freeze({ ...(options.locals || {}) }) as Readonly<Locals>,
    signal: request.signal,
    requestId: options.requestId || createRequestId(),
  })
}

export function defineAction<
  Input = unknown,
  Output = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
>(
  action: ServerAction<Input, Output, Locals>,
  options: ActionOptions<Input, Locals> = {}
): RequestHandler<Locals> {
  const methods = (options.methods || ['POST']).map(method => method.toUpperCase())
  const maxBodyBytes = options.maxBodyBytes || DEFAULT_BODY_LIMIT

  return async (request, contextOptions = {}) => {
    assertServerOnly()
    const context = createServerContext(request, contextOptions)

    if (!methods.includes(request.method.toUpperCase())) {
      return problem(405, 'Method Not Allowed', `Expected ${methods.join(', ')}`, { Allow: methods.join(', ') })
    }

    const originFailure = validateOrigin(context.url, request.headers.get('origin'), options)
    if (originFailure) return originFailure

    if (options.authorize) {
      const authorization = await options.authorize(context)
      if (authorization instanceof Response) return authorization
      if (!authorization) return problem(403, 'Forbidden', 'The current principal cannot perform this action.')
    }

    let input: Input
    try {
      const rawInput = await readBody(request, maxBodyBytes)
      input = options.parse ? await options.parse(rawInput) : rawInput as Input
    } catch (error) {
      if (error instanceof ServerRequestError) return problem(error.status, error.title, error.message)
      return problem(400, 'Invalid Request', error instanceof Error ? error.message : 'Input validation failed.')
    }

    try {
      const output = await action(input, context)
      return output instanceof Response ? output : json(output)
    } catch (error) {
      await options.onError?.(error, context)
      const response = problem(500, 'Internal Server Error', 'The action failed. Use the request ID to inspect server logs.')
      response.headers.set('x-drift-request-id', context.requestId)
      return response
    }
  }
}

export function withMiddleware<Locals extends Record<string, unknown>>(
  handler: (context: ServerContext<Locals>) => Promise<Response>,
  middleware: Middleware<Locals>[]
): RequestHandler<Locals> {
  return async (request, options = {}) => {
    const context = createServerContext(request, options)
    let index = -1
    const dispatch = async (nextIndex: number): Promise<Response> => {
      if (nextIndex <= index) throw new Error('Middleware next() called more than once')
      index = nextIndex
      const current = middleware[nextIndex]
      return current ? current(context, () => dispatch(nextIndex + 1)) : handler(context)
    }
    return dispatch(0)
  }
}

export function defineAdapter(adapter: DeploymentAdapter): DeploymentAdapter {
  assertServerOnly()
  if (!adapter.name.trim()) throw new Error('Deployment adapter requires a name')
  return Object.freeze(adapter)
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  if (!headers.has('content-type')) headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('x-content-type-options', 'nosniff')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export function redirect(location: string, status = 303): Response {
  if (![301, 302, 303, 307, 308].includes(status)) throw new Error(`Invalid redirect status: ${status}`)
  return new Response(null, { status, headers: { Location: location } })
}

function validateOrigin<Input, Locals extends Record<string, unknown>>(
  url: URL,
  origin: string | null,
  options: ActionOptions<Input, Locals>
): Response | null {
  if (options.csrf === 'off' || !origin) return null
  const allowed = new Set([url.origin, ...(options.origins || [])])
  return allowed.has(origin) ? null : problem(403, 'Forbidden', 'Cross-origin mutation rejected.')
}

async function readBody(request: Request, maxBodyBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > maxBodyBytes) throw new ServerRequestError(413, 'Payload Too Large', 'Request body exceeds the configured limit.')

  const bytes = new Uint8Array(await request.arrayBuffer())
  if (bytes.byteLength > maxBodyBytes) throw new ServerRequestError(413, 'Payload Too Large', 'Request body exceeds the configured limit.')
  if (bytes.byteLength === 0) return undefined

  const text = new TextDecoder().decode(bytes)
  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType === 'application/json') {
    try { return JSON.parse(text) } catch { throw new ServerRequestError(400, 'Invalid JSON', 'Request body is not valid JSON.') }
  }
  if (contentType === 'application/x-www-form-urlencoded') {
    return Object.fromEntries(new URLSearchParams(text))
  }
  if (contentType === 'text/plain') return text
  throw new ServerRequestError(415, 'Unsupported Media Type', 'Use application/json, form URL encoding, or text/plain.')
}

function problem(status: number, title: string, detail: string, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('cache-control', 'no-store')
  return json({ type: 'about:blank', title, status, detail }, { status, headers: responseHeaders })
}

function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error('@drift/server cannot execute in a browser context.')
  }
}

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

class ServerRequestError extends Error {
  constructor(readonly status: number, readonly title: string, message: string) {
    super(message)
  }
}
