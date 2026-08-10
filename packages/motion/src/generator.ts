import type {
  MotionBlock,
  AnimationDeclaration,
  AnimationProperty,
  GestureDeclaration,
  MotionPropsCode,
  GestureHandlerCode,
  CompiledMotion,
  TokenRegistry,
  WebAnimationCode,
  AnimationHook,
  AnimationEffect,
} from '@drift/types'

/**
 * Generate Web Animations API code from a motion block
 */
export function generateWebAnimations(
  componentName: string,
  motionBlock: MotionBlock | null,
  tokenRegistry?: TokenRegistry
): WebAnimationCode {
  if (!motionBlock) {
    return {
      componentName,
      imports: [],
      hooks: [],
      effects: [],
    }
  }

  const imports: string[] = []
  const hooks: AnimationHook[] = []
  const effects: AnimationEffect[] = []

  // Collect required imports
  const requiredImports = new Set<string>()

  // Generate enter animation
  if (motionBlock.enter) {
    const hook = generateEnterAnimation(motionBlock.enter, tokenRegistry)
    hooks.push(hook)
    requiredImports.add('animate')
  }

  // Generate exit animation
  if (motionBlock.exit) {
    const hook = generateExitAnimation(motionBlock.exit, tokenRegistry)
    hooks.push(hook)
    requiredImports.add('animate')
  }

  // Generate gesture animations
  motionBlock.gestures.forEach((gesture) => {
    const effect = generateGestureAnimation(gesture, tokenRegistry)
    effects.push(effect)
    requiredImports.add('gesture')
  })

  // Build imports array
  if (requiredImports.size > 0) {
    imports.push(`import { ${Array.from(requiredImports).join(', ')} } from '@drift/motion-runtime'`)
  }

  return {
    componentName,
    imports,
    hooks,
    effects,
  }
}

/**
 * Generate Framer Motion props from a motion block (DEPRECATED - use generateWebAnimations)
 */
export function generateMotionProps(
  componentName: string,
  motionBlock: MotionBlock | null,
  tokenRegistry?: TokenRegistry
): CompiledMotion {
  if (!motionBlock) {
    return {
      componentName,
      imports: [],
      props: {},
      handlers: [],
    }
  }

  const imports: string[] = ['motion']
  const props: MotionPropsCode = {}
  const handlers: GestureHandlerCode[] = []

  // Generate enter animation (initial + animate)
  if (motionBlock.enter) {
    const { initial, animate, transition } = generateEnterAnimationFramerMotion(
      motionBlock.enter,
      tokenRegistry
    )
    props.initial = initial
    props.animate = animate
    props.transition = transition
  }

  // Generate exit animation
  if (motionBlock.exit) {
    props.exit = generateExitAnimationFramerMotion(motionBlock.exit, tokenRegistry)
  }

  // Generate gesture animations
  motionBlock.gestures.forEach((gesture) => {
    const gestureProps = generateGestureAnimationFramerMotion(gesture, tokenRegistry)
    Object.assign(props, gestureProps)
  })

  return {
    componentName,
    imports,
    props,
    handlers,
  }
}

/**
 * Generate enter animation hook using Web Animations API
 */
export function generateEnterAnimation(
  animation: AnimationDeclaration,
  tokenRegistry?: TokenRegistry
): AnimationHook {
  const keyframes = convertToKeyframes(animation.properties)
  const options = generateTimingOptions(animation, tokenRegistry)

  const code = `
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!elementRef.current) return
    
    const animation = animate(elementRef.current, ${JSON.stringify(keyframes, null, 2)}, ${JSON.stringify(options, null, 2)})
    
    return () => animation.cancel()
  }, [])`

  return {
    name: 'enterAnimation',
    type: 'enter',
    code,
  }
}

/**
 * Generate exit animation hook using Web Animations API
 */
export function generateExitAnimation(
  animation: AnimationDeclaration,
  tokenRegistry?: TokenRegistry
): AnimationHook {
  const keyframes = convertToKeyframes(animation.properties)
  const options = generateTimingOptions(animation, tokenRegistry)

  const code = `
  // Exit animation handled by cleanup function
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        animate(elementRef.current, ${JSON.stringify(keyframes, null, 2)}, ${JSON.stringify(options, null, 2)})
      }
    }
  }, [])`

  return {
    name: 'exitAnimation',
    type: 'exit',
    code,
  }
}

/**
 * Generate gesture animation effect using Web Animations API
 */
export function generateGestureAnimation(
  gestureDecl: GestureDeclaration,
  tokenRegistry?: TokenRegistry
): AnimationEffect {
  const keyframes = convertToKeyframes(gestureDecl.animation.properties)
  const options = generateTimingOptions(gestureDecl.animation, tokenRegistry)

  const code = `
  useEffect(() => {
    if (!elementRef.current) return
    
    const cleanup = gesture(
      elementRef.current,
      '${gestureDecl.gesture}',
      ${JSON.stringify(keyframes, null, 2)},
      ${JSON.stringify(options, null, 2)}
    )
    
    return cleanup
  }, [])`

  return {
    trigger: gestureDecl.gesture,
    code,
  }
}

/**
 * Convert Drift animation properties to Web Animations API keyframes
 */
export function convertToKeyframes(
  properties: AnimationProperty[]
): Array<Record<string, any>> {
  const fromFrame: Record<string, any> = {}
  const toFrame: Record<string, any> = {}

  properties.forEach((prop) => {
    const { cssProperty, fromValue, toValue } = convertAnimationPropertyToWebAPI(prop)

    if (fromValue !== undefined) {
      fromFrame[cssProperty] = fromValue
    }
    toFrame[cssProperty] = toValue
  })

  return [fromFrame, toFrame]
}

/**
 * Generate timing options for Web Animations API
 */
export function generateTimingOptions(
  animation: AnimationDeclaration,
  tokenRegistry?: TokenRegistry
): Record<string, any> {
  const options: Record<string, any> = {
    fill: 'both',
  }

  if (animation.duration) {
    options.duration = animation.duration // Already in milliseconds
  }

  if (animation.delay) {
    options.delay = animation.delay // Already in milliseconds
  }

  if (animation.easing) {
    const easing = resolveEasing(animation.easing, tokenRegistry)
    if (Array.isArray(easing)) {
      options.easing = `cubic-bezier(${easing.join(', ')})`
    } else {
      options.easing = easing
    }
  }

  return options
}

/**
 * Convert animation property to Web Animations API CSS property and values
 */
function convertAnimationPropertyToWebAPI(prop: AnimationProperty): {
  cssProperty: string
  fromValue?: any
  toValue: any
} {
  // Handle shorthand properties
  if (prop.name === 'fade') {
    return {
      cssProperty: 'opacity',
      fromValue: prop.from || 0,
      toValue: prop.to,
    }
  }

  if (prop.name === 'rise') {
    const value = parseFloat(prop.to.toString())
    return {
      cssProperty: 'transform',
      fromValue: prop.from ? `translateY(${prop.from}px)` : 'translateY(0px)',
      toValue: `translateY(-${value}px)`,
    }
  }

  if (prop.name === 'fall') {
    const value = parseFloat(prop.to.toString())
    return {
      cssProperty: 'transform',
      fromValue: prop.from ? `translateY(${prop.from}px)` : 'translateY(0px)',
      toValue: `translateY(${value}px)`,
    }
  }

  if (prop.name === 'shrink') {
    return {
      cssProperty: 'transform',
      fromValue: prop.from ? `scale(${prop.from})` : 'scale(1)',
      toValue: `scale(${prop.to})`,
    }
  }

  if (prop.name === 'grow') {
    return {
      cssProperty: 'transform',
      fromValue: prop.from ? `scale(${prop.from})` : 'scale(1)',
      toValue: `scale(${prop.to})`,
    }
  }

  // Direct CSS properties
  return {
    cssProperty: prop.name,
    fromValue: prop.from,
    toValue: prop.to,
  }
}

/**
 * Generate enter animation (initial + animate + transition) - DEPRECATED Framer Motion version
 */
function generateEnterAnimationFramerMotion(
  animation: AnimationDeclaration,
  _tokenRegistry?: TokenRegistry
): { initial: string; animate: string; transition: string } {
  const initialProps: Record<string, any> = {}
  const animateProps: Record<string, any> = {}

  animation.properties.forEach((prop) => {
    const { cssProperty, fromValue, toValue } = convertAnimationProperty(prop)

    if (fromValue !== undefined) {
      initialProps[cssProperty] = fromValue
    }
    animateProps[cssProperty] = toValue
  })

  // Generate transition
  const transition: Record<string, any> = {}

  if (animation.duration) {
    transition.duration = animation.duration / 1000 // Convert ms to seconds
  }

  if (animation.delay) {
    transition.delay = animation.delay / 1000
  }

  if (animation.easing) {
    const easing = resolveEasing(animation.easing, _tokenRegistry)
    transition.ease = easing
  }

  return {
    initial: JSON.stringify(initialProps),
    animate: JSON.stringify(animateProps),
    transition: JSON.stringify(transition),
  }
}

/**
 * Generate exit animation - DEPRECATED Framer Motion version
 */
function generateExitAnimationFramerMotion(
  animation: AnimationDeclaration,
  _tokenRegistry?: TokenRegistry
): string {
  const exitProps: Record<string, any> = {}

  animation.properties.forEach((prop) => {
    const { cssProperty, toValue } = convertAnimationProperty(prop)
    exitProps[cssProperty] = toValue
  })

  return JSON.stringify(exitProps)
}

/**
 * Generate gesture animation props - DEPRECATED Framer Motion version
 */
function generateGestureAnimationFramerMotion(
  gesture: GestureDeclaration,
  _tokenRegistry?: TokenRegistry
): Partial<MotionPropsCode> {
  const props: Partial<MotionPropsCode> = {}
  const animationProps: Record<string, any> = {}

  gesture.animation.properties.forEach((prop) => {
    const { cssProperty, toValue } = convertAnimationProperty(prop)
    animationProps[cssProperty] = toValue
  })

  switch (gesture.gesture) {
    case 'hover':
      props.whileHover = JSON.stringify(animationProps)
      break
    case 'press':
      props.whileTap = JSON.stringify(animationProps)
      break
    case 'focus':
      props.whileFocus = JSON.stringify(animationProps)
      break
    case 'drag':
      props.drag = 'true'
      props.whileDrag = JSON.stringify(animationProps)
      if (gesture.constraints) {
        props.dragConstraints = JSON.stringify(gesture.constraints.bounds || {})
      }
      break
  }

  return props
}

/**
 * Convert animation property to CSS property and values (DEPRECATED - for Framer Motion)
 */
function convertAnimationProperty(prop: AnimationProperty): {
  cssProperty: string
  fromValue?: any
  toValue: any
} {
  // Handle shorthand properties
  if (prop.name === 'fade') {
    return {
      cssProperty: 'opacity',
      fromValue: prop.from || 0,
      toValue: prop.to,
    }
  }

  if (prop.name === 'rise') {
    const value = parseFloat(prop.to.toString())
    return {
      cssProperty: 'y',
      fromValue: prop.from || 0,
      toValue: -value,
    }
  }

  if (prop.name === 'fall') {
    const value = parseFloat(prop.to.toString())
    return {
      cssProperty: 'y',
      fromValue: prop.from || 0,
      toValue: value,
    }
  }

  if (prop.name === 'shrink') {
    return {
      cssProperty: 'scale',
      fromValue: prop.from || 1,
      toValue: prop.to,
    }
  }

  if (prop.name === 'grow') {
    return {
      cssProperty: 'scale',
      fromValue: prop.from || 1,
      toValue: prop.to,
    }
  }

  // Direct CSS properties
  return {
    cssProperty: prop.name,
    fromValue: prop.from,
    toValue: prop.to,
  }
}

/**
 * Resolve easing token or return easing value
 */
function resolveEasing(
  easing: string | any,
  _tokenRegistry?: TokenRegistry
): any {
  if (typeof easing === 'string') {
    // Parse cubic-bezier
    if (easing.startsWith('cubic')) {
      return parseCubicBezier(easing)
    }

    // Map named easings to cubic-bezier arrays for Web Animations API
    const easingMap: Record<string, number[]> = {
      spring: [0.5, 1.25, 0.75, 1.25],
      snap: [0.95, 0.05, 0.795, 0.035],
      exhale: [0.4, 0, 0.2, 1],
      breathe: [0.4, 0, 0.6, 1],
      float: [0.25, 0.46, 0.45, 0.94],
    }

    if (easingMap[easing]) {
      return easingMap[easing]
    }

    // Named easing (for Framer Motion compatibility)
    return easing
  }

  return easing
}

/**
 * Parse cubic-bezier string to array
 */
function parseCubicBezier(value: string): number[] | string {
  const match = value.match(/cubic\(([^)]+)\)/)
  if (match && match[1]) {
    return match[1].split(',').map((n) => parseFloat(n.trim()))
  }
  return value
}

/**
 * Optimize animations for GPU acceleration
 */
export function optimizeForGPU(props: MotionPropsCode): MotionPropsCode {
  const optimized = { ...props }

  // Add will-change hints for animated properties
  const animatedProps = new Set<string>()

  if (props.animate) {
    try {
      const animate = JSON.parse(props.animate)
      Object.keys(animate).forEach((key) => animatedProps.add(key))
    } catch {}
  }

  if (props.whileHover) {
    try {
      const hover = JSON.parse(props.whileHover)
      Object.keys(hover).forEach((key) => animatedProps.add(key))
    } catch {}
  }

  // Prefer transform properties
  if (animatedProps.has('x') || animatedProps.has('y')) {
    // Already using transform
  }

  return optimized
}


/**
 * Apply reduced motion preferences
 */
export function applyReducedMotion(
  props: MotionPropsCode,
  mode: 'disable' | 'simplify' | 'respect' = 'respect'
): MotionPropsCode {
  if (mode === 'disable') {
    // Remove all animations
    return {}
  }

  if (mode === 'simplify') {
    // Simplify animations - remove complex motion, keep opacity
    const simplified: MotionPropsCode = {}

    if (props.initial) {
      try {
        const initial = JSON.parse(props.initial)
        const simpleInitial: Record<string, any> = {}
        if ('opacity' in initial) {
          simpleInitial.opacity = initial.opacity
        }
        simplified.initial = JSON.stringify(simpleInitial)
      } catch {}
    }

    if (props.animate) {
      try {
        const animate = JSON.parse(props.animate)
        const simpleAnimate: Record<string, any> = {}
        if ('opacity' in animate) {
          simpleAnimate.opacity = animate.opacity
        }
        simplified.animate = JSON.stringify(simpleAnimate)
      } catch {}
    }

    // Reduce transition duration
    if (props.transition) {
      try {
        const transition = JSON.parse(props.transition)
        transition.duration = Math.min(transition.duration || 0.3, 0.15)
        simplified.transition = JSON.stringify(transition)
      } catch {}
    }

    return simplified
  }

  // 'respect' mode - wrap with prefers-reduced-motion check
  return props
}

/**
 * Generate code that respects prefers-reduced-motion
 */
export function generateReducedMotionCode(
  props: MotionPropsCode,
  mode: 'disable' | 'simplify' | 'respect'
): string {
  if (mode === 'respect') {
    return `
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const motionProps = prefersReducedMotion ? {} : ${JSON.stringify(props)}
`
  }

  const adjusted = applyReducedMotion(props, mode)
  return `const motionProps = ${JSON.stringify(adjusted)}`
}
