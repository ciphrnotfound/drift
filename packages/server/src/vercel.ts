import type { RequestHandler } from './index'

export interface VercelFetchHandler {
  fetch(request: Request): Promise<Response>
}

/** Adapt a Drift RequestHandler to Vercel's Web-standard Node.js Function export. */
export function createVercelHandler(handler: RequestHandler): VercelFetchHandler {
  return Object.freeze({
    fetch(request: Request) {
      return handler(request)
    },
  })
}
