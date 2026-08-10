// AST Node Types

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

export interface DriftAST extends ASTNode {
  type: 'DriftFile'
  imports: ImportDeclaration[]
  tokens: TokenDeclaration[]
  components: ComponentDeclaration[]
  motions: MotionSequenceDeclaration[]
  sourceMap: SourceMap
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
  value: string | TokenReference
}

export interface ComponentDeclaration extends ASTNode {
  type: 'Component'
  name: string
  props: PropDeclaration[]
  styles: StyleBlock
  motion: MotionBlock | null
  metadata?: MetadataBlock
  render: RenderBlock
}

export interface MetadataBlock extends ASTNode {
  type: 'MetadataBlock'
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  robots?: string
  themeColor?: string
  image?: string
  og?: Record<string, string>
  twitter?: Record<string, string>
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
  value: string | TokenReference
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
  easing?: string | TokenReference
}

export interface AnimationProperty {
  name: string
  from?: string | number
  to: string | number
}

export interface GestureDeclaration extends ASTNode {
  type: 'GestureDeclaration'
  gesture: 'hover' | 'press' | 'focus' | 'drag' | 'scroll'
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
  params: Record<string, any>
}

export interface MotionSequenceDeclaration extends ASTNode {
  type: 'MotionSequenceDeclaration'
  name: string
  params: MotionParam[]
  keyframes: Keyframe[]
}

export interface MotionParam {
  name: string
  type: 'number' | 'string' | 'boolean'
  defaultValue?: any
}

export interface Keyframe {
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

export interface TokenReference {
  type: 'TokenReference'
  path: string[]
}

export interface SourceMap {
  version: number
  sources: string[]
  names: string[]
  mappings: string
  sourcesContent: string[]
}
