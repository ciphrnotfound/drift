import { describe, test, expect } from 'vitest'
import { drift } from '../index'

describe('Drift Vite Plugin', () => {
  test('creates plugin with default options', () => {
    const plugin = drift()
    
    expect(plugin).toBeDefined()
    expect(plugin.name).toBe('drift')
    expect(plugin.resolveId).toBeDefined()
    expect(plugin.transform).toBeDefined()
    expect(plugin.handleHotUpdate).toBeDefined()
  })

  test('creates plugin with custom options', () => {
    const plugin = drift({
      tokensPath: './custom/tokens.drift',
      sourceMaps: true,
    })
    
    expect(plugin).toBeDefined()
    expect(plugin.name).toBe('drift')
  })

  test('resolveId handles .drift files', () => {
    const plugin = drift()
    
    // Test relative import
    const result = plugin.resolveId?.('./Button.drift', '/src/components/Card.drift', {})
    expect(result).toBeTruthy()
  })

  test('resolveId ignores non-.drift files', () => {
    const plugin = drift()
    
    const result = plugin.resolveId?.('./Button.tsx', '/src/components/Card.drift', {})
    expect(result).toBeNull()
  })
})
