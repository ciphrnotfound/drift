import { useMemo } from 'react'
import { useRouter, type NavigateOptions, type RouterContextValue } from './Router'

/**
 * Hook to access route parameters
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const params = useParams()
 *   return <div>User ID: {params.id}</div>
 * }
 * ```
 */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const router = useRouter()
  return router.params as T
}

/**
 * Hook to access data loader results
 * 
 * @param key - The loader key (e.g., 'route:id' or 'layout:id')
 * @returns The data returned by the loader
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const userData = useLoader('route:/users/[id]')
 *   return <div>{userData.name}</div>
 * }
 * ```
 */
export function useLoader<T = any>(key?: string): T {
  const router = useRouter()
  
  if (key) {
    return router.loaderData[key] as T
  }
  
  // If no key provided, return the current route's loader data
  const routeKey = `route:${router.currentRoute?.route.id}`
  return router.loaderData[routeKey] as T
}

/**
 * Hook to access all loader data
 * 
 * @returns All loader data for the current route and its layouts
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const allData = useLoaderData()
 *   return <div>{JSON.stringify(allData)}</div>
 * }
 * ```
 */
export function useLoaderData(): Record<string, any> {
  const router = useRouter()
  return router.loaderData
}

/**
 * Hook to access navigation function
 * 
 * @returns Navigation function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const navigate = useNavigate()
 *   return <button onClick={() => navigate('/home')}>Go Home</button>
 * }
 * ```
 */
export function useNavigate(): (path: string, options?: NavigateOptions) => void {
  const router = useRouter()
  return router.navigate
}

/** The current loader or render error for the nearest route boundary. */
export function useRouteError<T = unknown>(): T | null {
  return useRouter().error as T | null
}

/** Retry the current route loaders without reloading the document. */
export function useRevalidator(): { revalidate: () => void; state: 'idle' | 'loading' } {
  const router = useRouter()
  return { revalidate: router.retry, state: router.isLoading ? 'loading' : 'idle' }
}

/**
 * Hook to access current route information
 * 
 * @returns Current route match or null
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const route = useRoute()
 *   return <div>Current path: {route?.route.path}</div>
 * }
 * ```
 */
export function useRoute() {
  const router = useRouter()
  return router.currentRoute
}

/** Current normalized URL pathname. */
export function usePathname(): string {
  return useRouter().pathname
}

/** A stable URLSearchParams snapshot for the current URL. */
export function useSearchParams(): URLSearchParams {
  const search = useRouter().search
  return useMemo(() => new URLSearchParams(search), [search])
}

/** Navigation status for progress bars, pending links, and route transitions. */
export function useNavigation(): Pick<RouterContextValue, 'isNavigating' | 'pendingPath'> & { state: 'idle' | 'loading' } {
  const { isNavigating, isLoading, pendingPath } = useRouter()
  return { isNavigating, pendingPath, state: isNavigating || isLoading ? 'loading' : 'idle' }
}
