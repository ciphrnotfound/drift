// Error Handling Types

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

export interface DriftError {
  code: string
  severity: 'error' | 'warning'
  message: string
  file: string
  location: SourceLocation
  snippet: CodeSnippet
  suggestions: string[]
  documentation: string
}

export interface CodeSnippet {
  code: string
  highlight: {
    start: Position
    end: Position
  }
  context: number
}

export interface CompilationResult {
  success: boolean
  files: CompiledFile[]
  errors: CompilerError[]
  warnings: CompilerWarning[]
  stats: CompilationStats
}

export interface CompiledFile {
  path: string
  content: string
  type: 'component' | 'css' | 'types' | 'route' | 'metadata'
  sourceMap?: any
}

export interface CompilerError {
  message: string
  file: string
  location: SourceLocation
  code: string
  suggestions: string[]
  snippet?: CodeSnippet
}

export interface CompilerWarning {
  message: string
  file: string
  location: SourceLocation
}

export interface CompilationStats {
  duration: number
  filesProcessed: number
  linesOfCode: number
  cssSize: number
  jsSize: number
}
