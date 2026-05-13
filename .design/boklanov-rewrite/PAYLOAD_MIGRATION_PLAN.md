# PAYLOAD_MIGRATION_PLAN

Status: **proposed**. Created 2026-05-14. Owner: Daniil.

Replaces Keystatic Cloud + GitHub Actions + Vercel rebuild loop with Payload 3 running
in-process inside the Next.js app, writing to Postgres, hitting R2 directly, and
revalidating Next.js tags on save. Editor publish → live in ~1 s, no rebuild.

Goal-backward: Roman clicks Save → next visitor sees fresh content. Zero CI run.
Zero Vercel deploy. Same domain, same routes, same fonts, same R2 bucket.

Rationale source: `CMS_RESEARCH_v2.md` final ranking — Payload 3 is the only fully-FOSS
candidate that runs inside this Next.js deployment, supports unlimited locales free,
and reuses the existing R2 bucket via `@payloadcms/storage-s3`.

---

## 0. Constraints (inherit from `STATUS.md`)

- Birthday surprise: site stays at `boklanov.vercel.app` until D3/D4 cutover. Switch
  CMS _before_ cutover — Roman never sees Keystatic again.
- `git push origin main` blocked by safety hook. Daniil pushes.
- DE chrome only; RU/EN content parity. `hreflang` RU↔EN.
- Past-tense `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`. No fresh Russia work.
- Brutally brief docs. Imperatives. No marketing.
- Roman edits Russian primarily. Field labels stay RU.

## 1. Target architecture

```
Roman → /admin (Payload, Next.js route)
        ↓ write
       Neon Postgres (free tier, autoscale to zero)
        ↓ afterChange hook (same Node process)
       revalidateTag('production:<slug>') + revalidatePath('/[locale]/productions', 'layout')
        ↓
       Next visitor → fresh RSC fetch → cache filled → cached for next caller

Roman → /admin image upload → @payloadcms/storage-s3 → existing R2 bucket
                                                       (NEXT_PUBLIC_CDN_BASE unchanged)
```

No second deployment. No webhook hop. No GitHub Action. Same Vercel project, same
domain, same env vars layered with three new ones.

## 2. Stack diff vs today

| Layer          | Today (Keystatic)                                  | After (Payload)                                     |
| -------------- | -------------------------------------------------- | --------------------------------------------------- |
| Schema         | `keystatic.config.ts` (1 386 lines)                | `payload.config.ts` + `collections/*.ts`            |
| Editor         | Keystatic Studio at `/keystatic` (Cloud SSO)       | Payload admin at `/admin` (email + password)        |
| Storage        | YAML + MDX files in repo                           | Postgres rows                                       |
| Image upload   | `/api/keystatic-asset` → R2 + git mirror           | `@payloadcms/storage-s3` → R2 direct                |
| Save → live    | git commit → GitHub Action → Vercel build (~2 min) | Postgres write → `revalidateTag` (~1 s)             |
| Auth           | Keystatic Cloud team                               | Payload `users` collection, magic-link or pwd       |
| Content reader | `lib/content.ts` (fs+yaml)                         | `lib/content.ts` (rewritten over Payload Local API) |
| Backup         | git history + `backup-r2-to-git.yml`               | Neon point-in-time recovery + nightly pg_dump       |

## 3. Phases (5 + cutover)

| #   | Phase                           | Effort | Branch       | Ships when                                     |
| --- | ------------------------------- | ------ | ------------ | ---------------------------------------------- |
| P1  | Provision + install             | 1 h    | `payload`    | `/admin` loads on dev, empty DB                |
| P2  | Schema port + seed              | 4–6 h  | `payload`    | All 54 productions + about + contact in DB     |
| P3  | Reader rewrite + revalidation   | 3–4 h  | `payload`    | Site reads from Payload; edits go live in <5 s |
| P4  | R2 storage wiring               | 1–2 h  | `payload`    | Image upload from admin lands in existing R2   |
| P5  | Auth + admin polish (RU labels) | 2 h    | `payload`    | Roman can log in, sees Russian field hints     |
| C   | Cutover                         | 30 min | merge → main | Keystatic removed, single source = Postgres    |

Total: ~1.5–2 evenings of Daniil's time.

---

## P1 — Provision + install (1 h)

1. **Neon project**: free tier, region `eu-central-1` (Frankfurt). One db `boklanov`,
   one role. Copy pooled and unpooled connection strings.
2. **Vercel env** (Preview + Production):
   - `DATABASE_URL` = Neon pooled URL
   - `DATABASE_URL_UNPOOLED` = Neon direct URL (used for migrations)
   - `PAYLOAD_SECRET` = `openssl rand -base64 48`
   - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` = existing R2 token (read+write)
   - `S3_ENDPOINT` = `https://<account>.r2.cloudflarestorage.com`
   - `S3_BUCKET` = `boklanov-content`
   - `S3_REGION` = `auto`
3. **Install packages** (keep Keystatic alive until C):
   ```bash
   npm i payload @payloadcms/next @payloadcms/db-postgres \
         @payloadcms/storage-s3 @payloadcms/richtext-lexical sharp
   ```
   sharp is already a dep — Payload will reuse it.
4. **File layout**:
   ```
   payload.config.ts              ← root, picked up by @payload-config import
   collections/
     Productions.ts
     Users.ts
   globals/
     About.ts
     Contact.ts
   hooks/
     revalidate.ts
   app/
     (payload)/                   ← Payload admin route group — generated
       admin/[[...segments]]/
       api/[...slug]/
     [locale]/                    ← existing site
     keystatic/                   ← keep until C, then delete
   ```
5. **`next.config.js`**: wrap export in `withPayload(...)`. Adds the file-loader
   stubs Payload needs and lifts the `serverComponentsExternalPackages` list.
6. **First boot**: `npm run dev` → `/admin` shows the create-first-user form.

## P2 — Schema port + seed (4–6 h)

### Mapping rules

Keystatic shape → Payload shape. Rules below applied mechanically.

| Keystatic                                  | Payload                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `fields.text`                              | `type: 'text'`                                             |
| `fields.text` (RU/EN/DE object via `l10n`) | `type: 'text', localized: true`                            |
| `fields.markdoc.inline`                    | `type: 'textarea'` (markdoc syntax preserved as string)    |
| `fields.mdx`                               | `type: 'richText'` (Lexical) **or** `textarea` — see §P2.3 |
| `fields.image`                             | `upload: true` relationship to `media` collection          |
| `fields.url`                               | `type: 'text'` with URL validation                         |
| `fields.integer`                           | `type: 'number'`                                           |
| `fields.checkbox`                          | `type: 'checkbox'`                                         |
| `fields.select` (closed enum)              | `type: 'select', options: […]`                             |
| `fields.multiselect`                       | `type: 'select', hasMany: true`                            |
| `fields.array(object{…})`                  | `type: 'array', fields: [...]`                             |
| `fields.object{…}`                         | `type: 'group', fields: [...]`                             |
| `singleton`                                | `globals: [...]`                                           |
| `collection`                               | `collections: [...]`                                       |
| Slug field                                 | `type: 'text', index: true, unique: true` + slugify hook   |

### P2.1 Collections

- **`productions`** — port every group from `keystatic.config.ts` schema 1:1:
  identity, media, production, taxonomy, team, recognition, history, settings,
  legacy `notionIds`. Top-level scalars (`year`, `durationMin`, `status`, `slug`)
  stay top-level so admin list view shows them via `admin.useAsTitle` + `defaultColumns`.
- **`media`** — Payload's standard upload collection, configured with R2 adapter (P4).
  Fields: `alt` (localized text), `credit` (text). `imageSizes: []` — skip generated
  sizes, R2 + Next/Image handle delivery.
- **`users`** — Roman (admin) + Daniil (admin). Email + password. Magic-link plugin
  considered Tier 3.

### P2.2 Globals

- **`about`** — bio (RU/EN/DE richText), visuals (portrait + photos via `upload`),
  timeline (milestones + lineage arrays), margins (marginalia array).
- **`contact`** — intro (localized textarea), email, telegramUrl, instagramUrl.

### P2.3 Body / MDX decision

Three options for `bodyRu` / `bodyEn` / `bodyDe`:

| Option                                          | Pro                                                                           | Con                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Lexical (Payload default)**                   | Native editor, real WYSIWYG, blocks possible                                  | Storage = JSON tree; existing MDX renderer dies; new JSX-from-Lexical pipeline; lock-in |
| **Plain `textarea` + keep markdoc renderer**    | Zero renderer churn; `@markdoc/markdoc` keeps working; markdown view = string | No WYSIWYG; Roman writes raw markdown (he already does in Obsidian)                     |
| **Hybrid: Lexical for new entries, MD for old** | Migration optional                                                            | Two code paths; rejected                                                                |

**Decision: plain `textarea`**, store as markdoc string. `lib/markdoc.tsx` keeps
its job. Roman keeps the same editing experience as Obsidian. Revisit Lexical only
if Roman asks for WYSIWYG.

### P2.4 Localized field strategy

Two competing shapes:

- **Field-level (`localized: true`)** — one row, Payload stores `{ru,en,de}` per
  field internally. Editor sees a locale switcher at top of doc. **Adopted.**
- **Three docs per production** — one per locale, linked by `slug`. Rejected:
  doubles row count, breaks `getRelatedProductions` logic, and the existing site
  shows RU+EN on a single card regardless of locale (constraint).

Locale switcher dropdown at top of admin → swaps every `localized: true` field.
Roman edits in RU, then flips to EN, edits the same fields, saves once.

### P2.5 Seed script

`scripts/seed-payload.ts` — one-shot Node script (run locally against dev DB,
then again against production DB after Neon is live):

1. Read every `content/productions/<slug>/index.yaml` + `bodyRu.mdx` / `bodyEn.mdx` /
   `bodyDe.mdx`.
2. Normalise `l10n` strings: bare-string → `{ru, en, de}` (mirror `lib/content.ts`
   `expandL10n()`).
3. Read each image path referenced under `poster`, `productionsPhoto`,
   `featuredPhoto`, `gallery[]` and either (a) leave as raw R2 URL strings in a
   plain `text` field, or (b) upload to `media` and reference the new ID. **(a)** is
   cheaper and preserves existing R2 keys.
4. Use Payload Local API: `payload.create({ collection: 'productions', data: ... })`
   per slug, then `payload.update({ collection: 'productions', id, locale: 'en', data: ... })`
   for the EN sub-fields, then DE.
5. `payload.update({ slug: 'about', data: ... })` for the about global.
6. Verify count: 54 productions in.

Idempotency: pre-check `payload.find({ collection: 'productions', where: { slug: { equals } } })`
and `update` instead of `create` if present. Allows running twice without dupes.

## P3 — Reader rewrite + revalidation (3–4 h)

### P3.1 `lib/content.ts` rewrite

Today: filesystem reads at build/request time. Replace with Payload Local API:

```ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

export const getAllProductions = unstable_cache(
  async (locale: Locale) => {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'productions',
      locale,
      fallbackLocale: 'ru',
      limit: 200,
      sort: '-year'
    })
    return docs.map(flattenFm)
  },
  ['productions'],
  { tags: ['productions'] }
)

export const getProduction = (slug: string, locale: Locale) =>
  unstable_cache(
    async () => {
      /* payload.find by slug */
    },
    ['production', slug, locale],
    { tags: [`production:${slug}`, 'productions'] }
  )()
```

`flattenFm()` keeps the existing public `Production` interface intact — page
routes stay byte-identical.

### P3.2 Revalidation hooks

`hooks/revalidate.ts`:

```ts
export const revalidateProduction: CollectionAfterChangeHook = ({
  doc,
  previousDoc
}) => {
  revalidateTag(`production:${doc.slug}`)
  revalidateTag('productions')
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidateTag(`production:${previousDoc.slug}`)
  }
  revalidatePath('/[locale]/productions', 'page')
  revalidatePath('/[locale]', 'page') // home featured strip
  return doc
}

export const revalidateAbout: GlobalAfterChangeHook = () => {
  revalidateTag('about')
  revalidatePath('/[locale]/about', 'page')
  return undefined
}
```

Attach via `hooks.afterChange` on each collection + global. Also
`afterDelete` for productions to evict cached lists.

### P3.3 OG image + sitemap

`app/api/og/[slug]/route.tsx` already reads from `lib/content.ts` — picks up the
new reader for free. `app/sitemap.ts` same.

## P4 — R2 storage wiring (1–2 h)

```ts
import { s3Storage } from '@payloadcms/storage-s3'

plugins: [
  s3Storage({
    collections: { media: { prefix: 'productions' } },
    bucket: process.env.S3_BUCKET!,
    config: {
      endpoint: process.env.S3_ENDPOINT,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,            // required for R2
    },
  }),
],
```

Existing keys (`productions/<slug>/<file>.{jpg,webp}`) remain valid. New uploads
land under the same prefix. `NEXT_PUBLIC_CDN_BASE` unchanged — `lib/cdn.ts`
keeps prepending it.

Verify: open a production in `/admin`, drag a new photo into gallery, check R2
bucket, confirm public URL renders on the live page.

## P5 — Auth + admin polish (2 h)

- **First user**: create at `/admin` on first boot. Daniil first, then invite Roman.
- **Russian labels**: every `field.label` accepts `{ en, ru, de }`. Mirror the
  bilingual `desc()` helper from `keystatic.config.ts` — Russian primary.
- **`admin.useAsTitle`** = `slug` on productions; `admin.defaultColumns` =
  `['slug', 'year', 'durationMin', 'status']`. Mirrors current Keystatic view.
- **`admin.livePreview`** — point at `/[locale]/productions/{{slug}}`. Side-by-side
  edit + preview in iframe; better than Keystatic's external `previewUrl`.
- **Disable email**: no email sender configured. Use `payload.config.ts`
  `email: undefined` → magic-link disabled, password-only login. Sufficient for
  two users.
- **`/admin` access**: `access.admin: ({ req }) => Boolean(req.user)`. No public
  signup — only existing users can create users.

## C — Cutover (30 min)

After P1–P5 verified on a preview deploy with prod-cloned data:

1. Merge `payload` → `main` (Daniil pushes).
2. Run `scripts/seed-payload.ts` against the production Neon DB **once**.
3. Verify `/admin` works on production URL; verify `/`, `/productions`,
   `/productions/<slug>`, `/about` render unchanged.
4. **Delete Keystatic**:
   - `npm rm @keystatic/core @keystatic/next`
   - `rm keystatic.config.ts`
   - `rm -rf app/keystatic app/api/keystatic app/api/keystatic-asset`
   - `rm scripts/audit-keystatic-schema.ts`
   - `rm .github/workflows/backup-r2-to-git.yml`
   - `rm -rf content/productions content/about content/contact`
   - Keep `content/_PRODUCTION_TEMPLATE.yaml` archived under `archive/` for ref.
5. Update `readme.md`, `content/AUTHORING.ru.md`, `MAP.md`, `STATUS.md`,
   `CONTENT.md` (see §6).
6. Commit + tag `cms-payload`.

---

## 4. Schema port — concrete examples

### `collections/Productions.ts` (excerpt)

```ts
import type { CollectionConfig } from 'payload'
import { revalidateProduction } from '../hooks/revalidate'

export const Productions: CollectionConfig = {
  slug: 'productions',
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'year', 'durationMin', 'status'],
    livePreview: {
      url: ({ data, locale }) => `/${locale.code}/productions/${data.slug}`
    },
    group: { en: 'Content', ru: 'Контент' }
  },
  hooks: { afterChange: [revalidateProduction] },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: {
          ru: 'Имя папки. Только нижний регистр и дефисы.',
          en: 'Folder name. Lowercase + dashes only.'
        }
      }
    },
    { name: 'year', type: 'number', min: 1900, max: 2100, index: true },
    { name: 'durationMin', type: 'number' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'live',
      options: [
        { label: { ru: 'Идёт', en: 'Live' }, value: 'live' },
        {
          label: { ru: 'В работе', en: 'In development' },
          value: 'in-development'
        },
        { label: { ru: 'В архиве', en: 'Archived' }, value: 'archived' },
        { label: { ru: 'На гастролях', en: 'On tour' }, value: 'on-tour' }
      ]
    },

    {
      name: 'identity',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'tagline', type: 'text', localized: true },
        { name: 'synopsis', type: 'textarea', localized: true },
        { name: 'directorsNote', type: 'textarea', localized: true },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
          admin: {
            description: {
              ru: 'Markdoc / markdown. Курсив, ссылки.',
              en: 'Markdoc / markdown.'
            }
          }
        }
      ]
    },

    {
      name: 'media',
      type: 'group',
      fields: [
        {
          name: 'poster',
          type: 'group',
          fields: [
            { name: 'src', type: 'text' }, // path string preserves R2 keys
            { name: 'credit', type: 'text' }
          ]
        },
        // …productionsPhoto, featuredPhoto same shape
        {
          name: 'gallery',
          type: 'array',
          fields: [
            { name: 'src', type: 'text' },
            { name: 'credit', type: 'text' },
            { name: 'caption', type: 'text', localized: true }
          ]
        },
        {
          name: 'videos',
          type: 'array',
          fields: [
            {
              name: 'provider',
              type: 'select',
              options: ['youtube', 'vimeo'],
              defaultValue: 'youtube'
            },
            { name: 'id', type: 'text' }
          ]
        }
      ]
    }

    // production, taxonomy, team, recognition, history, settings — same pattern
  ]
}
```

### `payload.config.ts`

```ts
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { Productions } from './collections/Productions'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { About } from './globals/About'
import { Contact } from './globals/Contact'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET!,
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · boklanov.com' },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 }
      ]
    }
  },
  collections: [Productions, Media, Users],
  globals: [About, Contact],
  localization: {
    locales: [
      { label: 'Русский', code: 'ru' },
      { label: 'English', code: 'en' },
      { label: 'Deutsch', code: 'de' }
    ],
    defaultLocale: 'ru',
    fallback: true
  },
  editor: lexicalEditor(), // used by Media.alt only
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL! }
  }),
  plugins: [
    /* s3Storage(...) — see P4 */
  ],
  sharp,
  typescript: { outputFile: 'payload-types.ts' }
})
```

## 5. Migration script outline

`scripts/seed-payload.ts`:

```ts
import { getPayload } from 'payload'
import config from '../payload.config'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = path.resolve(process.cwd(), 'content/productions')

async function main() {
  const payload = await getPayload({ config })
  const slugs = await fs.readdir(ROOT)

  for (const slug of slugs) {
    const dir = path.join(ROOT, slug)
    const yaml = parseYaml(
      await fs.readFile(path.join(dir, 'index.yaml'), 'utf8')
    )
    const bodyRu = await readOpt(path.join(dir, 'bodyRu.mdx'))
    const bodyEn = await readOpt(path.join(dir, 'bodyEn.mdx'))
    const bodyDe = await readOpt(path.join(dir, 'bodyDe.mdx'))

    const existing = await payload.find({
      collection: 'productions',
      where: { slug: { equals: slug } },
      limit: 1
    })
    const id = existing.docs[0]?.id

    // RU pass — defaultLocale, writes all non-localized fields too
    const ruData = mapKeystaticToPayload(yaml, slug, 'ru', bodyRu)
    const doc = id
      ? await payload.update({
          collection: 'productions',
          id,
          data: ruData,
          locale: 'ru',
          context: { disableRevalidate: true }
        })
      : await payload.create({
          collection: 'productions',
          data: ruData,
          locale: 'ru',
          context: { disableRevalidate: true }
        })

    // EN + DE passes — only localized fields
    await payload.update({
      collection: 'productions',
      id: doc.id,
      locale: 'en',
      data: mapKeystaticToPayload(yaml, slug, 'en', bodyEn),
      context: { disableRevalidate: true }
    })
    await payload.update({
      collection: 'productions',
      id: doc.id,
      locale: 'de',
      data: mapKeystaticToPayload(yaml, slug, 'de', bodyDe),
      context: { disableRevalidate: true }
    })

    console.log(`✓ ${slug}`)
  }
}
```

`context: { disableRevalidate: true }` — skip the revalidation hook during bulk
seed. Hooks check `context.disableRevalidate` (see Payload docs).

## 6. Doc updates at cutover

Per `MAP.md` §7:

| File                      | Change                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `STATUS.md`               | New phase row "11 CMS swap — Payload". Move open Keystatic tasks.                                                             |
| `CONTENT.md`              | Replace Keystatic flow with `/admin` flow. New env table.                                                                     |
| `content/AUTHORING.ru.md` | Replace "Способ 1: браузер (Keystatic)" with `/admin`. Drop GitHub PAT + Obsidian section (Способ 2 retired — DB-backed now). |
| `MAP.md` §1               | Replace `KEYSTATIC_R2_ONLY_PLAN.md` row + delete other Keystatic plans. Add this doc.                                         |
| `MAP.md` §3               | Note `keystatic.config.ts`, `app/keystatic/*`, `KEYSTATIC_*.md` deleted.                                                      |
| `readme.md`               | Stack line: Keystatic → Payload. Dev section: `DATABASE_URL` required.                                                        |

## 7. Risks + mitigations

| Risk                                                                | Mitigation                                                                                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vercel Hobby 250 MB bundle / 10 s timeout                           | Admin is lazy-loaded; runtime pages stay light. If hit, Pro upgrade is $20/mo.                                                                   |
| Neon free tier autoscales to zero — cold start                      | First admin request after idle ≈1.5 s. Acceptable for a 2-editor admin. Public site uses cached fetches, not affected.                           |
| Seed script writes wrong data                                       | Run against dev Neon first, eyeball 5 productions, diff against current site. Idempotent — re-run after fix.                                     |
| Markdoc string in `textarea` loses formatting                       | `@markdoc/markdoc` parses raw string. Existing values round-trip unchanged. Confirmed: `directorsNote` is already markdoc.inline → plain string. |
| Image upload through admin breaks R2 mirror                         | New uploads go straight to R2 via `s3Storage`. No git mirror needed. `backup-r2-to-git.yml` retired at C.                                        |
| Postgres goes down / Neon outage                                    | Site keeps serving cached pages until next revalidate. `/admin` 502s — tolerable, two editors.                                                   |
| Two writers race-condition the same doc                             | Payload has row-level versioning; last write wins with warning. Same as Keystatic Cloud.                                                         |
| `revalidateTag` flaky on dynamic segments (next-sanity #639 analog) | Tag every fetch by both `productions` and `production:<slug>`. Fall back to `revalidatePath('/', 'layout')` for hero/featured.                   |
| Migration loses an entry                                            | Pre-cutover: row-count assert in seed. Post-cutover: keep `content/` directory archived under `archive/` (git retains anyway).                   |

## 8. Rollback

Two safety nets.

- **Before C**: nothing to roll back. Keystatic is still live on `main`. Throw away
  the `payload` branch.
- **After C (within 7 days)**: revert the cutover commit, redeploy. Content edits
  made via `/admin` are not in git — copy them back manually from Postgres dump
  (`pg_dump $DATABASE_URL > rollback.sql`) into YAML. Two editors, low traffic;
  ~1 h of manual reconciliation in the worst case.
- **After C (>7 days)**: Postgres is canonical. Rolling back means re-running a
  reverse `scripts/seed-payload.ts` that writes YAML from Postgres. Build the
  script lazily — only if a rollback is actually needed.

## 9. Open decisions

| #   | Question                                                           | Default                                      | Confirm by |
| --- | ------------------------------------------------------------------ | -------------------------------------------- | ---------- |
| Q1  | Lexical or markdoc-textarea for bodies?                            | **textarea** (no renderer churn)             | P2 start   |
| Q2  | Keep R2 paths as strings, or migrate to `media` upload collection? | **strings** (zero asset migration)           | P2 start   |
| Q3  | Magic-link or password auth?                                       | **password** (no email infra)                | P5         |
| Q4  | Neon region — Frankfurt or Ashburn?                                | **Frankfurt** (closer to RU/DE editors)      | P1         |
| Q5  | Drop Obsidian path entirely or keep it as a read-only export?      | **Drop.** Single source of truth = Postgres. | C          |
| Q6  | Move from Vercel Hobby to Pro at C?                                | **Stay on Hobby.** Watch metrics.            | post-C     |

## 10. Out of scope (explicit non-goals)

- Lexical migration of MDX bodies (Q1 default = no).
- Multi-tenant / multi-site setup.
- Email magic-link auth.
- Custom admin theme matching gorky/paper. Default Payload chrome stays.
- Migration of `content/AUTHORING.ru.md` Способ 2 (Obsidian path) — retired at C.
- Workflows / scheduled publishing — Tier 3 if Roman ever asks.

## 11. Verification checklist (run before C)

- [ ] `/admin` loads on preview deploy; can create + edit a production.
- [ ] Edit a production title in RU; `/ru/productions/<slug>` reflects within 5 s
      without a deploy.
- [ ] Edit same production in EN; `/en/productions/<slug>` reflects.
- [ ] Featured-flip on a production: home `/ru` updates.
- [ ] Upload a new gallery image; lands in R2 at `productions/<slug>/<file>`;
      renders on the production page through `cdnUrl()`.
- [ ] About global edit revalidates `/ru/about` + `/en/about` + `/de/about`.
- [ ] OG image `/api/og/<slug>` renders correctly with new data.
- [ ] `bun run build` clean (no Keystatic imports, no fs reads of `content/`).
- [ ] Lighthouse: home + production page still 4×100 (no regression from new
      data-fetch path).
- [ ] `payload-types.ts` generated; no `any` leaks in `lib/content.ts`.
- [ ] All 54 production slugs present in DB.

## 12. References

- `CMS_RESEARCH_v2.md` §recommendation — Payload 3 footnote + Google AI / Gemini / ChatGPT confluence.
- `keystatic.config.ts` — current schema, 1 386 lines, source of truth for the port.
- `lib/content.ts` — current reader API; public interface preserved verbatim.
- Payload docs (Context7, v3.84.0): localization, postgres adapter, s3 storage, afterChange hooks, livePreview.
- `STATUS.md` Constraints — birthday surprise, push hook, hreflang, past-tense.
- `MAP.md` §7 — post-implementation update prompt to run at C.
