import path from 'node:path'
import { discoverApplicationGraph, explainGraph, type GraphExplanation } from '@drift/graph'

export interface ExplainOptions {
  json?: boolean
  root?: string
}

export async function explain(query: string, options: ExplainOptions = {}): Promise<GraphExplanation | null> {
  const root = path.resolve(options.root || process.cwd())
  const result = explainGraph(await discoverApplicationGraph(root), query)

  if (!result) {
    const message = `No Drift graph node matched ${query}. Try a node id or exact node name.`
    if (options.json) console.log(JSON.stringify({ error: message, query }, null, 2))
    else console.error(message)
    process.exitCode = 1
    return null
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`Drift graph node: ${result.node.id}`)
    console.log(`  ${result.node.kind} ${result.node.name}`)
    if (result.node.filePath) console.log(`  source ${result.node.filePath}${result.node.line ? `:${result.node.line}` : ''}`)
    printRelationships('incoming', result.incoming)
    printRelationships('outgoing', result.outgoing)
  }

  return result
}

function printRelationships(label: string, relationships: GraphExplanation['incoming']): void {
  console.log(`\n${label}`)
  if (relationships.length === 0) {
    console.log('  none')
    return
  }
  for (const relationship of relationships) console.log(`  ${relationship.from} --${relationship.kind}--> ${relationship.to}`)
}
