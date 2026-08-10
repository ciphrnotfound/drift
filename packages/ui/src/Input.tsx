import React from 'react'
import { cx, type DriftStyleProps } from './utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, DriftStyleProps {
  invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, tw, 'aria-invalid': ariaInvalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cx('drift-ui-input', className, tw)}
      data-invalid={invalid ? 'true' : undefined}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
      {...props}
    />
  )
})
