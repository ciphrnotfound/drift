import type { CSSOptimizationResult } from '@drift/types'

/**
 * Optimize CSS by removing unused rules, merging duplicates, and minifying
 */
export function optimizeCSS(css: string): CSSOptimizationResult {
  const original = css
  const sizeBefore = css.length

  let optimized = css

  // Remove comments
  optimized = removeComments(optimized)

  // Remove duplicate rules
  const { css: deduplicated, mergedCount } = removeDuplicateRules(optimized)
  optimized = deduplicated

  // Minify
  optimized = minifyCSS(optimized)

  const sizeAfter = optimized.length

  return {
    original,
    optimized,
    removedRules: 0,
    mergedRules: mergedCount,
    sizeBefore,
    sizeAfter,
  }
}

/**
 * Remove CSS comments
 */
function removeComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/**
 * Remove duplicate CSS rules
 */
function removeDuplicateRules(css: string): { css: string; mergedCount: number } {
  const rules = new Map<string, string>()
  let mergedCount = 0

  // Parse CSS into rules
  const rulePattern = /([^{]+)\{([^}]+)\}/g
  let match

  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1]?.trim()
    const declarations = match[2]?.trim()

    if (!selector || !declarations) continue

    if (rules.has(selector)) {
      // Merge declarations
      const existing = rules.get(selector)!
      rules.set(selector, `${existing}; ${declarations}`)
      mergedCount++
    } else {
      rules.set(selector, declarations)
    }
  }

  // Rebuild CSS
  const rebuilt: string[] = []
  rules.forEach((declarations, selector) => {
    rebuilt.push(`${selector} { ${declarations} }`)
  })

  return {
    css: rebuilt.join('\n'),
    mergedCount,
  }
}

/**
 * Minify CSS
 */
export function minifyCSS(css: string): string {
  return css
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*{\s*/g, '{') // Remove space around {
    .replace(/\s*}\s*/g, '}') // Remove space around }
    .replace(/\s*:\s*/g, ':') // Remove space around :
    .replace(/\s*;\s*/g, ';') // Remove space around ;
    .replace(/;\s*}/g, '}') // Remove last semicolon
    .trim()
}

/**
 * Remove unused CSS rules based on used class names
 */
export function removeUnusedCSS(
  css: string,
  usedClassNames: Set<string>
): string {
  const rules: string[] = []
  const rulePattern = /([^{]+)\{([^}]+)\}/g
  let match

  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1]?.trim()
    const declarations = match[2]?.trim()

    if (!selector || !declarations) continue

    // Check if selector contains any used class names
    const isUsed = Array.from(usedClassNames).some((className) =>
      selector.includes(`.${className}`)
    )

    if (isUsed) {
      rules.push(`${selector} { ${declarations} }`)
    }
  }

  return rules.join('\n')
}

/**
 * Merge duplicate CSS declarations
 */
export function mergeDuplicateDeclarations(css: string): string {
  const rulePattern = /([^{]+)\{([^}]+)\}/g
  const rules: string[] = []
  let match

  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1]?.trim()
    const declarations = match[2]?.trim()

    if (!selector || !declarations) continue

    // Parse declarations
    const declMap = new Map<string, string>()
    declarations.split(';').forEach((decl) => {
      const parts = decl.split(':').map((s) => s.trim())
      const prop = parts[0]
      const value = parts[1]
      if (prop && value) {
        declMap.set(prop, value)
      }
    })

    // Rebuild declarations
    const merged = Array.from(declMap.entries())
      .map(([prop, value]) => `${prop}: ${value}`)
      .join('; ')

    rules.push(`${selector} { ${merged} }`)
  }

  return rules.join('\n')
}

/**
 * Extract critical CSS for above-the-fold content
 */
export function extractCriticalCSS(
  css: string,
  criticalSelectors: string[]
): string {
  const rules: string[] = []
  const rulePattern = /([^{]+)\{([^}]+)\}/g
  let match

  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1]?.trim()
    const declarations = match[2]?.trim()

    if (!selector || !declarations) continue

    // Check if selector is critical
    const isCritical = criticalSelectors.some((critical) =>
      selector.includes(critical)
    )

    if (isCritical) {
      rules.push(`${selector} { ${declarations} }`)
    }
  }

  return rules.join('\n')
}

/**
 * Split CSS into critical and non-critical parts
 */
export function splitCriticalCSS(
  css: string,
  criticalSelectors: string[]
): { critical: string; nonCritical: string } {
  const criticalRules: string[] = []
  const nonCriticalRules: string[] = []
  const rulePattern = /([^{]+)\{([^}]+)\}/g
  let match

  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1]?.trim()
    const declarations = match[2]?.trim()
    
    if (!selector || !declarations) continue
    
    const rule = `${selector} { ${declarations} }`

    const isCritical = criticalSelectors.some((critical) =>
      selector.includes(critical)
    )

    if (isCritical) {
      criticalRules.push(rule)
    } else {
      nonCriticalRules.push(rule)
    }
  }

  return {
    critical: criticalRules.join('\n'),
    nonCritical: nonCriticalRules.join('\n'),
  }
}
