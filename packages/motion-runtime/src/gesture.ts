import type { AnimateOptions } from './types'
import { animate } from './animate'

/**
 * Create gesture-based animation
 * Animations trigger on user interactions (hover, press, focus, drag)
 * 
 * @param element - The HTML element to animate
 * @param gesture - Gesture type (hover, press, focus, drag)
 * @param keyframes - Animation keyframes
 * @param options - Animation options
 * @returns Cleanup function
 */
export function gesture(
  element: HTMLElement,
  gesture: 'hover' | 'press' | 'focus' | 'drag',
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: AnimateOptions = {}
): () => void {
  const cleanupFunctions: Array<() => void> = []

  switch (gesture) {
    case 'hover': {
      const handleMouseEnter = () => {
        animate(element, keyframes, options)
      }
      
      const handleMouseLeave = () => {
        // Reverse animation on leave
        const reverseKeyframes = Array.isArray(keyframes)
          ? [...keyframes].reverse()
          : keyframes
        animate(element, reverseKeyframes, { ...options, duration: (options.duration || 300) / 2 })
      }

      element.addEventListener('mouseenter', handleMouseEnter)
      element.addEventListener('mouseleave', handleMouseLeave)

      cleanupFunctions.push(() => {
        element.removeEventListener('mouseenter', handleMouseEnter)
        element.removeEventListener('mouseleave', handleMouseLeave)
      })
      break
    }

    case 'press': {
      const handleMouseDown = () => {
        animate(element, keyframes, options)
      }

      const handleMouseUp = () => {
        // Reverse animation on release
        const reverseKeyframes = Array.isArray(keyframes)
          ? [...keyframes].reverse()
          : keyframes
        animate(element, reverseKeyframes, { ...options, duration: (options.duration || 300) / 2 })
      }

      element.addEventListener('mousedown', handleMouseDown)
      element.addEventListener('mouseup', handleMouseUp)
      element.addEventListener('mouseleave', handleMouseUp) // Also reverse if mouse leaves while pressed

      cleanupFunctions.push(() => {
        element.removeEventListener('mousedown', handleMouseDown)
        element.removeEventListener('mouseup', handleMouseUp)
        element.removeEventListener('mouseleave', handleMouseUp)
      })
      break
    }

    case 'focus': {
      const handleFocus = () => {
        animate(element, keyframes, options)
      }

      const handleBlur = () => {
        // Reverse animation on blur
        const reverseKeyframes = Array.isArray(keyframes)
          ? [...keyframes].reverse()
          : keyframes
        animate(element, reverseKeyframes, { ...options, duration: (options.duration || 300) / 2 })
      }

      element.addEventListener('focus', handleFocus)
      element.addEventListener('blur', handleBlur)

      cleanupFunctions.push(() => {
        element.removeEventListener('focus', handleFocus)
        element.removeEventListener('blur', handleBlur)
      })
      break
    }

    case 'drag': {
      let isDragging = false
      let startX = 0
      let startY = 0
      let currentX = 0
      let currentY = 0

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true
        startX = e.clientX - currentX
        startY = e.clientY - currentY
        element.style.cursor = 'grabbing'
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return

        currentX = e.clientX - startX
        currentY = e.clientY - startY

        element.style.transform = `translate(${currentX}px, ${currentY}px)`
      }

      const handleMouseUp = () => {
        isDragging = false
        element.style.cursor = 'grab'
      }

      element.style.cursor = 'grab'
      element.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      cleanupFunctions.push(() => {
        element.removeEventListener('mousedown', handleMouseDown)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        element.style.cursor = ''
      })
      break
    }
  }

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(fn => fn())
  }
}
