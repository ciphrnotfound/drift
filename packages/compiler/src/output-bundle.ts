
import type { DriftAST, CompiledFile, CompilationResult } from '@drift/types'
import { generateCSS } from '@drift/style'
import { extractStyles } from '@drift/style'
import { transformToJSX, type TransformOptions } from './jsx-transformer'

export interface BundleOptions {
  sourceMaps?: boolean
  transformOptions?: TransformOptions
  responsiveStrategy?: 'mobile-first' | 'desktop-first'
  breakpoints?: Record<string, number>
}

/**
 * Generate output bundle from compiled AST
 */
export function generateOutputBundle(
  ast: DriftAST,
  options: BundleOptions = {}
): CompiledFile[] {
  const files: CompiledFile[] = []
  const responsiveStrategy = options.responsiveStrategy || 'mobile-first'

  // Generate component files
  const jsxComponents = transformToJSX(ast, options.transformOptions)
  
  ast.components.forEach((component) => {
    // Generate TypeScript component file
    const jsxCode = jsxComponents.get(component.name)
    if (jsxCode) {
      files.push({
        path: `${component.name}.tsx`,
        content: jsxCode,
        type: 'component',
      })
    }

    // Generate CSS file with responsive strategy
    const styleResult = extractStyles(
      component.name,
      component.styles,
      undefined,
      options.breakpoints
    )
    const css = generateCSS(styleResult, responsiveStrategy)
    if (css) {
      files.push({
        path: `${component.name}.css`,
        content: css,
        type: 'css',
      })
    }

    // Generate TypeScript types
    const types = generateComponentTypes(component.name, component.props)
    if (types) {
      files.push({
        path: `${component.name}.d.ts`,
        content: types,
        type: 'types',
      })
    }

    if (component.metadata) {
      files.push({
        path: `${component.name}.metadata.json`,
        content: JSON.stringify(component.metadata, null, 2),
        type: 'metadata',
      })
    }
  })

  return files
}

/**
 * Generate TypeScript type definitions for a component
 */
function generateComponentTypes(
  componentName: string,
  props: any[]
): string {
  const lines: string[] = []

  lines.push(`import React from 'react'`)
  lines.push('')

  if (props.length > 0) {
    lines.push(`export interface ${componentName}Props {`)
    props.forEach((prop) => {
      const optional = prop.optional ? '?' : ''
      lines.push(`  ${prop.name}${optional}: ${prop.propType.value}`)
    })
    lines.push(`}`)
    lines.push('')
  }

  const propsType = props.length > 0 ? `${componentName}Props` : '{}'
  lines.push(
    `export declare function ${componentName}(props: ${propsType}): React.ReactElement`
  )

  return lines.join('\n')
}

/**
 * Create a compilation result with all output files
 */
export function createCompilationResult(
  files: CompiledFile[],
  stats: {
    duration: number
    filesProcessed: number
    linesOfCode: number
  }
): CompilationResult {
  return {
    success: true,
    files,
    errors: [],
    warnings: [],
    stats: {
      ...stats,
      cssSize: files
        .filter((f) => f.type === 'css')
        .reduce((sum, f) => sum + f.content.length, 0),
      jsSize: files
        .filter((f) => f.type === 'component')
        .reduce((sum, f) => sum + f.content.length, 0),
    },
  }
}
