import type { AnimateOptions, AnimationControls } from './types'
import { animate } from './animate'

/**
 * Create staggered animations for multiple elements
 * Each element's animation starts with a delay based on its index
 * 
 * @param elements - Array of HTML elements
 * @param keyframes - Animation keyframes
 * @param options - Animation options with stagger delay
 * @returns Array of animation controls
 */
export function stagger(
  elements: HTMLElement[],
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: AnimateOptions & { stagger?: number } = {}
): AnimationControls[] {
  const { stagger: staggerDelay = 80, ...animateOptions } = options

  return elements.map((element, index) => {
    const delay = (animateOptions.delay || 0) + (index * staggerDelay)
    
    return animate(element, keyframes, {
      ...animateOptions,
      delay,
    })
  })
}
