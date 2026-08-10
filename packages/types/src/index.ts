// Common types shared across all Drift packages

export interface SourceLocation {
  start: Position
  end: Position
  source: string
}

export interface Position {
  line: number
  column: number
  offset: number
}

export interface ASTNode {
  type: string
  location: SourceLocation
}

// Re-export all type modules
export * from './ast'
export * from './tokens'
export * from './styles'
export * from './motion'
export * from './routes'
export * from './config'
export * from './errors'
