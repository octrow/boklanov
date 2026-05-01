import type { NextRequest } from 'next/server'

// Placeholder route. The legacy Notion-driven OG renderer was removed in F8.
// S3 will port this to `app/api/og/[slug]/route.ts` driven by the content
// loader (lib/content.ts). Until then, return 501 so the build is clean.
export const config = { runtime: 'edge' }

export default function handler(_req: NextRequest) {
  return new Response('OG image renderer not yet ported (see TASKS.md S3)', {
    status: 501,
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  })
}
