import type { AnimateOptions, AnimationControls } from './types'
import { animate } from './animate'

/**
 * Create a sequence of animations
 * Animations play one after another
 * 
 * @param animations - Array of animation configurations
 * @returns Animation controls for the sequence
 */
export function sequence(
  animations: Array<{
    element: HTMLElement
    keyframes: Keyframe[] | PropertyIndexedKeyframes
    options?: AnimateOptions
  }>
): AnimationControls {
  if (animations.length === 0) {
    throw new Error('Sequence requires at least one animation')
  }

  const animationControls: AnimationControls[] = []
  let currentIndex = 0
  let isPlaying = false
  let isPaused = false

  const playNext = () => {
    if (currentIndex >= animations.length) {
      isPlaying = false
      return
    }

    const config = animations[currentIndex]
    if (!config) return

    const { element, keyframes, options } = config
    const controls = animate(element, keyframes, options)
    animationControls[currentIndex] = controls

    // Get the actual animation to listen for finish
    const animation = (element as any).getAnimations?.()[0]
    if (animation) {
      animation.onfinish = () => {
        currentIndex++
        if (!isPaused) {
          playNext()
        }
      }
    }

    currentIndex++
  }

  // Start the sequence
  playNext()
  isPlaying = true

  // Return unified controls
  return {
    play: () => {
      if (!isPlaying) {
        isPaused = false
        isPlaying = true
        playNext()
      } else if (isPaused) {
        isPaused = false
        animationControls.forEach(ctrl => ctrl.play())
      }
    },
    pause: () => {
      isPaused = true
      animationControls.forEach(ctrl => ctrl.pause())
    },
    cancel: () => {
      isPlaying = false
      isPaused = false
      animationControls.forEach(ctrl => ctrl.cancel())
    },
    reverse: () => {
      // Reverse all animations
      animationControls.forEach(ctrl => ctrl.reverse())
    },
    finish: () => {
      animationControls.forEach(ctrl => ctrl.finish())
    },
    get playState() {
      if (animationControls.length === 0) return 'idle'
      return animationControls[animationControls.length - 1]?.playState || 'idle'
    },
    get currentTime() {
      if (animationControls.length === 0) return null
      return animationControls[animationControls.length - 1]?.currentTime || null
    },
    get playbackRate() {
      if (animationControls.length === 0) return 1
      return animationControls[animationControls.length - 1]?.playbackRate || 1
    },
  }
}
