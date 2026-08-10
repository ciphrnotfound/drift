export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export interface DriftStyleProps {
  /** Optional Tailwind utility classes. Drift styles come first; utilities can override them. */
  tw?: string
}
