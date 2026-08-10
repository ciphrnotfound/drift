import type { EasingCurves } from './types'

/**
 * Easing curves for animations
 */
export const easings: EasingCurves = {
  // Standard easings
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  
  // Custom Drift easings
  spring: [0.34, 1.56, 0.64, 1],    // bouncy overshoot
  snap: [0.20, 0.00, 0.00, 1],      // instant start, smooth land
  exhale: [0.40, 0.00, 0.20, 1],    // slow out
  breathe: [0.45, 0.05, 0.40, 0.95], // symmetric
  float: [0.16, 1.00, 0.30, 1],     // dramatic ease-out
}

/**
 * Convert easing name to cubic-bezier array
 * 
 * @param name - Easing name
 * @returns Cubic-bezier array or easing string
 */
export function getEasing(name: string): number[] | string {
  if (name in easings) {
    return easings[name as keyof EasingCurves]
  }
  return name
}

/**
 * Create custom cubic-bezier easing
 * 
 * @param x1 - First control point X
 * @param y1 - First control point Y
 * @param x2 - Second control point X
 * @param y2 - Second control point Y
 * @returns Cubic-bezier array
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): number[] {
  return [x1, y1, x2, y2]
}
