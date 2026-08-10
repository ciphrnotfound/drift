import { describe, test, expect, vi } from 'vitest'
import { drift } from '../index'

describe('Drift Vite Plugin - Transform', () => {
  test.skip('transforms .drift file to JavaScript', async () => {
    const plugin = drift()
    
    const driftSource = `component Button
  props
    label: string
  
  render
    <button>{props.label}</button>
`

    // Mock the transform context
    const context = {
      error: vi.fn(),
      addWatchFile: vi.fn(),
    }

    const result = await plugin.transform?.call(
      context,
      driftSource,
      '/src/components/Button.drift'
    )

    expect(result).toBeDefined()
    if (result && typeof result === 'object' && 'code' in result) {
      expect(result.code).toContain('export')
      expect(result.code).toContain('Button')
    }
  })

  test('returns null for non-.drift files', async () => {
    const plugin = drift()
    
    const result = await plugin.transform?.call(
      {},
      'const x = 1',
      '/src/components/Button.tsx'
    )

    expect(result).toBeNull()
  })

  test('handles compilation errors gracefully', async () => {
    const plugin = drift()
    
    const invalidSource = `component Button
  invalid syntax here`

    const context = {
      error: vi.fn(),
      addWatchFile: vi.fn(),
    }

    await expect(
      plugin.transform?.call(
        context,
        invalidSource,
        '/src/components/Button.drift'
      )
    ).rejects.toThrow()
  })
})
