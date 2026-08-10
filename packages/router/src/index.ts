// Drift Router - File-based routing

// Route generation and layout hierarchy
export {
  generateRoutes,
  buildLayoutHierarchy,
  associateRoutesWithLayouts,
  parseDataLoader,
  generateLoaderExecutionOrder,
} from './generator'

// Router component
export { Router, normalizePathname, matchPath, matchRoute, useRouter } from './Router'
export type { NavigateOptions, RouterContextValue, RouterLocation, RouterProps } from './Router'

// SSR
export { renderToHTML } from './ssr'
export type { SSRResult } from './ssr'

export {
  DEFAULT_HYDRATION_ID,
  createHydrationScript,
  hydrateDriftApp,
  hydrateDriftRouter,
  readHydrationData,
  serializeHydrationData,
} from './hydration'
export type { DriftHydrationPayload } from './hydration'

// Metadata component
export { Metadata } from './Metadata'
export type { MetadataProps } from './Metadata'

// Link component
export { Link } from './Link'
export type { LinkProps } from './Link'

// Hooks
export {
  useParams,
  useLoader,
  useLoaderData,
  useNavigate,
  useNavigation,
  usePathname,
  useRevalidator,
  useRoute,
  useRouteError,
  useSearchParams,
} from './hooks'

export {
  RouteError,
  clearRouteModuleCache,
  executeRouteLoaders,
  deserializeRouteError,
  isRouteError,
  preloadRouteMatch,
  serializeRouteError,
} from './runtime'
export type { LoadRouteDataOptions } from './runtime'
