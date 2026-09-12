import path from 'node:path'
import { discoverApplicationGraph, type DriftGraph } from '@drift/graph'

export interface GraphOptions {
  json?: boolean
  root?: string
}

export async function graph(options: GraphOptions = {}): Promise<DriftGraph> {
  const root = path.resolve(options.root || process.cwd())
  const result = await discoverApplicationGraph(root)

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printGraph(result)
  }

  return result
}

function printGraph(graph: DriftGraph): void {
  console.log(`Drift application graph v${graph.version}`)
  console.log(`${graph.nodes.length} nodes · ${graph.edges.length} relationships · ${graph.root}`)

  const grouped = new Map<string, typeof graph.nodes>()
  for (const node of graph.nodes) {
    const nodes = grouped.get(node.kind) || []
    nodes.push(node)
    grouped.set(node.kind, nodes)
  }

  for (const [kind, nodes] of grouped) {
    console.log(`\n${kind}`)
    for (const node of nodes) console.log(`  ${node.name}${node.filePath ? `  ${node.filePath}${node.line ? `:${node.line}` : ''}` : ''}`)
  }

  if (graph.edges.length > 0) {
    console.log('\nrelationships')
    for (const edge of graph.edges) console.log(`  ${edge.from} --${edge.kind}--> ${edge.to}`)
  }
}
