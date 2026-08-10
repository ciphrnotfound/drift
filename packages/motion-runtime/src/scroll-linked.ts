/**
 * Scroll-linked animations
 * Animation progress tied directly to scroll position (like Apple product pages)
 */

export interface ScrollLinkedOptions {
  start?: number | string // Scroll position where animation starts (px or '50%')
  end?: number | string // Scroll position where animation ends
  target?: HTMLElement // Element to track (default: animated element)
  smooth?: boolean // Use smooth interpolation
}

/**
 * Create scroll-linked animation
 * Animation progress is directly tied to scroll position
 * 
 * @param element - The HTML element to animate
 * @param keyframes - Animation keyframes
 * @param options - Scroll-linked options
 * @returns Cleanup function
 */
export function scrollLinked(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: ScrollLinkedOptions = {}
): () => void {
  const {
    start = 0,
    end = window.innerHeight,
    target = element,
    smooth = true,
  } = options

  let currentProgress = 0
  let targetProgress = 0
  let rafId: number | null = null

  // Parse start/end values
  const parseValue = (value: number | string): number => {
    if (typeof value === 'string' && value.endsWith('%')) {
      const percent = parseFloat(value) / 100
      return window.innerHeight * percent
    }
    return typeof value === 'number' ? value : 0
  }

  const startPos = parseValue(start)
  const endPos = parseValue(end)
  const range = endPos - startPos

  const updateAnimation = () => {
    const rect = target.getBoundingClientRect()
    const elementTop = rect.top + window.scrollY
    const scrollPos = window.scrollY

    // Calculate progress (0 to 1)
    const rawProgress = (scrollPos - (elementTop + startPos)) / range
    targetProgress = Math.max(0, Math.min(1, rawProgress))

    if (smooth) {
      // Smooth interpolation
      currentProgress += (targetProgress - currentProgress) * 0.1

      applyKeyframes(element, keyframes, currentProgress)

      rafId = requestAnimationFrame(updateAnimation)
    } else {
      // Direct update
      applyKeyframes(element, keyframes, targetProgress)
    }
  }

  const handleScroll = () => {
    if (!smooth) {
      updateAnimation()
    } else if (rafId === null) {
      rafId = requestAnimationFrame(updateAnimation)
    }
  }

  // Start listening
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  if (smooth) {
    rafId = requestAnimationFrame(updateAnimation)
  } else {
    updateAnimation()
  }

  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll)
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
  }
}

/**
 * Apply keyframes at specific progress
 */
function applyKeyframes(
  element: HTMLElement,
  keyframes: Keyframe[],
  progress: number
): void {
  if (keyframes.length < 2) return

  // Find keyframes to interpolate between
  let startFrame: Keyframe = keyframes[0] || {}
  let endFrame: Keyframe = keyframes[keyframes.length - 1] || {}
  let localProgress = progress

  for (let i = 0; i < keyframes.length - 1; i++) {
    const current = keyframes[i]
    const next = keyframes[i + 1]
    if (!current || !next) continue
    
    const currentOffset = current.offset ?? (i / (keyframes.length - 1))
    const nextOffset = next.offset ?? ((i + 1) / (keyframes.length - 1))

    if (progress >= currentOffset && progress <= nextOffset) {
      startFrame = current
      endFrame = next
      localProgress = (progress - currentOffset) / (nextOffset - currentOffset)
      break
    }
  }

  // Interpolate and apply styles
  const styles = interpolateFrames(startFrame, endFrame, localProgress)
  Object.assign(element.style, styles)
}

/**
 * Interpolate between two keyframes
 */
function interpolateFrames(
  start: Keyframe,
  end: Keyframe,
  progress: number
): Record<string, string> {
  const result: Record<string, string> = {}

  const allKeys = new Set([...Object.keys(start), ...Object.keys(end)])

  for (const key of allKeys) {
    if (key === 'offset' || key === 'easing' || key === 'composite') continue

    const startValue = start[key]
    const endValue = end[key]

    if (typeof startValue === 'number' && typeof endValue === 'number') {
      result[key] = String(startValue + (endValue - startValue) * progress)
    } else if (typeof startValue === 'string' && typeof endValue === 'string') {
      // Try to interpolate numeric values in strings
      const startNum = parseFloat(startValue)
      const endNum = parseFloat(endValue)
      
      if (!isNaN(startNum) && !isNaN(endNum)) {
        const unit = startValue.replace(startNum.toString(), '')
        const interpolated = startNum + (endNum - startNum) * progress
        result[key] = `${interpolated}${unit}`
      } else {
        // Can't interpolate - use start or end based on progress
        result[key] = progress < 0.5 ? startValue : endValue
      }
    } else {
      result[key] = progress < 0.5 ? String(startValue) : String(endValue)
    }
  }

  return result
}
