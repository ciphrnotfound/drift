# Custom Drift Animation Runtime - Design Document

## Overview

This design replaces Framer Motion with a custom animation runtime built on the Web Animations API. The goal is to eliminate external animation dependencies, reduce bundle size by 50%+, and maintain full control over animation behavior while keeping all existing Drift motion features.

The design introduces a new `@drift/motion-runtime` package that provides runtime helpers for animations, updates the motion code generator to output Web Animations API code instead of Framer Motion props, and creates a `@drift/ui` component library with pre-styled components using the new animation system.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Drift Compiler                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Lexer     │→ │    Parser    │→ │  AST Builder │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Code Generators                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ JSX Generator│  │ CSS Generator│  │Motion Generator│     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                              ↓               │
│                                    ┌──────────────────┐     │
│                                    │ Web Animations   │     │
│                                    │  API Code Gen    │     │
│                                    └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Generated Output                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Component.tsx│  │Component.css │  │  Animation   │      │
│  │              │  │              │  │   Hooks      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              @drift/motion-runtime (Runtime)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   animate()  │  │  sequence()  │  │  stagger()   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   scroll()   │  │  gesture()   │  │   easings    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Browser Runtime                             │
│                 Web Animations API                           │
└─────────────────────────────────────────────────────────────┘
```

### Package Structure

The implementation spans multiple packages in the monorepo:

1. **@drift/motion** (existing, modified)
   - Motion code generator
   - Converts Drift motion AST to Web Animations API code
   - No longer generates Framer Motion props

2. **@drift/motion-runtime** (new)
   - Runtime animation helpers
   - Easing curve implementations
   - Animation state management
   - Browser compatibility layer

3. **@drift/ui** (existing, expanded)
   - Pre-built component library
   - Uses Drift syntax for styling
   - Demonstrates animation patterns
   - Fully typed with TypeScript

4. **@drift/compiler** (existing, modified)
   - Integrates new motion generator
   - Handles animation code generation in output bundle

### Data Flow

1. **Compile Time**:
   - Drift source → Lexer → Parser → AST
   - Motion AST → Motion Generator → Web Animations API code
   - Generated code imports from `@drift/motion-runtime`

2. **Runtime**:
   - Component mounts → Animation hooks execute
   - Hooks call `@drift/motion-runtime` functions
   - Runtime functions call Web Animations API
   - Browser executes animations with GPU acceleration

## Components and Interfaces

### @drift/motion-runtime Package

#### Core Animation Functions

```typescript
// packages/motion-runtime/src/animate.ts

export interface AnimateOptions {
  duration?: number
  delay?: number
  easing?: string | number[]
  iterations?: number
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

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
 * Animate an element using Web Animations API
 */
export function animate(
  element: HTMLElement,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: AnimateOptions
): AnimationControls

/**
 * Create a sequence of animations
 */
export function sequence(
  animations: Array<{
    element: HTMLElement
    keyframes: Keyframe[] | PropertyIndexedKeyframes
    options?: AnimateOptions
  }>
): AnimationControls

/**
 * Create staggered animations for multiple elements
 */
export function stagger(
  elements: HTMLElement[],
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: AnimateOptions & { stagger?: number }
): AnimationControls[]

/**
 * Create scroll-triggered animation
 */
export function scroll(
  element: HTMLElement,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: AnimateOptions & {
    trigger?: 'enter' | 'exit' | 'both'
    threshold?: number
  }
): AnimationControls

/**
 * Create gesture-based animation
 */
export function gesture(
  element: HTMLElement,
  gesture: 'hover' | 'press' | 'focus' | 'drag',
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: AnimateOptions
): () => void // Returns cleanup function
```

#### Easing Curves

```typescript
// packages/motion-runtime/src/easings.ts

export type EasingFunction = (t: number) => number

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

export const easings: EasingCurves

/**
 * Convert easing name to cubic-bezier array
 */
export function getEasing(name: string): number[] | string

/**
 * Create custom cubic-bezier easing
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): number[]
```

#### Reduced Motion Support

```typescript
// packages/motion-runtime/src/reduced-motion.ts

export type ReducedMotionMode = 'disable' | 'simplify' | 'respect'

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean

/**
 * Wrap animation with reduced motion support
 */
export function withReducedMotion<T extends Function>(
  animationFn: T,
  mode?: ReducedMotionMode
): T

/**
 * Simplify keyframes for reduced motion
 */
export function simplifyKeyframes(
  keyframes: Keyframe[] | PropertyIndexedKeyframes
): Keyframe[] | PropertyIndexedKeyframes
```

### Motion Code Generator Updates

#### Generator Interface

```typescript
// packages/motion/src/generator.ts

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

/**
 * Generate Web Animations API code from motion block
 */
export function generateWebAnimations(
  componentName: string,
  motionBlock: MotionBlock | null,
  tokenRegistry?: TokenRegistry
): WebAnimationCode

/**
 * Generate enter animation hook
 */
export function generateEnterAnimation(
  animation: AnimationDeclaration,
  tokenRegistry?: TokenRegistry
): AnimationHook

/**
 * Generate gesture animation effect
 */
export function generateGestureAnimation(
  gesture: GestureDeclaration,
  tokenRegistry?: TokenRegistry
): AnimationEffect

/**
 * Convert Drift animation properties to Web Animations keyframes
 */
export function convertToKeyframes(
  properties: AnimationProperty[]
): Keyframe[]

/**
 * Generate timing options for Web Animations API
 */
export function generateTimingOptions(
  animation: AnimationDeclaration,
  tokenRegistry?: TokenRegistry
): KeyframeAnimationOptions
```

### @drift/ui Component Library

#### Component Structure

```typescript
// packages/ui/src/Button.tsx

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
}

export function Button(props: ButtonProps): React.ReactElement

// packages/ui/src/Card.tsx

export interface CardProps {
  elevation?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  children: React.ReactNode
}

export function Card(props: CardProps): React.ReactElement

// packages/ui/src/Input.tsx

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number'
  label?: string
  error?: string
  disabled?: boolean
  value?: string
  onChange?: (value: string) => void
}

export function Input(props: InputProps): React.ReactElement

// packages/ui/src/Modal.tsx

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal(props: ModalProps): React.ReactElement
```

## Data Models

### Animation State

```typescript
// packages/motion-runtime/src/types.ts

export interface AnimationState {
  id: string
  element: HTMLElement
  animation: Animation
  status: 'idle' | 'running' | 'paused' | 'finished' | 'cancelled'
  startTime: number
  endTime: number
}

export interface AnimationRegistry {
  animations: Map<string, AnimationState>
  add(state: AnimationState): void
  remove(id: string): void
  get(id: string): AnimationState | undefined
  cleanup(): void
}
```

### Generated Code Structure

```typescript
// Example of generated component code

import React, { useEffect, useRef } from 'react'
import { animate, gesture, easings } from '@drift/motion-runtime'
import './Button.css'

export interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // Enter animation
  useEffect(() => {
    if (!buttonRef.current) return
    
    const animation = animate(
      buttonRef.current,
      [
        { opacity: 0, transform: 'scale(0.95)' },
        { opacity: 1, transform: 'scale(1)' }
      ],
      {
        duration: 300,
        easing: easings.spring,
        fill: 'both'
      }
    )
    
    return () => animation.cancel()
  }, [])
  
  // Gesture animations
  useEffect(() => {
    if (!buttonRef.current) return
    
    const cleanupHover = gesture(
      buttonRef.current,
      'hover',
      [{ transform: 'scale(1.02)' }],
      { duration: 200, easing: easings.ease }
    )
    
    const cleanupPress = gesture(
      buttonRef.current,
      'press',
      [{ transform: 'scale(0.98)' }],
      { duration: 100, easing: easings.ease }
    )
    
    return () => {
      cleanupHover()
      cleanupPress()
    }
  }, [])
  
  return (
    <button ref={buttonRef} className={`button button--${variant}`}>
      {children}
    </button>
  )
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified:
- R1.1, R3.1, and R5.2 all verify Web Animations API code generation (consolidated into Property 1)
- R3.7 and R5.7 both verify no Framer Motion imports (consolidated into Property 2)
- R5.4 and R6.1 both verify example migration (consolidated into example tests)

The following properties represent unique validation requirements:

### Property 1: Web Animations API Code Generation

*For any* Drift motion block, the generated code should use Web Animations API (element.animate() calls) and not contain any Framer Motion imports or API calls.

**Validates: Requirements R1.1, R3.1, R5.2**

### Property 2: Animation Type Support

*For any* Drift animation type (fade, rise, fall, shrink, grow), the generated keyframes should correctly represent the transformation with appropriate CSS properties (opacity for fade, transform for movement/scale).

**Validates: Requirements R1.2**

### Property 3: Gesture Animation Generation

*For any* gesture type (hover, press, focus, drag), the generated code should include appropriate event listeners and animation calls that trigger on the correct events.

**Validates: Requirements R1.3, R3.6**

### Property 4: Scroll Animation Setup

*For any* scroll-triggered animation, the generated code should include IntersectionObserver setup with correct threshold values and trigger conditions.

**Validates: Requirements R1.4, R3.5**

### Property 5: Animation Sequence Timing

*For any* animation sequence, the animations should execute in the specified order with correct timing relationships (delays and durations).

**Validates: Requirements R1.5, R2.2**

### Property 6: Stagger Delay Distribution

*For any* staggered animation with N elements and stagger delay D, each element's animation should start with delay i * D where i is the element's index (0 to N-1).

**Validates: Requirements R1.5, R2.3**

### Property 7: Reduced Motion Support

*For any* generated animation code, it should include checks for prefers-reduced-motion and either disable or simplify animations when the user preference is set.

**Validates: Requirements R1.6**

### Property 8: GPU-Accelerated Properties

*For any* generated animation, movement and scaling should use transform properties (translateX, translateY, scale) and visibility changes should use opacity, not layout-triggering properties (left, top, width, height).

**Validates: Requirements R1.7**

### Property 9: Easing Curve Conversion

*For any* Drift easing name (spring, snap, exhale, breathe, float), the generated timing options should include a valid cubic-bezier array with four numeric values between 0 and 1.

**Validates: Requirements R1.8, R2.6**

### Property 10: Animation Control Methods

*For any* animation created by the runtime, calling control methods (play, pause, cancel, reverse) should correctly change the animation's playState and behavior.

**Validates: Requirements R2.1, R2.7**

### Property 11: Scroll Trigger Accuracy

*For any* scroll animation with threshold T, the animation should trigger when the element's intersection ratio crosses threshold T (within a small epsilon for floating point comparison).

**Validates: Requirements R2.4**

### Property 12: Gesture Event Handling

*For any* gesture animation, simulating the corresponding DOM event (mouseenter for hover, mousedown for press, focus for focus) should trigger the animation.

**Validates: Requirements R2.5**

### Property 13: Keyframe Structure Correctness

*For any* Drift motion block, the generated keyframes should be valid Web Animations API keyframes (either array of Keyframe objects or PropertyIndexedKeyframes object) with all required properties.

**Validates: Requirements R3.2**

### Property 14: Timing Options Completeness

*For any* animation with specified duration, delay, or easing, the generated timing options should include all specified values with correct units (milliseconds for duration/delay).

**Validates: Requirements R3.3**

### Property 15: Composite Animation Properties

*For any* animation with multiple properties (e.g., fade + rise), all properties should be included in the generated keyframes.

**Validates: Requirements R3.4**

### Property 16: Runtime Import Presence

*For any* generated component with animations, the code should import required functions from '@drift/motion-runtime'.

**Validates: Requirements R3.8, R4.11**

### Property 17: Headless Component Architecture

*For any* UI component, rendering it without style-related props should result in minimal default styling (only structural CSS, no colors/spacing/decorative styles).

**Validates: Requirements R4.8**

## Error Handling

### Compile-Time Errors

1. **Invalid Animation Property**
   - Error: Unknown animation property in motion block
   - Recovery: Suggest valid properties (fade, rise, fall, shrink, grow, or CSS properties)
   - Example: `motion { enter { invalid: 100 } }` → "Unknown animation property 'invalid'. Did you mean 'fade', 'rise', or 'fall'?"

2. **Invalid Gesture Type**
   - Error: Unknown gesture in motion block
   - Recovery: Suggest valid gestures (hover, press, focus, drag, scroll)
   - Example: `motion { click { scale: 1.1 } }` → "Unknown gesture 'click'. Did you mean 'press'?"

3. **Invalid Easing Curve**
   - Error: Unknown easing name
   - Recovery: Suggest valid easings or cubic-bezier syntax
   - Example: `easing: bounce` → "Unknown easing 'bounce'. Valid easings: spring, snap, exhale, breathe, float, or use cubic(x1, y1, x2, y2)"

4. **Missing Animation Values**
   - Error: Animation property missing required 'to' value
   - Recovery: Show required syntax
   - Example: `fade` → "Animation property 'fade' requires a 'to' value. Use: fade: 0 to 1"

5. **Invalid Timing Values**
   - Error: Duration or delay is negative or not a number
   - Recovery: Show valid range
   - Example: `duration: -100` → "Duration must be a positive number in milliseconds"

### Runtime Errors

1. **Element Not Found**
   - Error: Animation target element is null or undefined
   - Recovery: Skip animation, log warning in development
   - Handling: Check element existence before calling animate()

2. **Invalid Keyframes**
   - Error: Keyframes are malformed or empty
   - Recovery: Skip animation, log error
   - Handling: Validate keyframes structure before passing to Web Animations API

3. **Browser Compatibility**
   - Error: Web Animations API not supported
   - Recovery: Graceful degradation (no animations)
   - Handling: Feature detection and polyfill suggestion

4. **Animation Conflict**
   - Error: Multiple animations targeting same property
   - Recovery: Cancel previous animation, start new one
   - Handling: Track active animations per element

5. **Scroll Observer Failure**
   - Error: IntersectionObserver not supported or fails
   - Recovery: Trigger animation immediately or skip
   - Handling: Feature detection and fallback

### Error Handling Strategy

```typescript
// packages/motion-runtime/src/error-handling.ts

export class AnimationError extends Error {
  constructor(
    message: string,
    public code: string,
    public element?: HTMLElement,
    public details?: any
  ) {
    super(message)
    this.name = 'AnimationError'
  }
}

export function handleAnimationError(error: AnimationError): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Drift Animation Error] ${error.message}`, error.details)
  }
  
  // Report to error tracking in production
  if (process.env.NODE_ENV === 'production' && window.errorTracker) {
    window.errorTracker.captureException(error)
  }
}

export function safeAnimate(
  element: HTMLElement | null,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: AnimateOptions
): AnimationControls | null {
  try {
    if (!element) {
      throw new AnimationError(
        'Animation target element is null',
        'ELEMENT_NOT_FOUND'
      )
    }
    
    if (!element.animate) {
      throw new AnimationError(
        'Web Animations API not supported',
        'API_NOT_SUPPORTED',
        element
      )
    }
    
    return animate(element, keyframes, options)
  } catch (error) {
    handleAnimationError(error as AnimationError)
    return null
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Unit tests focus on concrete scenarios (e.g., "button with hover animation generates correct code"), while property tests verify general rules (e.g., "all animations use Web Animations API"). Together they provide comprehensive coverage—unit tests catch specific bugs, property tests verify correctness across the input space.

### Property-Based Testing

We'll use **fast-check** for TypeScript property-based testing. Each property test will:
- Run minimum 100 iterations (due to randomization)
- Reference its design document property in a comment tag
- Generate random but valid inputs (motion blocks, animation configs, etc.)

**Configuration Example**:

```typescript
// packages/motion/src/__tests__/generator.property.test.ts

import fc from 'fast-check'
import { generateWebAnimations } from '../generator'
import { MotionBlock } from '@drift/types'

// Feature: custom-drift-runtime, Property 1: Web Animations API Code Generation
test('generated code uses Web Animations API', () => {
  fc.assert(
    fc.property(
      fc.record({
        enter: fc.option(animationArbitrary()),
        exit: fc.option(animationArbitrary()),
        gestures: fc.array(gestureArbitrary())
      }),
      (motionBlock) => {
        const result = generateWebAnimations('TestComponent', motionBlock)
        
        // Should not contain Framer Motion imports
        expect(result.imports).not.toContain('framer-motion')
        
        // Should contain Web Animations API code
        const code = result.hooks.map(h => h.code).join('\n')
        expect(code).toMatch(/\.animate\(/)
        expect(code).not.toMatch(/motion\./)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit Testing

Unit tests will cover:

1. **Code Generation**
   - Specific animation types (fade, rise, fall, etc.)
   - Gesture types (hover, press, focus, drag)
   - Scroll animations with different thresholds
   - Sequences and staggering
   - Edge cases: empty motion blocks, missing values

2. **Runtime Functions**
   - animate() with various keyframes and options
   - sequence() with multiple animations
   - stagger() with different element counts
   - scroll() with different triggers
   - gesture() with different event types
   - Animation controls (play, pause, cancel, reverse)

3. **Easing Curves**
   - Each named easing returns valid cubic-bezier
   - Custom cubic-bezier creation
   - Easing resolution from tokens

4. **Error Handling**
   - Invalid animation properties
   - Missing elements
   - Browser compatibility fallbacks
   - Animation conflicts

5. **UI Components**
   - Each component renders correctly
   - Props are properly typed
   - Animations trigger on interactions
   - Accessibility attributes present

### Integration Testing

Integration tests will verify:

1. **End-to-End Compilation**
   - Drift source → compiled output with animations
   - Generated code runs in browser
   - Animations execute smoothly

2. **Browser Compatibility**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify Web Animations API support
   - Test reduced motion preferences

3. **Performance**
   - Animations run at 60fps
   - No memory leaks from animation cleanup
   - Bundle size reduction vs Framer Motion

### Test Organization

```
packages/motion/src/__tests__/
  ├── generator.test.ts              # Unit tests for code generation
  ├── generator.property.test.ts     # Property tests for code generation
  └── fixtures/                      # Test fixtures

packages/motion-runtime/src/__tests__/
  ├── animate.test.ts                # Unit tests for animate()
  ├── sequence.test.ts               # Unit tests for sequence()
  ├── stagger.test.ts                # Unit tests for stagger()
  ├── scroll.test.ts                 # Unit tests for scroll()
  ├── gesture.test.ts                # Unit tests for gesture()
  ├── easings.test.ts                # Unit tests for easing curves
  ├── runtime.property.test.ts       # Property tests for runtime
  └── integration.test.ts            # Integration tests

packages/ui/src/__tests__/
  ├── Button.test.tsx                # Unit tests for Button
  ├── Card.test.tsx                  # Unit tests for Card
  ├── Input.test.tsx                 # Unit tests for Input
  ├── Modal.test.tsx                 # Unit tests for Modal
  └── accessibility.test.tsx         # Accessibility tests
```

### Property Test Generators

```typescript
// packages/motion/src/__tests__/arbitraries.ts

import fc from 'fast-check'
import type { AnimationDeclaration, GestureDeclaration } from '@drift/types'

export const animationPropertyArbitrary = () =>
  fc.oneof(
    fc.constant('fade'),
    fc.constant('rise'),
    fc.constant('fall'),
    fc.constant('shrink'),
    fc.constant('grow')
  )

export const animationArbitrary = (): fc.Arbitrary<AnimationDeclaration> =>
  fc.record({
    type: fc.constant('AnimationDeclaration'),
    properties: fc.array(
      fc.record({
        name: animationPropertyArbitrary(),
        from: fc.option(fc.double({ min: 0, max: 1 })),
        to: fc.double({ min: 0, max: 1 })
      }),
      { minLength: 1, maxLength: 3 }
    ),
    duration: fc.option(fc.integer({ min: 100, max: 2000 })),
    delay: fc.option(fc.integer({ min: 0, max: 1000 })),
    easing: fc.option(
      fc.oneof(
        fc.constant('spring'),
        fc.constant('snap'),
        fc.constant('exhale'),
        fc.constant('breathe'),
        fc.constant('float')
      )
    ),
    location: fc.constant({} as any)
  })

export const gestureArbitrary = (): fc.Arbitrary<GestureDeclaration> =>
  fc.record({
    type: fc.constant('GestureDeclaration'),
    gesture: fc.oneof(
      fc.constant('hover'),
      fc.constant('press'),
      fc.constant('focus'),
      fc.constant('drag')
    ),
    animation: animationArbitrary(),
    constraints: fc.option(
      fc.record({
        axis: fc.option(fc.oneof(fc.constant('x'), fc.constant('y'))),
        bounds: fc.option(
          fc.record({
            top: fc.option(fc.integer()),
            right: fc.option(fc.integer()),
            bottom: fc.option(fc.integer()),
            left: fc.option(fc.integer())
          })
        )
      })
    ),
    location: fc.constant({} as any)
  })
```

### Success Criteria

Tests pass when:
1. All property tests pass with 100+ iterations
2. All unit tests pass
3. Integration tests show 60fps animations
4. Bundle size is 50%+ smaller than with Framer Motion
5. No Framer Motion dependencies remain
6. All examples work in modern browsers
7. Accessibility tests pass (ARIA, keyboard navigation, reduced motion)


## Implementation Details

### Phase 1: Create @drift/motion-runtime Package

1. **Package Setup**
   - Create package structure in `packages/motion-runtime/`
   - Configure TypeScript, tsup for bundling
   - Set up package.json with exports

2. **Core Animation Functions**
   - Implement `animate()` wrapper around Web Animations API
   - Implement `sequence()` for sequential animations
   - Implement `stagger()` for staggered animations
   - Implement `scroll()` with IntersectionObserver
   - Implement `gesture()` with event listeners

3. **Easing Curves**
   - Define cubic-bezier values for each named easing
   - Implement easing resolution function
   - Export easing constants

4. **Reduced Motion Support**
   - Implement `prefersReducedMotion()` check
   - Implement `withReducedMotion()` wrapper
   - Implement `simplifyKeyframes()` utility

### Phase 2: Update Motion Code Generator

1. **Refactor Generator**
   - Replace Framer Motion prop generation with Web Animations code
   - Implement `generateWebAnimations()` function
   - Implement `convertToKeyframes()` for property conversion
   - Implement `generateTimingOptions()` for timing config

2. **Animation Type Handlers**
   - Handle enter animations → useEffect with animate()
   - Handle exit animations → cleanup with cancel()
   - Handle gesture animations → useEffect with gesture()
   - Handle scroll animations → useEffect with scroll()

3. **Code Generation**
   - Generate React hooks (useEffect, useRef)
   - Generate imports from @drift/motion-runtime
   - Generate cleanup functions
   - Generate TypeScript types

### Phase 3: Update Compiler Integration

1. **Output Bundle**
   - Update `generateOutputBundle()` to use new motion generator
   - Ensure generated code imports from @drift/motion-runtime
   - Remove Framer Motion from generated imports

2. **JSX Transformer**
   - Update component transformation to include animation hooks
   - Ensure refs are added to animated elements
   - Handle motion block compilation

### Phase 4: Create @drift/ui Components

1. **Component Implementation**
   - Implement Button with variants and animations
   - Implement Card with elevation and hover effects
   - Implement Input with validation states
   - Implement Modal with enter/exit animations
   - Implement Dropdown, Tabs, Tooltip

2. **Drift Source Files**
   - Write each component in Drift syntax
   - Use motion blocks for animations
   - Use style blocks with variants
   - Compile to TypeScript/CSS

3. **Documentation**
   - Add JSDoc comments to all components
   - Create usage examples
   - Document props and variants

### Phase 5: Migration and Cleanup

1. **Remove Framer Motion**
   - Remove framer-motion from all package.json files
   - Update example components to use new system
   - Update tests to use new animation system

2. **Update Examples**
   - Migrate example-app components
   - Create new animation demos
   - Add bundle size comparison

3. **Documentation**
   - Update README with new animation system
   - Create ANIMATION-GUIDE.md
   - Update API documentation
   - Create migration guide if needed

## Performance Considerations

### Bundle Size Optimization

1. **Tree Shaking**
   - Export functions individually for tree shaking
   - Use ES modules format
   - Avoid default exports for better tree shaking

2. **Code Splitting**
   - Separate easing curves into own module
   - Lazy load scroll/gesture handlers if not used
   - Keep core animate() function minimal

3. **Expected Savings**
   - Framer Motion: ~60KB minified + gzipped
   - @drift/motion-runtime: ~8-10KB minified + gzipped
   - Savings: ~50KB (83% reduction)

### Runtime Performance

1. **GPU Acceleration**
   - Always use transform and opacity for animations
   - Avoid layout-triggering properties
   - Use will-change hints sparingly

2. **Animation Cleanup**
   - Cancel animations on component unmount
   - Remove event listeners properly
   - Clear IntersectionObserver instances

3. **Memory Management**
   - Maintain animation registry for tracking
   - Implement cleanup on page unload
   - Avoid memory leaks from closures

### Browser Compatibility

1. **Web Animations API Support**
   - Chrome 36+, Firefox 48+, Safari 13.1+, Edge 79+
   - Covers 95%+ of users
   - Polyfill available for older browsers

2. **Fallback Strategy**
   - Feature detection for Web Animations API
   - Graceful degradation (no animations) if not supported
   - Console warning in development mode

3. **Polyfill Option**
   - Recommend web-animations-js polyfill for older browsers
   - Document polyfill installation
   - Make polyfill optional (user choice)

## Migration Strategy

### For Existing Drift Projects

1. **Automatic Migration**
   - Recompile Drift components with new compiler
   - Generated code automatically uses Web Animations API
   - No changes to Drift source files needed

2. **Dependency Updates**
   - Update @drift/compiler to new version
   - Add @drift/motion-runtime dependency
   - Remove framer-motion dependency

3. **Testing**
   - Run existing tests to verify animations work
   - Visual regression testing recommended
   - Check bundle size reduction

### For New Projects

1. **Project Setup**
   - Use `drift create` with updated templates
   - Templates include @drift/motion-runtime
   - No Framer Motion in dependencies

2. **Component Development**
   - Write motion blocks as usual
   - Compiler generates Web Animations code
   - Use @drift/ui components as examples

### Breaking Changes

**None expected** - This is a compiler/runtime change that doesn't affect Drift syntax. Existing Drift source files will compile to the new animation system without modification.

## Security Considerations

1. **XSS Prevention**
   - All animation values are sanitized
   - No eval() or Function() constructor usage
   - CSS property values validated

2. **Resource Limits**
   - Limit number of simultaneous animations
   - Prevent infinite animation loops
   - Throttle scroll event handlers

3. **Content Security Policy**
   - No inline styles generated (use CSS classes)
   - No unsafe-eval required
   - Compatible with strict CSP

## Accessibility

1. **Reduced Motion**
   - Automatic prefers-reduced-motion support
   - Simplify or disable animations based on user preference
   - Document reduced motion behavior

2. **Keyboard Navigation**
   - Gesture animations don't interfere with keyboard
   - Focus animations enhance keyboard navigation
   - All interactive components keyboard accessible

3. **Screen Readers**
   - Animations don't affect screen reader announcements
   - ARIA attributes preserved during animations
   - Loading states announced properly

## Future Enhancements

1. **Advanced Animation Features**
   - Spring physics simulation
   - Path animations (SVG morphing)
   - Scroll-linked animations (ScrollTimeline API)
   - View Transitions API integration

2. **Developer Tools**
   - Animation debugger/inspector
   - Performance profiler
   - Visual animation timeline

3. **Optimization**
   - Automatic animation batching
   - Intersection-based animation culling
   - Web Workers for complex calculations

4. **Framework Support**
   - Vue adapter for @drift/motion-runtime
   - Svelte adapter
   - Solid.js adapter

## Open Questions

1. **Polyfill Strategy**: Should we bundle a polyfill or require users to add it?
   - **Recommendation**: Document polyfill but don't bundle (keeps size small)

2. **Animation Conflicts**: How to handle multiple animations on same element?
   - **Recommendation**: Cancel previous, start new (last-wins strategy)

3. **SSR Support**: Should we support server-side rendering?
   - **Recommendation**: Out of scope for now, add in future version

4. **Animation Presets**: Should we provide pre-built animation presets?
   - **Recommendation**: Yes, add to @drift/ui as examples

## References

- [Web Animations API Specification](https://www.w3.org/TR/web-animations-1/)
- [MDN Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS Easing Functions](https://easings.net/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

