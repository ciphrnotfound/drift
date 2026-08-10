/**
 * Animation options for Web Animations API
 */
export interface AnimateOptions {
  duration?: number
  delay?: number
  easing?: string | number[]
  iterations?: number
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

/**
 * Animation controls for managing animations
 */
export interface AnimationControls {
  play(): void
  pause(): void
  cancel(): void
  reverse(): void
  finish(): void
  readonly playState: AnimationPlayState
  readonly currentTime: number | null
  readonly playbackRate: number
}

/**
 * Animation state for tracking active animations
 */
export interface AnimationState {
  id: string
  element: HTMLElement
  animation: Animation
  status: 'idle' | 'running' | 'paused' | 'finished' | 'cancelled'
  startTime: number
  endTime: number
}

/**
 * Animation registry for tracking all active animations
 */
export interface AnimationRegistry {
  animations: Map<string, AnimationState>
  add(state: AnimationState): void
  remove(id: string): void
  get(id: string): AnimationState | undefined
  cleanup(): void
}

/**
 * Reduced motion mode
 */
export type ReducedMotionMode = 'disable' | 'simplify' | 'respect'

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number

/**
 * Easing curves interface
 */
export interface EasingCurves {
  // Standard easings
  linear: number[]
  ease: number[]
  easeIn: number[]
  easeOut: number[]
  easeInOut: number[]
  
  // Custom Drift easings
  spring: number[]
  snap: number[]
  exhale: number[]
  breathe: number[]
  float: number[]
}
