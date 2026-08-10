import type { DriftAST, StyleRule, TokenReference, TokenRegistry } from '@drift/types'
import { ErrorCode, ErrorCollector } from './errors'
import { suggestTokens } from './suggestions'

/**
 * Resolve all token references in an AST
 */
export function resolveTokensInAST(
  ast: DriftAST,
  tokenRegistry: TokenRegistry,
  filename: string = '<unknown>',
  errorCollector?: ErrorCollector
): DriftAST {
  const collector = errorCollector || new ErrorCollector()

  // Clone the AST to avoid mutations
  const resolvedAST = { ...ast }

  // Resolve tokens in each component
  resolvedAST.components = ast.components.map((component) => ({
    ...component,
    styles: {
      ...component.styles,
      base: component.styles.base.map((rule) =>
        resolveTokenInStyleRule(rule, tokenRegistry, filename, collector)
      ),
      variants: component.styles.variants.map((variant) => ({
        ...variant,
        values: variant.values.map((value) => ({
          ...value,
          styles: value.styles.map((rule) =>
            resolveTokenInStyleRule(rule, tokenRegistry, filename, collector)
          ),
        })),
      })),
      responsive: component.styles.responsive.map((responsive) => ({
        ...responsive,
        styles: responsive.styles.map((rule) =>
          resolveTokenInStyleRule(rule, tokenRegistry, filename, collector)
        ),
      })),
    },
  }))

  return resolvedAST
}

/**
 * Resolve token reference in a style rule
 */
function resolveTokenInStyleRule(
  rule: StyleRule,
  tokenRegistry: TokenRegistry,
  filename: string,
  errorCollector: ErrorCollector
): StyleRule {
  if (typeof rule.value === 'string') {
    // Already a string value, check if it contains token references
    if (rule.value.includes('$')) {
      return {
        ...rule,
        value: resolveTokenReferencesInString(rule.value, tokenRegistry, filename, errorCollector, rule.location),
      }
    }
    return rule
  }

  // Token reference object
  const tokenRef = rule.value as TokenReference
  const tokenPath = tokenRef.path.join('.')

  try {
    const resolved = resolveTokenPath(tokenPath, tokenRegistry, filename, errorCollector, rule.location)
    return {
      ...rule,
      value: resolved,
    }
  } catch (error) {
    // Error already collected, keep the original reference
    return rule
  }
}

/**
 * Resolve token references in a string value
 */
function resolveTokenReferencesInString(
  value: string,
  tokenRegistry: TokenRegistry,
  filename: string,
  errorCollector: ErrorCollector,
  location: any
): string {
  return value.replace(/\$([a-zA-Z][a-zA-Z0-9.]*)/g, (_match, tokenPath) => {
    try {
      return resolveTokenPath(tokenPath, tokenRegistry, filename, errorCollector, location)
    } catch {
      // Return as CSS variable if resolution fails
      return `var(--${tokenPath.replace(/\./g, '-')})`
    }
  })
}

/**
 * Resolve a token path to its value
 */
function resolveTokenPath(
  path: string,
  tokenRegistry: TokenRegistry,
  filename: string,
  errorCollector: ErrorCollector,
  location: any
): string {
  const parts = path.split('.')
  const category = parts[0]
  const tokenName = parts.slice(1).join('.')

  // Get all available tokens for suggestions
  const getAllTokenNames = (): string[] => {
    const names: string[] = []
    tokenRegistry.colors.forEach((_, key) => names.push(`colors.${key}`))
    tokenRegistry.spacing.forEach((_, key) => names.push(`spacing.${key}`))
    tokenRegistry.typography.forEach((_, key) => names.push(`typography.${key}`))
    tokenRegistry.easing.forEach((_, key) => names.push(`easing.${key}`))
    tokenRegistry.shadows.forEach((_, key) => names.push(`shadows.${key}`))
    tokenRegistry.borders.forEach((_, key) => names.push(`borders.${key}`))
    return names
  }

  switch (category) {
    case 'color':
    case 'colors': {
      const token = tokenRegistry.colors.get(tokenName)
      if (!token) {
        const availableTokens = Array.from(tokenRegistry.colors.keys()).map(k => `colors.${k}`)
        const suggestions = suggestTokens(path, availableTokens)
        errorCollector.error({
          code: ErrorCode.TOKEN_UNDEFINED,
          message: `Undefined color token: ${path}`,
          file: filename,
          location,
          suggestions,
        })
        return `var(--color-${tokenName})`
      }
      return token.resolved
    }

    case 'space':
    case 'spacing': {
      const token = tokenRegistry.spacing.get(tokenName)
      if (!token) {
        const availableTokens = Array.from(tokenRegistry.spacing.keys()).map(k => `spacing.${k}`)
        const suggestions = suggestTokens(path, availableTokens)
        errorCollector.error({
          code: ErrorCode.TOKEN_UNDEFINED,
          message: `Undefined spacing token: ${path}`,
          file: filename,
          location,
          suggestions,
        })
        return `var(--spacing-${tokenName})`
      }
      return token.resolved
    }

    case 'type':
    case 'typography': {
      const token = tokenRegistry.typography.get(tokenName)
      if (!token) {
        const availableTokens = Array.from(tokenRegistry.typography.keys()).map(k => `typography.${k}`)
        const suggestions = suggestTokens(path, availableTokens)
        errorCollector.error({
          code: ErrorCode.TOKEN_UNDEFINED,
          message: `Undefined typography token: ${path}`,
          file: filename,
          location,
          suggestions,
        })
        return `var(--type-${tokenName})`
      }
      return token.resolved.fontSize
    }

    case 'ease':
    case 'easing': {
      const token = tokenRegistry.easing.get(tokenName)
      if (!token) {
        const availableTokens = Array.from(tokenRegistry.easing.keys()).map(k => `easing.${k}`)
        const suggestions = suggestTokens(path, availableTokens)
        errorCollector.error({
          code: ErrorCode.TOKEN_UNDEFINED,
          message: `Undefined easing token: ${path}`,
          file: filename,
          location,
          suggestions,
        })
        return `var(--ease-${tokenName})`
      }
      return token.resolved
    }

    case 'shadow':
    case 'shadows': {
      const token = tokenRegistry.shadows.get(tokenName)
      if (!token) {
        const availableTokens = Array.from(tokenRegistry.shadows.keys()).map(k => `shadows.${k}`)
        const suggestions = suggestTokens(path, availableTokens)
        errorCollector.error({
          code: ErrorCode.TOKEN_UNDEFINED,
          message: `Undefined shadow token: ${path}`,
          file: filename,
          location,
          suggestions,
        })
        return `var(--shadow-${tokenName})`
      }
      return token.resolved
    }

    case 'border':
    case 'borders': {
      if (tokenName.startsWith('radius.')) {
        const radius = tokenRegistry.spacing.get(tokenName)
        if (radius) return radius.resolved
      }

      if (tokenName.startsWith('width.')) {
        const width = tokenRegistry.borders.get(tokenName)
        if (width) return width.resolved.width
      }

      const token = tokenRegistry.borders.get(tokenName)
      if (!token) {
        const availableTokens = Array.from(tokenRegistry.borders.keys()).map(k => `borders.${k}`)
        const suggestions = suggestTokens(path, availableTokens)
        errorCollector.error({
          code: ErrorCode.TOKEN_UNDEFINED,
          message: `Undefined border token: ${path}`,
          file: filename,
          location,
          suggestions,
        })
        return `var(--border-${tokenName})`
      }
      return `${token.resolved.width} ${token.resolved.style} ${token.resolved.color}`
    }

    case 'radius': {
      const token = tokenRegistry.spacing.get(`radius.${tokenName}`)
      if (!token) {
        const suggestions = suggestTokens(path, getAllTokenNames())
        errorCollector.error({
          code: ErrorCode.TOKEN_UNDEFINED,
          message: `Undefined radius token: ${path}`,
          file: filename,
          location,
          suggestions,
        })
        return `var(--radius-${tokenName})`
      }
      return token.resolved
    }

    case 'duration': {
      const token = tokenRegistry.spacing.get(`duration.${tokenName}`)
      if (!token) {
        const suggestions = suggestTokens(path, getAllTokenNames())
        errorCollector.error({
          code: ErrorCode.TOKEN_UNDEFINED,
          message: `Undefined duration token: ${path}`,
          file: filename,
          location,
          suggestions,
        })
        return `var(--duration-${tokenName})`
      }
      return token.resolved
    }

    default: {
      const suggestions = suggestTokens(path, getAllTokenNames())
      errorCollector.error({
        code: ErrorCode.TOKEN_INVALID_REFERENCE,
        message: `Invalid token reference: ${path}`,
        file: filename,
        location,
        suggestions,
      })
      return `var(--${path.replace(/\./g, '-')})`
    }
  }
}
