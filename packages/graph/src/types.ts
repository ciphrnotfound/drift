export const graphVersion = '0.1' as const

export type GraphNodeKind =
  | 'application'
  | 'module'
  | 'route'
  | 'page'
  | 'layout'
  | 'action'
  | 'loader'
  | 'service'
  | 'provider'
  | 'resource'
  | 'database'
  | 'cache'
  | 'queue'
  | 'job'
  | 'schedule'
  | 'policy'
  | 'middleware'
  | 'stream'
  | 'cell'
  | 'secret'
  | 'native_function'
  | 'client_boundary'
  | 'server_boundary'
  | 'component'

export type GraphEdgeKind =
  | 'depends_on'
  | 'calls'
  | 'reads'
  | 'writes'
  | 'protects'
  | 'contains'
  | 'executes_in'
  | 'publishes_to'
  | 'subscribes_to'
  | 'requires_secret'
  | 'requires_network'
  | 'requires_resource'

export interface GraphNode {
  id: string
  kind: GraphNodeKind
  name: string
  filePath?: string
  line?: number
  metadata?: Record<string, string | number | boolean>
}

export interface GraphEdge {
  from: string
  to: string
  kind: GraphEdgeKind
}

export interface DriftGraph {
  version: typeof graphVersion
  root: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphSourceFile {
  path: string
  source: string
}

export interface GraphInput {
  root: string
  files: GraphSourceFile[]
}
