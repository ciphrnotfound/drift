import { describe, expect, test } from 'vitest'
import type { RouteConfig } from '@drift/types'
import { matchPath, matchRoute, normalizePathname } from '../Router'

const route = (id: string, path: string): RouteConfig => ({ id, path, component: id })

describe('Drift router matching', () => {
  test('normalizes duplicate and trailing slashes', () => {
    expect(normalizePathname('docs//routing/')).toBe('/docs/routing')
    expect(normalizePathname('/')).toBe('/')
  })

  test('ranks static routes ahead of dynamic and catch-all routes', () => {
    const routes = [
      route('catch', '/docs/[...slug]'),
      route('dynamic', '/docs/[page]'),
      route('static', '/docs/new'),
    ]

    expect(matchRoute('/docs/new', routes)?.route.id).toBe('static')
    expect(matchRoute('/docs/routing', routes)?.route.id).toBe('dynamic')
    expect(matchRoute('/docs/guides/routing', routes)?.route.id).toBe('catch')
  })

  test('decodes dynamic and catch-all parameters', () => {
    expect(matchPath('/users/ada%20lovelace', '/users/[name]')).toEqual({ name: 'ada lovelace' })
    expect(matchPath('/docs/core/routing', '/docs/[...slug]')).toEqual({ slug: 'core/routing' })
  })

  test('supports optional catch-all routes and invisible route groups', () => {
    expect(matchPath('/docs', '/docs/[[...slug]]')).toEqual({ slug: '' })
    expect(matchPath('/docs/core/setup', '/docs/[[...slug]]')).toEqual({ slug: 'core/setup' })
    expect(matchPath('/pricing', '/(marketing)/pricing')).toEqual({})
  })

  test('matches nested route manifests', () => {
    const routes = [{
      ...route('root', '/'),
      children: [{ ...route('account', '/account/[tab]') }],
    }]

    expect(matchRoute('/account/security', routes)?.params).toEqual({ tab: 'security' })
  })
})
