import React from 'react'

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  layout?: 'responsive' | 'fixed' | 'fill'
  priority?: boolean
  loading?: 'lazy' | 'eager'
}

/**
 * Optimized Image component for Drift
 */
export function Image({
  src,
  alt,
  width,
  height,
  layout = 'responsive',
  priority = false,
  loading,
  className,
  style,
  ...props
}: ImageProps) {
  const isLazy = !priority && (loading === 'lazy' || !loading)
  
  const containerStyle: React.CSSProperties = {
    position: layout === 'fill' ? 'absolute' : 'relative',
    overflow: 'hidden',
    width: layout === 'fixed' ? width : '100%',
    height: layout === 'fixed' ? height : (layout === 'fill' ? '100%' : 'auto'),
    ...style,
  }

  const imgStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    ...(layout === 'fill' ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    } : {}),
  }

  return (
    <div className={`drift-image-container ${className || ''}`} style={containerStyle}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={isLazy ? 'lazy' : 'eager'}
        style={imgStyle}
        {...props}
      />
    </div>
  )
}
