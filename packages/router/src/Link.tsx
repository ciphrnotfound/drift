import { useCallback, useEffect, useMemo, useRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { normalizePathname, useRouter } from './Router'

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
  replace?: boolean
  scroll?: boolean
  prefetch?: boolean | 'intent' | 'viewport'
  activeClassName?: string
  pendingClassName?: string
  children: ReactNode
  onNavigate?: (href: string) => void
}

export function Link({
  to,
  replace = false,
  scroll = true,
  prefetch = 'intent',
  activeClassName,
  pendingClassName,
  className,
  children,
  onClick,
  onFocus,
  onMouseEnter,
  onNavigate,
  target,
  download,
  ...props
}: LinkProps) {
  const router = useRouter()
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const targetPath = useMemo(() => resolvePathname(to), [to])
  const isInternal = targetPath !== null
  const isActive = isInternal && router.pathname === targetPath
  const isPending = isInternal && router.pendingPath === targetPath
  const shouldPrefetchOnIntent = prefetch === true || prefetch === 'intent'

  const prefetchRoute = useCallback(() => {
    if (isInternal && prefetch !== false) void router.prefetch(to)
  }, [isInternal, prefetch, router, to])

  useEffect(() => {
    if (prefetch !== 'viewport' || !isInternal || !anchorRef.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        prefetchRoute()
        observer.disconnect()
      }
    }, { rootMargin: '160px' })
    observer.observe(anchorRef.current)
    return () => observer.disconnect()
  }, [isInternal, prefetch, prefetchRoute])

  const handleClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      !isInternal ||
      download !== undefined ||
      (target && target !== '_self') ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
    ) return

    event.preventDefault()
    onNavigate?.(to)
    router.navigate(to, { replace, scroll })
  }, [download, isInternal, onClick, onNavigate, replace, router, scroll, target, to])

  const combinedClassName = [
    className,
    isActive && activeClassName,
    isPending && pendingClassName,
  ].filter(Boolean).join(' ')

  return (
    <a
      ref={anchorRef}
      href={to}
      target={target}
      download={download}
      className={combinedClassName}
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive}
      data-pending={isPending}
      onClick={handleClick}
      onMouseEnter={event => {
        onMouseEnter?.(event)
        if (shouldPrefetchOnIntent) prefetchRoute()
      }}
      onFocus={event => {
        onFocus?.(event)
        if (shouldPrefetchOnIntent) prefetchRoute()
      }}
      {...props}
    >
      {children}
    </a>
  )
}

function resolvePathname(href: string): string | null {
  try {
    const base = typeof window === 'undefined' ? 'http://drift.local' : window.location.href
    const url = new URL(href, base)
    if (typeof window !== 'undefined' && url.origin !== window.location.origin) return null
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return normalizePathname(url.pathname)
  } catch {
    return null
  }
}
