import { createElement, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import type { LayoutConfig, RouteConfig } from '@drift/types'
import { Router, type RouterProps } from './Router'
import { deserializeRouteError } from './runtime'

export const DEFAULT_HYDRATION_ID = '__DRIFT_DATA__'

export interface DriftHydrationPayload {
  path: string
  data: Record<string, unknown>
  error?: unknown
}

export function serializeHydrationData(payload: DriftHydrationPayload): string {
  return JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function createHydrationScript(
  payload: DriftHydrationPayload,
  id = DEFAULT_HYDRATION_ID
): string {
  return `<script id="${escapeAttribute(id)}" type="application/json">${serializeHydrationData(payload)}</script>`
}

export function readHydrationData(
  ownerDocument: Document = document,
  id = DEFAULT_HYDRATION_ID
): DriftHydrationPayload | null {
  const element = ownerDocument.getElementById(id)
  if (!element?.textContent) return null
  try {
    const payload = JSON.parse(element.textContent)
    if (!payload || typeof payload.path !== 'string' || !payload.path.startsWith('/') ||
        !payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) return null
    return payload as DriftHydrationPayload
  } catch {
    return null
  }
}

export function hydrateDriftRouter(
  container: Element,
  routes: RouteConfig[],
  layouts: LayoutConfig[] = [],
  props: Omit<RouterProps, 'routes' | 'layouts' | 'initialPath' | 'initialData' | 'initialError'> = {}
): Root {
  const payload = readHydrationData(container.ownerDocument || document)
  const app = createElement(Router, {
    ...props,
    routes,
    layouts,
    initialPath: payload?.path,
    initialData: payload?.data,
    initialError: payload?.error ? deserializeRouteError(payload.error) : undefined,
  })
  if (payload) return hydrateRoot(container, app)

  // Development and static builds have no SSR payload to hydrate.
  const root = createRoot(container)
  root.render(app)
  return root
}

export function hydrateDriftApp(container: Element, app: ReactNode): Root {
  return hydrateRoot(container, app)
}

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character)
}
