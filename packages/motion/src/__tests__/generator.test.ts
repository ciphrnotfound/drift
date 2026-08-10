import { describe, it, expect } from 'vitest'
import {
  generateWebAnimations,
  convertToKeyframes,
  generateTimingOptions,
} from '../generator'
import type { MotionBlock, AnimationDeclaration } from '@drift/types'

describe('generateWebAnimations', () => {
  it('should generate Web Animations API code for enter animation', () => {
    const motionBlock: MotionBlock = {
      type: 'MotionBlock',
      enter: {
        type: 'AnimationDeclaration',
        properties: [
          {
            type: 'AnimationProperty',
            name: 'fade',
            from: 0,
            to: 1,
            location: {} as any,
          },
        ],
        duration: 300,
        delay: 0,
        easing: 'ease-out',
        location: {} as any,
      },
      exit: null,
      gestures: [],
      location: {} as any,
    }

    const result = generateWebAnimations('TestComponent', motionBlock)

    expect(result.componentName).toBe('TestComponent')
    expect(result.imports).toContain("import { animate } from '@drift/motion-runtime'")
    expect(result.hooks).toHaveLength(1)
    expect(result.hooks[0].type).toBe('enter')
    expect(result.hooks[0].code).toContain('animate(')
    expect(result.hooks[0].code).toContain('elementRef.current')
    expect(result.hooks[0].code).toContain('useEffect')
  })

  it('should generate Web Animations API code for gesture animation', () => {
    const motionBlock: MotionBlock = {
      type: 'MotionBlock',
      enter: null,
      exit: null,
      gestures: [
        {
          type: 'GestureDeclaration',
          gesture: 'hover',
          animation: {
            type: 'AnimationDeclaration',
            properties: [
              {
                type: 'AnimationProperty',
                name: 'grow',
                from: 1,
                to: 1.05,
                location: {} as any,
              },
            ],
            duration: 200,
            location: {} as any,
          },
          constraints: null,
          location: {} as any,
        },
      ],
      location: {} as any,
    }

    const result = generateWebAnimations('TestComponent', motionBlock)

    expect(result.imports).toContain("import { gesture } from '@drift/motion-runtime'")
    expect(result.effects).toHaveLength(1)
    expect(result.effects[0].trigger).toBe('hover')
    expect(result.effects[0].code).toContain('gesture(')
  })

  it('should return empty result for null motion block', () => {
    const result = generateWebAnimations('TestComponent', null)

    expect(result.componentName).toBe('TestComponent')
    expect(result.imports).toHaveLength(0)
    expect(result.hooks).toHaveLength(0)
    expect(result.effects).toHaveLength(0)
  })
})

describe('convertToKeyframes', () => {
  it('should convert fade animation to opacity keyframes', () => {
    const properties = [
      {
        type: 'AnimationProperty' as const,
        name: 'fade',
        from: 0,
        to: 1,
        location: {} as any,
      },
    ]

    const keyframes = convertToKeyframes(properties)

    expect(keyframes).toHaveLength(2)
    expect(keyframes[0]).toEqual({ opacity: 0 })
    expect(keyframes[1]).toEqual({ opacity: 1 })
  })

  it('should convert rise animation to translateY transform', () => {
    const properties = [
      {
        type: 'AnimationProperty' as const,
        name: 'rise',
        to: 20,
        location: {} as any,
      },
    ]

    const keyframes = convertToKeyframes(properties)

    expect(keyframes).toHaveLength(2)
    expect(keyframes[0]).toEqual({ transform: 'translateY(0px)' })
    expect(keyframes[1]).toEqual({ transform: 'translateY(-20px)' })
  })

  it('should convert fall animation to translateY transform', () => {
    const properties = [
      {
        type: 'AnimationProperty' as const,
        name: 'fall',
        to: 20,
        location: {} as any,
      },
    ]

    const keyframes = convertToKeyframes(properties)

    expect(keyframes).toHaveLength(2)
    expect(keyframes[0]).toEqual({ transform: 'translateY(0px)' })
    expect(keyframes[1]).toEqual({ transform: 'translateY(20px)' })
  })

  it('should convert grow animation to scale transform', () => {
    const properties = [
      {
        type: 'AnimationProperty' as const,
        name: 'grow',
        from: 1,
        to: 1.1,
        location: {} as any,
      },
    ]

    const keyframes = convertToKeyframes(properties)

    expect(keyframes).toHaveLength(2)
    expect(keyframes[0]).toEqual({ transform: 'scale(1)' })
    expect(keyframes[1]).toEqual({ transform: 'scale(1.1)' })
  })

  it('should convert shrink animation to scale transform', () => {
    const properties = [
      {
        type: 'AnimationProperty' as const,
        name: 'shrink',
        from: 1,
        to: 0.9,
        location: {} as any,
      },
    ]

    const keyframes = convertToKeyframes(properties)

    expect(keyframes).toHaveLength(2)
    expect(keyframes[0]).toEqual({ transform: 'scale(1)' })
    expect(keyframes[1]).toEqual({ transform: 'scale(0.9)' })
  })
})

describe('generateTimingOptions', () => {
  it('should generate timing options with duration and delay', () => {
    const animation: AnimationDeclaration = {
      type: 'AnimationDeclaration',
      properties: [],
      duration: 300,
      delay: 100,
      location: {} as any,
    }

    const options = generateTimingOptions(animation)

    expect(options.duration).toBe(300)
    expect(options.delay).toBe(100)
    expect(options.fill).toBe('both')
  })

  it('should convert named easing to cubic-bezier', () => {
    const animation: AnimationDeclaration = {
      type: 'AnimationDeclaration',
      properties: [],
      duration: 300,
      easing: 'spring',
      location: {} as any,
    }

    const options = generateTimingOptions(animation)

    expect(options.easing).toBe('cubic-bezier(0.5, 1.25, 0.75, 1.25)')
  })

  it('should handle custom cubic-bezier easing', () => {
    const animation: AnimationDeclaration = {
      type: 'AnimationDeclaration',
      properties: [],
      duration: 300,
      easing: 'cubic(0.4, 0, 0.2, 1)',
      location: {} as any,
    }

    const options = generateTimingOptions(animation)

    expect(options.easing).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
  })
})
