import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match every path except API, Next internals, static assets, and known files.
  // `admin` excluded so Payload's /admin/** route group serves directly without
  // a locale prefix; `keystatic` kept until cutover C.
  matcher: ['/((?!api|_next|_vercel|fonts|favicon|keystatic|admin|.*\\..*).*)']
}
