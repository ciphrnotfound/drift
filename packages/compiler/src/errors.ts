import type { SourceLocation, Position } from '@drift/types'

/**
 * Error code ranges:
 * DRIFT001-099: Parser errors
 * DRIFT100-199: Token resolution errors
 * DRIFT200-299: Style extraction errors
 * DRIFT300-399: Motion generation errors
 * DRIFT400-499: JSX transformation errors
 * DRIFT500-599: Route building errors
 * DRIFT600-699: Output generation errors
 * DRIFT700-799: Configuration errors
 */

export enum ErrorCode {
  // Parser errors (001-099)
  PARSE_UNEXPECTED_TOKEN = 'DRIFT001',
  PARSE_UNEXPECTED_EOF = 'DRIFT002',
  PARSE_INVALID_SYNTAX = 'DRIFT003',
  PARSE_INVALID_INDENTATION = 'DRIFT004',
  PARSE_MISSING_COMPONENT_NAME = 'DRIFT005',
  PARSE_MISSING_CLOSING_TAG = 'DRIFT006',
  PARSE_MISMATCHED_TAG = 'DRIFT007',

  // Token resolution errors (100-199)
  TOKEN_UNDEFINED = 'DRIFT100',
  TOKEN_CIRCULAR_DEPENDENCY = 'DRIFT101',
  TOKEN_INVALID_REFERENCE = 'DRIFT102',
  TOKEN_INVALID_VALUE = 'DRIFT103',

  // Style extraction errors (200-299)
  STYLE_INVALID_PROPERTY = 'DRIFT200',
  STYLE_INVALID_VALUE = 'DRIFT201',
  STYLE_DUPLICATE_VARIANT = 'DRIFT202',
  STYLE_INVALID_BREAKPOINT = 'DRIFT203',

  // Motion generation errors (300-399)
  MOTION_INVALID_PROPERTY = 'DRIFT300',
  MOTION_INVALID_EASING = 'DRIFT301',
  MOTION_INVALID_DURATION = 'DRIFT302',
  MOTION_UNDEFINED_SEQUENCE = 'DRIFT303',

  // JSX transformation errors (400-499)
  JSX_INVALID_ELEMENT = 'DRIFT400',
  JSX_INVALID_ATTRIBUTE = 'DRIFT401',
  JSX_INVALID_EXPRESSION = 'DRIFT402',

  // Route building errors (500-599)
  ROUTE_INVALID_PATH = 'DRIFT500',
  ROUTE_DUPLICATE_ROUTE = 'DRIFT501',
  ROUTE_INVALID_LAYOUT = 'DRIFT502',

  // Output generation errors (600-699)
  OUTPUT_WRITE_FAILED = 'DRIFT600',
  OUTPUT_INVALID_PATH = 'DRIFT601',

  // Configuration errors (700-799)
  CONFIG_INVALID_VALUE = 'DRIFT700',
  CONFIG_MISSING_REQUIRED = 'DRIFT701',
  CONFIG_INVALID_BREAKPOINT = 'DRIFT702',
}

export interface CodeSnippet {
  code: string
  highlight: {
    start: Position
    end: Position
  }
  context: number
}

/**
 * DriftError class for structured error reporting
 */
export class DriftError extends Error {
  public readonly code: ErrorCode
  public readonly severity: 'error' | 'warning'
  public readonly file: string
  public readonly location: SourceLocation
  public readonly snippet: CodeSnippet
  public readonly suggestions: string[]
  public readonly documentation: string

  constructor(options: {
    code: ErrorCode
    message: string
    file: string
    location: SourceLocation
    severity?: 'error' | 'warning'
    suggestions?: string[]
    documentation?: string
  }) {
    super(options.message)
    this.name = 'DriftError'
    this.code = options.code
    this.severity = options.severity || 'error'
    this.file = options.file
    this.location = options.location
    this.snippet = this.generateSnippet(options.location)
    this.suggestions = options.suggestions || []
    this.documentation = options.documentation || this.getDocumentationUrl(options.code)

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DriftError)
    }
  }

  /**
   * Generate a code snippet with context around the error location
   */
  private generateSnippet(location: SourceLocation): CodeSnippet {
    const lines = location.source.split('\n')
    const startLine = Math.max(0, location.start.line - 3)
    const endLine = Math.min(lines.length, location.end.line + 2)

    const snippetLines = lines.slice(startLine, endLine)
    const code = snippetLines.join('\n')

    return {
      code,
      highlight: {
        start: location.start,
        end: location.end,
      },
      context: 2,
    }
  }

  /**
   * Get documentation URL for error code
   */
  private getDocumentationUrl(code: ErrorCode): string {
    return `https://drift.dev/errors/${code}`
  }

  /**
   * Format error for display in terminal
   */
  public format(): string {
    const lines: string[] = []

    // Error header
    lines.push(`${this.severity === 'error' ? '✖' : '⚠'} ${this.code}: ${this.message}`)
    lines.push(`  at ${this.file}:${this.location.start.line}:${this.location.start.column}`)
    lines.push('')

    // Code snippet with line numbers
    const snippetLines = this.snippet.code.split('\n')
    const startLine = Math.max(0, this.location.start.line - 2)

    snippetLines.forEach((line, index) => {
      const lineNumber = startLine + index + 1
      const isErrorLine =
        lineNumber >= this.location.start.line && lineNumber <= this.location.end.line

      const linePrefix = isErrorLine ? '>' : ' '
      const lineNumberStr = String(lineNumber).padStart(4, ' ')

      lines.push(`${linePrefix} ${lineNumberStr} | ${line}`)

      // Add highlight marker for error line
      if (isErrorLine && lineNumber === this.location.start.line) {
        const padding = ' '.repeat(7 + this.location.start.column)
        const underline = '^'.repeat(
          Math.max(1, this.location.end.column - this.location.start.column)
        )
        lines.push(`${padding}${underline}`)
      }
    })

    lines.push('')

    // Suggestions
    if (this.suggestions.length > 0) {
      lines.push('Suggestions:')
      this.suggestions.forEach((suggestion) => {
        lines.push(`  • ${suggestion}`)
      })
      lines.push('')
    }

    // Documentation link
    lines.push(`Learn more: ${this.documentation}`)

    return lines.join('\n')
  }

  /**
   * Convert to CompilerError format for compatibility
   */
  public toCompilerError(): {
    message: string
    file: string
    location: SourceLocation
    code: string
    suggestions: string[]
    snippet: CodeSnippet
  } {
    return {
      message: this.message,
      file: this.file,
      location: this.location,
      code: this.code,
      suggestions: this.suggestions,
      snippet: this.snippet,
    }
  }
}

/**
 * Error collector for gathering errors during compilation
 */
export class ErrorCollector {
  private errors: DriftError[] = []
  private warnings: DriftError[] = []

  /**
   * Add an error to the collection
   */
  public addError(error: DriftError): void {
    if (error.severity === 'error') {
      this.errors.push(error)
    } else {
      this.warnings.push(error)
    }
  }

  /**
   * Create and add an error
   */
  public error(options: {
    code: ErrorCode
    message: string
    file: string
    location: SourceLocation
    suggestions?: string[]
    documentation?: string
  }): void {
    this.addError(
      new DriftError({
        ...options,
        severity: 'error',
      })
    )
  }

  /**
   * Create and add a warning
   */
  public warning(options: {
    code: ErrorCode
    message: string
    file: string
    location: SourceLocation
    suggestions?: string[]
    documentation?: string
  }): void {
    this.addError(
      new DriftError({
        ...options,
        severity: 'warning',
      })
    )
  }

  /**
   * Check if there are any errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * Check if there are any warnings
   */
  public hasWarnings(): boolean {
    return this.warnings.length > 0
  }

  /**
   * Get all errors
   */
  public getErrors(): DriftError[] {
    return [...this.errors]
  }

  /**
   * Get all warnings
   */
  public getWarnings(): DriftError[] {
    return [...this.warnings]
  }

  /**
   * Get all errors and warnings combined
   */
  public getAll(): DriftError[] {
    return [...this.errors, ...this.warnings]
  }

  /**
   * Clear all errors and warnings
   */
  public clear(): void {
    this.errors = []
    this.warnings = []
  }

  /**
   * Format all errors for display
   */
  public format(): string {
    const all = this.getAll()
    if (all.length === 0) {
      return 'No errors or warnings'
    }

    return all.map((error) => error.format()).join('\n\n')
  }
}
