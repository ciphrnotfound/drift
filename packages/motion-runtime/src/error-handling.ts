import type { AnimateOptions, AnimationControls } from './types'
import { animate } from './animate'

/**
 * Animation error class
 */
export class AnimationError extends Error {
  constructor(
    message: string,
    public code: string,
    public element?: HTMLElement,
    public details?: any
  ) {
    super(message)
    this.name = 'AnimationError'
  }
}

/**
 * Handle animation error
 * 
 * @param error - Animation error
 */
export function handleAnimationError(error: AnimationError): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Drift Animation Error] ${error.message}`, error.details)
  }
  
  // Report to error tracking in production
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && (window as any).errorTracker) {
    (window as any).errorTracker.captureException(error)
  }
}

/**
 * Safe animate wrapper with error handling
 * 
 * @param element - The HTML element to animate
 * @param keyframes - Animation keyframes
 * @param options - Animation options
 * @returns Animation controls or null if error
 */
export function safeAnimate(
  element: HTMLElement | null,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: AnimateOptions
): AnimationControls | null {
  try {
    if (!element) {
      throw new AnimationError(
        'Animation target element is null',
        'ELEMENT_NOT_FOUND'
      )
    }
    
    if (!element.animate) {
      throw new AnimationError(
        'Web Animations API not supported',
        'API_NOT_SUPPORTED',
        element
      )
    }
    
    return animate(element, keyframes, options)
  } catch (error) {
    handleAnimationError(error as AnimationError)
    return null
  }
}
