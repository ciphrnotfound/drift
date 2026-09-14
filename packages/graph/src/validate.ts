import type { DriftGraph, GraphDiagnostic, GraphNode } from './types'

/** Validate structural facts that are guaranteed by the graph contract. */
export function validateApplicationGraph(graph: DriftGraph): GraphDiagnostic[] {
  const diagnostics: GraphDiagnostic[] = []
  const nodes = new Map(graph.nodes.map(node => [node.id, node]))
  const incoming = new Map<string, typeof graph.edges>()
  const outgoing = new Map<string, typeof graph.edges>()

  for (const edge of graph.edges) {
    if (!nodes.has(edge.from)) {
      diagnostics.push({ code: 'DRIFTGRAPH001', severity: 'error', message: `Relationship starts at missing node ${edge.from}.` })
    }
    if (!nodes.has(edge.to)) {
      diagnostics.push({ code: 'DRIFTGRAPH002', severity: 'error', message: `Relationship points to missing node ${edge.to}.` })
    }
    const edges = incoming.get(edge.to) || []
    edges.push(edge)
    incoming.set(edge.to, edges)
    const nextEdges = outgoing.get(edge.from) || []
    nextEdges.push(edge)
    outgoing.set(edge.from, nextEdges)
  }

  for (const node of graph.nodes) {
    if (node.kind === 'application' || node.kind === 'module' || node.kind === 'route') continue
    if (!incoming.get(node.id)?.some(edge => edge.kind === 'contains')) {
      diagnostics.push({
        code: 'DRIFTGRAPH003',
        severity: 'error',
        message: `${node.kind} ${node.name} is not contained by a module or route.`,
        ...sourceLocation(node),
      })
    }
  }

  for (const route of graph.nodes.filter(node => node.kind === 'route')) {
    const pages = outgoing.get(route.id)?.filter(edge => edge.kind === 'contains') || []
    if (pages.length === 0) {
      diagnostics.push({
        code: 'DRIFTGRAPH004',
        severity: 'error',
        message: `Route ${route.name} has no page target.`,
        ...sourceLocation(route),
      })
    } else if (pages.length > 1) {
      diagnostics.push({
        code: 'DRIFTGRAPH005',
        severity: 'error',
        message: `Route ${route.name} is claimed by ${pages.length} pages: ${pages.map(page => nodes.get(page.to)?.filePath || page.to).join(', ')}.`,
        ...sourceLocation(route),
      })
    }
  }

  return diagnostics.sort(compareDiagnostics)
}

function sourceLocation(node: GraphNode): Pick<GraphDiagnostic, 'nodeId' | 'filePath' | 'line'> {
  return { nodeId: node.id, filePath: node.filePath, line: node.line }
}

function compareDiagnostics(a: GraphDiagnostic, b: GraphDiagnostic): number {
  return `${a.code}|${a.nodeId || ''}|${a.message}`.localeCompare(`${b.code}|${b.nodeId || ''}|${b.message}`)
}
