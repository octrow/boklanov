/**
 * scripts/seed-payload.ts — one-shot import of content/productions/* into Payload.
 *
 * Run with: npm run payload:seed
 *
 * Idempotent: pre-checks for an existing slug and updates in place if found.
 * Skips revalidation hooks via `context.disableRevalidate = true` so a 54-row
 * seed doesn't flush the RSC cache 54 times.
 *
 * See PAYLOAD_MIGRATION_PLAN §P2.5.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { Payload } from 'payload'
import {
  arrayWrap,
  bodyToLexical,
  pickLocale,
  toPayloadProduction,
  type AnyMap,
  type L10n
} from './production-mapping'

const ROOT = path.resolve(process.cwd(), 'content/productions')
const ABOUT_DIR = path.resolve(process.cwd(), 'content/about')
const CONTACT_DIR = path.resolve(process.cwd(), 'content/contact')

const readOpt = async (p: string): Promise<string | null> => {
  try {
    return await fs.readFile(p, 'utf8')
  } catch {
    return null
  }
}

async function seedProductions(payload: Payload) {
  const slugs = (await fs.readdir(ROOT)).filter(
    (n) => !n.startsWith('.') && !n.startsWith('_')
  )
  console.log(`→ Found ${slugs.length} production folders`)

  for (const slug of slugs) {
    const dir = path.join(ROOT, slug)
    const yamlText = await readOpt(path.join(dir, 'index.yaml'))
    if (!yamlText) {
      console.warn(`  ⚠ ${slug}: no index.yaml — skip`)
      continue
    }
    const yaml = parseYaml(yamlText) as AnyMap
    const bodyRu = await readOpt(path.join(dir, 'bodyRu.mdx'))
    const bodyEn = await readOpt(path.join(dir, 'bodyEn.mdx'))
    const bodyDe = await readOpt(path.join(dir, 'bodyDe.mdx'))

    const existing = await payload.find({
      collection: 'productions',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0
    })

    const ctx = { disableRevalidate: true }
    const ruData = toPayloadProduction(yaml, slug, 'ru', bodyRu)

    const doc =
      existing.docs[0]?.id != null
        ? await payload.update({
            collection: 'productions',
            id: existing.docs[0].id,
            data: ruData,
            locale: 'ru',
            context: ctx
          })
        : await payload.create({
            collection: 'productions',
            data: ruData,
            locale: 'ru',
            context: ctx
          })

    // EN + DE — only localized fields will actually persist new values.
    await payload.update({
      collection: 'productions',
      id: doc.id,
      data: toPayloadProduction(yaml, slug, 'en', bodyEn),
      locale: 'en',
      context: ctx
    })
    await payload.update({
      collection: 'productions',
      id: doc.id,
      data: toPayloadProduction(yaml, slug, 'de', bodyDe),
      locale: 'de',
      context: ctx
    })

    console.log(`  ✓ ${slug}`)
  }
}

async function seedAbout(payload: Payload) {
  const ruYaml = await readOpt(path.join(ABOUT_DIR, 'ru.yaml'))
  const enYaml = await readOpt(path.join(ABOUT_DIR, 'en.yaml'))
  const deYaml = await readOpt(path.join(ABOUT_DIR, 'de.yaml'))
  const ruBody = await readOpt(path.join(ABOUT_DIR, 'bio', 'bodyRu.mdx'))
  const enBody = await readOpt(path.join(ABOUT_DIR, 'bio', 'bodyEn.mdx'))
  const deBody = await readOpt(path.join(ABOUT_DIR, 'bio', 'bodyDe.mdx'))

  if (!ruYaml) {
    console.warn('→ about: no ru.yaml — skip')
    return
  }
  const ru = parseYaml(ruYaml) as AnyMap
  const en = (enYaml ? (parseYaml(enYaml) as AnyMap) : {}) as AnyMap
  const de = (deYaml ? (parseYaml(deYaml) as AnyMap) : {}) as AnyMap

  const ctx = { disableRevalidate: true }

  // RU pass — also writes shared fields (visuals.portrait / photos).
  await payload.updateGlobal({
    slug: 'about',
    locale: 'ru',
    context: ctx,
    data: {
      body: bodyToLexical(ruBody),
      portrait: (ru.visuals as AnyMap)?.portrait ?? { src: null, credit: null },
      photos: arrayWrap((ru.visuals as AnyMap)?.photos as unknown[]).map(
        (p) => p as { src?: string; credit?: string }
      ),
      milestones: arrayWrap(
        (ru.timeline as AnyMap)?.milestones as unknown[]
      ).map((m) => {
        const o = m as AnyMap
        return {
          year: typeof o.year === 'number' ? o.year : null,
          label: pickLocale(o.label, 'ru')
        }
      }),
      lineage: arrayWrap((ru.timeline as AnyMap)?.lineage as unknown[]).map(
        (l) => {
          const o = l as AnyMap
          return {
            key: typeof o.key === 'string' ? o.key : null,
            name: pickLocale(o.name, 'ru'),
            role: pickLocale(o.role, 'ru'),
            institution: pickLocale(o.institution, 'ru'),
            note: pickLocale(o.note, 'ru')
          }
        }
      ),
      marginalia: arrayWrap(
        (ru.margins as AnyMap)?.marginalia as unknown[]
      ).map((n) => ({ note: pickLocale(n, 'ru') }))
    }
  })

  for (const [code, src, bodyText] of [
    ['en', en, enBody],
    ['de', de, deBody]
  ] as const) {
    await payload.updateGlobal({
      slug: 'about',
      locale: code,
      context: ctx,
      data: {
        body: bodyToLexical(bodyText),
        milestones: arrayWrap(
          (src.timeline as AnyMap)?.milestones as unknown[]
        ).map((m) => {
          const o = m as AnyMap
          return {
            year: typeof o.year === 'number' ? o.year : null,
            label: pickLocale(o.label, code)
          }
        })
      }
    })
  }

  console.log('  ✓ about')
}

async function seedContact(payload: Payload) {
  const yamlText = await readOpt(path.join(CONTACT_DIR, 'index.yaml'))
  if (!yamlText) {
    console.warn('→ contact: no index.yaml — skip')
    return
  }
  const c = parseYaml(yamlText) as AnyMap & { intro?: L10n }
  const ctx = { disableRevalidate: true }

  await payload.updateGlobal({
    slug: 'contact',
    locale: 'ru',
    context: ctx,
    data: {
      intro: pickLocale(c.intro, 'ru'),
      email: typeof c.email === 'string' ? c.email : '',
      telegramUrl: typeof c.telegramUrl === 'string' ? c.telegramUrl : null,
      instagramUrl: typeof c.instagramUrl === 'string' ? c.instagramUrl : null
    }
  })
  for (const code of ['en', 'de'] as const) {
    await payload.updateGlobal({
      slug: 'contact',
      locale: code,
      context: ctx,
      data: { intro: pickLocale(c.intro, code) }
    })
  }
  console.log('  ✓ contact')
}

async function main() {
  console.log('Initialising Payload…')
  const payload = await getPayload({ config })

  console.log('\nSeeding productions…')
  await seedProductions(payload)

  console.log('\nSeeding about…')
  await seedAbout(payload)

  console.log('\nSeeding contact…')
  await seedContact(payload)

  console.log('\n✓ done')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
