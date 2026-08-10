export { Router, normalizePathname, matchPath, matchRoute, useRouter } from './Router'
export type { NavigateOptions, RouterContextValue, RouterLocation, RouterProps } from './Router'
export { Link } from './Link'
export type { LinkProps } from './Link'
export { Metadata } from './Metadata'
export type { MetadataProps } from './Metadata'
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
export { RouteError, deserializeRouteError, isRouteError, serializeRouteError } from './runtime'
export {
  DEFAULT_HYDRATION_ID,
  createHydrationScript,
  hydrateDriftApp,
  hydrateDriftRouter,
  readHydrationData,
  serializeHydrationData,
} from './hydration'
export type { DriftHydrationPayload } from './hydration'
