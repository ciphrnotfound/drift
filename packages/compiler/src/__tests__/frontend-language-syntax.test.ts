import { describe, expect, test } from 'vitest'
import { compile } from '../compiler'

describe('frontend language syntax', () => {
  test('parses grouped variants and responsive breakpoints', () => {
    const source = `component Button {
  props {
    variant: "primary" | "secondary"
  }

  style {
    layout: row center gap($space.2)
    pad: $space.3 $space.6

    variant {
      variant {
        primary {
          bg: $color.primary.500
          text: $color.white
        }

        secondary {
          bg: $color.gray.100
          text: $color.gray.900
        }
      }
    }

    responsive {
      md {
        pad: $space.4 $space.8
      }
    }
  }

  render {
    <button>{children}</button>
  }
}`

    const result = compile(source, { filename: 'Button.drift' })

    expect(result.errors).toEqual([])
    expect(result.success).toBe(true)

    const css = result.files.find(file => file.path === 'Button.css')?.content ?? ''
    expect(css).toContain('display: flex;')
    expect(css).toContain('justify-content: center;')
    expect(css).toContain('padding-top: var(--space-3);')
    expect(css).toMatch(/\.drift-button-[a-z0-9]+--variant-primary/)
    expect(css).toContain('@media (min-width: 768px)')
  })

  test('compiles prop defaults and class alias', () => {
    const source = `component Badge {
  props {
    tone: "info" | "success" = "info"
    pill?: boolean = true
  }

  style {
    pad: $space.1 $space.3
  }

  render {
    <span class="badge-shell" data-pill={pill}>{tone}</span>
  }
}`

    const result = compile(source, { filename: 'Badge.drift' })

    expect(result.errors).toEqual([])
    expect(result.success).toBe(true)

    const tsx = result.files.find(file => file.path === 'Badge.tsx')?.content ?? ''
    expect(tsx).toContain('tone?: "info" | "success"')
    expect(tsx).toContain('pill?: boolean')
    expect(tsx).toContain('export function Badge({ tone = "info", pill = true, className, tw, style, ...rest }: BadgeProps)')
    expect(tsx).toContain('className="badge-shell"')
  })

  test('compiles JSX expressions and prop spreads', () => {
    const source = `component Counter {
  props {
    count: number = 0
    setCount: Function
  }

  render {
    <button {...buttonProps} aria-label={count > 0 ? "Increment again" : "Increment"} onClick={() => setCount(count + 1)}>
      {count > 0 ? count : "Start"}
    </button>
  }
}`

    const result = compile(source, { filename: 'Counter.drift' })

    expect(result.errors).toEqual([])
    expect(result.success).toBe(true)

    const tsx = result.files.find(file => file.path === 'Counter.tsx')?.content ?? ''
    expect(tsx).toContain('{...buttonProps}')
    expect(tsx).toContain('aria-label={count > 0 ? "Increment again" : "Increment"}')
    expect(tsx).toContain('onClick={() => setCount(count + 1)}')
    expect(tsx).toContain('{count > 0 ? count : "Start"}')
  })

  test('preserves semantic prop kinds in the AST', async () => {
    const { parse } = await import('../parser')
    const ast = parse(`component Panel {
  props {
    title: string
    count: number = 0
    enabled: boolean = true
    items: string[]
    tone: "quiet" | "loud" = "quiet"
    data: Record<string, unknown>
  }
  render { <section>{title}</section> }
}`)

    expect(ast.components[0]?.props.map(prop => prop.propType.kind)).toEqual([
      'string', 'number', 'boolean', 'array', 'union', 'object',
    ])
  })

  test('supports aliased imports from React icon libraries', async () => {
    const { parse } = await import('../parser')
    const ast = parse(`import { ArrowRight as Arrow, Search } from "lucide-react"
component IconButton {
  render { <button><Search /><Arrow /></button> }
}`)

    expect(ast.imports[0]?.source).toBe('lucide-react')
    expect(ast.imports[0]?.specifiers).toEqual([
      { imported: 'ArrowRight', local: 'Arrow' },
      { imported: 'Search', local: 'Search' },
    ])
  })

  test('preserves shadcn, Hugeicons, Supabase, and Firebase ESM imports', () => {
    const source = `import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon } from "@hugeicons/core-free-icons"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { initializeApp as initializeFirebase } from "firebase/app"

component SearchAction {
  render {
    <Button aria-label="Search"><HugeiconsIcon icon={SearchIcon} size={18} /></Button>
  }
}`

    const result = compile(source, { filename: 'SearchAction.drift' })
    const tsx = result.files.find(file => file.path === 'SearchAction.tsx')?.content ?? ''

    expect(result.errors).toEqual([])
    expect(tsx).toContain("import { Button } from '@/components/ui/button'")
    expect(tsx).toContain("import { HugeiconsIcon } from '@hugeicons/react'")
    expect(tsx).toContain("import { SearchIcon } from '@hugeicons/core-free-icons'")
    expect(tsx).toContain("createClient as createSupabaseClient")
    expect(tsx).toContain("initializeApp as initializeFirebase")
  })
})
