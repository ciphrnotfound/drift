import { describe, expect, test } from 'vitest'
import { buildApplicationGraph } from '../index'

describe('Drift application graph', () => {
  test('builds deterministic route and component nodes from Drift files', () => {
    const graph = buildApplicationGraph({
      root: '/project',
      files: [
        { path: '/project/pages/docs/[slug].drift', source: 'page Docs {}' },
        { path: '/project/pages/index.drift', source: 'page Home {}' },
      ],
    })

    expect(graph.version).toBe('0.1')
    expect(graph.nodes.map(node => node.id)).toContain('route:/docs/:slug')
    expect(graph.nodes.map(node => node.id)).toContain('page:pages/index.drift')
    expect(graph.edges).toContainEqual({ from: 'route:/', to: 'page:pages/index.drift', kind: 'contains' })
    expect(graph.nodes).toEqual([...graph.nodes].sort((a, b) => `${a.kind}|${a.id}`.localeCompare(`${b.kind}|${b.id}`)))
  })

  test('discovers typed application declarations and supported relationships', () => {
    const graph = buildApplicationGraph({
      root: '/project',
      files: [{
        path: '/project/src/billing.ts',
        source: `
          const billingDb = resource.postgres('billing')
          const authenticated = policy(async ctx => ctx.auth.user !== null)
          @service()
          export class BillingService {}
          export const checkout = action({
            policy: authenticated,
            async run({ use }) { return use(BillingService) }
          })
        `,
      }],
    })

    expect(graph.nodes.map(node => node.kind)).toEqual(expect.arrayContaining(['resource', 'policy', 'service', 'action']))
    expect(graph.edges).toContainEqual(expect.objectContaining({ kind: 'protects' }))
    expect(graph.edges).toContainEqual(expect.objectContaining({ kind: 'calls' }))
  })
})
