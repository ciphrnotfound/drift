import { beforeEach, expect, test, vi } from 'vitest'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { hydrateDriftRouter, readHydrationData } from '../hydration'

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
  hydrateRoot: vi.fn(() => ({ render: vi.fn() })),
}))

function container(text: string | null): Element {
  return { ownerDocument: {
    getElementById: () => text === null ? null : { textContent: text },
  } } as unknown as Element
}

beforeEach(() => vi.clearAllMocks())

test('mounts a static or development app without attempting hydration', () => {
  const element = container(null)
  const root = hydrateDriftRouter(element, [])
  expect(createRoot).toHaveBeenCalledWith(element)
  expect(root.render).toHaveBeenCalledOnce()
  expect(hydrateRoot).not.toHaveBeenCalled()
})

test('hydrates SSR HTML with its route and loader data', () => {
  const element = container(JSON.stringify({ path: '/products?sort=new', data: { products: [1] } }))
  hydrateDriftRouter(element, [])
  expect(createRoot).not.toHaveBeenCalled()
  expect(hydrateRoot).toHaveBeenCalledWith(element, expect.objectContaining({
    props: expect.objectContaining({ initialPath: '/products?sort=new', initialData: { products: [1] } }),
  }))
})

test.each(['null', '{}', '{', '{"path":"/","data":[]}', '{"path":4,"data":{}}'])(
  'rejects an invalid hydration payload: %s', text => {
    const element = container(text)
    expect(readHydrationData(element.ownerDocument)).toBeNull()
    hydrateDriftRouter(element, [])
    expect(createRoot).toHaveBeenCalledOnce()
    expect(hydrateRoot).not.toHaveBeenCalled()
  },
)
