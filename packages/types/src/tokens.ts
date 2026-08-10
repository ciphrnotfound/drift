import type { TokenReference } from './ast'

// Token System Types

export interface TokenRegistry {
  colors: Map<string, ColorToken>
  spacing: Map<string, SpacingToken>
  typography: Map<string, TypographyToken>
  easing: Map<string, EasingToken>
  shadows: Map<string, ShadowToken>
  borders: Map<string, BorderToken>
  fonts: Map<string, FontToken>
}

export interface FontToken extends BaseToken {
  category: 'font'
  provider: 'google' | 'self-hosted' | 'system'
  family: string
  weights?: number[]
  subsets?: string[]
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  preload?: boolean
}

export interface BaseToken {
  name: string
  category: string
  description?: string
}

export interface ColorToken extends BaseToken {
  category: 'color'
  value: string | TokenReference
  resolved: string
}

export interface SpacingToken extends BaseToken {
  category: 'spacing'
  value: number | string | TokenReference
  resolved: string
  scale?: number[]
}

export interface TypographyToken extends BaseToken {
  category: 'typography'
  fontSize?: string | TokenReference
  fontWeight?: string | number | TokenReference
  lineHeight?: string | number | TokenReference
  letterSpacing?: string | TokenReference
  fontFamily?: string | TokenReference
  resolved: TypographyResolved
}

export interface TypographyResolved {
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  fontFamily: string
}

export interface EasingToken extends BaseToken {
  category: 'easing'
  value: string | number[] | TokenReference
  resolved: string
}

export interface ShadowToken extends BaseToken {
  category: 'shadow'
  value: string | ShadowValue | TokenReference
  resolved: string
}

export interface ShadowValue {
  x: number
  y: number
  blur: number
  spread: number
  color: string | TokenReference
  inset?: boolean
}

export interface BorderToken extends BaseToken {
  category: 'border'
  width?: string | number | TokenReference
  style?: string | TokenReference
  color?: string | TokenReference
  radius?: string | number | TokenReference
  resolved: BorderResolved
}

export interface BorderResolved {
  width: string
  style: string
  color: string
  radius: string
}

export interface ResolvedToken {
  name: string
  value: string
  dependencies: string[]
}
