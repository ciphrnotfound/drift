/**
 * Generate a unique scoped class name for a component
 */
export function generateScopedClassName(
  component: string,
  element?: string
): string {
  // Generate a hash-based scoped class name
  const hash = simpleHash(component)
  const base = `drift-${component.toLowerCase()}-${hash}`
  
  if (element) {
    return `${base}__${element}`
  }
  
  return base
}

/**
 * Simple hash function for generating consistent class name suffixes
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6)
}

/**
 * Generate a scoped class name for a variant
 */
export function generateVariantClassName(
  component: string,
  variant: string,
  value: string
): string {
  const base = generateScopedClassName(component)
  return `${base}--${variant}-${value}`
}

/**
 * Generate a scoped class name for a responsive breakpoint
 */
export function generateResponsiveClassName(
  component: string,
  breakpoint: string
): string {
  const base = generateScopedClassName(component)
  return `${base}@${breakpoint}`
}

/**
 * Check if two scoped class names would collide
 */
export function checkClassNameCollision(
  className1: string,
  className2: string
): boolean {
  return className1 === className2
}

/**
 * Generate a unique class name registry to track all generated names
 */
export class ClassNameRegistry {
  private names = new Set<string>()

  register(className: string): void {
    if (this.names.has(className)) {
      throw new Error(`Class name collision detected: ${className}`)
    }
    this.names.add(className)
  }

  has(className: string): boolean {
    return this.names.has(className)
  }

  clear(): void {
    this.names.clear()
  }

  getAll(): string[] {
    return Array.from(this.names)
  }
}
