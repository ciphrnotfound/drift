import { describe, test, expect } from 'vitest'
import { transformToJSX } from '../jsx-transformer'
import type { DriftAST } from '@drift/types'

describe('Task 9 Verification - Component Composition and Imports', () => {
  test('Requirements 9.4, 16.1: Import path resolution for Drift components', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [
        {
          type: 'ImportDeclaration',
          source: '../components/Button.drift',
          specifiers: [{ imported: 'Button', local: 'Button' }],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 40, offset: 40 },
            source: '',
          },
        },
        {
          type: 'ImportDeclaration',
          source: '@/ui/Input.drift',
          specifiers: [{ imported: 'Input', local: 'Input' }],
          location: {
            start: { line: 2, column: 1, offset: 41 },
            end: { line: 2, column: 35, offset: 75 },
            source: '',
          },
        },
      ],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'Form',
          props: [],
          styles: {
            type: 'StyleBlock',
            base: [],
            variants: [],
            responsive: [],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          motion: null,
          render: {
            type: 'RenderBlock',
            elements: [
              {
                type: 'JSXElement',
                tag: 'div',
                props: [],
                children: [],
                selfClosing: false,
                location: {
                  start: { line: 1, column: 1, offset: 0 },
                  end: { line: 1, column: 1, offset: 0 },
                  source: '',
                },
              },
            ],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
            source: '',
          },
        },
      ],
      motions: [],
      sourceMap: {
        version: 3,
        sources: [],
        names: [],
        mappings: '',
        sourcesContent: [],
      },
      location: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
        source: '',
      },
    }

    const result = transformToJSX(ast, {
      currentFilePath: 'src/pages/Form.drift',
      aliases: { '@': './src' },
    })
    const formCode = result.get('Form')

    expect(formCode).toBeDefined()
    // Verify relative import resolution
    expect(formCode).toContain("import { Button } from '../components/Button'")
    // Verify absolute import with alias resolution
    expect(formCode).toContain("import { Input } from './src/ui/Input'")
  })

  test('Requirement 16.2: Passing props to child components', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [
        {
          type: 'ImportDeclaration',
          source: './Button.drift',
          specifiers: [{ imported: 'Button', local: 'Button' }],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 30, offset: 30 },
            source: '',
          },
        },
      ],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'Card',
          props: [
            {
              type: 'PropDeclaration',
              name: 'label',
              propType: { kind: 'string', value: 'string' },
              optional: false,
              location: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 1, offset: 0 },
                source: '',
              },
            },
            {
              type: 'PropDeclaration',
              name: 'size',
              propType: { kind: 'string', value: '"sm" | "md" | "lg"' },
              optional: true,
              location: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 1, offset: 0 },
                source: '',
              },
            },
          ],
          styles: {
            type: 'StyleBlock',
            base: [],
            variants: [],
            responsive: [],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          motion: null,
          render: {
            type: 'RenderBlock',
            elements: [
              {
                type: 'JSXElement',
                tag: 'div',
                props: [],
                children: [
                  {
                    type: 'JSXElement',
                    tag: 'Button',
                    props: [
                      {
                        name: 'label',
                        value: { raw: 'props.label' },
                      },
                      {
                        name: 'size',
                        value: { raw: 'props.size || "md"' },
                      },
                    ],
                    children: [],
                    selfClosing: true,
                    location: {
                      start: { line: 1, column: 1, offset: 0 },
                      end: { line: 1, column: 1, offset: 0 },
                      source: '',
                    },
                  },
                ],
                selfClosing: false,
                location: {
                  start: { line: 1, column: 1, offset: 0 },
                  end: { line: 1, column: 1, offset: 0 },
                  source: '',
                },
              },
            ],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
            source: '',
          },
        },
      ],
      motions: [],
      sourceMap: {
        version: 3,
        sources: [],
        names: [],
        mappings: '',
        sourcesContent: [],
      },
      location: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
        source: '',
      },
    }

    const result = transformToJSX(ast)
    const cardCode = result.get('Card')

    expect(cardCode).toBeDefined()
    // Verify props are passed to child component
    expect(cardCode).toContain('<Button label={props.label} size={props.size || "md"} />')
  })

  test('Requirement 16.3: Passing children content to child components', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [
        {
          type: 'ImportDeclaration',
          source: './Container.drift',
          specifiers: [{ imported: 'Container', local: 'Container' }],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 35, offset: 35 },
            source: '',
          },
        },
      ],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'Layout',
          props: [],
          styles: {
            type: 'StyleBlock',
            base: [],
            variants: [],
            responsive: [],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          motion: null,
          render: {
            type: 'RenderBlock',
            elements: [
              {
                type: 'JSXElement',
                tag: 'Container',
                props: [],
                children: [
                  {
                    type: 'JSXExpression',
                    expression: 'props.children',
                    location: {
                      start: { line: 1, column: 1, offset: 0 },
                      end: { line: 1, column: 1, offset: 0 },
                      source: '',
                    },
                  },
                ],
                selfClosing: false,
                location: {
                  start: { line: 1, column: 1, offset: 0 },
                  end: { line: 1, column: 1, offset: 0 },
                  source: '',
                },
              },
            ],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
            source: '',
          },
        },
      ],
      motions: [],
      sourceMap: {
        version: 3,
        sources: [],
        names: [],
        mappings: '',
        sourcesContent: [],
      },
      location: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
        source: '',
      },
    }

    const result = transformToJSX(ast)
    const layoutCode = result.get('Layout')

    expect(layoutCode).toBeDefined()
    // Verify children are passed to child component
    expect(layoutCode).toContain('<Container>')
    expect(layoutCode).toContain('{props.children}')
    expect(layoutCode).toContain('</Container>')
    // Verify children prop is added to interface
    expect(layoutCode).toContain('children?: React.ReactNode')
  })

  test('Requirement 16.4: Prop spreading to child components', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [
        {
          type: 'ImportDeclaration',
          source: './Button.drift',
          specifiers: [{ imported: 'Button', local: 'Button' }],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 30, offset: 30 },
            source: '',
          },
        },
      ],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'IconButton',
          props: [
            {
              type: 'PropDeclaration',
              name: 'icon',
              propType: { kind: 'string', value: 'string' },
              optional: false,
              location: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 1, offset: 0 },
                source: '',
              },
            },
          ],
          styles: {
            type: 'StyleBlock',
            base: [],
            variants: [],
            responsive: [],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          motion: null,
          render: {
            type: 'RenderBlock',
            elements: [
              {
                type: 'JSXElement',
                tag: 'Button',
                props: [
                  {
                    name: '...',
                    value: { raw: 'props' },
                  },
                ],
                children: [
                  {
                    type: 'JSXElement',
                    tag: 'span',
                    props: [],
                    children: [
                      {
                        type: 'JSXExpression',
                        expression: 'props.icon',
                        location: {
                          start: { line: 1, column: 1, offset: 0 },
                          end: { line: 1, column: 1, offset: 0 },
                          source: '',
                        },
                      },
                    ],
                    selfClosing: false,
                    location: {
                      start: { line: 1, column: 1, offset: 0 },
                      end: { line: 1, column: 1, offset: 0 },
                      source: '',
                    },
                  },
                ],
                selfClosing: false,
                location: {
                  start: { line: 1, column: 1, offset: 0 },
                  end: { line: 1, column: 1, offset: 0 },
                  source: '',
                },
              },
            ],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
            source: '',
          },
        },
      ],
      motions: [],
      sourceMap: {
        version: 3,
        sources: [],
        names: [],
        mappings: '',
        sourcesContent: [],
      },
      location: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
        source: '',
      },
    }

    const result = transformToJSX(ast)
    const iconButtonCode = result.get('IconButton')

    expect(iconButtonCode).toBeDefined()
    // Verify prop spreading to child component
    expect(iconButtonCode).toContain('<Button {...props}>')
    expect(iconButtonCode).toContain('{props.icon}')
  })

  test('Complete integration: imports + composition + props + children + spreading', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [
        {
          type: 'ImportDeclaration',
          source: './Button.drift',
          specifiers: [{ imported: 'Button', local: 'Button' }],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 30, offset: 30 },
            source: '',
          },
        },
        {
          type: 'ImportDeclaration',
          source: '@/components/Card.drift',
          specifiers: [{ imported: 'Card', local: 'Card' }],
          location: {
            start: { line: 2, column: 1, offset: 31 },
            end: { line: 2, column: 40, offset: 70 },
            source: '',
          },
        },
      ],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'CompleteExample',
          props: [
            {
              type: 'PropDeclaration',
              name: 'title',
              propType: { kind: 'string', value: 'string' },
              optional: false,
              location: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 1, offset: 0 },
                source: '',
              },
            },
            {
              type: 'PropDeclaration',
              name: 'onSubmit',
              propType: { kind: 'custom', value: '() => void' },
              optional: true,
              location: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 1, offset: 0 },
                source: '',
              },
            },
          ],
          styles: {
            type: 'StyleBlock',
            base: [],
            variants: [],
            responsive: [],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          motion: null,
          render: {
            type: 'RenderBlock',
            elements: [
              {
                type: 'JSXElement',
                tag: 'Card',
                props: [
                  {
                    name: 'title',
                    value: { raw: 'props.title' },
                  },
                  {
                    name: '...',
                    value: { raw: 'props' },
                  },
                ],
                children: [
                  {
                    type: 'JSXExpression',
                    expression: 'props.children',
                    location: {
                      start: { line: 1, column: 1, offset: 0 },
                      end: { line: 1, column: 1, offset: 0 },
                      source: '',
                    },
                  },
                  {
                    type: 'JSXElement',
                    tag: 'Button',
                    props: [
                      {
                        name: 'onClick',
                        value: { raw: 'props.onSubmit' },
                      },
                    ],
                    children: [
                      {
                        type: 'JSXText',
                        value: 'Submit',
                        location: {
                          start: { line: 1, column: 1, offset: 0 },
                          end: { line: 1, column: 1, offset: 0 },
                          source: '',
                        },
                      },
                    ],
                    selfClosing: false,
                    location: {
                      start: { line: 1, column: 1, offset: 0 },
                      end: { line: 1, column: 1, offset: 0 },
                      source: '',
                    },
                  },
                ],
                selfClosing: false,
                location: {
                  start: { line: 1, column: 1, offset: 0 },
                  end: { line: 1, column: 1, offset: 0 },
                  source: '',
                },
              },
            ],
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
              source: '',
            },
          },
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
            source: '',
          },
        },
      ],
      motions: [],
      sourceMap: {
        version: 3,
        sources: [],
        names: [],
        mappings: '',
        sourcesContent: [],
      },
      location: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 },
        source: '',
      },
    }

    const result = transformToJSX(ast, {
      currentFilePath: 'src/pages/Example.drift',
      aliases: { '@': './src' },
    })
    const code = result.get('CompleteExample')

    expect(code).toBeDefined()
    
    // Verify imports are resolved correctly
    expect(code).toContain("import { Button } from './Button'")
    expect(code).toContain("import { Card } from './src/components/Card'")
    
    // Verify component interface includes all props
    expect(code).toContain('interface CompleteExampleProps')
    expect(code).toContain('title: string')
    expect(code).toContain('onSubmit?: () => void')
    expect(code).toContain('children?: React.ReactNode')
    
    // Verify component composition with props
    expect(code).toContain('title={props.title}')
    
    // Verify prop spreading
    expect(code).toContain('{...props}')
    
    // Verify children passing
    expect(code).toContain('{props.children}')
    
    // Verify nested component with props
    expect(code).toContain('onClick={props.onSubmit}')
    expect(code).toContain('Submit')
  })
})
