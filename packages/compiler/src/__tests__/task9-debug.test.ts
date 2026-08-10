import { describe, test, expect } from 'vitest'
import { compile } from '../compiler'

describe('Task 9 Debug', () => {
  test('debug compilation errors', () => {
    const source = `import { Button } from './Button.drift'

component Card
  props
    title: string
  
  render
    <div>
      <h2>{props.title}</h2>
    </div>
`

    const result = compile(source, {
      filename: 'Card.drift',
    })

    console.log('Success:', result.success)
    console.log('Errors:', JSON.stringify(result.errors, null, 2))
    console.log('Files:', result.files.map(f => f.path))
    
    if (result.files.length > 0) {
      console.log('Card.tsx content:')
      const cardFile = result.files.find(f => f.path === 'Card.tsx')
      if (cardFile) {
        console.log(cardFile.content)
      }
    }
  })
})
