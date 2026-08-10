import type {
  TokenRegistry,
  ColorToken,
  SpacingToken,
  TypographyToken,
  EasingToken,
  ShadowToken,
  BorderToken,
} from '@drift/types'

/**
 * Parse a drift.tokens file into a TokenRegistry.
 * Supports curly-brace format:
 *   colors {
 *     primary.500: #3b82f6
 *   }
 */
export function parseTokens(source: string): TokenRegistry {
  const registry: TokenRegistry = {
    colors: new Map(),
    spacing: new Map(),
    typography: new Map(),
    easing: new Map(),
    shadows: new Map(),
    borders: new Map(),
    fonts: new Map(),
  }

  let currentCategory: string | null = null

  for (const raw of source.split('\n')) {
    const line = raw.trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('#')) continue

    // Category opening:  "colors {" or "spacing {"
    const catMatch = line.match(/^(\w+)\s*\{/)
    if (catMatch) {
      currentCategory = catMatch[1]!.toLowerCase()
      continue
    }

    // Category close
    if (line === '}') {
      currentCategory = null
      continue
    }

    // Token line:  "key.sub: value"
    if (currentCategory && line.includes(':')) {
      const colonIdx = line.indexOf(':')
      const key = line.slice(0, colonIdx).trim()
      const value = line.slice(colonIdx + 1).trim()
      if (key && value) {
        parseEntry(key, value, currentCategory, registry)
      }
    }
  }

  return registry
}

function parseEntry(
  key: string,
  value: string,
  category: string,
  registry: TokenRegistry
): void {
  switch (category) {
    case 'color':
    case 'colors':
      registry.colors.set(key, {
        name: key,
        category: 'color',
        value,
        resolved: value,
      } as ColorToken)
      break

    case 'space':
    case 'spacing': {
      // "scale" and "base" are meta-values — store them but also generate scale tokens
      if (key === 'scale' || key === 'base') {
        // Store as meta for runtime use; also generate numeric scale entries
        generateSpacingScale(registry, key, value)
      } else {
        registry.spacing.set(key, {
          name: key,
          category: 'spacing',
          value,
          resolved: value,
        } as SpacingToken)
      }
      break
    }

    case 'typography':
    case 'type': {
      if (key === 'scale' || key === 'base') {
        generateTypographyScale(registry, key, value)
      } else {
        registry.typography.set(key, {
          name: key,
          category: 'typography',
          fontSize: value,
          fontWeight: '400',
          lineHeight: '1.5',
          resolved: {
            fontSize: value,
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            fontFamily: 'system-ui',
          },
        } as TypographyToken)
      }
      break
    }

    case 'easing':
    case 'ease':
      registry.easing.set(key, {
        name: key,
        category: 'easing',
        value,
        resolved: value,
      } as EasingToken)
      break

    case 'shadow':
    case 'shadows':
      registry.shadows.set(key, {
        name: key,
        category: 'shadow',
        value,
        resolved: value,
      } as ShadowToken)
      break

    case 'border':
    case 'borders': {
      // "radius.md: 6px"  or  "width.thin: 1px"
      const parts = value.split(/\s+/)
      const isRadius = key.startsWith('radius.')
      const isWidth = key.startsWith('width.')
      if (isRadius) {
        // Store as spacing token so $border.radius.md resolves
        registry.spacing.set(key, {
          name: key,
          category: 'spacing',
          value: parseInt(parts[0] ?? '0', 10),
          resolved: parts[0] ?? '0px',
        } as SpacingToken)
      } else if (isWidth) {
        registry.borders.set(key, {
          name: key,
          category: 'border',
          width: parts[0] ?? '1px',
          style: 'solid',
          color: 'currentColor',
          radius: '0',
          resolved: {
            width: parts[0] ?? '1px',
            style: 'solid',
            color: 'currentColor',
            radius: '0',
          },
        } as BorderToken)
      } else {
        registry.borders.set(key, {
          name: key,
          category: 'border',
          width: parts[0] ?? '1px',
          style: parts[1] ?? 'solid',
          color: parts[2] ?? '#e5e7eb',
          radius: '0',
          resolved: {
            width: parts[0] ?? '1px',
            style: parts[1] ?? 'solid',
            color: parts[2] ?? '#e5e7eb',
            radius: '0',
          },
        } as BorderToken)
      }
      break
    }

    case 'font':
    case 'fonts':
      parseFontEntry(key, value, registry)
      break
  }
}

/** Generate numeric spacing scale from scale/base meta-values */
function generateSpacingScale(registry: TokenRegistry, key: string, value: string): void {
  // Store meta
  registry.spacing.set(`__meta_${key}`, {
    name: key,
    category: 'spacing',
    value,
    resolved: value,
  } as SpacingToken)

  // After storing meta, try to generate scale if both are present
  const scaleMeta = registry.spacing.get('__meta_scale')
  const baseMeta = registry.spacing.get('__meta_base')
  if (!scaleMeta || !baseMeta) return

  const baseNum = parseFloat(baseMeta.resolved)
  const scaleNum = parseFloat(scaleMeta.resolved)
  if (isNaN(baseNum) || isNaN(scaleNum)) return

  // Generate tokens $space.1 through $space.20
  for (let i = 1; i <= 20; i++) {
    const px = Math.round(baseNum * Math.pow(scaleNum, i - 1))
    registry.spacing.set(String(i), {
      name: String(i),
      category: 'spacing',
      value: px,
      resolved: `${px}px`,
    } as SpacingToken)
  }
}

/** Generate typography scale from scale/base meta-values */
function generateTypographyScale(registry: TokenRegistry, key: string, value: string): void {
  registry.typography.set(`__meta_${key}`, {
    name: key,
    category: 'typography',
    fontSize: value,
    fontWeight: '400',
    lineHeight: '1.5',
    resolved: { fontSize: value, fontWeight: '400', lineHeight: '1.5', letterSpacing: '0', fontFamily: 'system-ui' },
  } as TypographyToken)

  const scaleMeta = registry.typography.get('__meta_scale')
  const baseMeta = registry.typography.get('__meta_base')
  if (!scaleMeta || !baseMeta) return

  const baseNum = parseFloat(baseMeta.resolved.fontSize)
  const scaleNum = parseFloat(scaleMeta.resolved.fontSize)
  if (isNaN(baseNum) || isNaN(scaleNum)) return

  const steps: Array<[string, number]> = [
    ['xs', -2], ['sm', -1], ['base', 0], ['lg', 1], ['xl', 2],
    ['2xl', 3], ['3xl', 4], ['4xl', 5],
  ]

  for (const [name, exp] of steps) {
    const px = Math.round(baseNum * Math.pow(scaleNum, exp) * 10) / 10
    const token: TypographyToken = {
      name,
      category: 'typography',
      fontSize: `${px}px`,
      fontWeight: '400',
      lineHeight: '1.5',
      resolved: { fontSize: `${px}px`, fontWeight: '400', lineHeight: '1.5', letterSpacing: '0', fontFamily: 'system-ui' },
    }
    registry.typography.set(name, token)
  }
}

function parseFontEntry(name: string, value: string, registry: TokenRegistry): void {
  // Format: "google:Inter weights:400,700 subsets:latin"
  //      or "google:Roboto weights:400,500"
  const parts = value.split(/\s+/)
  const providerPart = parts[0]
  if (!providerPart) return

  const [provider, family] = providerPart.split(':')
  const weightsStr = parts.find(p => p.startsWith('weights:'))?.split(':')[1]
  const subsetsStr = parts.find(p => p.startsWith('subsets:'))?.split(':')[1]

  registry.fonts.set(name, {
    name,
    category: 'font',
    provider: provider ?? 'system',
    family: family ?? 'Inter',
    weights: weightsStr ? weightsStr.split(',').map(Number) : undefined,
    subsets: subsetsStr ? subsetsStr.split(',') : undefined,
    display: 'swap',
    preload: true,
  } as any)
}
