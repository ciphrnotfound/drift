import { describe, test, expect } from 'vitest'
import { compile } from '../compiler'

describe('Task 9 Integration - Complete Compiler Pipeline', () => {
  test('compiles component with imports and composition', () => {
    const source = `import { Button } from './Button.drift'

style Card {
  pad $space.4
}

render Card({ title, onSubmit, children }) {
  <div>
    <h2>{title}</h2>
    <Button onClick={onSubmit}>Submit</Button>
    {children}
  </div>
}
`

    const result = compile(source, {
      filename: 'Card.drift',
      transformOptions: {
        currentFilePath: 'src/components/Card.drift',
      },
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    
    // Find the component file
    const componentFile = result.files.find(f => f.path === 'Card.tsx')
    expect(componentFile).toBeDefined()
    
    const code = componentFile!.content
    
    // Verify import resolution
    expect(code).toContain("import { Button } from './Button'")
    
    // Verify component interface
    expect(code).toContain('interface CardProps')
    expect(code).toContain('title')
    expect(code).toContain('onSubmit')
    
    // Verify component composition
    expect(code).toContain('{title}')
    expect(code).toContain('onClick={onSubmit}')
    expect(code).toContain('{children}')
  })

  test('compiles component with alias imports', () => {
    const source = `import { Button } from '@/components/Button.drift'
import { Card } from '@/ui/Card.drift'

render Form() {
  <Card>
    <Button />
  </Card>
}
`

    const result = compile(source, {
      filename: 'Form.drift',
      transformOptions: {
        currentFilePath: 'src/pages/Form.drift',
        aliases: { '@': './src' },
      },
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    
    const componentFile = result.files.find(f => f.path === 'Form.tsx')
    expect(componentFile).toBeDefined()
    
    const code = componentFile!.content
    
    // Verify alias resolution
    expect(code).toContain("import { Button } from './src/components/Button'")
    expect(code).toContain("import { Card } from './src/ui/Card'")
  })

  test('compiles component with prop spreading', () => {
    const source = `import { Button } from './Button.drift'

render IconButton({ icon }) {
  <Button>
    <span>{icon}</span>
  </Button>
}
`

    const result = compile(source, {
      filename: 'IconButton.drift',
      transformOptions: {
        currentFilePath: 'src/components/IconButton.drift',
      },
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    
    const componentFile = result.files.find(f => f.path === 'IconButton.tsx')
    expect(componentFile).toBeDefined()
    
    const code = componentFile!.content
    
    // Verify component renders
    expect(code).toContain('<Button>')
    expect(code).toContain('{icon}')
  })

  test('generates CSS and type definition files', () => {
    const source = `style Button {
  bg $color.primary
  text white
  pad $space.2 $space.4
}

render Button({ label }) {
  <button>{label}</button>
}
`

    const result = compile(source, {
      filename: 'Button.drift',
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    
    // Verify all output files are generated
    const componentFile = result.files.find(f => f.path === 'Button.tsx')
    const cssFile = result.files.find(f => f.path === 'Button.css')
    const typesFile = result.files.find(f => f.path === 'Button.d.ts')
    
    expect(componentFile).toBeDefined()
    expect(cssFile).toBeDefined()
    expect(typesFile).toBeDefined()
    
    // Verify CSS is generated
    expect(cssFile!.content).toContain('background')
    expect(cssFile!.content).toContain('padding')
    
    // Verify types are generated
    expect(typesFile!.content).toContain('ButtonProps')
    expect(typesFile!.content).toContain('label')
  })

  test('handles multiple components in single file', () => {
    const source = `import { Button } from './Button.drift'

style Card {
  pad $space.4
}

render Card({ title, children }) {
  <div>
    <h2>{title}</h2>
    {children}
  </div>
}

style CardWithButton {
  pad $space.2
}

render CardWithButton({ title, buttonLabel }) {
  <Card title={title}>
    <Button>{buttonLabel}</Button>
  </Card>
}
`

    const result = compile(source, {
      filename: 'Cards.drift',
      transformOptions: {
        currentFilePath: 'src/components/Cards.drift',
      },
    })

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    
    // Verify both components are generated
    const cardFile = result.files.find(f => f.path === 'Card.tsx')
    const cardWithButtonFile = result.files.find(f => f.path === 'CardWithButton.tsx')
    
    expect(cardFile).toBeDefined()
    expect(cardWithButtonFile).toBeDefined()
    
    // Verify Card component
    expect(cardFile!.content).toContain('export function Card')
    expect(cardFile!.content).toContain('{children}')
    
    // Verify CardWithButton component uses Card
    expect(cardWithButtonFile!.content).toContain('<Card title={title}>')
    expect(cardWithButtonFile!.content).toContain('<Button>')
  })
})
