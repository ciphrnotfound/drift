import type { StyleResult, CSSRule } from '@drift/types'

/**
 * Generate CSS from extracted styles with responsive conflict resolution
 */
export function generateCSS(
  styleResult: StyleResult,
  responsiveStrategy: 'mobile-first' | 'desktop-first' = 'mobile-first'
): string {
  const lines: string[] = []

  // Generate base styles
  if (styleResult.baseStyles.length > 0) {
    lines.push(`.${styleResult.scopedClassName} {`)
    styleResult.baseStyles.forEach((rule) => {
      lines.push(`  ${formatCSSRule(rule)}`)
    })
    lines.push('}')
    lines.push('')
  }

  // Generate variant styles
  styleResult.variants.forEach((variant) => {
    const pseudoClasses = ['hover', 'focus', 'active', 'disabled', 'visited']
    
    variant.values.forEach((rules, valueName) => {
      // Check if it's a pseudo-class (and valueName matches variant name for simple states)
      if (pseudoClasses.includes(variant.name) && variant.name === valueName) {
        lines.push(`.${styleResult.scopedClassName}:${variant.name} {`)
      } else {
        const className = `${styleResult.scopedClassName}--${variant.name}-${valueName}`
        lines.push(`.${className} {`)
      }
      
      rules.forEach((rule) => {
        lines.push(`  ${formatCSSRule(rule)}`)
      })
      lines.push('}')
      lines.push('')
    })
  })

  // Generate responsive styles with conflict resolution
  const orderedResponsive = orderResponsiveBlocks(
    styleResult.responsive,
    responsiveStrategy
  )

  // Apply conflict resolution: later breakpoints override earlier ones
  const resolvedResponsive = resolveResponsiveConflicts(
    orderedResponsive,
    responsiveStrategy
  )

  resolvedResponsive.forEach((responsive) => {
    const mediaQuery =
      responsiveStrategy === 'mobile-first'
        ? `@media (min-width: ${responsive.minWidth}px)`
        : `@media (max-width: ${responsive.minWidth - 1}px)`

    lines.push(`${mediaQuery} {`)
    lines.push(`  .${styleResult.scopedClassName} {`)
    responsive.rules.forEach((rule) => {
      lines.push(`    ${formatCSSRule(rule)}`)
    })
    lines.push('  }')
    lines.push('}')
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Order responsive blocks based on strategy
 * Mobile-first: smallest to largest breakpoints
 * Desktop-first: largest to smallest breakpoints
 */
function orderResponsiveBlocks(
  responsive: Array<{ breakpoint: string; minWidth: number; rules: CSSRule[] }>,
  strategy: 'mobile-first' | 'desktop-first'
): Array<{ breakpoint: string; minWidth: number; rules: CSSRule[] }> {
  const sorted = [...responsive].sort((a, b) => {
    if (strategy === 'mobile-first') {
      return a.minWidth - b.minWidth // Ascending order
    } else {
      return b.minWidth - a.minWidth // Descending order
    }
  })

  return sorted
}

/**
 * Resolve conflicts when multiple responsive blocks define the same property
 * In mobile-first: later (larger) breakpoints override earlier ones
 * In desktop-first: later (smaller) breakpoints override earlier ones
 * 
 * This ensures proper CSS cascade where the last matching rule wins
 */
function resolveResponsiveConflicts(
  orderedResponsive: Array<{ breakpoint: string; minWidth: number; rules: CSSRule[] }>,
  _strategy: 'mobile-first' | 'desktop-first'
): Array<{ breakpoint: string; minWidth: number; rules: CSSRule[] }> {
  // Track which properties have been defined at each breakpoint
  const propertyTracker = new Map<string, Set<string>>()

  // Process blocks in order and track property conflicts
  orderedResponsive.forEach((responsive, index) => {
    const propertiesInBlock = new Set<string>()
    
    responsive.rules.forEach((rule) => {
      propertiesInBlock.add(rule.property)
    })

    propertyTracker.set(`${index}`, propertiesInBlock)
  })

  // The ordering already ensures correct cascade:
  // - Mobile-first: smaller breakpoints come first, larger override
  // - Desktop-first: larger breakpoints come first, smaller override
  // CSS cascade naturally handles this when rules are in the right order

  // Return the ordered blocks as-is - CSS cascade handles conflicts
  // The key is that we've ordered them correctly above
  return orderedResponsive
}

/**
 * Format a CSS rule as a string
 */
function formatCSSRule(rule: CSSRule): string {
  const important = rule.important ? ' !important' : ''
  return `${rule.property}: ${rule.value}${important};`
}

/**
 * Generate CSS with proper specificity handling
 */
export function generateCSSWithSpecificity(
  styleResults: StyleResult[],
  responsiveStrategy: 'mobile-first' | 'desktop-first' = 'mobile-first'
): string {
  const lines: string[] = []

  styleResults.forEach((result) => {
    lines.push(generateCSS(result, responsiveStrategy))
  })

  return lines.join('\n')
}
