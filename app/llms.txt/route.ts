import { BASE_URL as BASE } from '@/lib/baseUrl'
import { getAllProductions } from '@/lib/content'

// llms.txt (https://llmstxt.org): a Markdown map of the site for AI search.
// Built from the same production data as the sitemap, so it never drifts.
export async function GET() {
  const productions = (await getAllProductions('en')).filter((p) =>
    p.role.includes('director')
  )

  const lines = productions.map((p) => {
    const meta = [p.theatre.name, p.theatre.city, p.year]
      .filter(Boolean)
      .join(', ')
    return `- [${p.title.trim()}](${BASE}/productions/${p.slug})${meta ? `: ${meta}` : ''}`
  })

  const body = `# Roman Boklanov

> Theatre director making shows about people and things for children, teenagers and families: puppet, object and drama theatre. Works between Bremen, Vienna and Almaty; productions staged in Russia, Kazakhstan, Germany, Austria, Spain, Finland and Uzbekistan. 30+ productions, 20+ festival awards.

The site is in English (default), German (/de) and Russian (/ru). Russian is the original language of most production texts and press.

## Pages

- [About](${BASE}/about): biography and artistic approach
- [Productions](${BASE}/productions): all productions, filterable by role, form, age and country
- [Awards & festivals](${BASE}/awards): prizes and festival appearances
- [Press](${BASE}/press): reviews and interviews, grouped by production
- [Contact](${BASE}/contact): collaboration, festival and press enquiries

## Productions (as director)

${lines.join('\n')}

## Optional

- [Archive](${BASE}/archive): complete list of works, including readings and performances
- [RSS feed](${BASE}/feed): new productions
- [Sitemap](${BASE}/sitemap.xml)
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  })
}
