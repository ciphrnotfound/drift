// Style System Types

export interface CompiledStyles {
  componentName: string
  scopedClassName: string
  css: string
  variants: CompiledVariant[]
  responsive: CompiledResponsive[]
  classNames: Map<string, string>
}

export interface CompiledVariant {
  name: string
  values: Map<string, string>
  defaultValue?: string
}

export interface CompiledResponsive {
  breakpoint: string
  minWidth: number
  className: string
  rules: CSSRule[]
}

export interface CSSRule {
  property: string
  value: string
  important: boolean
}

export interface StyleResult {
  componentName: string
  scopedClassName: string
  baseStyles: CSSRule[]
  variants: VariantStyle[]
  responsive: ResponsiveStyle[]
  cssOutput: string
}

export interface VariantStyle {
  name: string
  values: Map<string, CSSRule[]>
  defaultValue?: string
}

export interface ResponsiveStyle {
  breakpoint: string
  minWidth: number
  rules: CSSRule[]
}

export interface CSSOptimizationResult {
  original: string
  optimized: string
  removedRules: number
  mergedRules: number
  sizeBefore: number
  sizeAfter: number
}
