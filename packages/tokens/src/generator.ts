import type { TokenRegistry, SpacingToken, ColorToken } from '@drift/types'

/**
 * Generate a scale of values from a base value and ratio
 */
export function generateScale(
  base: number,
  ratio: number,
  steps: number
): number[] {
  const scale: number[] = []

  for (let i = 0; i < steps; i++) {
    scale.push(Math.round(base * Math.pow(ratio, i)))
  }

  return scale
}

/**
 * Generate a spacing scale and add to registry
 */
export function generateSpacingScale(
  registry: TokenRegistry,
  base: number = 4,
  ratio: number = 1.5,
  steps: number = 10
): void {
  const scale = generateScale(base, ratio, steps)

  scale.forEach((value, index) => {
    const token: SpacingToken = {
      name: index.toString(),
      category: 'spacing',
      value,
      resolved: `${value}px`,
      scale,
    }
    registry.spacing.set(index.toString(), token)
  })
}

/**
 * Generate a typography scale and add to registry
 */
export function generateTypographyScale(
  registry: TokenRegistry,
  baseFontSize: number = 16,
  ratio: number = 1.25,
  steps: number = 8
): void {
  const scale = generateScale(baseFontSize, ratio, steps)

  const names = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl']

  scale.forEach((value, index) => {
    const name = names[index]
    if (name) {
      registry.typography.set(name, {
        name,
        category: 'typography',
        fontSize: `${value}px`,
        resolved: {
          fontSize: `${value}px`,
          fontWeight: '400',
          lineHeight: '1.5',
          letterSpacing: '0',
          fontFamily: 'system-ui',
        },
      })
    }
  })
}

/**
 * Generate a color scale from start and end colors
 * Creates shades from 50 (lightest) to 950 (darkest)
 */
export function generateColorScale(
  registry: TokenRegistry,
  name: string,
  startColor: string,
  endColor: string
): void {
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  const steps = shades.length

  // Parse hex colors
  const start = parseHexColor(startColor)
  const end = parseHexColor(endColor)

  shades.forEach((shade, index) => {
    const t = index / (steps - 1)
    const r = Math.round(start.r + (end.r - start.r) * t)
    const g = Math.round(start.g + (end.g - start.g) * t)
    const b = Math.round(start.b + (end.b - start.b) * t)

    const hexColor = rgbToHex(r, g, b)
    const tokenName = `${name}.${shade}`

    const token: ColorToken = {
      name: tokenName,
      category: 'color',
      value: hexColor,
      resolved: hexColor,
    }

    registry.colors.set(tokenName, token)
  })
}

/**
 * Parse a hex color string to RGB components
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace('#', '')

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return { r, g, b }
}

/**
 * Convert RGB components to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Generate TypeScript type definitions for a token registry
 */
export function generateTokenTypes(registry: TokenRegistry): string {
  const lines: string[] = []

  lines.push('// Auto-generated token types')
  lines.push('// Do not edit manually')
  lines.push('')

  // Color tokens
  if (registry.colors.size > 0) {
    lines.push('export type ColorToken =')
    const colorNames = Array.from(registry.colors.keys())
    colorNames.forEach((name, index) => {
      const isLast = index === colorNames.length - 1
      lines.push(`  | '${name}'${isLast ? '' : ''}`)
    })
    lines.push('')
  }

  // Spacing tokens
  if (registry.spacing.size > 0) {
    lines.push('export type SpacingToken =')
    const spacingNames = Array.from(registry.spacing.keys())
    spacingNames.forEach((name, index) => {
      const isLast = index === spacingNames.length - 1
      lines.push(`  | '${name}'${isLast ? '' : ''}`)
    })
    lines.push('')
  }

  // Typography tokens
  if (registry.typography.size > 0) {
    lines.push('export type TypographyToken =')
    const typeNames = Array.from(registry.typography.keys())
    typeNames.forEach((name, index) => {
      const isLast = index === typeNames.length - 1
      lines.push(`  | '${name}'${isLast ? '' : ''}`)
    })
    lines.push('')
  }

  // Easing tokens
  if (registry.easing.size > 0) {
    lines.push('export type EasingToken =')
    const easingNames = Array.from(registry.easing.keys())
    easingNames.forEach((name, index) => {
      const isLast = index === easingNames.length - 1
      lines.push(`  | '${name}'${isLast ? '' : ''}`)
    })
    lines.push('')
  }

  // Shadow tokens
  if (registry.shadows.size > 0) {
    lines.push('export type ShadowToken =')
    const shadowNames = Array.from(registry.shadows.keys())
    shadowNames.forEach((name, index) => {
      const isLast = index === shadowNames.length - 1
      lines.push(`  | '${name}'${isLast ? '' : ''}`)
    })
    lines.push('')
  }

  // Border tokens
  if (registry.borders.size > 0) {
    lines.push('export type BorderToken =')
    const borderNames = Array.from(registry.borders.keys())
    borderNames.forEach((name, index) => {
      const isLast = index === borderNames.length - 1
      lines.push(`  | '${name}'${isLast ? '' : ''}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}
