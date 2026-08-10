import type { AnimateOptions, AnimationControls } from './types'
import { animate } from './animate'

/**
 * Create scroll-triggered animation
 * Animation triggers when element enters viewport
 * 
 * @param element - The HTML element to animate
 * @param keyframes - Animation keyframes
 * @param options - Animation options with scroll trigger config
 * @returns Animation controls
 */
export function scroll(
  element: HTMLElement,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: AnimateOptions & {
    trigger?: 'enter' | 'exit' | 'both'
    threshold?: number
  } = {}
): AnimationControls {
  const {
    trigger = 'enter',
    threshold = 0.1,
    ...animateOptions
  } = options

  let controls: AnimationControls | null = null
  let hasTriggered = false

  // Create intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const isEntering = entry.isIntersecting
        const isExiting = !entry.isIntersecting && entry.boundingClientRect.top < 0

        // Trigger animation based on mode
        if (trigger === 'enter' && isEntering && !hasTriggered) {
          controls = animate(element, keyframes, animateOptions)
          hasTriggered = true
        } else if (trigger === 'exit' && isExiting && !hasTriggered) {
          controls = animate(element, keyframes, animateOptions)
          hasTriggered = true
        } else if (trigger === 'both') {
          if (isEntering || isExiting) {
            controls = animate(element, keyframes, animateOptions)
          }
        }
      })
    },
    {
      threshold,
    }
  )

  // Start observing
  observer.observe(element)

  // Return controls with cleanup
  const dummyControls: AnimationControls = {
    play: () => controls?.play(),
    pause: () => controls?.pause(),
    cancel: () => {
      controls?.cancel()
      observer.disconnect()
    },
    reverse: () => controls?.reverse(),
    finish: () => controls?.finish(),
    get playState() {
      return controls?.playState || 'idle'
    },
    get currentTime() {
      return controls?.currentTime || null
    },
    get playbackRate() {
      return controls?.playbackRate || 1
    },
  }

  return dummyControls
}
