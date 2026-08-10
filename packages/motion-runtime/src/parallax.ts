/**
 * Parallax scrolling effect
 * Elements move at different speeds based on scroll position
 */

export interface ParallaxOptions {
  speed?: number // Multiplier for scroll speed (0.5 = half speed, 2 = double speed)
  direction?: 'vertical' | 'horizontal'
  smooth?: boolean // Use smooth interpolation
}

/**
 * Create parallax scrolling effect
 * 
 * @param element - The HTML element to apply parallax to
 * @param options - Parallax options
 * @returns Cleanup function
 */
export function parallax(
  element: HTMLElement,
  options: ParallaxOptions = {}
): () => void {
  const {
    speed = 0.5,
    direction = 'vertical',
    smooth = true,
  } = options

  let currentScroll = 0
  let targetScroll = 0
  let rafId: number | null = null

  const updateParallax = () => {
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    if (direction === 'vertical') {
      targetScroll = scrollY * speed
    } else {
      targetScroll = scrollX * speed
    }

    if (smooth) {
      // Smooth interpolation
      currentScroll += (targetScroll - currentScroll) * 0.1

      if (direction === 'vertical') {
        element.style.transform = `translateY(${-currentScroll}px)`
      } else {
        element.style.transform = `translateX(${-currentScroll}px)`
      }

      rafId = requestAnimationFrame(updateParallax)
    } else {
      // Direct update
      if (direction === 'vertical') {
        element.style.transform = `translateY(${-targetScroll}px)`
      } else {
        element.style.transform = `translateX(${-targetScroll}px)`
      }
    }
  }

  const handleScroll = () => {
    if (!smooth) {
      updateParallax()
    } else if (rafId === null) {
      rafId = requestAnimationFrame(updateParallax)
    }
  }

  // Start listening
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  if (smooth) {
    rafId = requestAnimationFrame(updateParallax)
  }

  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll)
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
  }
}
