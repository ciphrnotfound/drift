/**
 * Compiler-specific types
 */

import type { ASTNode, SourceLocation } from '@drift/types'

// ============================================================================
// AST Node Types
// ============================================================================

export interface DriftAST extends ASTNode {
  type: 'DriftFile'
  imports: ImportDeclaration[]
  tokens: TokenDeclaration[]
  components: ComponentDeclaration[]
  motions: MotionSequenceDeclaration[]
  sourceMap: SourceLocation
}

export interface ImportDeclaration extends ASTNode {
  type: 'ImportDeclaration'
  source: string
  specifiers: ImportSpecifier[]
}

export interface ImportSpecifier {
  imported: string
  local: string
}

export interface TokenDeclaration extends ASTNode {
  type: 'TokenDeclaration'
  category: string
  name: string
  value: string
}

export interface ComponentDeclaration extends ASTNode {
  type: 'Component'
  name: string
  props: PropDeclaration[]
  styles: StyleBlock
  motion: MotionBlock | null
  render: RenderBlock
}

export interface PropDeclaration extends ASTNode {
  type: 'PropDeclaration'
  name: string
  propType: TypeAnnotation
  optional: boolean
  defaultValue?: Expression
}

export interface TypeAnnotation {
  kind: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'union' | 'custom'
  value: string
}

export interface StyleBlock extends ASTNode {
  type: 'StyleBlock'
  base: StyleRule[]
  variants: VariantDeclaration[]
  responsive: ResponsiveBlock[]
}

export interface StyleRule extends ASTNode {
  type: 'StyleRule'
  property: string
  value: string
  important: boolean
}

export interface VariantDeclaration extends ASTNode {
  type: 'VariantDeclaration'
  name: string
  values: VariantValue[]
  defaultValue?: string
}

export interface VariantValue extends ASTNode {
  type: 'VariantValue'
  name: string
  styles: StyleRule[]
}

export interface ResponsiveBlock extends ASTNode {
  type: 'ResponsiveBlock'
  breakpoint: string
  styles: StyleRule[]
}

export interface MotionBlock extends ASTNode {
  type: 'MotionBlock'
  enter: AnimationDeclaration | null
  exit: AnimationDeclaration | null
  gestures: GestureDeclaration[]
  sequences: MotionSequenceReference[]
}

export interface AnimationDeclaration extends ASTNode {
  type: 'AnimationDeclaration'
  properties: AnimationProperty[]
  duration?: number
  delay?: number
  easing?: string
}

export interface AnimationProperty {
  name: string
  from?: string | number
  to: string | number
}

export interface GestureDeclaration extends ASTNode {
  type: 'GestureDeclaration'
  gesture: 'hover' | 'press' | 'focus' | 'drag' | 'scroll' | 'pinch' | 'rotate'
  animation: AnimationDeclaration
  constraints?: GestureConstraints
}

export interface GestureConstraints {
  axis?: 'x' | 'y'
  bounds?: { top?: number; right?: number; bottom?: number; left?: number }
}

export interface MotionSequenceReference extends ASTNode {
  type: 'MotionSequenceReference'
  name: string
  params: Record<string, unknown>
}

export interface MotionSequenceDeclaration extends ASTNode {
  type: 'MotionSequenceDeclaration'
  name: string
  params: MotionParam[]
  keyframes: KeyframeDeclaration[]
}

export interface MotionParam {
  name: string
  type: 'number' | 'string' | 'boolean'
  defaultValue?: unknown
}

export interface KeyframeDeclaration extends ASTNode {
  type: 'KeyframeDeclaration'
  offset: number
  properties: Record<string, string | number>
  easing?: string
}

export interface RenderBlock extends ASTNode {
  type: 'RenderBlock'
  elements: JSXElement[]
}

export interface JSXElement extends ASTNode {
  type: 'JSXElement'
  tag: string
  props: JSXAttribute[]
  children: (JSXElement | JSXText | JSXExpression)[]
  selfClosing: boolean
}

export interface JSXAttribute {
  name: string
  value: string | Expression
}

export interface JSXText extends ASTNode {
  type: 'JSXText'
  value: string
}

export interface JSXExpression extends ASTNode {
  type: 'JSXExpression'
  expression: string
}

export interface Expression {
  raw: string
}
