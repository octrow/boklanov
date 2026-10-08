/**
 * scripts/drop-about-milestone.ts — remove About timeline rows whose RU label
 * contains a phrase. Rows are kept by id, so EN/DE of the others survive.
 *
 *   npx tsx scripts/drop-about-milestone.ts "<RU phrase>" [--apply]
 *
 * Dry run by default. Revalidation is skipped: revalidate the `about` tag
 * after --apply.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

async function main() {
  const phrase = process.argv[2]
  if (!phrase)
    throw new Error('usage: drop-about-milestone.ts <phrase> [--apply]')
  const apply = process.argv.includes('--apply')
  const payload = await getPayload({ config })

  const about = await payload.findGlobal({
    slug: 'about',
    locale: 'ru',
    depth: 0
  })
  const rows = about.milestones ?? []
  const keep = rows.filter((m) => !m.label?.includes(phrase))
  const dropped = rows.length - keep.length
  for (const m of rows)
    if (!keep.includes(m)) console.log(`  drop ${m.year} ${m.label}`)

  if (apply && dropped) {
    await payload.updateGlobal({
      slug: 'about',
      locale: 'ru',
      data: { milestones: keep },
      depth: 0,
      context: { disableRevalidate: true }
    })
  }
  console.log(
    `\n${dropped} row(s)${apply ? ' removed' : ' — dry run, nothing written'}`
  )
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
