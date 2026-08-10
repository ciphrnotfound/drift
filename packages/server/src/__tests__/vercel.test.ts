import { describe, expect, test, vi } from 'vitest'
import { createVercelHandler } from '../vercel'

describe('Vercel server adapter', () => {
  test('preserves the Web Request and Response contract', async () => {
    const handler = vi.fn(async (request: Request) => Response.json({ path: new URL(request.url).pathname }))
    const vercel = createVercelHandler(handler)
    const request = new Request('https://drift.dev/api/profile')
    const response = await vercel.fetch(request)

    expect(handler).toHaveBeenCalledWith(request)
    await expect(response.json()).resolves.toEqual({ path: '/api/profile' })
  })
})
