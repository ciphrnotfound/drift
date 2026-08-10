# Implementation Plan: Custom Drift Animation Runtime

## Overview

Replace Framer Motion with a custom animation runtime built on Web Animations API. This implementation creates the @drift/motion-runtime package, updates the motion code generator to output Web Animations API code, expands the @drift/ui component library, and removes all Framer Motion dependencies. The result is a 50%+ bundle size reduction while maintaining full animation feature parity.

## Tasks

- [x] 1. Create @drift/motion-runtime package structure
  - Create `packages/motion-runtime/` directory
  - Set up package.json with name "@drift/motion-runtime"
  - Configure TypeScript (tsconfig.json) with strict mode
  - Configure tsup for ESM/CJS bundling with tree-shaking
  - Create src/ directory structure (animate.ts, sequence.ts, stagger.ts, scroll.ts, gesture.ts, easings.ts, reduced-motion.ts, types.ts, error-handling.ts, index.ts)
  - _Requirements: R2.1, R2.9_

- [x] 2. Implement core animation functions
  - [x] 2.1 Implement animate() function
    - Create animate.ts with animate() function wrapping element.animate()
    - Implement AnimateOptions interface (duration, delay, easing, iterations, direction, fill)
    - Implement AnimationControls interface (play, pause, cancel, reverse, finish, playState, currentTime, playbackRate)
    - Return AnimationControls wrapper around Web Animations API Animation object
    - Add null checks for element and element.animate support
    - _Requirements: R2.1, R2.7_
  
  - [ ]* 2.2 Write property test for animate() function
    - **Property 10: Animation Control Methods**
    - **Validates: Requirements R2.1, R2.7**
  
  - [x] 2.3 Implement sequence() function
    - Create sequence.ts with sequence() function for sequential animations
    - Accept array of animation configs (element, keyframes, options)
    - Chain animations using onfinish callbacks
    - Return unified AnimationControls for the sequence
    - _Requirements: R1.5, R2.2_
  
  - [ ]* 2.4 Write property test for sequence() timing
    - **Property 5: Animation Sequence Timing**
    - **Validates: Requirements R1.5, R2.2**
  
  - [x] 2.5 Implement stagger() function
    - Create stagger.ts with stagger() function for staggered animations
    - Accept array of elements, keyframes, and options with stagger delay
    - Calculate delay for each element (index * stagger)
    - Start all animations with appropriate delays
    - Return array of AnimationControls
    - _Requirements: R1.5, R2.3_
  
  - [ ]* 2.6 Write property test for stagger() delay distribution
    - **Property 6: Stagger Delay Distribution**
    - **Validates: Requirements R1.5, R2.3**
  
  - [x] 2.7 Implement scroll() function
    - Create scroll.ts with scroll() function for scroll-triggered animations
    - Use IntersectionObserver to detect element visibility
    - Support trigger options (enter, exit, both) and threshold
    - Start animation when threshold is crossed
    - Return AnimationControls and cleanup function
    - _Requirements: R1.4, R2.4_
  
  - [ ]* 2.8 Write property test for scroll() trigger accuracy
    - **Property 11: Scroll Trigger Accuracy**
    - **Validates: Requirements R2.4**
  
  - [x] 2.9 Implement gesture() function
    - Create gesture.ts with gesture() function for gesture-based animations
    - Support gesture types: hover (mouseenter/mouseleave), press (mousedown/mouseup), focus (focus/blur), drag (mousedown + mousemove)
    - Add event listeners for appropriate events
    - Trigger animations on events
    - Return cleanup function to remove listeners
    - _Requirements: R1.3, R2.5_
  
  - [ ]* 2.10 Write property test for gesture() event handling
    - **Property 12: Gesture Event Handling**
    - **Validates: Requirements R2.5**

- [x] 3. Implement easing curves and reduced motion support
  - [x] 3.1 Implement easing curves
    - Create easings.ts with EasingCurves interface
    - Define cubic-bezier arrays for standard easings (linear, ease, easeIn, easeOut, easeInOut)
    - Define cubic-bezier arrays for Drift custom easings (spring, snap, exhale, breathe, float)
    - Implement getEasing() function to resolve easing name to cubic-bezier
    - Implement cubicBezier() helper for custom curves
    - Export easings constant with all curves
    - _Requirements: R1.8, R2.6_
  
  - [ ]* 3.2 Write property test for easing curve conversion
    - **Property 9: Easing Curve Conversion**
    - **Validates: Requirements R1.8, R2.6**
  
  - [x] 3.3 Implement reduced motion support
    - Create reduced-motion.ts with prefersReducedMotion() function
    - Check window.matchMedia('(prefers-reduced-motion: reduce)')
    - Implement withReducedMotion() wrapper to disable/simplify animations
    - Implement simplifyKeyframes() to reduce animation complexity (remove transforms, keep opacity only)
    - Support ReducedMotionMode: 'disable', 'simplify', 'respect'
    - _Requirements: R1.6_
  
  - [ ]* 3.4 Write property test for reduced motion support
    - **Property 7: Reduced Motion Support**
    - **Validates: Requirements R1.6**

- [x] 4. Implement error handling and types
  - [x] 4.1 Create TypeScript types
    - Create types.ts with AnimationState interface
    - Create AnimationRegistry interface for tracking active animations
    - Export all public types from index.ts
    - _Requirements: R2.9_
  
  - [x] 4.2 Implement error handling
    - Create error-handling.ts with AnimationError class
    - Implement handleAnimationError() function with dev/prod modes
    - Implement safeAnimate() wrapper with try-catch
    - Add error codes: ELEMENT_NOT_FOUND, API_NOT_SUPPORTED, INVALID_KEYFRAMES, ANIMATION_CONFLICT
    - _Requirements: R2.8_
  
  - [ ]* 4.3 Write unit tests for error handling
    - Test each error type and recovery strategy
    - Test safeAnimate() with null elements
    - Test browser compatibility fallback
    - _Requirements: R2.8_

- [x] 5. Checkpoint - Ensure @drift/motion-runtime tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update motion code generator
  - [ ] 6.1 Refactor generator to output Web Animations API code
    - Update packages/motion/src/generator.ts
    - Create generateWebAnimations() function replacing Framer Motion generation
    - Implement WebAnimationCode interface (componentName, imports, hooks, effects)
    - Generate imports from '@drift/motion-runtime' instead of 'framer-motion'
    - _Requirements: R3.1, R3.7, R3.8_
  
  - [ ]* 6.2 Write property test for Web Animations API code generation
    - **Property 1: Web Animations API Code Generation**
    - **Validates: Requirements R1.1, R3.1, R5.2**
  
  - [ ] 6.3 Implement convertToKeyframes() function
    - Convert Drift animation properties (fade, rise, fall, shrink, grow) to Web Animations keyframes
    - Map fade to opacity changes
    - Map rise/fall to translateY transforms
    - Map shrink/grow to scale transforms
    - Support composite animations (multiple properties)
    - Return Keyframe[] or PropertyIndexedKeyframes
    - _Requirements: R3.2, R3.4_
  
  - [ ]* 6.4 Write property tests for keyframe conversion
    - **Property 2: Animation Type Support**
    - **Validates: Requirements R1.2**
    - **Property 13: Keyframe Structure Correctness**
    - **Validates: Requirements R3.2**
    - **Property 15: Composite Animation Properties**
    - **Validates: Requirements R3.4**
  
  - [ ] 6.5 Implement generateTimingOptions() function
    - Convert Drift timing values to KeyframeAnimationOptions
    - Map duration (ms), delay (ms), easing (name or cubic-bezier)
    - Resolve easing names using token registry
    - Set fill mode to 'both' by default
    - _Requirements: R3.3_
  
  - [ ]* 6.6 Write property test for timing options
    - **Property 14: Timing Options Completeness**
    - **Validates: Requirements R3.3**
  
  - [ ] 6.7 Implement generateEnterAnimation() function
    - Generate useEffect hook with animate() call
    - Generate useRef for element reference
    - Generate cleanup function calling animation.cancel()
    - Return AnimationHook with code string
    - _Requirements: R1.2, R3.1_
  
  - [ ] 6.8 Implement generateGestureAnimation() function
    - Generate useEffect hook with gesture() call
    - Support hover, press, focus, drag gestures
    - Generate cleanup function to remove listeners
    - Return AnimationEffect with code string
    - _Requirements: R1.3, R3.6_
  
  - [ ]* 6.9 Write property test for gesture animation generation
    - **Property 3: Gesture Animation Generation**
    - **Validates: Requirements R1.3, R3.6**
  
  - [ ] 6.10 Implement scroll animation generation
    - Generate useEffect hook with scroll() call
    - Generate IntersectionObserver setup code
    - Support threshold and trigger options
    - Generate cleanup function
    - _Requirements: R1.4, R3.5_
  
  - [ ]* 6.11 Write property test for scroll animation setup
    - **Property 4: Scroll Animation Setup**
    - **Validates: Requirements R1.4, R3.5**
  
  - [ ] 6.12 Ensure GPU-accelerated properties
    - Verify convertToKeyframes() uses transform (translateX, translateY, scale) not layout properties
    - Verify opacity is used for visibility changes
    - Add validation to reject layout-triggering properties (left, top, width, height)
    - _Requirements: R1.7_
  
  - [ ]* 6.13 Write property test for GPU acceleration
    - **Property 8: GPU-Accelerated Properties**
    - **Validates: Requirements R1.7**

- [ ] 7. Update compiler integration
  - [ ] 7.1 Update output bundle generator
    - Update packages/compiler/src/output-bundle.ts
    - Call generateWebAnimations() instead of old motion generator
    - Include animation hooks in generated component code
    - Add @drift/motion-runtime to imports
    - Remove framer-motion from imports
    - _Requirements: R3.1, R3.7, R3.8_
  
  - [ ] 7.2 Update JSX transformer
    - Ensure refs are added to elements with motion blocks
    - Include animation hooks in component body
    - Generate proper TypeScript types
    - _Requirements: R3.8_
  
  - [ ]* 7.3 Write property test for runtime import presence
    - **Property 16: Runtime Import Presence**
    - **Validates: Requirements R3.8, R4.11**
  
  - [ ]* 7.4 Write integration test for end-to-end compilation
    - Compile Drift component with motion block
    - Verify generated code is valid TypeScript
    - Verify generated code uses Web Animations API
    - Verify no Framer Motion imports
    - _Requirements: R3.1, R3.7, R3.8_

- [ ] 8. Checkpoint - Ensure motion generator tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create @drift/ui components with new animation system
  - [ ] 9.1 Implement Button component
    - Create packages/ui/src/Button.drift with motion blocks
    - Support variants: primary, secondary, ghost, danger
    - Add hover and press gesture animations
    - Add enter animation (fade + scale)
    - Compile to Button.tsx using new motion generator
    - _Requirements: R4.1_
  
  - [ ] 9.2 Implement Card component
    - Create packages/ui/src/Card.drift with motion blocks
    - Support elevation levels: none, sm, md, lg
    - Add hover animation (elevation increase)
    - Add enter animation (fade + rise)
    - Support interactive prop for hover effects
    - _Requirements: R4.2_
  
  - [ ] 9.3 Implement Input component
    - Create packages/ui/src/Input.drift with motion blocks
    - Support validation states (error, success)
    - Add focus animation (border color + scale)
    - Add label animation on focus
    - _Requirements: R4.3_
  
  - [ ] 9.4 Implement Modal component
    - Create packages/ui/src/Modal.drift with motion blocks
    - Add enter animation (fade + scale from center)
    - Add exit animation (fade + scale to center)
    - Add backdrop fade animation
    - Support open/onClose props
    - _Requirements: R4.4_
  
  - [ ] 9.5 Implement Dropdown component
    - Create packages/ui/src/Dropdown.drift with motion blocks
    - Add enter animation (fade + rise)
    - Add exit animation (fade + fall)
    - Support keyboard navigation
    - _Requirements: R4.5_
  
  - [ ] 9.6 Implement Tabs component
    - Create packages/ui/src/Tabs.drift with motion blocks
    - Add active indicator slide animation
    - Add panel enter animation (fade)
    - Support keyboard navigation
    - _Requirements: R4.6_
  
  - [ ] 9.7 Implement Tooltip component
    - Create packages/ui/src/Tooltip.drift with motion blocks
    - Add enter animation (fade + rise)
    - Add exit animation (fade + fall)
    - Position dynamically based on available space
    - _Requirements: R4.7_
  
  - [ ]* 9.8 Write property test for headless component architecture
    - **Property 17: Headless Component Architecture**
    - **Validates: Requirements R4.8**
  
  - [ ]* 9.9 Write accessibility tests for all components
    - Test ARIA attributes presence
    - Test keyboard navigation
    - Test screen reader announcements
    - _Requirements: R4.1_

- [ ] 10. Remove Framer Motion dependencies
  - [ ] 10.1 Remove framer-motion from package.json files
    - Remove from packages/compiler/package.json
    - Remove from packages/motion/package.json
    - Remove from packages/ui/package.json
    - Remove from example-app/package.json
    - Remove from root package.json
    - _Requirements: R5.1_
  
  - [ ] 10.2 Add @drift/motion-runtime dependencies
    - Add to packages/compiler/package.json (devDependency)
    - Add to packages/ui/package.json (dependency)
    - Add to example-app/package.json (dependency)
    - _Requirements: R5.3_
  
  - [ ] 10.3 Search and remove Framer Motion imports
    - Search codebase for "from 'framer-motion'" and "from \"framer-motion\""
    - Replace with @drift/motion-runtime imports where needed
    - Remove unused imports
    - _Requirements: R5.7_
  
  - [ ]* 10.4 Write property test to verify no Framer Motion imports
    - **Property 1: Web Animations API Code Generation** (validates no framer-motion imports)
    - **Validates: Requirements R5.1, R5.7**

- [ ] 11. Update example app
  - [ ] 11.1 Update example-app Button component
    - Update example-app/components/Button.drift to use new motion syntax
    - Recompile with new motion generator
    - Verify animations work in browser
    - _Requirements: R6.1, R6.2_
  
  - [ ] 11.2 Update example-app Card component
    - Update example-app/components/ImageCard.drift with enter animation
    - Add hover animation for interactive cards
    - Recompile and verify
    - _Requirements: R6.3_
  
  - [ ] 11.3 Create hero section with staggered animations
    - Create example-app/components/Hero.drift
    - Add staggered enter animations for multiple elements
    - Demonstrate sequence and stagger features
    - _Requirements: R6.4_
  
  - [ ]* 11.4 Verify 60fps animation performance
    - **Property 6.1: All example animations run at 60fps**
    - Use browser DevTools Performance tab
    - Verify no frame drops during animations
    - _Requirements: R6.5_
  
  - [ ] 11.5 Measure and document bundle size reduction
    - Build example-app with new animation system
    - Compare bundle size to previous Framer Motion version
    - Document savings in example-app/README.md
    - _Requirements: R6.7_

- [ ] 12. Checkpoint - Ensure example app works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Update documentation
  - [ ] 13.1 Update README.md
    - Replace Framer Motion references with custom animation runtime
    - Add @drift/motion-runtime to features list
    - Update installation instructions
    - Add bundle size comparison
    - _Requirements: R7.1_
  
  - [ ] 13.2 Create ANIMATION-GUIDE.md
    - Document Web Animations API usage in Drift
    - Explain motion block syntax and generated code
    - Show examples of each animation type
    - Document easing curves
    - Explain reduced motion support
    - _Requirements: R7.3_
  
  - [ ] 13.3 Update API documentation
    - Document @drift/motion-runtime API (animate, sequence, stagger, scroll, gesture)
    - Document AnimateOptions and AnimationControls interfaces
    - Document easing curves and custom cubic-bezier
    - Add TypeScript type examples
    - _Requirements: R7.4_
  
  - [ ] 13.4 Update vision document
    - Update packages/compiler/src/driftvision.MD
    - Reflect custom animation runtime implementation
    - Remove Framer Motion from dependencies
    - Document performance benefits
    - _Requirements: R7.6_
  
  - [ ]* 13.5 Verify documentation accuracy
    - **Property 7.1: Documentation accurately describes current implementation**
    - **Property 7.2: All code examples work with custom runtime**
    - Test all code examples in documentation
    - Check for broken links
    - _Requirements: R7.1, R7.2, R7.3_

- [ ] 14. Final integration and verification
  - [ ] 14.1 Run full test suite
    - Run all unit tests across packages
    - Run all property tests
    - Run integration tests
    - Verify all tests pass
    - _Requirements: R5.6_
  
  - [ ] 14.2 Build all packages
    - Build @drift/motion-runtime
    - Build @drift/motion
    - Build @drift/compiler
    - Build @drift/ui
    - Verify no build errors
    - _Requirements: R5.3_
  
  - [ ] 14.3 Test in multiple browsers
    - Test example-app in Chrome, Firefox, Safari, Edge
    - Verify animations work in all browsers
    - Test reduced motion preferences
    - _Requirements: R6.6_
  
  - [ ]* 14.4 Verify bundle size reduction
    - **Property 5.4: Generated code is smaller without Framer Motion**
    - Compare bundle sizes before/after
    - Verify 50%+ reduction in animation code
    - _Requirements: R5.4_

- [ ] 15. Final checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The implementation maintains backward compatibility - existing Drift source files will work without modification
