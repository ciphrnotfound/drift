import type {
  DriftAST,
  ComponentDeclaration,
  MotionBlock,
  AnimationDeclaration,
  JSXElement,
  JSXAttribute,
  JSXText,
  JSXExpression,
  ImportDeclaration,
} from '@drift/types'
import * as path from 'path'

/**
 * Transform Drift render blocks to JSX code
 */
export function transformToJSX(ast: DriftAST, options: TransformOptions = {}): Map<string, string> {
  const components = new Map<string, string>()

  ast.components.forEach((component) => {
    const jsxCode = generateComponentJSX(component, ast.imports, options)
    components.set(component.name, jsxCode)
  })

  return components
}

export interface TransformOptions {
  /** Current file path for resolving relative imports */
  currentFilePath?: string
  /** Base path for resolving absolute imports (e.g., @/components) */
  basePath?: string
  /** Alias mappings (e.g., { '@': './src' }) */
  aliases?: Record<string, string>
}

/**
 * Generate JSX code for a component
 */
function generateComponentJSX(
  component: ComponentDeclaration,
  imports: ImportDeclaration[],
  options: TransformOptions
): string {
  const lines: string[] = []
  const hasMotion = component.motion !== null && component.motion !== undefined
  const mayHaveChildren = componentMayHaveChildren(component)

  // Imports
  lines.push(`import React from 'react'`)
  if (hasMotion) {
    lines.push(`import { motion } from 'framer-motion'`)
  }
  if (component.metadata) {
    lines.push(`import { Metadata } from '@drift/router/client'`)
  }
  const componentImports = resolveComponentImports(imports, options)
  componentImports.forEach((importLine) => lines.push(importLine))
  lines.push('')

  // Props interface — always includes className and tw for Tailwind integration
  const explicitProps = component.props
  const hasChildrenProp = explicitProps.some(p => p.name === 'children')

  lines.push(`interface ${component.name}Props {`)
  explicitProps.forEach((prop) => {
    const optional = prop.optional || prop.defaultValue ? '?' : ''
    lines.push(`  ${prop.name}${optional}: ${prop.propType.value}`)
  })
  if (!hasChildrenProp && mayHaveChildren) {
    lines.push(`  children?: React.ReactNode`)
  }
  lines.push(`  className?: string`)
  lines.push(`  tw?: string`)
  lines.push(`  style?: React.CSSProperties`)
  lines.push(`  [key: string]: unknown`)
  lines.push(`}`)
  lines.push('')

  // Destructure all known props, rest goes to the root element
  const knownProps = explicitProps.map(p =>
    p.defaultValue ? `${p.name} = ${p.defaultValue.raw}` : p.name
  )
  if (!hasChildrenProp && mayHaveChildren) knownProps.push('children')
  knownProps.push('className', 'tw', 'style')
  const destructured = knownProps.join(', ')

  lines.push(`export function ${component.name}({ ${destructured}, ...rest }: ${component.name}Props) {`)

  // className merging: Drift scoped class + tw utility classes + passed className
  const scopedClass = `drift-${component.name.toLowerCase()}`
  lines.push(`  const _cn = [`)
  lines.push(`    '${scopedClass}',`)
  lines.push(`    tw,`)
  lines.push(`    className,`)
  lines.push(`  ].filter(Boolean).join(' ')`)
  lines.push('')

  if (component.metadata) {
    const metadataStr = JSON.stringify(component.metadata)
    lines.push(`  const _meta = ${metadataStr}`)
  }

  // Motion props — emitted as a proper JS object so it can be spread onto the element
  let motionPropsVar: string | null = null
  if (hasMotion && component.motion) {
    motionPropsVar = '_motionProps'
    const mp = generateMotionProps(component.motion)
    lines.push(`  const _motionProps = ${mp}`)
  }
  lines.push('')

  lines.push(`  return (`)

  const wrapInFragment = Boolean(component.metadata) || component.render.elements.length !== 1
  if (wrapInFragment) {
    lines.push(`    <>`)
  }

  if (component.metadata) {
    lines.push(`      <Metadata metadata={_meta} />`)
  }

  component.render.elements.forEach((element, i) => {
    const isRoot = i === 0
    const indent = wrapInFragment ? 3 : 2
    const jsx = generateJSXElement(element, indent, isRoot ? {
      injectClassName: true,
      motionPropsVar: hasMotion ? motionPropsVar! : undefined,
    } : {})
    lines.push(jsx)
  })

  if (wrapInFragment) {
    lines.push(`    </>`)
  }
  lines.push(`  )`)
  lines.push(`}`)

  return lines.join('\n')
}

/**
 * Resolve component imports from Drift files to TypeScript imports
 */
function resolveComponentImports(
  imports: ImportDeclaration[],
  options: TransformOptions
): string[] {
  const importLines: string[] = []

  imports.forEach((importDecl) => {
    const resolvedPath = resolveImportPath(importDecl.source, options)
    
    // Generate import statement
    const specifiers = importDecl.specifiers
      .map((spec) => {
        if (spec.imported === spec.local) {
          return spec.imported
        }
        return `${spec.imported} as ${spec.local}`
      })
      .join(', ')
    
    importLines.push(`import { ${specifiers} } from '${resolvedPath}'`)
  })

  return importLines
}

/**
 * Resolve import path from Drift file to TypeScript file
 * Handles:
 * - Relative imports: ./Button.drift -> ./Button
 * - Absolute imports: @/components/Button.drift -> @/components/Button
 */
function resolveImportPath(
  source: string,
  options: TransformOptions
): string {
  // Remove .drift extension
  let resolvedPath = source.replace(/\.drift$/, '')
  
  // Handle alias imports (e.g., @/components/Button)
  if (options.aliases) {
    for (const [alias, aliasPath] of Object.entries(options.aliases)) {
      if (resolvedPath.startsWith(alias + '/')) {
        resolvedPath = resolvedPath.replace(alias, aliasPath)
        break
      }
    }
  }
  
  // Handle relative imports
  if (resolvedPath.startsWith('./') || resolvedPath.startsWith('../')) {
    // Keep relative path as-is (just removed .drift extension)
    return resolvedPath
  }
  
  // Handle absolute imports with basePath
  if (options.basePath && !resolvedPath.startsWith('.')) {
    // Convert to relative path from current file
    if (options.currentFilePath) {
      const currentDir = path.dirname(options.currentFilePath)
      const absolutePath = path.resolve(options.basePath, resolvedPath)
      resolvedPath = path.relative(currentDir, absolutePath)
      
      // Ensure relative path starts with ./
      if (!resolvedPath.startsWith('.')) {
        resolvedPath = './' + resolvedPath
      }
    }
  }
  
  return resolvedPath
}

/**
 * Convert a MotionBlock to a Framer Motion props object literal.
 * Semantics:
 *   enter { opacity: 0, scale: 0.95 } → initial (from state) + animate (to natural)
 *   exit { ... }                       → exit state
 *   hover/press/focus/drag             → whileHover/whileTap/whileFocus/drag
 */
function generateMotionProps(motion: MotionBlock): string {
  const entries: string[] = []

  if (motion.enter) {
    entries.push(`  initial: ${animToObj(motion.enter)}`)

    const animateEntries = motion.enter.properties.map(p =>
      `${p.name}: ${naturalValue(p.name)}`
    )
    entries.push(`  animate: { ${animateEntries.join(', ')} }`)

    const trans: string[] = []
    if (motion.enter.duration !== undefined) trans.push(`duration: ${motion.enter.duration}`)
    if (motion.enter.easing !== undefined) trans.push(`ease: "${motion.enter.easing}"`)
    if (motion.enter.delay !== undefined) trans.push(`delay: ${motion.enter.delay}`)
    if (trans.length > 0) entries.push(`  transition: { ${trans.join(', ')} }`)
  }

  if (motion.exit) {
    entries.push(`  exit: ${animToObj(motion.exit)}`)
  }

  const hasHover = motion.gestures.find(g => g.gesture === 'hover')
  const hasPress = motion.gestures.find(g => g.gesture === 'press')
  const hasFocus = motion.gestures.find(g => g.gesture === 'focus')
  const hasDrag = motion.gestures.find(g => g.gesture === 'drag')

  if (hasHover) entries.push(`  whileHover: ${animToObj(hasHover.animation)}`)
  if (hasPress) entries.push(`  whileTap: ${animToObj(hasPress.animation)}`)
  if (hasFocus) entries.push(`  whileFocus: ${animToObj(hasFocus.animation)}`)
  if (hasDrag) entries.push(`  drag: true`)

  return `{\n${entries.join(',\n')}\n  }`
}

/** Return sensible "natural" value for a CSS/motion property */
function naturalValue(prop: string): string | number {
  switch (prop) {
    case 'opacity': return 1
    case 'scale': return 1
    case 'scaleX': return 1
    case 'scaleY': return 1
    case 'rotate': return 0
    case 'x': return 0
    case 'y': return 0
    case 'skewX': return 0
    case 'skewY': return 0
    default: return 1
  }
}

function animToObj(anim: AnimationDeclaration): string {
  const entries = anim.properties.map(p => {
    const val = p.from !== undefined ? p.from : p.to
    return `${p.name}: ${JSON.stringify(val)}`
  })
  return `{ ${entries.join(', ')} }`
}

interface ElementOptions {
  injectClassName?: boolean
  motionPropsVar?: string
}

/**
 * Generate JSX code for an element
 */
function generateJSXElement(
  element: JSXElement | JSXText | JSXExpression,
  indent: number,
  opts: ElementOptions = {}
): string {
  const indentStr = '  '.repeat(indent)

  if (element.type === 'JSXText') {
    return `${indentStr}${element.value}`
  }

  if (element.type === 'JSXExpression') {
    return `${indentStr}{${element.expression}}`
  }

  // JSXElement — upgrade to motion.tag when motion props are injected
  const isHtmlTag = /^[a-z]/.test(element.tag)
  const tag = opts.motionPropsVar && isHtmlTag
    ? `motion.${element.tag}`
    : element.tag

  // Generate props — inject className/_cn and rest spread on root HTML element only
  let propsStr = generateJSXProps(element.props)
  if (opts.injectClassName && isHtmlTag) {
    const extras: string[] = []
    if (!element.props.some(p => p.name === 'className' || p.name === 'class')) {
      extras.push(`className={_cn}`)
    }
    if (opts.motionPropsVar) {
      extras.push(`{...${opts.motionPropsVar}}`)
    }
    extras.push(`style={style}`)
    extras.push(`{...rest}`)
    propsStr = [propsStr, ...extras].filter(Boolean).join(' ')
  }

  if (element.selfClosing) {
    return `${indentStr}<${tag}${propsStr ? ' ' + propsStr : ''} />`
  }

  if (element.children.length === 0) {
    return `${indentStr}<${tag}${propsStr ? ' ' + propsStr : ''}></${tag}>`
  }

  if (element.children.length === 1) {
    const child = element.children[0]!
    if (child.type === 'JSXText') {
      return `${indentStr}<${tag}${propsStr ? ' ' + propsStr : ''}>${child.value}</${tag}>`
    }
    if (child.type === 'JSXExpression') {
      return `${indentStr}<${tag}${propsStr ? ' ' + propsStr : ''}>{${child.expression}}</${tag}>`
    }
  }

  // Multi-line children
  const lines: string[] = []
  lines.push(`${indentStr}<${tag}${propsStr ? ' ' + propsStr : ''}>`)

  element.children.forEach((child) => {
    lines.push(generateJSXElement(child, indent + 1))
  })

  lines.push(`${indentStr}</${tag}>`)

  return lines.join('\n')
}

/**
 * Generate JSX props string with support for spreading
 */
function generateJSXProps(props: JSXAttribute[]): string {
  return props
    .map((prop) => {
      // Handle prop spreading: {...props}
      const propName = prop.name === 'class' ? 'className' : prop.name

      if (propName === '...') {
        if (typeof prop.value === 'string') {
          return `{...${prop.value}}`
        }
        return `{...${prop.value.raw}}`
      }
      
      // Handle boolean props
      if (typeof prop.value === 'string') {
        if (prop.value === 'true') {
          return propName
        }
        return `${propName}="${prop.value}"`
      }
      
      // Handle expression props
      return `${propName}={${prop.value.raw}}`
    })
    .join(' ')
}

/**
 * Check if a component may have children based on its render block
 */
function componentMayHaveChildren(component: ComponentDeclaration): boolean {
  // Check if any JSX element in the render block uses {children} or {props.children}
  return hasChildrenReference(component.render.elements)
}

/**
 * Recursively check if JSX elements reference children
 */
function hasChildrenReference(
  elements: (JSXElement | JSXText | JSXExpression)[]
): boolean {
  for (const element of elements) {
    if (element.type === 'JSXExpression') {
      if (element.expression.includes('children') || element.expression.includes('props.children')) {
        return true
      }
    }
    
    if (element.type === 'JSXElement') {
      // Check props for children references
      for (const prop of element.props) {
        if (typeof prop.value !== 'string') {
          if (prop.value.raw.includes('children') || prop.value.raw.includes('props.children')) {
            return true
          }
        }
      }
      
      // Recursively check children
      if (hasChildrenReference(element.children)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Apply scoped class names to JSX elements
 */
export function applyScopedClassNames(
  jsx: string,
  scopedClassName: string
): string {
  // Simple implementation - add className prop to root element
  return jsx.replace(
    /^(\s*<\w+)/,
    `$1 className="${scopedClassName}"`
  )
}

/**
 * Inject motion props into JSX elements
 */
export function injectMotionProps(
  jsx: string,
  motionProps: Record<string, string>
): string {
  if (Object.keys(motionProps).length === 0) {
    return jsx
  }

  // Convert motion props to JSX attributes
  const propsStr = Object.entries(motionProps)
    .map(([key, value]) => `${key}={${value}}`)
    .join(' ')

  // Replace opening tag with motion.div and add props
  return jsx.replace(
    /^(\s*)<(\w+)/,
    `$1<motion.$2 ${propsStr}`
  )
}
