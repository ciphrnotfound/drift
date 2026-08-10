/**
 * Fuzzy matching and suggestion utilities for error reporting
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to suggest corrections
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    if (matrix[0]) {
      matrix[0][j] = j
    }
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const row = matrix[i]
      const prevRow = matrix[i - 1]
      
      if (!row || !prevRow) continue

      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        row[j] = prevRow[j - 1] ?? 0
      } else {
        row[j] = Math.min(
          (prevRow[j - 1] ?? 0) + 1, // substitution
          (row[j - 1] ?? 0) + 1, // insertion
          (prevRow[j] ?? 0) + 1 // deletion
        )
      }
    }
  }

  const lastRow = matrix[b.length]
  return lastRow?.[a.length] ?? 0
}

/**
 * Find the closest matches for a given string from a list of candidates
 */
export function findClosestMatches(
  target: string,
  candidates: string[],
  maxDistance: number = 3,
  maxResults: number = 3
): string[] {
  if (candidates.length === 0) return []

  // Calculate distances for all candidates
  const distances = candidates.map((candidate) => ({
    candidate,
    distance: levenshteinDistance(target.toLowerCase(), candidate.toLowerCase()),
  }))

  // Filter by max distance and sort by distance
  const matches = distances
    .filter((item) => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
    .map((item) => item.candidate)

  return matches
}

/**
 * Generate suggestions for undefined tokens
 */
export function suggestTokens(
  undefinedToken: string,
  availableTokens: string[]
): string[] {
  const matches = findClosestMatches(undefinedToken, availableTokens, 3, 3)

  if (matches.length === 0) {
    return ['Check your drift.tokens file for available tokens']
  }

  return matches.map((match) => `Did you mean '${match}'?`)
}

/**
 * Generate suggestions for invalid syntax
 */
export function suggestSyntaxCorrection(
  invalidToken: string,
  expectedTokens: string[]
): string[] {
  const suggestions: string[] = []

  // Try to find close matches
  const matches = findClosestMatches(invalidToken, expectedTokens, 2, 2)

  if (matches.length > 0) {
    suggestions.push(...matches.map((match) => `Did you mean '${match}'?`))
  }

  // Add general syntax suggestions
  if (expectedTokens.length > 0) {
    suggestions.push(`Expected one of: ${expectedTokens.join(', ')}`)
  }

  return suggestions
}

/**
 * Generate suggestions for invalid property names
 */
export function suggestPropertyName(
  invalidProperty: string,
  validProperties: string[]
): string[] {
  const matches = findClosestMatches(invalidProperty, validProperties, 3, 3)

  if (matches.length === 0) {
    return ['Check the CSS property name spelling']
  }

  return matches.map((match) => `Did you mean '${match}'?`)
}

/**
 * Common CSS properties for suggestions
 */
export const COMMON_CSS_PROPERTIES = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background',
  'background-color',
  'background-image',
  'color',
  'font-size',
  'font-weight',
  'font-family',
  'line-height',
  'text-align',
  'text-decoration',
  'border',
  'border-radius',
  'border-width',
  'border-color',
  'border-style',
  'box-shadow',
  'opacity',
  'transform',
  'transition',
  'animation',
  'flex',
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'align-content',
  'grid',
  'grid-template-columns',
  'grid-template-rows',
  'gap',
  'z-index',
  'overflow',
  'cursor',
  'pointer-events',
]

/**
 * Common easing functions for suggestions
 */
export const COMMON_EASING_FUNCTIONS = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'cubic-bezier',
  'spring',
  'bounce',
]

/**
 * Generate suggestions for component names
 */
export function suggestComponentName(
  invalidName: string,
  availableComponents: string[]
): string[] {
  const matches = findClosestMatches(invalidName, availableComponents, 3, 3)

  if (matches.length === 0) {
    return ['Check the component name spelling or import path']
  }

  return matches.map((match) => `Did you mean '${match}'?`)
}

/**
 * Generate suggestions for missing closing tags
 */
export function suggestClosingTag(openTag: string): string[] {
  return [
    `Add closing tag: </${openTag}>`,
    'Check if the tag should be self-closing with />',
  ]
}

/**
 * Generate suggestions for indentation errors
 */
export function suggestIndentationFix(): string[] {
  return [
    'Check that indentation is consistent (use spaces or tabs, not both)',
    'Ensure nested blocks are indented by 2 or 4 spaces',
    'Verify that dedentation aligns with the opening block',
  ]
}
