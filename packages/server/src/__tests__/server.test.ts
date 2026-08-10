import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineAction, json, redirect, serverEnv, withMiddleware } from '../index'

const originalSecret = process.env.DRIFT_TEST_SECRET

afterEach(() => {
  if (originalSecret === undefined) delete process.env.DRIFT_TEST_SECRET
  else process.env.DRIFT_TEST_SECRET = originalSecret
})

describe('secure server actions', () => {
  test('enforces methods and same-origin mutation checks', async () => {
    const action = defineAction(input => input)
    const methodResponse = await action(new Request('https://drift.dev/action', { method: 'GET' }))
    expect(methodResponse.status).toBe(405)
    expect(methodResponse.headers.get('allow')).toBe('POST')

    const originResponse = await action(new Request('https://drift.dev/action', {
      method: 'POST',
      headers: { origin: 'https://attacker.example', 'content-type': 'application/json' },
      body: '{}',
    }))
    expect(originResponse.status).toBe(403)
  })

  test('parses, validates, authorizes, and returns JSON', async () => {
    const action = defineAction(
      (input: { name: string }, context) => ({ greeting: `Hello ${input.name}`, user: context.locals.userId }),
      {
        parse(value) {
          const name = (value as { name?: unknown })?.name
          if (typeof name !== 'string') throw new Error('name must be a string')
          return { name }
        },
        authorize: context => context.locals.userId === 'user_1',
      }
    )
    const response = await action(new Request('https://drift.dev/action', {
      method: 'POST',
      headers: { origin: 'https://drift.dev', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ada' }),
    }), { locals: { userId: 'user_1' } })

    expect(response.status).toBe(200)
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    await expect(response.json()).resolves.toEqual({ greeting: 'Hello Ada', user: 'user_1' })
  })

  test('rejects oversized bodies and unsupported content types', async () => {
    const action = defineAction(input => input, { maxBodyBytes: 4 })
    const large = await action(new Request('https://drift.dev/action', {
      method: 'POST', headers: { 'content-type': 'text/plain' }, body: '12345',
    }))
    expect(large.status).toBe(413)

    const binary = await action(new Request('https://drift.dev/action', {
      method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: '12',
    }))
    expect(binary.status).toBe(415)
  })

  test('sanitizes action failures and exposes a request ID', async () => {
    const onError = vi.fn()
    const action = defineAction(() => { throw new Error('database password leaked') }, { onError })
    const response = await action(new Request('https://drift.dev/action', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    }))
    const body = await response.text()
    expect(response.status).toBe(500)
    expect(response.headers.get('x-drift-request-id')).toBeTruthy()
    expect(body).not.toContain('database password')
    expect(onError).toHaveBeenCalledOnce()
  })

  test('runs middleware once in declared order', async () => {
    const calls: string[] = []
    const handler = withMiddleware(async () => { calls.push('handler'); return json({ ok: true }) }, [
      async (_context, next) => { calls.push('before'); const response = await next(); calls.push('after'); return response },
    ])
    const response = await handler(new Request('https://drift.dev/'))
    expect(response.status).toBe(200)
    expect(calls).toEqual(['before', 'handler', 'after'])
  })
})

describe('server utilities', () => {
  test('reads required secrets only from valid server environment names', () => {
    process.env.DRIFT_TEST_SECRET = 'secret'
    expect(serverEnv('DRIFT_TEST_SECRET', { required: true })).toBe('secret')
    expect(() => serverEnv('bad-name')).toThrow('Invalid environment variable name')
    expect(() => serverEnv('DRIFT_MISSING_SECRET', { required: true })).toThrow('Required server environment variable')
  })

  test('creates validated redirects', () => {
    expect(redirect('/login').status).toBe(303)
    expect(redirect('/login').headers.get('location')).toBe('/login')
    expect(() => redirect('/login', 200)).toThrow('Invalid redirect status')
  })
})
