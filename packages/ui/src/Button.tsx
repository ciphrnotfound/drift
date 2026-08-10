import React from 'react'
import { cx, type DriftStyleProps } from './utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    DriftStyleProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  tw,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx('drift-ui-button', className, tw)}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? 'true' : undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="drift-ui-button__spinner" aria-hidden="true" />}
      <span className="drift-ui-button__content">{children}</span>
    </button>
  )
}
