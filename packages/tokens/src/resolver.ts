import type { TokenRegistry, ResolvedToken } from '@drift/types'

/**
 * Resolve a token reference to its final value
 */
export function resolveToken(
  name: string,
  registry: TokenRegistry
): ResolvedToken {
  const visited = new Set<string>()
  return resolveTokenRecursive(name, registry, visited)
}

function resolveTokenRecursive(
  name: string,
  registry: TokenRegistry,
  visited: Set<string>
): ResolvedToken {
  // Check for circular dependencies
  if (visited.has(name)) {
    throw new Error(`Circular token dependency detected: ${name}`)
  }
  visited.add(name)

  // Parse token path (e.g., "color.ember" or "spacing.4")
  const parts = name.split('.')
  const category = parts[0]
  const tokenName = parts.slice(1).join('.')

  // Look up token in appropriate category
  let token: any
  let value: string

  switch (category) {
    case 'color':
    case 'colors':
      token = registry.colors.get(tokenName)
      if (!token) {
        throw new Error(`Undefined color token: ${name}`)
      }
      value = token.resolved
      break

    case 'space':
    case 'spacing':
      token = registry.spacing.get(tokenName)
      if (!token) {
        throw new Error(`Undefined spacing token: ${name}`)
      }
      value = token.resolved
      break

    case 'type':
    case 'typography':
      token = registry.typography.get(tokenName)
      if (!token) {
        throw new Error(`Undefined typography token: ${name}`)
      }
      value = token.resolved.fontSize
      break

    case 'ease':
    case 'easing':
      token = registry.easing.get(tokenName)
      if (!token) {
        throw new Error(`Undefined easing token: ${name}`)
      }
      value = token.resolved
      break

    case 'shadow':
    case 'shadows':
      token = registry.shadows.get(tokenName)
      if (!token) {
        throw new Error(`Undefined shadow token: ${name}`)
      }
      value = token.resolved
      break

    case 'border':
    case 'borders':
      token = registry.borders.get(tokenName)
      if (!token) {
        throw new Error(`Undefined border token: ${name}`)
      }
      value = `${token.resolved.width} ${token.resolved.style} ${token.resolved.color}`
      break

    case 'radius':
      token = registry.spacing.get(`radius.${tokenName}`)
      if (!token) {
        throw new Error(`Undefined radius token: ${name}`)
      }
      value = token.resolved
      break

    case 'duration':
      token = registry.spacing.get(`duration.${tokenName}`)
      if (!token) {
        throw new Error(`Undefined duration token: ${name}`)
      }
      value = token.resolved
      break

    default:
      throw new Error(`Unknown token category: ${category}`)
  }

  return {
    name,
    value,
    dependencies: Array.from(visited),
  }
}

/**
 * Resolve all token references in a value string
 * Handles values like "pad $space.4 $space.2"
 */
export function resolveTokenReferences(
  value: string,
  registry: TokenRegistry
): string {
  // Match $token.path patterns
  const tokenPattern = /\$([a-zA-Z][a-zA-Z0-9.]*)/g
  
  return value.replace(tokenPattern, (match, tokenPath) => {
    try {
      const resolved = resolveToken(tokenPath, registry)
      return resolved.value
    } catch (error) {
      // If token doesn't exist, return original
      return match
    }
  })
}

/**
 * Check if a token reference is valid
 */
export function isValidTokenReference(
  name: string,
  registry: TokenRegistry
): boolean {
  try {
    resolveToken(name, registry)
    return true
  } catch {
    return false
  }
}

/**
 * Get suggestions for similar token names (for error messages)
 */
export function getSimilarTokenNames(
  name: string,
  registry: TokenRegistry
): string[] {
  const allTokens: string[] = []

  // Collect all token names
  registry.colors.forEach((_, key) => allTokens.push(`color.${key}`))
  registry.spacing.forEach((_, key) => allTokens.push(`spacing.${key}`))
  registry.typography.forEach((_, key) => allTokens.push(`typography.${key}`))
  registry.easing.forEach((_, key) => allTokens.push(`easing.${key}`))
  registry.shadows.forEach((_, key) => allTokens.push(`shadow.${key}`))
  registry.borders.forEach((_, key) => allTokens.push(`border.${key}`))

  // Simple fuzzy matching based on edit distance
  const suggestions = allTokens
    .map((token) => ({
      token,
      distance: levenshteinDistance(name.toLowerCase(), token.toLowerCase()),
    }))
    .filter((item) => item.distance <= 3)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map((item) => item.token)

  return suggestions
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        )
      }
    }
  }

  return matrix[b.length]![a.length]!
}
