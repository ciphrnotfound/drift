import type { DriftAST, CompilationResult, TokenRegistry } from '@drift/types'
import { parse } from './parser'
import { print } from './printer'
import { resolveTokensInAST } from './token-resolver'
import { generateOutputBundle, createCompilationResult } from './output-bundle'
import { ErrorCollector } from './errors'
import type { TransformOptions } from './jsx-transformer'

export interface CompileOptions {
  filename?: string
  sourceMaps?: boolean
  tokenRegistry?: TokenRegistry
  /** Transform options for JSX generation (import resolution, aliases, etc.) */
  transformOptions?: TransformOptions
  /** Responsive strategy for CSS generation */
  responsiveStrategy?: 'mobile-first' | 'desktop-first'
  /** Breakpoints configuration */
  breakpoints?: Record<string, number>
}

/**
 * Compile a Drift source file through the complete pipeline
 */
export function compile(
  source: string,
  options: CompileOptions = {}
): CompilationResult {
  const startTime = Date.now()
  const errorCollector = new ErrorCollector()
  const filename = options.filename || '<unknown>'

  try {
    // Stage 1: Parse
    const ast = parse(source, filename, errorCollector)

    // Check for parse errors
    if (errorCollector.hasErrors()) {
      return {
        success: false,
        files: [],
        errors: errorCollector.getErrors().map(e => e.toCompilerError()),
        warnings: errorCollector.getWarnings().map(w => w.toCompilerError()),
        stats: {
          duration: Date.now() - startTime,
          filesProcessed: 0,
          linesOfCode: source.split('\n').length,
          cssSize: 0,
          jsSize: 0,
        },
      }
    }

    // Stage 2: Resolve tokens (if token registry provided)
    const resolvedAST = options.tokenRegistry
      ? resolveTokensInAST(ast, options.tokenRegistry, filename, errorCollector)
      : ast

    // Check for token resolution errors
    if (errorCollector.hasErrors()) {
      return {
        success: false,
        files: [],
        errors: errorCollector.getErrors().map(e => e.toCompilerError()),
        warnings: errorCollector.getWarnings().map(w => w.toCompilerError()),
        stats: {
          duration: Date.now() - startTime,
          filesProcessed: 0,
          linesOfCode: source.split('\n').length,
          cssSize: 0,
          jsSize: 0,
        },
      }
    }

    // Stages 3-7: Generate output bundle
    // (Style extraction, Motion codegen, JSX transform, Route building, Output)
    const files = generateOutputBundle(resolvedAST, {
      sourceMaps: options.sourceMaps,
      transformOptions: options.transformOptions,
      responsiveStrategy: options.responsiveStrategy,
      breakpoints: options.breakpoints,
    })

    // Create compilation result
    const result = createCompilationResult(files, {
      duration: Date.now() - startTime,
      filesProcessed: 1,
      linesOfCode: source.split('\n').length,
    })

    // Add any warnings
    return {
      ...result,
      warnings: errorCollector.getWarnings().map(w => w.toCompilerError()),
    }
  } catch (error) {
    // Catch any unhandled errors
    if (errorCollector.hasErrors()) {
      // Use collected errors
      return {
        success: false,
        files: [],
        errors: errorCollector.getErrors().map(e => e.toCompilerError()),
        warnings: errorCollector.getWarnings().map(w => w.toCompilerError()),
        stats: {
          duration: Date.now() - startTime,
          filesProcessed: 0,
          linesOfCode: 0,
          cssSize: 0,
          jsSize: 0,
        },
      }
    }

    // Fallback for unexpected errors
    return {
      success: false,
      files: [],
      errors: [{
        message: error instanceof Error ? error.message : 'Unknown error',
        file: filename,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
          source,
        },
        code: 'DRIFT001',
        suggestions: [],
      }],
      warnings: [],
      stats: {
        duration: Date.now() - startTime,
        filesProcessed: 0,
        linesOfCode: 0,
        cssSize: 0,
        jsSize: 0,
      },
    }
  }
}

export { parse, print, ErrorCollector }
export type { DriftAST }
