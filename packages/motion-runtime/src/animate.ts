import type { AnimateOptions, AnimationControls } from './types'
import { getEasing } from './easings'

/**
 * Animate an element using Web Animations API
 * 
 * @param element - The HTML element to animate
 * @param keyframes - Animation keyframes
 * @param options - Animation options
 * @returns Animation controls
 */
export function animate(
  element: HTMLElement,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: AnimateOptions = {}
): AnimationControls {
  // Resolve easing
  let easing: string | undefined
  if (options.easing) {
    if (typeof options.easing === 'string') {
      const resolved = getEasing(options.easing)
      easing = Array.isArray(resolved) 
        ? `cubic-bezier(${resolved.join(', ')})` 
        : resolved
    } else if (Array.isArray(options.easing)) {
      easing = `cubic-bezier(${options.easing.join(', ')})`
    }
  }

  // Build animation options
  const animationOptions: KeyframeAnimationOptions = {
    duration: options.duration ?? 300,
    delay: options.delay ?? 0,
    easing: easing ?? 'ease',
    iterations: options.iterations ?? 1,
    direction: options.direction ?? 'normal',
    fill: options.fill ?? 'both',
  }

  // Create animation
  const animation = element.animate(keyframes, animationOptions)

  // Return controls
  return {
    play: () => animation.play(),
    pause: () => animation.pause(),
    cancel: () => animation.cancel(),
    reverse: () => animation.reverse(),
    finish: () => animation.finish(),
    get playState() {
      return animation.playState
    },
    get currentTime() {
      return animation.currentTime as number | null
    },
    get playbackRate() {
      return animation.playbackRate
    },
  }
}

/**
 * Animate with spring physics
 * Uses a spring simulation for natural, bouncy motion
 * 
 * @param element - The HTML element to animate
 * @param keyframes - Animation keyframes (only 'to' values used)
 * @param options - Spring options
 * @returns Animation controls
 */
export function spring(
  element: HTMLElement,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: {
    stiffness?: number
    damping?: number
    mass?: number
    velocity?: number
  } = {}
): AnimationControls {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    velocity = 0,
  } = options

  // Calculate spring duration and generate spring curve
  const { duration, frames } = generateSpringFrames(
    keyframes,
    stiffness,
    damping,
    mass,
    velocity
  )

  // Animate with generated frames
  return animate(element, frames, {
    duration,
    easing: 'linear', // Linear because frames already have spring curve
    fill: 'both',
  })
}

/**
 * Generate spring animation frames
 * Uses spring physics simulation to create natural motion
 */
function generateSpringFrames(
  targetKeyframes: Keyframe[] | PropertyIndexedKeyframes,
  stiffness: number,
  damping: number,
  mass: number,
  velocity: number
): { duration: number; frames: Keyframe[] } {
  // Extract target values
  const target = Array.isArray(targetKeyframes) 
    ? targetKeyframes[targetKeyframes.length - 1] as Keyframe
    : targetKeyframes as Keyframe

  // Spring physics simulation
  const frames: Keyframe[] = []
  let position = 0
  let vel = velocity
  let time = 0
  const dt = 16.67 // 60fps

  // Simulate until settled (velocity near zero and position near target)
  while (time < 5000) { // Max 5 seconds
    // Spring force: F = -k * x - c * v
    const springForce = -stiffness * (position - 1)
    const dampingForce = -damping * vel
    const acceleration = (springForce + dampingForce) / mass

    // Update velocity and position
    vel += acceleration * (dt / 1000)
    position += vel * (dt / 1000)

    // Add frame
    const progress = Math.max(0, Math.min(1, position))
    const interpolated = interpolateKeyframe(target, progress)
    frames.push({
      ...interpolated,
      offset: time / 5000,
    } as Keyframe)

    time += dt

    // Check if settled
    if (Math.abs(vel) < 0.01 && Math.abs(position - 1) < 0.01) {
      break
    }
  }

  // Ensure final frame is exactly at target
  frames.push({
    ...target,
    offset: 1,
  })

  return {
    duration: time,
    frames,
  }
}

/**
 * Interpolate keyframe values based on progress
 */
function interpolateKeyframe(target: Keyframe, progress: number): Keyframe {
  const result: Keyframe = {}
  
  for (const [key, value] of Object.entries(target)) {
    if (typeof value === 'number') {
      result[key] = value * progress
    } else if (typeof value === 'string') {
      // Handle transform strings
      if (key === 'transform') {
        result[key] = interpolateTransform(value, progress)
      } else {
        result[key] = value
      }
    } else {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Interpolate CSS transform string
 */
function interpolateTransform(transform: string, progress: number): string {
  // Parse transform functions
  const functions = transform.match(/(\w+)\(([^)]+)\)/g) || []
  
  return functions.map(fn => {
    const match = fn.match(/(\w+)\(([^)]+)\)/)
    if (!match) return fn
    
    const [, name, value] = match
    if (!value) return fn
    
    // Handle different transform functions
    if (name === 'translateX' || name === 'translateY' || name === 'translateZ') {
      const num = parseFloat(value)
      const unit = value.replace(num.toString(), '')
      return `${name}(${num * progress}${unit})`
    }
    
    if (name === 'scale' || name === 'scaleX' || name === 'scaleY') {
      const num = parseFloat(value)
      const interpolated = 1 + (num - 1) * progress
      return `${name}(${interpolated})`
    }
    
    if (name === 'rotate' || name === 'rotateX' || name === 'rotateY' || name === 'rotateZ') {
      const num = parseFloat(value)
      const unit = value.replace(num.toString(), '')
      return `${name}(${num * progress}${unit})`
    }
    
    return fn
  }).join(' ')
}
