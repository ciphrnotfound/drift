import { promises as fs } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
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
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const declarations: TypeScriptDeclaration[] = []

  for (const statement of sourceFile.statements) {
    if (ts.isClassDeclaration(statement) && statement.name && hasModifier(statement, ts.SyntaxKind.ExportKeyword) && isServiceClass(statement)) {
      declarations.push({ kind: 'service', name: statement.name.text, index: statement.getStart(sourceFile), node: statement })
      continue
    }

    if (!ts.isVariableStatement(statement)) continue
    for (const variable of statement.declarationList.declarations) {
      if (!ts.isIdentifier(variable.name) || !variable.initializer) continue
      const declaration = getCallDeclaration(variable.name.text, variable.initializer, variable.getStart(sourceFile))
      if (declaration) declarations.push({ ...declaration, node: variable })
    }
  }

  for (const declaration of declarations.sort((a, b) => a.index - b.index)) {
    const nodeId = `${declaration.kind}:${relativePath}:${declaration.name}`
    addNode(nodes, {
      id: nodeId,
      kind: declaration.kind,
      name: declaration.name,
      filePath: relativePath,
      line: lineNumber(source, declaration.index),
      metadata: declaration.metadata,
    })
    addEdge(edges, { from: moduleId, to: nodeId, kind: 'contains' })

    inspectRelationships(declaration, sourceFile, relativePath, declarations, nodes, edges)
  }
}

interface TypeScriptDeclaration {
  kind: GraphNodeKind
  name: string
  index: number
  node: ts.Node
  metadata?: Record<string, string | number | boolean>
  resourceMethod?: string
}

function getCallDeclaration(name: string, initializer: ts.Expression, index: number): Omit<TypeScriptDeclaration, 'node'> | null {
  if (!ts.isCallExpression(initializer)) return null

  if (ts.isIdentifier(initializer.expression)) {
    const kind = initializer.expression.text
    if (kind === 'action' || kind === 'loader' || kind === 'policy' || kind === 'route') {
      return { kind, name, index }
    }
  }

  if (ts.isPropertyAccessExpression(initializer.expression) && ts.isIdentifier(initializer.expression.expression) && initializer.expression.expression.text === 'resource') {
    const method = initializer.expression.name.text
    return { kind: 'resource', name: `${name} (${method})`, index, resourceMethod: method, metadata: { provider: method } }
  }

  return null
}

function inspectRelationships(declaration: TypeScriptDeclaration, sourceFile: ts.SourceFile, relativePath: string, declarations: TypeScriptDeclaration[], nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): void {
  if (!ts.isVariableDeclaration(declaration.node)) return
  const initializer = declaration.node.initializer
  if (!initializer) return

  const visit = (node: ts.Node): void => {
    if (declaration.kind === 'action' && ts.isPropertyAssignment(node) && node.name.getText(sourceFile) === 'policy' && ts.isIdentifier(node.initializer)) {
      connectByName(declaration, node.initializer.text, 'protects', relativePath, declarations, nodes, edges)
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const firstArgument = node.arguments[0]
      if (node.expression.text === 'use' && firstArgument && ts.isIdentifier(firstArgument)) {
        connectByName(declaration, firstArgument.text, 'calls', relativePath, declarations, nodes, edges)
      }
    }

    if (declaration.kind !== 'resource' && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'resource') {
      connectByName(declaration, node.expression.name.text, 'requires_resource', relativePath, declarations, nodes, edges)
    }

    ts.forEachChild(node, visit)
  }

  visit(initializer)
}

function connectByName(source: { kind: GraphNodeKind; name: string }, targetName: string, kind: GraphEdge['kind'], relativePath: string, declarations: TypeScriptDeclaration[], nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): void {
  const target = declarations.find(candidate => candidate.name === targetName || candidate.name.startsWith(`${targetName} (`))
  if (!target) return
  const from = `${source.kind}:${relativePath}:${source.name}`
  const to = `${target.kind}:${relativePath}:${target.name}`
  if (nodes.has(from) && nodes.has(to)) addEdge(edges, { from, to, kind })
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return ts.canHaveModifiers(node) && (ts.getModifiers(node)?.some(modifier => modifier.kind === kind) ?? false)
}

function isServiceClass(node: ts.ClassDeclaration): boolean {
  if (node.name?.text.endsWith('Service')) return true
  return ts.getDecorators(node)?.some(decorator => {
    const expression = decorator.expression
    return ts.isCallExpression(expression) && ts.isIdentifier(expression.expression) && expression.expression.text === 'service'
  }) ?? false
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
