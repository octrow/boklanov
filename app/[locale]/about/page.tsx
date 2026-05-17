import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import * as React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type {
  SerializedEditorState,
  SerializedLexicalNode
} from '@payloadcms/richtext-lexical/lexical'

import { Marginalia } from '@/components/Marginalia'
import { SpecimenPlate } from '@/components/SpecimenPlate'
import { BASE_URL as BASE } from '@/lib/baseUrl'
import { getAbout, type AboutData, type AboutL10n } from '@/lib/content'
import type { Locale } from '@/i18n/routing'
import { cdnUrl } from '@/lib/cdn'

import styles from './page.module.css'

interface Milestone {
  year: number
  label: string
}

interface LineageItem {
  key: string
  name: string
  role: string
  institution: string
  note?: string
}

interface AboutPhoto {
  src: string
  credit?: string | null
}

interface AboutFrontmatter {
  portrait: { src: string | null; credit: string | null }
  photos: AboutPhoto[]
  milestones: Milestone[]
  lineage: LineageItem[]
  marginalia: Array<string | null>
}

function pickL10n(v: AboutL10n, locale: Locale): string {
  const order =
    locale === 'de'
      ? (['de', 'en', 'ru'] as const)
      : ([locale, 'en', 'ru'] as const)
  for (const l of order) {
    const s = v[l]
    if (typeof s === 'string' && s.trim()) return s
  }
  return ''
}

/** Resolve the bio body Lexical state for a locale with DE→EN→RU fallback,
 *  returning the editor state and which locale actually supplied it (used
 *  to trigger the "DE forthcoming" Marginalia cue). A state counts as
 *  "supplied" only when its root has at least one child node — empty
 *  Lexical states (the default Payload writes for blank fields) fall
 *  through to the next locale in the chain. */
function pickBody(
  body: AboutData['body'],
  locale: Locale
): {
  state: SerializedEditorState | null
  resolvedLocale: Locale | null
} {
  const order =
    locale === 'de'
      ? (['de', 'en', 'ru'] as const)
      : ([locale, 'en', 'ru'] as const)
  for (const l of order) {
    const s = body[l]
    if (s && Array.isArray(s.root?.children) && s.root.children.length > 0) {
      return { state: s, resolvedLocale: l }
    }
  }
  return { state: null, resolvedLocale: null }
}

/** Recursively collect text from a Lexical node tree — used to derive the
 *  plain-text lead paragraph for `<meta name="description">` and the
 *  Person JSON-LD `description` field. */
function collectText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: unknown; children?: unknown }
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.children)) return n.children.map(collectText).join('')
  return ''
}

/** Plain-text content of the first root-level child (the lead paragraph). */
function leadText(state: SerializedEditorState | null): string {
  if (!state) return ''
  const first = state.root?.children?.[0]
  return first ? collectText(first).trim() : ''
}

/** Wrap a single root-level child as its own one-node SerializedEditorState
 *  so `<RichText>` can render it as a standalone paragraph. Lets us slot
 *  each paragraph into its own `<Marginalia>` (preserves the per-paragraph
 *  marginalia[i] mapping). */
function singleNodeState(
  state: SerializedEditorState,
  node: SerializedLexicalNode
): SerializedEditorState {
  return {
    ...state,
    root: { ...state.root, children: [node] }
  } as SerializedEditorState
}

function projectAbout(
  data: AboutData,
  locale: Locale
): {
  frontmatter: AboutFrontmatter
  bodyState: SerializedEditorState | null
  leadParagraphText: string
  deForthcoming: boolean
} {
  const { state: bodyState, resolvedLocale } = pickBody(data.body, locale)

  return {
    frontmatter: {
      portrait: data.portrait,
      photos: data.photos
        .filter((p) => p.src)
        .map((p) => ({ src: p.src, credit: p.credit })),
      milestones: data.milestones
        .map((m) => ({
          year: typeof m.year === 'number' ? m.year : 0,
          label: pickL10n(m.label, locale)
        }))
        .filter((m) => m.year || m.label),
      lineage: data.lineage.map((l) => ({
        key: l.key,
        name: pickL10n(l.name, locale),
        role: pickL10n(l.role, locale),
        institution: pickL10n(l.institution, locale),
        note: pickL10n(l.note, locale) || undefined
      })),
      marginalia: data.marginalia.map((m) => pickL10n(m.note, locale) || null)
    },
    bodyState,
    leadParagraphText: leadText(bodyState),
    deForthcoming: locale === 'de' && resolvedLocale !== 'de'
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const about = await getAbout()
  const { leadParagraphText } = projectAbout(about, locale)
  // Lead paragraph is the preferred description; fall back to the localized
  // home meta blurb so `<meta name="description">` is always emitted (else the
  // SEO category drops to 92).
  const t = await getTranslations({ locale, namespace: 'meta' })
  const description = leadParagraphText || t('homeDescription')

  const url = locale === 'en' ? `${BASE}/about` : `${BASE}/${locale}/about`
  const name =
    locale === 'ru'
      ? 'Роман Бокланов — о режиссёре'
      : locale === 'de'
        ? 'Roman Boklanov — über'
        : 'Roman Boklanov — about'

  return {
    title: name,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${BASE}/about`, ru: `${BASE}/ru/about` }
    },
    openGraph: {
      title: name,
      description,
      url,
      type: 'profile'
    }
  }
}

function personSchema(locale: Locale, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Roman Boklanov',
    alternateName: 'Роман Бокланов',
    jobTitle:
      locale === 'ru'
        ? 'Театральный режиссёр'
        : locale === 'de'
          ? 'Theaterregisseur'
          : 'Theatre Director',
    description,
    url: locale === 'en' ? `${BASE}/about` : `${BASE}/${locale}/about`,
    email: 'roman.boklanov@web.de',
    sameAs: ['https://instagram.com/boklanovroman', 'https://t.me/roman7593']
  }
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('nav')
  const tAbout = await getTranslations('about')
  const tHome = await getTranslations('home')

  const about = await getAbout()
  const { frontmatter, bodyState, leadParagraphText, deForthcoming } =
    projectAbout(about, locale)
  const { portrait, milestones, lineage, marginalia, photos } = frontmatter
  const validPhotos = photos.filter((p) => p.src)
  const portraitUrl = cdnUrl(portrait.src)

  // Slice Lexical root.children into [lead, ...rest] so each paragraph can
  // be wrapped in its own <Marginalia> — preserves the per-paragraph
  // marginalia[i] mapping that the prior plain-text version used.
  const bodyNodes = (bodyState?.root?.children ?? []) as SerializedLexicalNode[]
  const [leadNode, ...restNodes] = bodyNodes

  const schema = personSchema(locale, leadParagraphText)

  return (
    <main className={styles.page}>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h1 className={styles.heading}>{t('about')}</h1>

      {portraitUrl && (
        <figure className={styles.portrait}>
          <Image
            className={styles.portraitImg}
            src={portraitUrl}
            alt={portrait.credit ?? 'Roman Boklanov'}
            priority
            width={0}
            height={0}
            sizes='(min-width: 1024px) 40vw, (min-width: 768px) 60vw, 90vw'
            style={{ width: '100%', height: 'auto' }}
          />
          {portrait.credit && (
            <figcaption className={styles.portraitCredit}>
              {portrait.credit}
            </figcaption>
          )}
        </figure>
      )}

      {/* Bio prose — DA-7.6.A: Marginalia grid at ≥1024px.
          DE forthcoming: annotate lead paragraph; suppress RU margin notes.
          Each Lexical root child is rendered as its own <RichText> so we
          can slot one paragraph per <Marginalia>; the lead gets the
          display-typography lead style, the rest get the body style. */}
      {bodyState && leadNode && (
        <section className={styles.bio}>
          <Marginalia
            note={
              deForthcoming
                ? tAbout('deForthcoming')
                : (marginalia[0] ?? undefined)
            }
          >
            <div className={styles.bioLead}>
              <RichText data={singleNodeState(bodyState, leadNode)} />
            </div>
          </Marginalia>
          {restNodes.map((node, i) => (
            <Marginalia
              key={i}
              note={
                deForthcoming ? undefined : (marginalia[i + 1] ?? undefined)
              }
            >
              <div className={styles.bioParagraph}>
                <RichText data={singleNodeState(bodyState, node)} />
              </div>
            </Marginalia>
          ))}
        </section>
      )}

      {/* Staging geography — DA-2.C (§3.G.1) */}
      <section className={styles.geographySection}>
        <p className={styles.geographyLabel}>{tAbout('stagedIn')}</p>
        <p className={styles.geographyCities}>
          {(tHome.raw('stagingCities') as string[]).filter(Boolean).join(' · ')}
        </p>
      </section>

      {/* Photos of Roman */}
      {validPhotos.length > 0 && (
        <section className={styles.photosSection}>
          <div className={styles.photosGrid}>
            {validPhotos.map((photo, i) => (
              <SpecimenPlate
                key={i}
                src={cdnUrl(photo.src)!}
                alt={photo.credit ?? 'Roman Boklanov'}
                credit={photo.credit}
                plateNumber={i + 1}
                total={validPhotos.length}
              />
            ))}
          </div>
        </section>
      )}

      {/* Milestones timeline */}
      {milestones.length > 0 && (
        <section className={styles.milestonesSection}>
          <h2 className={styles.lineageHeading}>{tAbout('chronology')}</h2>
          <div className={styles.milestones}>
            {milestones.map((m) => (
              <div key={m.year} className={styles.milestone}>
                <span className={styles.milestoneYear}>{m.year}</span>
                <span className={styles.milestoneLabel}>{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lineage block */}
      {lineage.length > 0 && (
        <section className={styles.lineageSection}>
          <h2 className={styles.lineageHeading}>{tAbout('lineage')}</h2>
          <div className={styles.lineageGrid}>
            {lineage.map((item) => (
              <div key={item.key} className={styles.lineageCard}>
                <h3 className={styles.lineageName}>{item.name}</h3>
                <span className={styles.lineageRole}>{item.role}</span>
                <span className={styles.lineageInstitution}>
                  {item.institution}
                </span>
                {item.note && <p className={styles.lineageNote}>{item.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
