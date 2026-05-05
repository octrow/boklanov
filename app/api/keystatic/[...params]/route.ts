import { makeRouteHandler } from '@keystatic/next/route-handler'
import config, { showAdminUI } from '../../../../keystatic.config'

const notFoundHandler = () => new Response(null, { status: 404 })

export const { GET, POST } = showAdminUI
  ? makeRouteHandler({ config })
  : { GET: notFoundHandler, POST: notFoundHandler }
