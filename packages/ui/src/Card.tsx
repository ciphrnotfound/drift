import React from 'react'
import { cx, type DriftStyleProps } from './utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, DriftStyleProps {
  tone?: 'surface' | 'muted' | 'accent'
  interactive?: boolean
}

export function Card({
  tone = 'surface',
  interactive = false,
  className,
  tw,
  ...props
}: CardProps) {
  return (
    <div
      className={cx('drift-ui-card', className, tw)}
      data-tone={tone}
      data-interactive={interactive ? 'true' : undefined}
      {...props}
    />
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement>, DriftStyleProps {}
export function CardHeader({ className, tw, ...props }: CardHeaderProps) {
  return <div className={cx('drift-ui-card__header', className, tw)} {...props} />
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement>, DriftStyleProps {}
export function CardBody({ className, tw, ...props }: CardBodyProps) {
  return <div className={cx('drift-ui-card__body', className, tw)} {...props} />
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement>, DriftStyleProps {}
export function CardFooter({ className, tw, ...props }: CardFooterProps) {
  return <div className={cx('drift-ui-card__footer', className, tw)} {...props} />
}
