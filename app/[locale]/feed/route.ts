import type { NextRequest } from 'next/server'

import type { Locale } from '@/i18n/routing'
import { getAllProductions } from '@/lib/content'

const BASE = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://boklanov.com').replace(/\/$/, '')

function localeBase(locale: Locale): string {
  return locale === 'en' ? BASE : `${BASE}/${locale}`
}

const FEED_META: Record<'ru' | 'en', { title: string; desc: string }> = {
  ru: {
    title: 'Роман Бокланов — постановки',
    desc: 'Режиссёр театра кукол и театра объекта',
  },
  en: {
    title: 'Roman Boklanov — productions',
    desc: 'Puppet theatre and theatre of objects director',
  },
}

// DE is chrome-only — no RSS per IA.
function isContentLocale(locale: string): locale is 'ru' | 'en' {
  return locale === 'ru' || locale === 'en'
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ locale: Locale }> }
) {
  const { locale } = await params

  if (!isContentLocale(locale)) {
    return new Response(null, { status: 404 })
  }

  const productions = getAllProductions(locale)
  const base = localeBase(locale)
  const meta = FEED_META[locale]

  const items = productions
    .filter((p) => p.role.includes('director'))
    .map((p) => {
      const url = `${base}/productions/${p.slug}`
      const pubDate = p.year ? new Date(p.year, 0, 1).toUTCString() : ''
      const synopsis = p.synopsis ? p.synopsis.replace(/&/g, '&amp;') : ''
      return [
        '    <item>',
        `      <title><![CDATA[${p.title}]]></title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
        synopsis ? `      <description><![CDATA[${synopsis}]]></description>` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${meta.title}</title>
    <link>${base}</link>
    <description>${meta.desc}</description>
    <language>${locale}</language>
    <atom:link href="${base}/feed" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
