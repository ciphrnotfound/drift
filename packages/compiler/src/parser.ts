import type {
  DriftAST,
  ComponentDeclaration,
  StyleBlock,
  StyleRule,
  VariantDeclaration,
  ResponsiveBlock,
  MotionBlock,
  AnimationDeclaration,
  AnimationProperty,
  GestureDeclaration,
  MetadataBlock,
  RenderBlock,
  JSXElement,
  JSXAttribute,
  JSXText,
  JSXExpression,
  ImportDeclaration,
  ImportSpecifier,
  PropDeclaration,
  SourceLocation,
  TokenReference,
} from '@drift/types'
import { Lexer, Token, TokenType } from './lexer'
import { DriftError, ErrorCode, ErrorCollector } from './errors'
import { suggestSyntaxCorrection } from './suggestions'

export class Parser {
  private tokens: Token[]
  private current: number = 0
  private source: string
  private filename: string
  private errorCollector: ErrorCollector

  constructor(source: string, filename: string = '<unknown>', errorCollector?: ErrorCollector) {
    this.source = source
    this.filename = filename
    this.errorCollector = errorCollector || new ErrorCollector()
    const lexer = new Lexer(source)
    this.tokens = lexer.tokenize()
  }

  public getErrorCollector(): ErrorCollector {
    return this.errorCollector
  }

  parse(): DriftAST {
    const imports: ImportDeclaration[] = []
    const components: ComponentDeclaration[] = []

    while (!this.isAtEnd()) {
      if (this.check(TokenType.IMPORT)) {
        imports.push(this.parseImport())
      } else if (this.check(TokenType.COMPONENT)) {
        components.push(this.parseFullComponent())
      } else if (this.check(TokenType.STYLE) || this.check(TokenType.RENDER)) {
        // Parse component (style and render blocks together)
        const component = this.parseComponent()
        components.push(component)
      } else if (!this.isAtEnd()) {
        const token = this.peek()
        if (token.type === TokenType.NEWLINE) {
          // Silently skip newlines at top level
          this.advance()
        } else {
          const location = this.createLocation(token.position.offset, token.position.offset + token.value.length)
          this.errorCollector.error({
            code: ErrorCode.PARSE_UNEXPECTED_TOKEN,
            message: `Unexpected token '${token.value}' at top level`,
            file: this.filename,
            location,
            suggestions: ['Expected: component, import, style, or render'],
          })
          this.advance()
        }
      }
    }

    return {
      type: 'DriftFile',
      imports,
      tokens: [],
      components,
      motions: [],
      sourceMap: {
        version: 3,
        sources: [this.source],
        names: [],
        mappings: '',
        sourcesContent: [this.source],
      },
      location: this.createLocation(0, this.source.length),
    }
  }

  private parseImport(): ImportDeclaration {
    const start = this.peek().position
    this.consume(TokenType.IMPORT, 'Expected import keyword')

    const specifiers: ImportSpecifier[] = []

    // Parse import specifiers
    if (this.check(TokenType.LBRACE)) {
      this.advance()
      do {
        const imported = this.consume(
          TokenType.IDENTIFIER,
          'Expected identifier'
        ).value
        let local = imported
        if (this.check(TokenType.AS)) {
          this.advance()
          local = this.consume(TokenType.IDENTIFIER, 'Expected import alias').value
        }
        specifiers.push({ imported, local })

        if (this.check(TokenType.COMMA)) {
          this.advance()
        }
      } while (!this.check(TokenType.RBRACE))
      this.consume(TokenType.RBRACE, 'Expected }')
    } else {
      const imported = this.consume(TokenType.IDENTIFIER, 'Expected identifier')
        .value
      specifiers.push({ imported, local: imported })
    }

    this.consume(TokenType.FROM, 'Expected from keyword')
    const source = this.consume(TokenType.STRING, 'Expected string').value

    return {
      type: 'ImportDeclaration',
      source,
      specifiers,
      location: this.createLocation(start.offset, this.peek().position.offset),
    }
  }

  private parseFullComponent(): ComponentDeclaration {
    const start = this.peek().position
    this.consume(TokenType.COMPONENT, 'Expected component keyword')
    
    const name = this.consume(TokenType.IDENTIFIER, 'Expected component name').value
    this.consume(TokenType.LBRACE, 'Expected {')
    
    let props: PropDeclaration[] = []
    let styles: StyleBlock | null = null
    let motion: MotionBlock | null = null
    let metadata: MetadataBlock | null = null
    let render: RenderBlock | null = null

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines()
      if (this.check(TokenType.RBRACE)) break

      if (this.check(TokenType.PROPS)) {
        this.advance()
        this.consume(TokenType.LBRACE, 'Expected {')
        // Parse props
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          this.skipNewlines()
          if (this.check(TokenType.RBRACE)) break
          
          const propName = this.consume(TokenType.IDENTIFIER, 'Expected prop name').value
          const optional = this.check(TokenType.QUESTION) ? (this.advance(), true) : false
          this.consume(TokenType.COLON, 'Expected :')
          const typeStr = this.parsePropType()
          const defaultValue = this.check(TokenType.EQUALS)
            ? (this.advance(), this.parseDefaultValue())
            : undefined

          props.push({
            type: 'PropDeclaration',
            name: propName,
            propType: { kind: this.classifyPropType(typeStr), value: typeStr },
            optional: optional || defaultValue !== undefined,
            defaultValue,
            location: this.createLocation(this.peek().position.offset, this.peek().position.offset),
          })
        }
        this.consume(TokenType.RBRACE, 'Expected }')
      } else if (this.check(TokenType.STYLE)) {
        this.advance()
        this.consume(TokenType.LBRACE, 'Expected {')
        styles = this.parseStyleBlockContent()
        this.consume(TokenType.RBRACE, 'Expected }')
      } else if (this.check(TokenType.METADATA)) {
        metadata = this.parseMetadataBlock()
      } else if (this.check(TokenType.MOTION)) {
        motion = this.parseMotionBlock()
      } else if (this.check(TokenType.RENDER)) {
        this.advance()
        this.consume(TokenType.LBRACE, 'Expected {')
        render = this.parseRenderBlock()
        this.consume(TokenType.RBRACE, 'Expected }')
      } else {
        this.advance()
      }
    }

    this.consume(TokenType.RBRACE, 'Expected }')

    return {
      type: 'Component',
      name,
      props,
      styles: styles || this.createEmptyStyleBlock(),
      motion,
      metadata: metadata || undefined,
      render: render || this.createEmptyRenderBlock(),
      location: this.createLocation(start.offset, this.peek().position.offset),
    }
  }

  /**
   * Parse a prop type annotation — supports:
   *   string | number | boolean | React.ReactNode
   *   "literal" | "union"
   *   identifier.qualified
   */
  private parsePropType(): string {
    const parts: string[] = []

    const readOne = (): string => {
      if (this.check(TokenType.STRING)) {
        // String literal: "primary"
        return `"${this.advance().value}"`
      }
      if (this.check(TokenType.IDENTIFIER)) {
        let t = this.advance().value
        // Qualified type like React.ReactNode
        while (this.check(TokenType.DOT)) {
          this.advance()
          t += '.' + this.consume(TokenType.IDENTIFIER, 'Expected identifier').value
        }
        // Preserve common generic frontend types such as Record<string, unknown>
        // so prop declarations remain expressive without falling back to any.
        if (this.check(TokenType.LT)) {
          let depth = 0
          do {
            const genericToken = this.advance()
            if (genericToken.type === TokenType.LT) depth++
            if (genericToken.type === TokenType.GT) depth--
            if (genericToken.type === TokenType.COMMA) t += ', '
            else if (genericToken.type !== TokenType.LT && genericToken.type !== TokenType.GT) t += genericToken.value
          } while (depth > 0 && !this.isAtEnd())
          t += '>'
        }
        // Array type: string[]
        if (this.check(TokenType.LBRACKET)) {
          this.advance()
          this.consume(TokenType.RBRACKET, 'Expected ]')
          t += '[]'
        }
        return t
      }
      // Fallback — skip to newline
      return 'any'
    }

    parts.push(readOne())

    // Handle union: | next
    while (this.check(TokenType.PIPE)) {
      this.advance()
      parts.push(readOne())
    }

    return parts.join(' | ')
  }

  private classifyPropType(type: string): PropDeclaration['propType']['kind'] {
    const normalized = type.replace(/\s+/g, '')
    if (normalized.includes('|')) return 'union'
    if (normalized.endsWith('[]')) return 'array'
    if (normalized === 'string' || normalized.startsWith('"')) return 'string'
    if (normalized === 'number') return 'number'
    if (normalized === 'boolean') return 'boolean'
    if (normalized.startsWith('{') || normalized === 'object' || normalized.startsWith('Record')) return 'object'
    return 'custom'
  }

  private parseDefaultValue(): { raw: string } {
    const parts: string[] = []

    while (
      !this.check(TokenType.NEWLINE) &&
      !this.check(TokenType.RBRACE) &&
      !this.isAtEnd()
    ) {
      if (this.check(TokenType.STRING)) {
        parts.push(JSON.stringify(this.advance().value))
      } else {
        parts.push(this.advance().value)
      }
    }

    return { raw: parts.join(' ').trim() }
  }

  private parseMotionBlock(): MotionBlock {
    const start = this.peek().position
    this.consume(TokenType.MOTION, 'Expected motion keyword')
    this.consume(TokenType.LBRACE, 'Expected {')

    let enter: AnimationDeclaration | null = null
    let exit: AnimationDeclaration | null = null
    const gestures: GestureDeclaration[] = []

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines()
      if (this.check(TokenType.RBRACE)) break

      const keyword = this.peek()

      if (this.check(TokenType.ENTER)) {
        this.advance()
        this.consume(TokenType.LBRACE, 'Expected {')
        enter = this.parseAnimationDeclaration()
        this.consume(TokenType.RBRACE, 'Expected }')
      } else if (this.check(TokenType.EXIT)) {
        this.advance()
        this.consume(TokenType.LBRACE, 'Expected {')
        exit = this.parseAnimationDeclaration()
        this.consume(TokenType.RBRACE, 'Expected }')
      } else if (
        this.check(TokenType.HOVER) ||
        this.check(TokenType.PRESS) ||
        this.check(TokenType.FOCUS) ||
        this.check(TokenType.DRAG) ||
        this.check(TokenType.SCROLL)
      ) {
        const gestureType = keyword.value as GestureDeclaration['gesture']
        this.advance()
        this.consume(TokenType.LBRACE, 'Expected {')
        const anim = this.parseAnimationDeclaration()
        this.consume(TokenType.RBRACE, 'Expected }')
        gestures.push({
          type: 'GestureDeclaration',
          gesture: gestureType,
          animation: anim,
          location: this.createLocation(keyword.position.offset, this.peek().position.offset),
        })
      } else {
        this.advance()
      }
    }

    this.consume(TokenType.RBRACE, 'Expected }')

    return {
      type: 'MotionBlock',
      enter,
      exit,
      gestures,
      sequences: [],
      location: this.createLocation(start.offset, this.peek().position.offset),
    }
  }

  private parseAnimationDeclaration(): AnimationDeclaration {
    const start = this.peek().position
    const properties: AnimationProperty[] = []
    let duration: number | undefined
    let delay: number | undefined
    let easing: string | undefined

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines()
      if (this.check(TokenType.RBRACE)) break

      const propName = this.consume(TokenType.IDENTIFIER, 'Expected property name').value

      if (this.check(TokenType.COLON)) {
        this.advance()
      }

      const valueStr = this.parseStyleValue()
      const value = typeof valueStr === 'string' ? valueStr : valueStr.path.join('.')

      if (propName === 'duration') {
        duration = parseFloat(value)
      } else if (propName === 'delay') {
        delay = parseFloat(value)
      } else if (propName === 'easing') {
        easing = value
      } else {
        properties.push({ name: propName, to: value })
      }
    }

    return {
      type: 'AnimationDeclaration',
      properties,
      duration,
      delay,
      easing,
      location: this.createLocation(start.offset, this.peek().position.offset),
    }
  }

  private parseMetadataBlock(): MetadataBlock {
    const start = this.peek().position
    this.consume(TokenType.METADATA, 'Expected metadata keyword')
    this.consume(TokenType.LBRACE, 'Expected {')

    const metadata: MetadataBlock = {
      type: 'MetadataBlock',
      location: this.createLocation(start.offset, 0),
    }

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines()
      if (this.check(TokenType.RBRACE)) break

      let key = this.consume(TokenType.IDENTIFIER, 'Expected metadata key').value
      if (this.check(TokenType.DOT)) {
        this.advance()
        key += '.' + this.consume(TokenType.IDENTIFIER, 'Expected metadata subkey').value
      }
      this.consume(TokenType.COLON, 'Expected :')
      const value = this.consume(TokenType.STRING, 'Expected metadata value').value

      if (key === 'title') metadata.title = value
      else if (key === 'description') metadata.description = value
      else if (key === 'keywords') metadata.keywords = value.split(',').map(k => k.trim())
      else if (key === 'canonical') metadata.canonical = value
      else if (key === 'robots') metadata.robots = value
      else if (key === 'themeColor') metadata.themeColor = value
      else if (key === 'image') metadata.image = value
      else if (key.startsWith('og.')) metadata.og = { ...(metadata.og || {}), [key.slice(3)]: value }
      else if (key.startsWith('twitter.')) metadata.twitter = { ...(metadata.twitter || {}), [key.slice(8)]: value }
    }

    this.consume(TokenType.RBRACE, 'Expected }')
    metadata.location.end = this.peek().position
    return metadata
  }

  private parseComponent(): ComponentDeclaration {
    const start = this.peek().position

    let styles: StyleBlock | null = null
    let motion: MotionBlock | null = null
    let render: RenderBlock | null = null
    let name = ''
    let props: PropDeclaration[] = []

    // Parse style block if present
    if (this.check(TokenType.STYLE)) {
      this.advance() // consume 'style'
      const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected component name')
      name = nameToken.value
      this.consume(TokenType.LBRACE, 'Expected {')
      styles = this.parseStyleBlockContent()
      this.consume(TokenType.RBRACE, 'Expected }')
      this.skipNewlines()
    }

    // Parse render block if present
    if (this.check(TokenType.RENDER)) {
      this.advance() // consume 'render'
      const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected component name')
      if (!name) name = nameToken.value

      // Parse props
      if (this.check(TokenType.LPAREN)) {
        this.advance()
        if (this.check(TokenType.LBRACE)) {
          this.advance() // consume '{'
          while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            const propName = this.consume(TokenType.IDENTIFIER, 'Expected prop name').value
            props.push({
              type: 'PropDeclaration',
              name: propName,
              propType: { kind: 'string', value: 'any' },
              optional: false,
              location: this.createLocation(
                this.peek().position.offset,
                this.peek().position.offset
              ),
            })

            if (this.check(TokenType.COMMA)) {
              this.advance()
            }
          }
          this.consume(TokenType.RBRACE, 'Expected }')
        }
        this.consume(TokenType.RPAREN, 'Expected )')
      }

      this.consume(TokenType.LBRACE, 'Expected {')
      render = this.parseRenderBlock()
      this.consume(TokenType.RBRACE, 'Expected }')
    }

    return {
      type: 'Component',
      name,
      props,
      styles: styles || this.createEmptyStyleBlock(),
      motion,
      render: render || this.createEmptyRenderBlock(),
      location: this.createLocation(start.offset, this.peek().position.offset),
    }
  }


  private parseStyleBlockContent(): StyleBlock {
    const start = this.peek().position
    const base: StyleRule[] = []
    const variants: VariantDeclaration[] = []
    const responsive: ResponsiveBlock[] = []

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines()
      if (this.check(TokenType.RBRACE)) break

      const prop = this.consumeStylePropertyName('Expected property name').value

      if (prop === 'variant' && this.check(TokenType.LBRACE)) {
        variants.push(...this.parseVariantGroup())
        continue
      }

      if (prop === 'responsive' && this.check(TokenType.LBRACE)) {
        responsive.push(...this.parseResponsiveGroup())
        continue
      }

      // Check if this is a pseudo-state, direct variant, or legacy responsive block.
      if (this.check(TokenType.LBRACE)) {
        this.advance() // consume '{'
        const rules = this.parseStyleRulesUntilRBrace()
        this.consume(TokenType.RBRACE, 'Expected }')

        if (['sm', 'md', 'lg', 'xl', '2xl', 'mobile', 'tablet', 'desktop'].includes(prop)) {
          responsive.push({
            type: 'ResponsiveBlock',
            breakpoint: prop,
            styles: rules,
            location: this.createLocation(start.offset, this.peek().position.offset),
          })
        } else {
          // hover, press, focus, or custom variants
          variants.push({
            type: 'VariantDeclaration',
            name: prop,
            values: [{
              type: 'VariantValue',
              name: prop,
              styles: rules,
              location: this.createLocation(start.offset, this.peek().position.offset),
            }],
            location: this.createLocation(start.offset, this.peek().position.offset),
          })
        }
      } else {
        // Regular style rule
        if (this.check(TokenType.COLON)) {
          this.advance()
        }
        const value = this.parseStyleValue()

        base.push({
          type: 'StyleRule',
          property: prop,
          value,
          important: false,
          location: this.createLocation(
            this.peek().position.offset,
            this.peek().position.offset
          ),
        })
      }
    }

    return {
      type: 'StyleBlock',
      base,
      variants,
      responsive,
      location: this.createLocation(start.offset, this.peek().position.offset),
    }
  }

  private parseVariantGroup(): VariantDeclaration[] {
    const start = this.peek().position
    const variants: VariantDeclaration[] = []
    const directValues = []

    this.consume(TokenType.LBRACE, 'Expected {')

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines()
      if (this.check(TokenType.RBRACE)) break

      const variantName = this.consumeStylePropertyName('Expected variant name').value
      this.consume(TokenType.LBRACE, 'Expected {')

      if (!this.blockLooksLikeGroupedVariant()) {
        const styles = this.parseStyleRulesUntilRBrace()
        this.consume(TokenType.RBRACE, 'Expected }')
        directValues.push({
          type: 'VariantValue' as const,
          name: variantName,
          styles,
          location: this.createLocation(start.offset, this.peek().position.offset),
        })
        continue
      }

      const values = []
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        this.skipNewlines()
        if (this.check(TokenType.RBRACE)) break

        const valueName = this.consumeStylePropertyName('Expected variant value').value
        this.consume(TokenType.LBRACE, 'Expected {')
        const styles = this.parseStyleRulesUntilRBrace()
        this.consume(TokenType.RBRACE, 'Expected }')

        values.push({
          type: 'VariantValue' as const,
          name: valueName,
          styles,
          location: this.createLocation(start.offset, this.peek().position.offset),
        })
      }

      this.consume(TokenType.RBRACE, 'Expected }')
      variants.push({
        type: 'VariantDeclaration',
        name: variantName,
        values,
        location: this.createLocation(start.offset, this.peek().position.offset),
      })
    }

    this.consume(TokenType.RBRACE, 'Expected }')
    if (directValues.length > 0) {
      variants.unshift({
        type: 'VariantDeclaration',
        name: 'variant',
        values: directValues,
        location: this.createLocation(start.offset, this.peek().position.offset),
      })
    }
    return variants
  }

  private blockLooksLikeGroupedVariant(): boolean {
    let offset = 0
    while (this.peek(offset).type === TokenType.NEWLINE) {
      offset++
    }
    const first = this.peek(offset)
    const second = this.peek(offset + 1)
    return first.type !== TokenType.RBRACE && second.type === TokenType.LBRACE
  }

  private parseResponsiveGroup(): ResponsiveBlock[] {
    const start = this.peek().position
    const responsive: ResponsiveBlock[] = []

    this.consume(TokenType.LBRACE, 'Expected {')

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines()
      if (this.check(TokenType.RBRACE)) break

      const breakpoint = this.consumeStylePropertyName('Expected breakpoint name').value
      this.consume(TokenType.LBRACE, 'Expected {')
      const styles = this.parseStyleRulesUntilRBrace()
      this.consume(TokenType.RBRACE, 'Expected }')

      responsive.push({
        type: 'ResponsiveBlock',
        breakpoint,
        styles,
        location: this.createLocation(start.offset, this.peek().position.offset),
      })
    }

    this.consume(TokenType.RBRACE, 'Expected }')
    return responsive
  }

  private parseStyleRulesUntilRBrace(): StyleRule[] {
    const rules: StyleRule[] = []

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipNewlines()
      if (this.check(TokenType.RBRACE)) break

      const nestedProp = this.consumeStylePropertyName('Expected property').value
      if (this.check(TokenType.LBRACE)) {
        this.skipBalancedBlock()
        continue
      }
      if (this.check(TokenType.COLON)) {
        this.advance()
      }
      const value = this.parseStyleValue()

      rules.push({
        type: 'StyleRule',
        property: nestedProp,
        value,
        important: false,
        location: this.createLocation(
          this.peek().position.offset,
          this.peek().position.offset
        ),
      })
    }

    return rules
  }

  private skipBalancedBlock(): void {
    this.consume(TokenType.LBRACE, 'Expected {')
    let depth = 1

    while (depth > 0 && !this.isAtEnd()) {
      const token = this.advance()
      if (token.type === TokenType.LBRACE) {
        depth++
      } else if (token.type === TokenType.RBRACE) {
        depth--
      }
    }
  }

  private parseStyleValue(): string | TokenReference {
    const tokens: string[] = []

    while (
      !this.check(TokenType.NEWLINE) &&
      !this.check(TokenType.RBRACE) &&
      !this.check(TokenType.LBRACE) &&
      !this.isAtEnd()
    ) {
      if (this.check(TokenType.TOKEN_REF)) {
        const tokenRef = this.advance().value
        // Return token reference (only if it's the only value)
        if (tokens.length === 0 && (this.check(TokenType.NEWLINE) || this.check(TokenType.RBRACE) || this.check(TokenType.LBRACE))) {
          return {
            type: 'TokenReference',
            path: tokenRef.substring(1).split('.'),
          }
        }
        tokens.push(tokenRef)
      } else {
        tokens.push(this.advance().value)
      }
    }

    return tokens.join(' ').trim()
  }

  private parseRenderBlock(): RenderBlock {
    const start = this.peek().position
    const elements: JSXElement[] = []

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.RBRACE)) break

      if (this.check(TokenType.LT)) {
        elements.push(this.parseJSXElement())
      } else {
        this.advance()
      }
    }

    return {
      type: 'RenderBlock',
      elements,
      location: this.createLocation(start.offset, this.peek().position.offset),
    }
  }

  private parseJSXElement(): JSXElement {
    const start = this.peek().position
    this.consume(TokenType.LT, 'Expected <')

    const tag = this.consume(TokenType.IDENTIFIER, 'Expected tag name').value
    const props: JSXAttribute[] = []

    // Parse attributes
    while (!this.check(TokenType.GT) && !this.check(TokenType.SLASH) && !this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER)) {
        const name = this.advance().value
        let value: string | any = 'true'

        if (this.check(TokenType.EQUALS)) {
          this.advance()
          if (this.check(TokenType.STRING)) {
            value = this.advance().value
          } else if (this.check(TokenType.LBRACE)) {
            this.advance()
            value = { raw: this.parseJSXExpressionRaw() }
          }
        }

        if (typeof value !== 'string' && value.raw.startsWith('...')) {
          props.push({ name: '...', value: { raw: value.raw.slice(3).trim() } })
        } else {
          props.push({ name, value })
        }
      } else if (this.check(TokenType.LBRACE)) {
        this.advance()
        const expression = this.parseJSXExpressionRaw()
        if (expression.startsWith('...')) {
          props.push({ name: '...', value: { raw: expression.slice(3).trim() } })
        }
      } else {
        this.advance()
      }
    }

    // Check for self-closing
    const selfClosing = this.check(TokenType.SLASH)
    if (selfClosing) {
      this.advance()
    }

    this.consume(TokenType.GT, 'Expected >')

    const children: (JSXElement | JSXText | JSXExpression)[] = []

    if (!selfClosing) {
      // Parse children
      while (!this.check(TokenType.LT) || this.peek(1)?.type !== TokenType.SLASH) {
        if (this.check(TokenType.LT)) {
          children.push(this.parseJSXElement())
        } else if (this.check(TokenType.LBRACE)) {
          this.advance()
          const expr = this.parseJSXExpressionRaw()
          children.push({
            type: 'JSXExpression',
            expression: expr,
            location: this.createLocation(
              this.peek().position.offset,
              this.peek().position.offset
            ),
          })
        } else if (!this.isAtEnd()) {
          const text = this.advance().value
          if (text.trim()) {
            children.push({
              type: 'JSXText',
              value: text,
              location: this.createLocation(
                this.peek().position.offset,
                this.peek().position.offset
              ),
            })
          }
        } else {
          break
        }
      }

      // Parse closing tag
      this.consume(TokenType.LT, 'Expected <')
      this.consume(TokenType.SLASH, 'Expected /')
      this.consume(TokenType.IDENTIFIER, `Expected closing tag ${tag}`)
      this.consume(TokenType.GT, 'Expected >')
    }

    return {
      type: 'JSXElement',
      tag,
      props,
      children,
      selfClosing,
      location: this.createLocation(start.offset, this.peek().position.offset),
    }
  }

  private createEmptyStyleBlock(): StyleBlock {
    return {
      type: 'StyleBlock',
      base: [],
      variants: [],
      responsive: [],
      location: this.createLocation(0, 0),
    }
  }

  private createEmptyRenderBlock(): RenderBlock {
    return {
      type: 'RenderBlock',
      elements: [],
      location: this.createLocation(0, 0),
    }
  }

  private createLocation(start: number, end: number): SourceLocation {
    return {
      start: { line: 1, column: 1, offset: start },
      end: { line: 1, column: 1, offset: end },
      source: this.source,
    }
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++
    return this.previous()
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  private peek(offset: number = 0): Token {
    const token = this.tokens[this.current + offset]
    return token || this.tokens[this.tokens.length - 1]!
  }

  private previous(): Token {
    return this.tokens[this.current - 1]!
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance()

    const token = this.peek()
    const location = this.createLocation(token.position.offset, token.position.offset + token.value.length)

    // Generate suggestions based on expected token type
    const suggestions = suggestSyntaxCorrection(token.value, [type])

    this.errorCollector.error({
      code: ErrorCode.PARSE_UNEXPECTED_TOKEN,
      message: `${message}. Got '${token.value}' (${token.type})`,
      file: this.filename,
      location,
      suggestions,
    })

    throw new DriftError({
      code: ErrorCode.PARSE_UNEXPECTED_TOKEN,
      message: `${message} at line ${token.position.line}, column ${token.position.column}. Got ${token.type}`,
      file: this.filename,
      location,
      suggestions,
    })
  }

  private parseJSXExpressionRaw(): string {
    const parts: string[] = []
    let depth = 1

    while (depth > 0 && !this.isAtEnd()) {
      const token = this.advance()

      if (token.type === TokenType.LBRACE) {
        depth++
        parts.push(token.value)
        continue
      }

      if (token.type === TokenType.RBRACE) {
        depth--
        if (depth === 0) break
        parts.push(token.value)
        continue
      }

      parts.push(token.type === TokenType.STRING ? JSON.stringify(token.value) : token.value)
    }

    return this.formatExpressionParts(parts)
  }

  private formatExpressionParts(parts: string[]): string {
    return parts
      .join(' ')
      .replace(/\. \. \./g, '...')
      .replace(/\s+\./g, '.')
      .replace(/\.\s+/g, '.')
      .replace(/\s+,/g, ',')
      .replace(/([A-Za-z0-9_$]) \(/g, '$1(')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\[\s+/g, '[')
      .replace(/\s+\]/g, ']')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private consumeStylePropertyName(message: string): Token {
    const styleNameTokens = new Set<TokenType>([
      TokenType.IDENTIFIER,
      TokenType.LAYOUT,
      TokenType.HOVER,
      TokenType.PRESS,
      TokenType.FOCUS,
      TokenType.DRAG,
      TokenType.SCROLL,
      TokenType.ENTER,
      TokenType.EXIT,
    ])

    if (!this.isAtEnd() && styleNameTokens.has(this.peek().type)) {
      return this.advance()
    }

    return this.consume(TokenType.IDENTIFIER, message)
  }

  private skipNewlines(): void {
    while (this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      this.advance()
    }
  }
}

export function parse(source: string, filename: string = '<unknown>', errorCollector?: ErrorCollector): DriftAST {
  const parser = new Parser(source, filename, errorCollector)
  return parser.parse()
}
