import type { ReducedMotionMode } from './types'

/**
 * Check if user prefers reduced motion
 * 
 * @returns True if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Wrap animation with reduced motion support
 * 
 * @param animationFn - Animation function to wrap
 * @param mode - Reduced motion mode
 * @returns Wrapped animation function
 */
export function withReducedMotion<T extends Function>(
  animationFn: T,
  mode: ReducedMotionMode = 'respect'
): T {
  return ((...args: any[]) => {
    if (mode === 'respect' && prefersReducedMotion()) {
      // Don't run animation if user prefers reduced motion
      return null
    }

    if (mode === 'disable' && prefersReducedMotion()) {
      // Completely disable animations
      return null
    }

    if (mode === 'simplify' && prefersReducedMotion()) {
      // Simplify animations - modify keyframes before running
      const [element, keyframes, options] = args
      const simplified = simplifyKeyframes(keyframes)
      return animationFn(element, simplified, {
        ...options,
        duration: Math.min(options?.duration || 300, 150), // Reduce duration
      })
    }

    // Run animation normally
    return animationFn(...args)
  }) as unknown as T
}

/**
 * Simplify keyframes for reduced motion
 * Removes complex transforms, keeps only opacity changes
 * 
 * @param keyframes - Original keyframes
 * @returns Simplified keyframes
 */
export function simplifyKeyframes(
  keyframes: Keyframe[] | PropertyIndexedKeyframes
): Keyframe[] | PropertyIndexedKeyframes {
  if (Array.isArray(keyframes)) {
    // Array format
    return keyframes.map(frame => {
      const simplified: Keyframe = {}
      
      // Keep only opacity
      if ('opacity' in frame) {
        simplified.opacity = frame.opacity
      }
      
      // Keep offset if present
      if ('offset' in frame) {
        simplified.offset = frame.offset
      }

      return simplified
    })
  } else {
    // Object format
    const simplified: PropertyIndexedKeyframes = {}
    
    // Keep only opacity
    if ('opacity' in keyframes) {
      simplified.opacity = keyframes.opacity
    }

    return simplified
  }
}
