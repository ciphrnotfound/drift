import { describe, test, expect } from 'vitest'
import { transformToJSX } from '../jsx-transformer'
import type { DriftAST, ComponentDeclaration, ImportDeclaration } from '@drift/types'

describe('JSX Transformer - Import Resolution', () => {
  test('resolves relative imports from .drift files', () => {
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

    const result = transformToJSX(ast)
    const cardCode = result.get('Card')

    expect(cardCode).toBeDefined()
    expect(cardCode).toContain("import { Button } from './Button'")
  })

  test('resolves absolute imports with aliases', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [
        {
          type: 'ImportDeclaration',
          source: '@/components/Button.drift',
          specifiers: [{ imported: 'Button', local: 'Button' }],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 40, offset: 40 },
            source: '',
          },
        },
      ],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'Card',
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
      aliases: { '@': './src' },
    })
    const cardCode = result.get('Card')

    expect(cardCode).toBeDefined()
    expect(cardCode).toContain("import { Button } from './src/components/Button'")
  })

  test('handles multiple import specifiers', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [
        {
          type: 'ImportDeclaration',
          source: './components.drift',
          specifiers: [
            { imported: 'Button', local: 'Button' },
            { imported: 'Input', local: 'Input' },
          ],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 50, offset: 50 },
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

    const result = transformToJSX(ast)
    const formCode = result.get('Form')

    expect(formCode).toBeDefined()
    expect(formCode).toContain("import { Button, Input } from './components'")
  })
})

describe('JSX Transformer - Component Composition', () => {
  test('generates code for passing props to child components', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'Card',
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
                props: [
                  {
                    name: 'title',
                    value: { raw: 'props.title' },
                  },
                ],
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

    const result = transformToJSX(ast)
    const cardCode = result.get('Card')

    expect(cardCode).toBeDefined()
    expect(cardCode).toContain('title={props.title}')
  })

  test('generates code for passing children content', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'Container',
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
    const containerCode = result.get('Container')

    expect(containerCode).toBeDefined()
    expect(containerCode).toContain('{props.children}')
    expect(containerCode).toContain('children?: React.ReactNode')
  })

  test('generates code for prop spreading', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'Wrapper',
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
                props: [
                  {
                    name: '...',
                    value: { raw: 'props' },
                  },
                ],
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

    const result = transformToJSX(ast)
    const wrapperCode = result.get('Wrapper')

    expect(wrapperCode).toBeDefined()
    expect(wrapperCode).toContain('{...props}')
  })

  test('combines prop passing, children, and spreading', () => {
    const ast: DriftAST = {
      type: 'DriftFile',
      imports: [],
      tokens: [],
      components: [
        {
          type: 'Component',
          name: 'ComplexCard',
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
    const cardCode = result.get('ComplexCard')

    expect(cardCode).toBeDefined()
    expect(cardCode).toContain('title={props.title}')
    expect(cardCode).toContain('{...props}')
    expect(cardCode).toContain('{props.children}')
    expect(cardCode).toContain('children?: React.ReactNode')
  })
})
