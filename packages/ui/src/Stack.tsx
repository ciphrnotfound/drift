import React from 'react'
import { cx, type DriftStyleProps } from './utils'

export interface StackProps extends React.HTMLAttributes<HTMLDivElement>, DriftStyleProps {
  direction?: 'row' | 'column'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  gap?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8'
  wrap?: boolean
}

export function Stack({
  direction = 'column',
  align = 'stretch',
  justify = 'start',
  gap = '4',
  wrap = false,
  className,
  tw,
  ...props
}: StackProps) {
  return (
    <div
      className={cx('drift-ui-stack', className, tw)}
      data-direction={direction}
      data-align={align}
      data-justify={justify}
      data-gap={gap}
      data-wrap={wrap ? 'true' : undefined}
      {...props}
    />
  )
}
