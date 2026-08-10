import { describe, test, expect } from 'vitest'
import { generateCSS } from '../generator'
import type { StyleResult } from '@drift/types'

describe('Responsive Conflict Resolution', () => {
  test('mobile-first: larger breakpoints override smaller ones', () => {
    const styleResult: StyleResult = {
      componentName: 'TestComponent',
      scopedClassName: 'test-component',
      baseStyles: [],
      variants: [],
      responsive: [
        {
          breakpoint: 'sm',
          minWidth: 640,
          rules: [
            { property: 'color', value: 'red', important: false },
            { property: 'font-size', value: '14px', important: false },
          ],
        },
        {
          breakpoint: 'md',
          minWidth: 768,
          rules: [
            { property: 'color', value: 'blue', important: false },
          ],
        },
        {
          breakpoint: 'lg',
          minWidth: 1024,
          rules: [
            { property: 'color', value: 'green', important: false },
          ],
        },
      ],
      cssOutput: '',
    }

    const css = generateCSS(styleResult, 'mobile-first')

    // Verify breakpoints are in ascending order (smallest to largest)
    const smIndex = css.indexOf('@media (min-width: 640px)')
    const mdIndex = css.indexOf('@media (min-width: 768px)')
    const lgIndex = css.indexOf('@media (min-width: 1024px)')

    expect(smIndex).toBeLessThan(mdIndex)
    expect(mdIndex).toBeLessThan(lgIndex)

    // Verify all color rules are present
    expect(css).toContain('color: red')
    expect(css).toContain('color: blue')
    expect(css).toContain('color: green')
  })

  test('desktop-first: smaller breakpoints override larger ones', () => {
    const styleResult: StyleResult = {
      componentName: 'TestComponent',
      scopedClassName: 'test-component',
      baseStyles: [],
      variants: [],
      responsive: [
        {
          breakpoint: 'sm',
          minWidth: 640,
          rules: [
            { property: 'color', value: 'red', important: false },
          ],
        },
        {
          breakpoint: 'md',
          minWidth: 768,
          rules: [
            { property: 'color', value: 'blue', important: false },
          ],
        },
        {
          breakpoint: 'lg',
          minWidth: 1024,
          rules: [
            { property: 'color', value: 'green', important: false },
          ],
        },
      ],
      cssOutput: '',
    }

    const css = generateCSS(styleResult, 'desktop-first')

    // Verify breakpoints are in descending order (largest to smallest)
    const lgIndex = css.indexOf('@media (max-width: 1023px)')
    const mdIndex = css.indexOf('@media (max-width: 767px)')
    const smIndex = css.indexOf('@media (max-width: 639px)')

    expect(lgIndex).toBeLessThan(mdIndex)
    expect(mdIndex).toBeLessThan(smIndex)

    // Verify all color rules are present
    expect(css).toContain('color: red')
    expect(css).toContain('color: blue')
    expect(css).toContain('color: green')
  })

  test('handles multiple properties with conflicts', () => {
    const styleResult: StyleResult = {
      componentName: 'TestComponent',
      scopedClassName: 'test-component',
      baseStyles: [
        { property: 'color', value: 'black', important: false },
        { property: 'font-size', value: '12px', important: false },
      ],
      variants: [],
      responsive: [
        {
          breakpoint: 'sm',
          minWidth: 640,
          rules: [
            { property: 'color', value: 'red', important: false },
            { property: 'font-size', value: '14px', important: false },
          ],
        },
        {
          breakpoint: 'md',
          minWidth: 768,
          rules: [
            { property: 'color', value: 'blue', important: false },
            { property: 'padding', value: '20px', important: false },
          ],
        },
      ],
      cssOutput: '',
    }

    const css = generateCSS(styleResult, 'mobile-first')

    // Base styles should come first
    expect(css.indexOf('color: black')).toBeLessThan(css.indexOf('color: red'))

    // Responsive styles should be in order
    expect(css.indexOf('color: red')).toBeLessThan(css.indexOf('color: blue'))

    // Non-conflicting properties should still be present
    expect(css).toContain('padding: 20px')
  })
})
