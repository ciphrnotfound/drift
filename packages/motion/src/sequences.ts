import type { MotionSequence, MotionParam, Keyframe } from '@drift/types'

/**
 * Motion sequence registry
 */
export class MotionSequenceRegistry {
  private sequences = new Map<string, MotionSequence>()

  register(sequence: MotionSequence): void {
    this.sequences.set(sequence.name, sequence)
  }

  get(name: string): MotionSequence | undefined {
    return this.sequences.get(name)
  }

  has(name: string): boolean {
    return this.sequences.has(name)
  }

  getAll(): MotionSequence[] {
    return Array.from(this.sequences.values())
  }
}

/**
 * Generate code for a motion sequence
 */
export function generateSequenceCode(
  sequence: MotionSequence,
  params: Record<string, any> = {}
): string {
  const resolvedParams = resolveSequenceParams(sequence, params)
  const keyframes = generateKeyframesCode(sequence.keyframes, resolvedParams)

  return `{
  keyframes: ${keyframes},
  duration: ${resolvedParams.duration || sequence.defaultDuration},
  ease: "${resolvedParams.easing || sequence.defaultEasing}"
}`
}

/**
 * Resolve sequence parameters with defaults
 */
function resolveSequenceParams(
  sequence: MotionSequence,
  params: Record<string, any>
): Record<string, any> {
  const resolved: Record<string, any> = {}

  sequence.params.forEach((param) => {
    resolved[param.name] = params[param.name] ?? param.defaultValue
  })

  return resolved
}

/**
 * Generate keyframes code
 */
function generateKeyframesCode(
  keyframes: Keyframe[],
  params: Record<string, any>
): string {
  const frames = keyframes.map((keyframe) => {
    const props: Record<string, any> = {}

    Object.entries(keyframe.properties).forEach(([key, value]) => {
      // Replace parameter references
      if (typeof value === 'string' && value.startsWith('$')) {
        const paramName = value.substring(1)
        props[key] = params[paramName] ?? value
      } else {
        props[key] = value
      }
    })

    return JSON.stringify(props)
  })

  return `[${frames.join(', ')}]`
}

/**
 * Create a parameterized motion sequence
 */
export function createMotionSequence(
  name: string,
  params: MotionParam[],
  keyframes: Keyframe[],
  defaultDuration: number = 1000,
  defaultEasing: string = 'ease'
): MotionSequence {
  return {
    name,
    params,
    keyframes,
    defaultDuration,
    defaultEasing,
  }
}

/**
 * Built-in motion sequences
 */
export const builtInSequences: MotionSequence[] = [
  createMotionSequence(
    'fadeIn',
    [],
    [
      { offset: 0, properties: { opacity: 0 } },
      { offset: 1, properties: { opacity: 1 } },
    ],
    300,
    'ease'
  ),
  createMotionSequence(
    'fadeOut',
    [],
    [
      { offset: 0, properties: { opacity: 1 } },
      { offset: 1, properties: { opacity: 0 } },
    ],
    300,
    'ease'
  ),
  createMotionSequence(
    'slideUp',
    [{ name: 'distance', type: 'number', defaultValue: 20 }],
    [
      { offset: 0, properties: { y: '$distance', opacity: 0 } },
      { offset: 1, properties: { y: 0, opacity: 1 } },
    ],
    400,
    'ease'
  ),
  createMotionSequence(
    'slideDown',
    [{ name: 'distance', type: 'number', defaultValue: 20 }],
    [
      { offset: 0, properties: { y: -20, opacity: 0 } },
      { offset: 1, properties: { y: 0, opacity: 1 } },
    ],
    400,
    'ease'
  ),
  createMotionSequence(
    'scale',
    [{ name: 'from', type: 'number', defaultValue: 0.8 }],
    [
      { offset: 0, properties: { scale: '$from', opacity: 0 } },
      { offset: 1, properties: { scale: 1, opacity: 1 } },
    ],
    400,
    'spring'
  ),
]

/**
 * Initialize built-in sequences in registry
 */
export function initializeBuiltInSequences(
  registry: MotionSequenceRegistry
): void {
  builtInSequences.forEach((sequence) => {
    registry.register(sequence)
  })
}
