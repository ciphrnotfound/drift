import path from 'node:path'
import { discoverApplicationGraph, validateApplicationGraph, type GraphDiagnostic } from '@drift/graph'

export interface CheckOptions {
  json?: boolean
  strict?: boolean
  root?: string
}

export interface CheckReport {
  root: string
  valid: boolean
  diagnostics: GraphDiagnostic[]
}

export async function check(options: CheckOptions = {}): Promise<CheckReport> {
  const root = path.resolve(options.root || process.cwd())
  const graph = await discoverApplicationGraph(root)
  const diagnostics = validateApplicationGraph(graph)
  const report = { root, valid: diagnostics.every(diagnostic => diagnostic.severity !== 'error'), diagnostics }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`Drift check: ${root}`)
    if (diagnostics.length === 0) {
      console.log('  ✓ Application graph is structurally valid.')
    } else {
      for (const diagnostic of diagnostics) {
        const location = diagnostic.filePath ? ` (${diagnostic.filePath}${diagnostic.line ? `:${diagnostic.line}` : ''})` : ''
        console.log(`  ${diagnostic.severity === 'error' ? '✗' : '!'} ${diagnostic.code}: ${diagnostic.message}${location}`)
      }
    }
  }

  if (!report.valid || (options.strict && diagnostics.some(diagnostic => diagnostic.severity === 'warning'))) process.exitCode = 1
  return report
}
