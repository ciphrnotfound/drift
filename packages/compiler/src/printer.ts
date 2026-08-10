import type {
  DriftAST,
  ComponentDeclaration,
  StyleBlock,
  StyleRule,
  JSXElement,
  ImportDeclaration,
  TokenReference,
} from '@drift/types'

export class Printer {
  private indent: number = 0
  private indentSize: number = 2

  print(ast: DriftAST): string {
    const lines: string[] = []

    // Print imports
    ast.imports.forEach((imp) => {
      lines.push(this.printImport(imp))
    })

    if (ast.imports.length > 0) {
      lines.push('')
    }

    // Print components
    ast.components.forEach((component, index) => {
      if (index > 0) lines.push('')
      lines.push(this.printComponent(component))
    })

    return lines.join('\n')
  }

  private printImport(imp: ImportDeclaration): string {
    const specifiers = imp.specifiers.map((s) => s.imported).join(', ')
    if (imp.specifiers.length > 1) {
      return `import { ${specifiers} } from "${imp.source}"`
    }
    return `import ${specifiers} from "${imp.source}"`
  }

  private printComponent(component: ComponentDeclaration): string {
    const lines: string[] = []

    // Print style block
    if (component.styles.base.length > 0 || component.styles.variants.length > 0) {
      lines.push(this.printStyleBlock(component.name, component.styles))
      lines.push('')
    }

    // Print render block
    lines.push(this.printRenderBlock(component.name, component))

    return lines.join('\n')
  }

  private printStyleBlock(name: string, styles: StyleBlock): string {
    const lines: string[] = []

    lines.push(`style ${name}`)
    this.indent++

    // Print base styles
    styles.base.forEach((rule) => {
      lines.push(this.printIndent() + this.printStyleRule(rule))
    })

    // Print variants
    styles.variants.forEach((variant) => {
      lines.push('')
      lines.push(this.printIndent() + `# ${variant.name} variant`)
      variant.values.forEach((value) => {
        lines.push(this.printIndent() + value.name)
        this.indent++
        value.styles.forEach((rule) => {
          lines.push(this.printIndent() + this.printStyleRule(rule))
        })
        this.indent--
      })
    })

    // Print responsive blocks
    styles.responsive.forEach((responsive) => {
      lines.push('')
      lines.push(this.printIndent() + responsive.breakpoint)
      this.indent++
      responsive.styles.forEach((rule) => {
        lines.push(this.printIndent() + this.printStyleRule(rule))
      })
      this.indent--
    })

    this.indent--

    return lines.join('\n')
  }

  private printStyleRule(rule: StyleRule): string {
    const value = this.printStyleValue(rule.value)
    return `${rule.property}   ${value}`
  }

  private printStyleValue(value: string | TokenReference): string {
    if (typeof value === 'string') {
      return value
    }
    // Token reference
    return `$${value.path.join('.')}`
  }

  private printRenderBlock(
    name: string,
    component: ComponentDeclaration
  ): string {
    const lines: string[] = []

    // Print render signature
    const props = component.props.map((p) => p.name).join(', ')
    lines.push(`render ${name}${props ? ` (${props})` : ''}`)

    this.indent++

    // Print JSX elements
    component.render.elements.forEach((element) => {
      lines.push(this.printIndent() + this.printJSXElement(element))
    })

    this.indent--

    return lines.join('\n')
  }

  private printJSXElement(element: JSXElement): string {
    const lines: string[] = []

    // Opening tag
    let opening = `<${element.tag}`

    // Add props
    element.props.forEach((prop) => {
      if (typeof prop.value === 'string') {
        if (prop.value === 'true') {
          opening += ` ${prop.name}`
        } else {
          opening += ` ${prop.name}="${prop.value}"`
        }
      } else {
        opening += ` ${prop.name}={${prop.value.raw}}`
      }
    })

    if (element.selfClosing) {
      opening += ' />'
      return opening
    }

    opening += '>'

    // Children
    if (element.children.length === 0) {
      return opening + `</${element.tag}>`
    }

    if (element.children.length === 1) {
      const child = element.children[0]
      if (child && child.type === 'JSXText') {
        return opening + (child as any).value + `</${element.tag}>`
      }
      if (child && child.type === 'JSXExpression') {
        return opening + `{${(child as any).expression}}` + `</${element.tag}>`
      }
    }

    // Multi-line children
    lines.push(opening)
    this.indent++

    element.children.forEach((child) => {
      if (child.type === 'JSXElement') {
        lines.push(this.printIndent() + this.printJSXElement(child))
      } else if (child.type === 'JSXText') {
        lines.push(this.printIndent() + child.value)
      } else if (child.type === 'JSXExpression') {
        lines.push(this.printIndent() + `{${child.expression}}`)
      }
    })

    this.indent--
    lines.push(this.printIndent() + `</${element.tag}>`)

    return lines.join('\n')
  }

  private printIndent(): string {
    return ' '.repeat(this.indent * this.indentSize)
  }
}

export function print(ast: DriftAST): string {
  const printer = new Printer()
  return printer.print(ast)
}
