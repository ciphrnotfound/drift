import { describe, expect, test } from 'vitest'
import { overlayScript } from '../overlay'

describe('Drift development diagnostics', () => {
  test('ships a compact, clickable error drawer', () => {
    expect(overlayScript).toContain('Drift diagnostics')
    expect(overlayScript).toContain('drift-dev-panel')
    expect(overlayScript).toContain('aria-expanded')
    expect(overlayScript).toContain('(import.meta.hot);')
  })

  test('clears stale diagnostics before a successful update', () => {
    expect(overlayScript).toMatch(/hot\.on\(["']vite:beforeUpdate["']/)
    expect(overlayScript).toContain('document.getElementById(ROOT_ID)?.remove()')
  })
})
