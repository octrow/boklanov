#!/usr/bin/env tsx
/**
 * scripts/fold-overlay.ts — Phase 8.3 one-shot tool
 *
 * For each production, merges metadata.yml (manual overlay) into index.mdx
 * frontmatter using the same overlay-wins logic that lib/content.ts used,
 * then deletes the metadata.yml. After this runs, lib/content.ts reads
 * frontmatter directly with no overlay step.
 *
 * Run once: npx tsx scripts/fold-overlay.ts
 * Safe to re-run (no-ops if metadata.yml already deleted).
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import * as yaml from 'yaml'

const CONTENT_DIR = path.resolve(process.cwd(), 'content', 'productions')

type Rec = Record<string, unknown>

// overlay wins if non-null and non-empty-array
function pick<T>(overlayVal: T | null | undefined, fmVal: T): T {
  if (overlayVal === null || overlayVal === undefined) return fmVal
  if (Array.isArray(overlayVal) && (overlayVal as unknown[]).length === 0) return fmVal
  return overlayVal
}

function mergeGallery(
  fmGallery: Rec[],
  overlayGallery: Rec[]
): Rec[] {
  if (!overlayGallery.length) return fmGallery
  return fmGallery.map((g) => {
    const o = overlayGallery.find((x) => x?.src === g.src)
    if (!o) return g
    const fmCap = (g.caption as Rec | null) ?? null
    const oCap = (o.caption as Rec | null) ?? null
    return {
      src: g.src,
      credit: pick(o.credit as string | null, (g.credit as string | null) ?? null),
      caption: {
        ru: pick(oCap?.ru as string | null, (fmCap?.ru as string | null) ?? null),
        en: pick(oCap?.en as string | null, (fmCap?.en as string | null) ?? null),
        de: pick(oCap?.de as string | null, (fmCap?.de as string | null) ?? null),
      },
    }
  })
}

function applyOverlay(fm: Rec, overlay: Rec): Rec {
  const ovTitle = (overlay.title ?? {}) as Rec
  const fmTitle = (fm.title ?? {}) as Rec
  const ovSynopsis = (overlay.synopsis ?? {}) as Rec
  const fmSynopsis = (fm.synopsis ?? {}) as Rec
  const ovPoster = (overlay.poster ?? {}) as Rec
  const fmPoster = (fm.poster ?? {}) as Rec

  const fmGallery = ((fm.gallery ?? []) as Rec[])
  const ovGallery = ((overlay.gallery ?? []) as Rec[])

  // videos: concatenate (overlay adds extras the sync missed)
  const fmVideos = (fm.videos ?? []) as Rec[]
  const ovVideos = (overlay.videos ?? []) as Rec[]
  // deduplicate by id
  const allVideos = [...fmVideos]
  for (const v of ovVideos) {
    if (!allVideos.some((x) => x.id === v.id)) allVideos.push(v)
  }

  return {
    slug: fm.slug,
    notionIds: fm.notionIds ?? {},
    title: {
      ...fmTitle,
      de: pick(ovTitle.de as string | null, (fmTitle.de as string | null) ?? null),
    },
    synopsis: {
      ...fmSynopsis,
      de: pick(ovSynopsis.de as string | null, (fmSynopsis.de as string | null) ?? null),
    },
    theatre: pick(overlay.theatre as Rec | undefined, (fm.theatre as Rec) ?? {}),
    year: fm.year,
    premiereDate: pick(overlay.premiereDate as Rec | undefined, (fm.premiereDate as Rec | undefined)),
    ticketsUrl: pick(overlay.ticketsUrl as string | null, (fm.ticketsUrl as string | null) ?? null),
    ageRating: pick(overlay.ageRating as string | null, (fm.ageRating as string | null) ?? null),
    durationMin: pick(overlay.durationMin as number | null, (fm.durationMin as number | null) ?? null),
    role: pick(overlay.role as string, (fm.role as string) ?? 'director'),
    form: pick(overlay.form as string[], (fm.form as string[]) ?? []),
    lineage: pick(overlay.lineage as string[], (fm.lineage as string[]) ?? []),
    credits: pick(overlay.credits as Rec | undefined, (fm.credits as Rec) ?? { ru: [], en: [] }),
    poster: {
      ...fmPoster,
      credit: pick(ovPoster.credit as string | null, (fmPoster.credit as string | null) ?? null),
    },
    gallery: mergeGallery(fmGallery, ovGallery),
    videos: allVideos,
    awards: pick(overlay.awards as Rec[] | undefined, (fm.awards as Rec[]) ?? []),
    press: (fm.press as Rec[]) ?? [],
    externalLinks: (fm.externalLinks as Rec[]) ?? [],
    techRider: pick(overlay.techRider as string | null, (fm.techRider as string | null) ?? null),
    pressKit: pick(overlay.pressKit as string | null, (fm.pressKit as string | null) ?? null),
    featured: typeof overlay.featured === 'boolean' ? overlay.featured : !!fm.featured,
    tags: (fm.tags as string[]) ?? [],
    tour: pick(overlay.tour as string[] | undefined, (fm.tour as string[]) ?? []),
  }
}

const slugs = fs
  .readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()

let folded = 0
let skipped = 0

for (const slug of slugs) {
  const dir = path.join(CONTENT_DIR, slug)
  const mdxPath = path.join(dir, 'index.mdx')
  const metaPath = path.join(dir, 'metadata.yml')

  if (!fs.existsSync(mdxPath)) { skipped++; continue }
  if (!fs.existsSync(metaPath)) {
    console.log(`  skip  ${slug}  (no metadata.yml)`)
    skipped++
    continue
  }

  const rawMdx = fs.readFileSync(mdxPath, 'utf8')
  const { data: fm, content: body } = matter(rawMdx)
  const rawYml = fs.readFileSync(metaPath, 'utf8')
  const overlay = (yaml.parse(rawYml) ?? {}) as Rec

  const merged = applyOverlay(fm as Rec, overlay)

  // Serialize: yaml library with no line-wrap to preserve long strings
  const yamlStr = yaml.stringify(merged, { lineWidth: 0 })
  const newMdx = `---\n${yamlStr}---\n${body}`

  fs.writeFileSync(mdxPath, newMdx, 'utf8')
  fs.unlinkSync(metaPath)

  console.log(`  fold  ${slug}`)
  folded++
}

console.log(`\nDone — folded ${folded}, skipped ${skipped}.`)
