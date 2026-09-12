import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { DriftGraph, GraphEdge, GraphInput, GraphNode, GraphNodeKind } from './types'
import { graphVersion } from './types'

const ignoredDirectories = new Set(['node_modules', 'dist', 'out', 'compiled', '.git', '.drift'])

export async function discoverApplicationGraph(root: string): Promise<DriftGraph> {
  const files = await collectSourceFiles(root)
  return buildApplicationGraph({ root, files })
}

export function buildApplicationGraph(input: GraphInput): DriftGraph {
  const nodes = new Map<string, GraphNode>()
  const edges = new Map<string, GraphEdge>()
  const root = normalizePath(input.root)
  const applicationId = 'application:root'

  nodes.set(applicationId, { id: applicationId, kind: 'application', name: path.basename(root) || 'application' })

  for (const file of [...input.files].sort((a, b) => a.path.localeCompare(b.path))) {
    const relativePath = normalizePath(path.relative(root, file.path))
    const moduleId = `module:${relativePath}`
    addNode(nodes, { id: moduleId, kind: 'module', name: relativePath, filePath: relativePath })
    addEdge(edges, { from: applicationId, to: moduleId, kind: 'contains' })

    if (file.path.endsWith('.drift')) discoverDriftFile(file.source, relativePath, moduleId, nodes, edges)
    if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) discoverTypeScriptFile(file.source, relativePath, moduleId, nodes, edges)
  }

  return {
    version: graphVersion,
    root,
    nodes: [...nodes.values()].sort(compareNodes),
    edges: [...edges.values()].sort(compareEdges),
  }
}

async function collectSourceFiles(root: string): Promise<GraphInput['files']> {
  const files: GraphInput['files'] = []

  async function visit(directory: string): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) await visit(path.join(directory, entry.name))
        continue
      }
      if (!entry.isFile() || !/\.(drift|ts|tsx)$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue
      const absolutePath = path.join(directory, entry.name)
      files.push({ path: absolutePath, source: await fs.readFile(absolutePath, 'utf8') })
    }
  }

  await visit(root)
  return files
}

function discoverDriftFile(source: string, relativePath: string, moduleId: string, nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): void {
  const declaration = source.match(/^\s*(page|component|layout)\s+([A-Za-z_$][\w$]*)/m)
  const inferredKind = declaration?.[1] || (relativePath.startsWith('pages/') ? 'page' : 'component')
  const name = declaration?.[2] || path.basename(relativePath, '.drift')
  const kind: GraphNodeKind = inferredKind === 'page' || relativePath.startsWith('pages/') ? 'page' : inferredKind === 'layout' ? 'layout' : 'component'
  const nodeId = `${kind}:${relativePath}`

  addNode(nodes, { id: nodeId, kind, name, filePath: relativePath, line: declaration ? lineNumber(source, declaration.index || 0) : undefined })
  addEdge(edges, { from: moduleId, to: nodeId, kind: 'contains' })

  if (kind === 'page') {
    const routeId = `route:${routePath(relativePath)}`
    addNode(nodes, { id: routeId, kind: 'route', name: routePath(relativePath), filePath: relativePath })
    addEdge(edges, { from: routeId, to: nodeId, kind: 'contains' })
  }
}

function discoverTypeScriptFile(source: string, relativePath: string, moduleId: string, nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): void {
  const declarations: Array<{ kind: GraphNodeKind; name: string; index: number }> = []
  const patterns: Array<[GraphNodeKind, RegExp]> = [
    ['service', /(?:@service\(\)\s*)?export\s+class\s+([A-Za-z_$][\w$]*)/g],
    ['action', /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*action\s*\(/g],
    ['loader', /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*loader\s*\(/g],
    ['policy', /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*policy\s*\(/g],
    ['resource', /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*resource\.([A-Za-z_$][\w$]*)\s*\(/g],
    ['route', /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*route\s*\(/g],
  ]

  for (const [kind, pattern] of patterns) {
    for (const match of source.matchAll(pattern)) {
      const name = kind === 'resource' ? `${match[1]} (${match[2]})` : match[1]!
      declarations.push({ kind, name, index: match.index || 0 })
    }
  }

  for (const declaration of declarations.sort((a, b) => a.index - b.index)) {
    const nodeId = `${declaration.kind}:${relativePath}:${declaration.name}`
    addNode(nodes, { id: nodeId, kind: declaration.kind, name: declaration.name, filePath: relativePath, line: lineNumber(source, declaration.index) })
    addEdge(edges, { from: moduleId, to: nodeId, kind: 'contains' })

    const body = declarationBody(source, declaration.index)
    const policy = body.match(/\bpolicy\s*:\s*([A-Za-z_$][\w$]*)/)
    if (declaration.kind === 'action' && policy) connectByName(declaration, policy[1]!, 'protects', relativePath, declarations, nodes, edges)

    for (const use of body.matchAll(/\buse\s*\(\s*([A-Za-z_$][\w$]*)/g)) {
      connectByName(declaration, use[1]!, 'calls', relativePath, declarations, nodes, edges)
    }
    for (const resource of body.matchAll(/\bresource\.(postgres|redis|queue|storage)\s*\(/g)) {
      connectByName(declaration, resource[1]!, 'requires_resource', relativePath, declarations, nodes, edges)
    }
  }
}

function connectByName(source: { kind: GraphNodeKind; name: string }, targetName: string, kind: GraphEdge['kind'], relativePath: string, declarations: Array<{ kind: GraphNodeKind; name: string; index: number }>, nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): void {
  const target = declarations.find(candidate => candidate.name === targetName || candidate.name.startsWith(`${targetName} (`))
  if (!target) return
  const from = `${source.kind}:${relativePath}:${source.name}`
  const to = `${target.kind}:${relativePath}:${target.name}`
  if (nodes.has(from) && nodes.has(to)) addEdge(edges, { from, to, kind })
}

function declarationBody(source: string, start: number): string {
  const next = source.indexOf('\nexport ', start + 1)
  return source.slice(start, next === -1 ? source.length : next)
}

function routePath(relativePath: string): string {
  const withoutRoot = relativePath.replace(/^pages[\\/]/, '').replace(/\.drift$/, '')
  const segments = withoutRoot.split(/[\\/]/).filter(Boolean)
  if (segments.length === 0 || segments[0] === 'index') return '/'
  return '/' + segments.map(segment => segment === 'index' ? '' : segment.replace(/^\[\.\.\.(.+)\]$/, '*').replace(/^\[(.+)\]$/, ':$1')).filter(Boolean).join('/')
}

function lineNumber(source: string, offset: number): number { return source.slice(0, offset).split('\n').length }
function normalizePath(value: string): string { return value.replace(/\\/g, '/') }
function addNode(nodes: Map<string, GraphNode>, node: GraphNode): void { if (!nodes.has(node.id)) nodes.set(node.id, node) }
function addEdge(edges: Map<string, GraphEdge>, edge: GraphEdge): void { edges.set(`${edge.from}|${edge.kind}|${edge.to}`, edge) }
function compareNodes(a: GraphNode, b: GraphNode): number { return `${a.kind}|${a.id}`.localeCompare(`${b.kind}|${b.id}`) }
function compareEdges(a: GraphEdge, b: GraphEdge): number { return `${a.from}|${a.kind}|${a.to}`.localeCompare(`${b.from}|${b.kind}|${b.to}`) }
