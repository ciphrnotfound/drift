// Motion System Types

import type { Keyframe, MotionParam } from './ast'

export interface CompiledMotion {
  componentName: string
  imports: string[]
  props: MotionPropsCode
  handlers: GestureHandlerCode[]
}

export interface MotionPropsCode {
  initial?: string
  animate?: string
  exit?: string
  whileHover?: string
  whileTap?: string
  whileFocus?: string
  whileDrag?: string
  drag?: string
  dragConstraints?: string
  transition?: string
}

export interface GestureHandlerCode {
  event: string
  handler: string
}

export interface MotionSequence {
  name: string
  params: MotionParam[]
  keyframes: Keyframe[]
  defaultDuration: number
  defaultEasing: string
}

export interface MotionProps {
  initial?: MotionValue
  animate?: MotionValue
  exit?: MotionValue
  whileHover?: MotionValue
  whileTap?: MotionValue
  whileFocus?: MotionValue
  whileDrag?: MotionValue
  drag?: boolean | 'x' | 'y'
  dragConstraints?: DragConstraints
  onDragStart?: EventHandler
  onDragEnd?: EventHandler
}

export interface MotionValue {
  [property: string]: string | number
}

export interface DragConstraints {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export type EventHandler = (event: any) => void

// Web Animations API Code Generation Types

export interface WebAnimationCode {
  componentName: string
  imports: string[]
  hooks: AnimationHook[]
  effects: AnimationEffect[]
}

export interface AnimationHook {
  name: string
  type: 'enter' | 'exit' | 'gesture' | 'scroll'
  code: string
}

export interface AnimationEffect {
  trigger: string
  code: string
}
