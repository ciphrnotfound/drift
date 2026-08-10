import { describe, expect, test } from 'vitest'
import { expandShorthand } from '../extractor'

describe('Drift style shorthands', () => {
  test('expands directional spacing', () => {
    expect(expandShorthand('px', '$space.4')).toEqual([
      { property: 'padding-left', value: '$space.4', important: false },
      { property: 'padding-right', value: '$space.4', important: false },
    ])

    expect(expandShorthand('my', '1rem')).toEqual([
      { property: 'margin-top', value: '1rem', important: false },
      { property: 'margin-bottom', value: '1rem', important: false },
    ])
  })

  test('expands size and visual aliases', () => {
    expect(expandShorthand('size', '44px')).toEqual([
      { property: 'width', value: '44px', important: false },
      { property: 'height', value: '44px', important: false },
    ])

    expect(expandShorthand('radius', '$radius.md')).toEqual([
      { property: 'border-radius', value: '$radius.md', important: false },
    ])

    expect(expandShorthand('shadow', 'md')).toEqual([
      { property: 'box-shadow', value: '0 8px 24px rgb(15 23 42 / 0.12)', important: false },
    ])
  })

  test('expands border helpers', () => {
    expect(expandShorthand('border', '1px solid $color.gray.200')).toEqual([
      { property: 'border', value: '1px solid $color.gray.200', important: false },
    ])

    expect(expandShorthand('border', 'color($color.primary.500)')).toEqual([
      { property: 'border-color', value: '$color.primary.500', important: false },
    ])
  })
})
