export * from './types'
export * from './discover'
export * from './validate'

import type { DriftGraph, GraphExplanation } from './types'

export function explainGraph(graph: DriftGraph, query: string): GraphExplanation | null {
  const node = graph.nodes.find(candidate => candidate.id === query) || graph.nodes.find(candidate => candidate.name === query)
  if (!node) return null

  return {
    node,
    incoming: graph.edges.filter(edge => edge.to === node.id),
    outgoing: graph.edges.filter(edge => edge.from === node.id),
  }
}
