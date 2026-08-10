import type { Position } from '@drift/types'

export enum TokenType {
  // Keywords
  STYLE = 'STYLE',
  RENDER = 'RENDER',
  MOTION = 'MOTION',
  ENTER = 'ENTER',
  EXIT = 'EXIT',
  HOVER = 'HOVER',
  PRESS = 'PRESS',
  FOCUS = 'FOCUS',
  DRAG = 'DRAG',
  SCROLL = 'SCROLL',
  LAYOUT = 'LAYOUT',
  PAGE = 'PAGE',
  COMPONENT = 'COMPONENT',
  PROPS = 'PROPS',
  METADATA = 'METADATA',
  IMPORT = 'IMPORT',
  FROM = 'FROM',
  IF = 'IF',
  EACH = 'EACH',
  AS = 'AS',

  // Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  TOKEN_REF = 'TOKEN_REF', // $token.path

  // Symbols
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  LT = 'LT',
  GT = 'GT',
  SLASH = 'SLASH',
  EQUALS = 'EQUALS',
  COMMA = 'COMMA',
  DOT = 'DOT',
  COLON = 'COLON',
  QUESTION = 'QUESTION',
  BANG = 'BANG',
  AT = 'AT',
  HASH = 'HASH',
  DOLLAR = 'DOLLAR',
  PERCENT = 'PERCENT',
  AMPERSAND = 'AMPERSAND',
  STAR = 'STAR',
  PLUS = 'PLUS',
  PIPE = 'PIPE',
  TILDE = 'TILDE',
  ARROW = 'ARROW', // →
  
  // Special
  NEWLINE = 'NEWLINE',
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
  COMMENT = 'COMMENT',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType
  value: string
  position: Position
}

export class Lexer {
  private source: string
  private pos: number = 0
  private line: number = 1
  private column: number = 1
  private tokens: Token[] = []

  constructor(source: string) {
    this.source = source
  }

  tokenize(): Token[] {
    while (this.pos < this.source.length) {
      this.scanToken()
    }

    this.addToken(TokenType.EOF, '')
    return this.tokens
  }

  private scanToken(): void {
    const char = this.current()

    // Skip spaces and tabs
    if (char === ' ' || char === '\t') {
      this.advance()
      return
    }

    // Emit newline tokens (needed for property value parsing)
    if (char === '\n' || char === '\r') {
      if (char === '\r' && this.peek() === '\n') {
        this.advance() // Skip \r
      }
      this.addToken(TokenType.NEWLINE, '\n')
      this.line++
      this.column = 0
      this.advance()
      return
    }

    // Comments (// style)
    if (char === '/' && this.peek() === '/') {
      this.scanComment()
      return
    }

    // Strings
    if (char === '"' || char === "'") {
      this.scanString(char)
      return
    }

    // Numbers
    if (this.isDigit(char)) {
      this.scanNumber()
      return
    }

    // Token references ($token.path)
    if (char === '$') {
      this.scanTokenReference()
      return
    }

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      this.scanIdentifier()
      return
    }

    // Symbols
    switch (char) {
      case '(':
        this.addToken(TokenType.LPAREN, char)
        this.advance()
        break
      case ')':
        this.addToken(TokenType.RPAREN, char)
        this.advance()
        break
      case '{':
        this.addToken(TokenType.LBRACE, char)
        this.advance()
        break
      case '}':
        this.addToken(TokenType.RBRACE, char)
        this.advance()
        break
      case '[':
        this.addToken(TokenType.LBRACKET, char)
        this.advance()
        break
      case ']':
        this.addToken(TokenType.RBRACKET, char)
        this.advance()
        break
      case '<':
        this.addToken(TokenType.LT, char)
        this.advance()
        break
      case '>':
        this.addToken(TokenType.GT, char)
        this.advance()
        break
      case '/':
        this.addToken(TokenType.SLASH, char)
        this.advance()
        break
      case '=':
        // Check for =>
        if (this.peek() === '>') {
          this.addToken(TokenType.ARROW, '=>')
          this.advance()
          this.advance()
        } else {
          this.addToken(TokenType.EQUALS, char)
          this.advance()
        }
        break
      case ',':
        this.addToken(TokenType.COMMA, char)
        this.advance()
        break
      case '.':
        this.addToken(TokenType.DOT, char)
        this.advance()
        break
      case ':':
        this.addToken(TokenType.COLON, char)
        this.advance()
        break
      case '?':
        this.addToken(TokenType.QUESTION, char)
        this.advance()
        break
      case '!':
        this.addToken(TokenType.BANG, char)
        this.advance()
        break
      case '@':
        this.addToken(TokenType.AT, char)
        this.advance()
        break
      case '#':
        this.addToken(TokenType.HASH, char)
        this.advance()
        break
      case '$':
        this.addToken(TokenType.DOLLAR, char)
        this.advance()
        break
      case '%':
        this.addToken(TokenType.PERCENT, char)
        this.advance()
        break
      case '&':
        this.addToken(TokenType.AMPERSAND, char)
        this.advance()
        break
      case '*':
        this.addToken(TokenType.STAR, char)
        this.advance()
        break
      case '+':
        this.addToken(TokenType.PLUS, char)
        this.advance()
        break
      case '|':
        this.addToken(TokenType.PIPE, char)
        this.advance()
        break
      case '~':
        this.addToken(TokenType.TILDE, char)
        this.advance()
        break
      case ';':
        // Semicolons are optional, just skip them
        this.advance()
        break
      default:
        throw new Error(
          `Unexpected character '${char}' at line ${this.line}, column ${this.column}`
        )
    }
  }

  private scanComment(): void {
    this.advance() // Skip first /
    this.advance() // Skip second /
    
    while (this.current() !== '\n' && !this.isAtEnd()) {
      this.advance()
    }
    // Comments are skipped, don't add token
  }

  private scanString(quote: string): void {
    const start = this.pos
    this.advance() // Skip opening quote

    while (this.current() !== quote && !this.isAtEnd()) {
      if (this.current() === '\n') {
        this.line++
        this.column = 1
      }
      if (this.current() === '\\') {
        this.advance() // Skip escape character
      }
      this.advance()
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${this.line}`)
    }

    this.advance() // Skip closing quote
    const value = this.source.substring(start + 1, this.pos - 1)
    this.addToken(TokenType.STRING, value)
  }

  private scanNumber(): void {
    const start = this.pos

    while (this.isDigit(this.current())) {
      this.advance()
    }

    // Handle decimal point
    if (this.current() === '.' && this.isDigit(this.peek())) {
      this.advance() // Skip .
      while (this.isDigit(this.current())) {
        this.advance()
      }
    }

    // Handle units (px, rem, em, ms, etc.)
    if (this.isAlpha(this.current())) {
      while (this.isAlpha(this.current())) {
        this.advance()
      }
    }

    const value = this.source.substring(start, this.pos)
    this.addToken(TokenType.NUMBER, value)
  }

  private scanTokenReference(): void {
    const start = this.pos
    this.advance() // Skip $

    if (!this.isAlpha(this.current())) {
      throw new Error(
        `Invalid token reference at line ${this.line}, column ${this.column}`
      )
    }

    while (this.isAlphaNumeric(this.current()) || this.current() === '.') {
      this.advance()
    }

    const value = this.source.substring(start, this.pos)
    this.addToken(TokenType.TOKEN_REF, value)
  }

  private scanIdentifier(): void {
    const start = this.pos

    while (this.isAlphaNumeric(this.current()) || this.current() === '_' || this.current() === '-') {
      this.advance()
    }

    const value = this.source.substring(start, this.pos)
    const type = this.getKeywordType(value) ?? TokenType.IDENTIFIER
    this.addToken(type, value)
  }

  private getKeywordType(value: string): TokenType | null {
    const keywords: Record<string, TokenType> = {
      style: TokenType.STYLE,
      render: TokenType.RENDER,
      motion: TokenType.MOTION,
      enter: TokenType.ENTER,
      exit: TokenType.EXIT,
      hover: TokenType.HOVER,
      press: TokenType.PRESS,
      focus: TokenType.FOCUS,
      drag: TokenType.DRAG,
      scroll: TokenType.SCROLL,
      layout: TokenType.LAYOUT,
      component: TokenType.COMPONENT,
      props: TokenType.PROPS,
      metadata: TokenType.METADATA,
      page: TokenType.PAGE,
      import: TokenType.IMPORT,
      from: TokenType.FROM,
      if: TokenType.IF,
      each: TokenType.EACH,
      as: TokenType.AS,
    }

    return keywords[value] ?? null
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      position: {
        line: this.line,
        column: this.column - value.length,
        offset: this.pos - value.length,
      },
    })
  }

  private current(): string {
    if (this.isAtEnd()) return '\0'
    return this.source[this.pos] || '\0'
  }

  private peek(): string {
    if (this.pos + 1 >= this.source.length) return '\0'
    return this.source[this.pos + 1] || '\0'
  }

  private advance(): void {
    this.pos++
    this.column++
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9'
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char)
  }
}
