/**
 * Magnetic cursor effect
 * Elements follow the cursor with spring physics (like Apple.com buttons)
 */

export interface MagneticOptions {
  strength?: number // How strongly element follows cursor (0-1)
  radius?: number // Distance in pixels where effect activates
  speed?: number // How quickly element follows (0-1, higher = faster)
}

/**
 * Create magnetic cursor effect
 * 
 * @param element - The HTML element to make magnetic
 * @param options - Magnetic options
 * @returns Cleanup function
 */
export function magnetic(
  element: HTMLElement,
  options: MagneticOptions = {}
): () => void {
  const {
    strength = 0.3,
    radius = 120,
    speed = 0.15,
  } = options

  let currentX = 0
  let currentY = 0
  let targetX = 0
  let targetY = 0
  let rafId: number | null = null

  const rect = element.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const animate = () => {
    // Smooth interpolation
    currentX += (targetX - currentX) * speed
    currentY += (targetY - currentY) * speed

    element.style.transform = `translate(${currentX}px, ${currentY}px)`

    // Continue animation if not settled
    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      rafId = requestAnimationFrame(animate)
    } else {
      rafId = null
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    const mouseX = e.clientX
    const mouseY = e.clientY

    // Calculate distance from center
    const deltaX = mouseX - centerX
    const deltaY = mouseY - centerY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance < radius) {
      // Inside radius - apply magnetic effect
      const force = 1 - (distance / radius) // Stronger when closer
      targetX = deltaX * strength * force
      targetY = deltaY * strength * force
    } else {
      // Outside radius - return to center
      targetX = 0
      targetY = 0
    }

    // Start animation if not already running
    if (rafId === null) {
      rafId = requestAnimationFrame(animate)
    }
  }

  const handleMouseLeave = () => {
    // Return to center when mouse leaves
    targetX = 0
    targetY = 0

    if (rafId === null) {
      rafId = requestAnimationFrame(animate)
    }
  }

  // Start listening
  document.addEventListener('mousemove', handleMouseMove)
  element.addEventListener('mouseleave', handleMouseLeave)

  // Cleanup
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
    element.removeEventListener('mouseleave', handleMouseLeave)
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    element.style.transform = ''
  }
}
