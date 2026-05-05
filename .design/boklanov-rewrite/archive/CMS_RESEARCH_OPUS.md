# CMS for boklanov.com: 2026 Decision Memo

**Bottom line: Keystatic is the right primary pick if you're willing to rename your three body files
to `body.ru.mdoc` / `body.en.mdoc` / `body.de.mdoc` siblings of `index.yaml` (which is its native idiom). Sveltia CMS is
the right fast-path / fallback if you want to keep the exact `body.{ru,en,de}.md` shape and need a fully client-side
admin that won't fight Vercel static export. Both are MIT, free for 2 seats, and neither has native R2 support — solve
that with a one-time GitHub Action.**

## TL;DR

- **Pick Keystatic** (`@keystatic/core` + `@keystatic/next`) as the primary recommendation. It's actively maintained by
  Thinkmill, has the cleanest TypeScript schema (including a real `fields.conditional` for your `L10nString`
  dual-shape), and natively writes a sibling-files-per-entry layout that matches your `content/productions/<slug>/`
  structure. The only wart: it doesn't have a native i18n layer, so you model three locales as three separate
  `fields.mdx` (or `markdoc`) document fields, which produces `body.<locale>.mdoc` — close enough to your current
  `body.{ru,en,de}.md` that a 30-line reader patch is the entire migration.
- **Use a GitHub Action — not the CMS — for R2 sync.** No Git-backed CMS in 2026 supports R2/S3 as a media backend (
  Keystatic has hinted at it via Keystatic Cloud Images on Cloudflare R2 but only as part of their Pro service, not as a
  configurable media adapter). Add a workflow on `push` that runs
  `aws s3 sync public/productions/ s3://<bucket>/productions/ --endpoint-url https://<account>.r2.cloudflarestorage.com --delete`.
  That kills the "ping Daniil" handoff for good.
- **Avoid the editorial-workflow / branch-PR requirement for now.** Keystatic, Sveltia, and Decap all commit straight to
  a configured branch in 2026. Sveltia's editorial-workflow / branch-per-entry feature is on the roadmap for v2.0 (late
  2026). The pragmatic equivalent is to point the CMS at a `cms` or `drafts` branch and merge via the GitHub mobile
  app — that's the workflow Ergaster, Pages CMS users, and others have settled on.

## Key Findings

### State of the Git-backed CMS market in 2026

**Keystatic (Thinkmill).** Still maintained, MIT-licensed, ~2k GitHub stars. The core hasn't had loud major releases in
2025 but the docs site and Cloud product have shipped continuously, and Thinkmill uses it for thinkmill.com.au and
high-traffic client sites. Active GitHub Discussions in October–November 2025 (Q&As, ideas, show-and-tell) show ongoing
engagement from maintainers (notably @simonswiss). The Cloud free tier covers 3 users per team forever; Pro
is $10/team/mo + $5/user beyond 3 and adds Cloud Images on Cloudflare R2 (Keystatic's own R2 service, not a configurable
bucket). For 2 seats you'll never pay anything. Status verdict: stable, not flashy, no signs of abandonment.

**Sveltia CMS (Kohei Yoshino, solo).** This is the one that's gaining real momentum. v0.126 in late 2025, ~2k stars,
v1.0 expected early/mid 2026, weekly releases. Built from scratch in Svelte 5, ~300 KB bundle vs Decap's 1.5 MB, GraphQL
fetches, deliberately mobile-friendly, true drop-in replacement for Decap (one-line script swap, same `config.yml`). The
maintainer is candid about it being a one-person project and PRs are not yet accepted, but issue triage is fast and a
Build-Time Render meetup talk on February 3, 2026 indicates it's getting wider eyeballs. A US government site has
migrated. Caveats: no editorial workflow yet (single-branch commits), no custom widgets yet, Git Gateway deliberately
not supported, real-time preview not yet implemented. None of those matter for your use case.

**Decap CMS (PM TechHub).** Latest is 3.11.0 (March 24, 2026); a new Plate-based richtext widget shipped April 16, 2026,
with the legacy markdown widget formally deprecated. So it's not dead, but development pace is genuinely slow — the
community has largely moved to Sveltia, and Sveltia openly states Decap "has been neglected for years." Don't pick Decap
in 2026 unless you have a specific reason.

**Pages CMS (Ronan Berder, single maintainer).** MIT, fully free, hosted at app.pagescms.org or self-hostable on Vercel.
Auth supports both GitHub OAuth and magic-link email — the only candidate that ships email magic links out of the box.
Single `.pages.yml` config. No native i18n (open issue #221, no implementation in sight). Not the right fit for your
three-body-file shape, though it's the slickest UX of the bunch and the mobile experience is reportedly excellent.

**Outstatic.** Lives inside Next.js, GitHub-backed, has a "Pro" tier at $5/mo for AI completion + email/Google login for
non-GitHub users. Limited schema flexibility compared to Keystatic; Markdown-with-frontmatter only. Less idiomatic for
your `index.yaml + three body files` shape. Skip.

**Front Matter CMS (Elio Struyf).** A VS Code extension. The author publicly announced in 2025 that he's deprioritizing
major feature work to focus on Demo Time. Even if it were actively developed, it's a developer-in-VS-Code tool — Roman
would have to install VS Code and learn its UI. Wrong shape for a non-technical author. Skip.

**CloudCannon, Spinal, Siteleaf.** All paid SaaS ($29–$55/mo entry). Out of scope for $0/mo budget.

**No new entrant emerged in 2025–2026 that displaces this trio.** The Git-CMS category has consolidated: Keystatic for
code-first/TS-first teams, Sveltia for the Decap successor crown, Pages CMS for hosted simplicity. CloudCannon expanded
the visual-editing premium tier. That's it.

### The multi-locale body files problem (the make-or-break technical issue)

Your current shape is unusual: **one shared `index.yaml` + three sibling `body.ru.md` / `body.en.md` / `body.de.md`
files per entry**. Most CMS i18n configurations assume *full entry duplication* (one full file per locale, with all
metadata duplicated). Your shape is metadata-shared / body-localized, which is a midpoint not directly modeled by any of
the three.

**Keystatic native fit (cleanest, but renames extension):** Keystatic's content-organization model writes `index.yaml`
for an entry's structured fields and produces additional sibling files for *each non-primary `document`/`markdoc`/`mdx`
field* (this is documented and confirmed by Thinkmill in Discussion #361). You can therefore model your schema as:

```ts
// keystatic.config.ts
collection({
  label: 'Productions',
  slugField: 'title',
  path: 'content/productions/*/',           // trailing slash → folder per slug
  schema: {
    title: fields.slug({ name: { label: 'Title' } }),
    // …other index.yaml fields…
    bodyRu: fields.mdx({ label: 'Body (RU)' }),
    bodyEn: fields.mdx({ label: 'Body (EN)' }),
    bodyDe: fields.mdx({ label: 'Body (DE)' }),
  },
})
```

This produces on disk:

```
content/productions/<slug>/
  index.yaml
  bodyRu.mdx
  bodyEn.mdx
  bodyDe.mdx
```

Your existing `lib/content.ts` reader currently looks for `body.ru.md`. The migration is a `git mv` plus a one-line
reader change to look for `bodyRu.mdx` (or `body.ru.mdx` if you set up the field naming convention to match — Keystatic
uses the field key as the filename). You can set `format: { contentField: 'bodyRu' }` to make Russian the "primary" body
and inline it into `index.yaml` frontmatter, but doing so will block having three peer body files, so don't.

**Idiomatic in Keystatic, ugly only in that you lose the `.<locale>.md` dotted-extension naming.** If you must keep
dotted extensions, Keystatic doesn't let you control sibling filenames directly — you'd write a post-commit
normalization Action. Don't.

**Sveltia / Decap native fit:** Sveltia (and Decap, identical syntax) supports `i18n: { structure: 'multiple_files' }`,
which produces this layout:

```
content/productions/
  <slug>.ru.md
  <slug>.en.md
  <slug>.de.md
```

That's three full Markdown files with **duplicated frontmatter** in each. You can mark fields as `i18n: duplicate` (
Decap docs explicitly support this) so the YAML metadata is identical and synchronized across the three files when
edited, but you still write the metadata three times to disk. This breaks your "one source of truth for metadata"
architecture. Sveltia v0.75+ added `omit_default_locale_from_filename: true` (Discussion #394), which gets you
`<slug>.md` + `<slug>.en.md` + `<slug>.de.md`, still triplicated. **There is no Sveltia/Decap config that produces one
YAML + three body siblings out of the box.**

**Sveltia + folder structure workaround:** With `path: '{{slug}}/index'` plus `i18n: { structure: 'multiple_files' }`,
you can get:

```
content/productions/<slug>/
  index.ru.md
  index.en.md
  index.de.md
```

Frontmatter still triplicated. This is the closest Sveltia comes to your shape. If you accept this — i.e., you let
`lib/content.ts` read merged-but-redundant frontmatter and use only one locale's frontmatter as canonical — Sveltia
works. The wart is real-time-editable redundancy: change a production's `year` field in the editor and Sveltia will
write all three files; if anyone hand-edits one body file's frontmatter divergently, you'll have a quiet split-brain.

**Verdict on this problem:** Keystatic wins decisively if you can change the file extension/naming. Sveltia wins if you
must keep three separate Markdown files (with the cost of triplicate frontmatter). Pages CMS is out — no i18n support
exists for it.

### The L10nString dual-shape problem (`string | { ru, en, de }`)

This is the easiest of the technical questions to solve in 2026.

**Keystatic — clean.** `fields.conditional()` is a first-class, documented field that takes a discriminator (checkbox or
select) and a per-branch schema. The exact shape you need:

```ts
title: fields.conditional(
  fields.select({
    label: 'Title language mode',
    options: [
      { label: 'Same in all languages', value: 'shared' },
      { label: 'Per-language', value: 'localized' },
    ],
    defaultValue: 'shared',
  }),
  {
    shared: fields.text({ label: 'Title' }),
    localized: fields.object({
      ru: fields.text({ label: 'Title (RU)' }),
      en: fields.text({ label: 'Title (EN)' }),
      de: fields.text({ label: 'Title (DE)' }),
    }),
  }
)
```

Roman gets a dropdown that switches the form between one input and three. The on-disk YAML is the discriminator + the
chosen branch — slightly noisier than your current `string | { ru, en, de }` (you'll have a
`discriminant: 'shared' | 'localized'` key), but trivially normalized in `lib/content.ts`. If you want true union output
without a discriminator, that's a custom widget territory, which Keystatic doesn't expose easily — accept the small
extra YAML key.

**Sveltia / Decap — no clean primitive.** Decap's i18n field-level options (`i18n: true | duplicate | none`) work
per-field but don't give you "either one string or three" — you'd have to model both shapes and let one be empty, plus
write convention enforcement in your reader. Significantly worse DX.

This alone is a strong tiebreaker for Keystatic if your `L10nString` is used heavily.

### Image pipeline / R2 sync

**No Git-backed CMS in 2026 supports configurable S3/R2 media backends.** Verified across Keystatic Discussion #491 (
Thinkmill confirmed they're building Keystatic Cloud Images on Cloudflare R2/Workers but it's their managed service, not
a configurable bucket adapter — and only on the Pro plan), Sveltia roadmap (no plans for non-Git backends), Decap (still
defers to its in-repo media folder pattern), and Pages CMS (in-repo only). Keystatic Cloud Images is the closest thing,
and it's the wrong shape — it points images at Keystatic's CDN, not your R2 bucket.

**The right architecture in 2026 is unchanged: CMS commits images to `public/productions/<slug>/` in Git, GitHub Action
mirrors them to R2 on every push.** The `aws s3 sync` command works against R2 via the S3-compatible API once you create
an R2 access key with Object Read & Write scope on a specific bucket. Concrete workflow:

```yaml
# .github/workflows/sync-r2.yml
name: Sync productions to R2
on:
  push:
    branches: [ main ]
    paths: [ 'public/productions/**' ]
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Sync to R2
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: auto
        run: |
          aws s3 sync public/productions/ \
            s3://${{ secrets.R2_BUCKET }}/productions/ \
            --endpoint-url https://${{ secrets.R2_ACCOUNT_ID }}.r2.cloudflarestorage.com \
            --delete
```

This is ~15 lines and replaces `scripts/upload-images.ts` entirely. Roman never touches a terminal again. (
`ryand56/r2-upload-action` is a popular wrapper if you don't want to write the AWS CLI invocation, but raw `aws s3 sync`
is fewer dependencies.)

### Static export, Vercel, and Keystatic's runtime requirement

There is one critical detail in the original constraint stack. **Keystatic's admin UI requires a server runtime —
its `app/keystatic/[[...params]]/page.tsx` route mounts API routes that hit the GitHub API, so it cannot live in a
Next.js `output: 'export'` static build.** Confirmed in Keystatic Discussion #826 by Thinkmill. The recommended
pattern (used by thinkmill.com.au itself) is: the public site is fully prerendered and statically optimized, and only
`/keystatic/*` and `/api/keystatic/*` run server-rendered. On Vercel this is the default Next.js behavior — you'd drop
`output: 'export'` and instead let Vercel statically optimize the public pages and serverless-render only the admin
routes. Build cost stays effectively the same, deployments stay on Vercel free tier, and you keep one Vercel project.

**If you genuinely need pure static export** (e.g., to move off Vercel), Keystatic doesn't fit. Sveltia does — it's a
100% client-side single-page app loaded from a CDN that talks directly to the GitHub API via OAuth proxy. No server, no
API routes, no Vercel functions. This is Sveltia's structural advantage for any static-only host (Cloudflare Pages,
GitHub Pages, S3+CloudFront).

For your stated stack (Vercel + Next.js), the loss of `output: 'export'` is cosmetic, not real. **Drop the static-export
requirement; let Vercel handle the admin routes serverlessly.**

### Auth setup overhead

- **Keystatic Cloud (recommended for 2 users):** Sign up, create a project, link the GitHub repo. Roman logs in with
  email; the Cloud handles GitHub OAuth on his behalf so he doesn't need a GitHub account. Free up to 3 users per team
  forever. ~5 minutes setup.
- **Keystatic self-hosted GitHub mode:** Manually create a GitHub App, set client ID/secret as Vercel env vars, follow
  the prompts at first login. Both users need GitHub accounts. ~20 minutes setup, $0 forever.
- **Sveltia:** Requires deploying the official Cloudflare Workers OAuth proxy (`sveltia-cms-auth`) — a 5-minute step,
  free on Cloudflare's Workers free tier. Then both users authenticate with GitHub PAT or OAuth flow. Both users need
  GitHub accounts. No magic-link option.
- **Pages CMS:** Magic-link out of the box on the hosted version. Easiest for Roman if you went that route — but Pages
  CMS doesn't solve the i18n problem.

For a non-technical author who travels, Keystatic Cloud is the lowest-friction option of the three. Roman gets an
email-link login and never sees GitHub.

### Mobile UX

- **Sveltia:** Built explicitly mobile-first. Reviewers (dubasipavankumar.com, Ergaster, multiple Bluesky testimonials
  in 2025) confirm it's genuinely usable on a phone — large tap targets, responsive panes. Best-in-class for this use
  case.
- **Pages CMS:** Modern interface, reportedly works well on mobile per CSS-Tricks coverage and Rachsmith's blog ("I can
  do it from anywhere, from my phone").
- **Keystatic:** Third-party comparisons (wisp.blog, repeated across multiple pages) describe Keystatic mobile support
  as "listed but complex/limited." The admin UI is a desktop-first React app — workable on a tablet, awkward on a phone.
  This is the one real point against Keystatic for Roman's travel use case.
- **Decap:** Notoriously not mobile-friendly (one of the original drivers behind Sveltia's existence).

### Plain-text/YAML diff quality

- **Keystatic:** Excellent. Round-trips YAML and Markdoc/MDX cleanly; the writer is from the Thinkmill/KeystoneJS
  lineage and treats the file format as canonical, not as a serialized blob.
- **Sveltia:** Good but not perfect. Active issue/discussion threads (e.g., the Hugo migration story at
  0deepresearch.com) document early TOML-frontmatter generation bugs that have since been fixed in YAML mode; default
  `quote: none` in v1.0 produces clean output. Sveltia exposes a global
  `output: { yaml: { quote, indent_size }, json: {...} }` config to control formatting precisely.
- **Decap:** Long-standing complaints about reformatting frontmatter and reordering keys; this is one of the things
  Sveltia explicitly fixes.

### Branch-based workflow

None of the three Git CMSes ship a real branch-per-entry / PR-review flow as of May 2026:

- **Sveltia:** "Editorial workflow" deferred to v2.0 (late 2026). Currently single-branch commit only.
- **Keystatic:** No editorial workflow. The `branchPrefix` storage option lets you scope which branches are
  visible/editable, but there's no per-entry branch.
- **Decap:** Has the original Netlify CMS editorial workflow, but it's bug-ridden (multiple open issues) and Sveltia
  explicitly rejected reusing it.

**Pragmatic substitute:** point the CMS at a `cms` (or `drafts`) branch via the storage config; Daniil opens a PR from
`cms` → `main` on the GitHub mobile app or web after Roman is done editing. This is what the Ergaster blog post
documents for Sveltia, and it's the workflow most "I want PR review for content" users land on. It satisfies the spirit
of constraint #11 without depending on a feature that doesn't exist yet.

## Details

### Recommended stack: Keystatic + Vercel + R2 sync Action

**Architecture:**

```
┌─────────────┐     commits to      ┌──────────────┐
│ Roman / iPad│ ──────────────────► │  GitHub repo │
│ /keystatic  │   `cms` branch      │              │
└─────────────┘                     └──────┬───────┘
                                           │
                       Daniil opens PR     │ on push to main
                       cms → main          ▼
                                    ┌──────────────────┐
                                    │ Vercel build     │ ◄── public site
                                    │ (Next.js + ISR)  │     statically optimized
                                    └──────────────────┘
                                           │
                                           │ also fires
                                           ▼
                                    ┌──────────────────┐
                                    │ GitHub Action    │
                                    │ aws s3 sync → R2 │
                                    └──────────────────┘
```

**Schema sketch (the parts that matter):**

```ts
// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core';

const l10nString = (label: string) =>
  fields.conditional(
    fields.select({
      label: `${label} — mode`,
      options: [
        { label: 'Same in all languages', value: 'shared' },
        { label: 'Per-language', value: 'localized' },
      ],
      defaultValue: 'shared',
    }),
    {
      shared: fields.text({ label }),
      localized: fields.object({
        ru: fields.text({ label: `${label} (RU)` }),
        en: fields.text({ label: `${label} (EN)` }),
        de: fields.text({ label: `${label} (DE)` }),
      }),
    }
  );

export default config({
  storage: {
    kind: 'github',
    repo: 'boklanov/site', // adjust
    branchPrefix: 'cms/',  // optional: if you want all CMS work on cms/* branches
  },
  collections: {
    productions: collection({
      label: 'Productions',
      slugField: 'slug',
      path: 'content/productions/*/',
      format: { data: 'yaml' }, // keep index.yaml not index.json
      entryLayout: 'content',
      schema: {
        slug: fields.slug({ name: { label: 'Slug' } }),
        title: l10nString('Title'),
        year: fields.integer({ label: 'Year' }),
        director: l10nString('Director'),
        // …all your other index.yaml fields…
        coverImage: fields.image({
          label: 'Cover Image',
          directory: 'public/productions',     // image lands at public/productions/<slug>/<filename>
          publicPath: '/productions/',
        }),
        bodyRu: fields.mdx({ label: 'Body (RU)' }),
        bodyEn: fields.mdx({ label: 'Body (EN)' }),
        bodyDe: fields.mdx({ label: 'Body (DE)' }),
      },
    }),
    // similarly for `pages` (About) and future `posts` (blog)
  },
});
```

This produces, per production:

```
content/productions/<slug>/
  index.yaml
  bodyRu.mdx
  bodyEn.mdx
  bodyDe.mdx
public/productions/<slug>/
  cover.jpg, ...
```

**Reader change in `lib/content.ts`:** swap the regex/glob from `body\.(ru|en|de)\.md` to `body(Ru|En|De)\.mdx` (or use
Keystatic's `createReader` API and skip the manual file-walking entirely — its `Reader API` returns typed objects). The
Reader API is a meaningful win if you adopt Keystatic; you stop hand-parsing YAML and get TypeScript types from your
schema for free.

**Cost:** $0/mo, 2 seats, MIT license, no SaaS lock-in.

### Fast-path alternative: Sveltia CMS

If renaming `body.ru.md` → `bodyRu.mdx` is intolerable for any reason (e.g., you have a lot of cross-references in
existing content, or you're philosophically attached to dotted-locale extensions), use Sveltia and accept the
triplicate-frontmatter wart.

```yaml
# public/admin/config.yml
backend:
  name: github
  repo: boklanov/site
  branch: cms                   # branch-based workflow via convention
  base_url: https://your-cf-worker.workers.dev
media_folder: public/productions
public_folder: /productions

i18n:
  structure: multiple_files
  locales: [ ru, en, de ]
  default_locale: ru
  omit_default_locale_from_filename: true   # ru becomes index.md, others index.<locale>.md

collections:
  - name: productions
    label: Productions
    folder: content/productions
    create: true
    path: '{{slug}}/index'
    extension: md
    format: yaml-frontmatter
    i18n: true
    fields:
      - { name: title, label: Title, widget: string, i18n: true }
      - { name: year,  label: Year,  widget: number, i18n: duplicate }
      - { name: director, label: Director, widget: string, i18n: true }
      - { name: body,  label: Body,  widget: markdown, i18n: true }
```

Result on disk:

```
content/productions/<slug>/
  index.md       # ru (default)
  index.en.md
  index.de.md
```

`i18n: duplicate` keeps the metadata in lockstep across all three files — you read whichever file you want and the
metadata is identical. Pick `index.md` (the default-locale file) as canonical for `lib/content.ts` metadata reading;
pull the `body` field from each file separately.

This is a smaller code change to your existing reader (filename pattern shifts from `body.<locale>.md` →
`index.<locale>.md`, and metadata is read once from `index.md`), at the cost of redundant on-disk YAML.

**Cost:** $0/mo, 2 seats, MIT, plus a free Cloudflare Worker for OAuth.

### Things ruled out and why

- **Pages CMS:** No i18n support, period. Open issue with no implementation. Otherwise excellent (free, magic-link auth,
  mobile-friendly, hosted).
- **Outstatic:** Schema flexibility insufficient for your `L10nString` and three-body-files shape. Wants
  frontmatter-in-Markdown only.
- **Decap CMS:** Sveltia is strictly better in every dimension you care about (mobile, performance, YAML output quality,
  maintenance velocity). No reason to pick Decap in 2026.
- **Front Matter CMS:** VS Code extension; needs Roman to install and learn VS Code.
- **Notion + sync adapter, headless CMS + sync adapter, build-your-own minimal admin:** All technically possible. None
  is justified given Keystatic and Sveltia exist and solve the problem natively. The ROI on a custom tiny admin (say, a
  Next.js route that hits the GitHub Contents API and renders a hand-built form) is negative compared to Keystatic's 30
  minutes of setup. Skip.
- **Strapi / Directus / Payload:** Require a database; ruled out by constraint #2 / #7.

### Known footguns

1. **Keystatic + Next.js static export are mutually exclusive.** You must run Vercel in normal Next.js mode (default),
   not `output: 'export'`. Confirmed in Discussion #826 by Thinkmill. Vercel's free tier handles serverless route
   execution for the admin routes for free at this scale.
2. **Keystatic Cloud Images is not a configurable R2 adapter.** It's Thinkmill's own image-hosting service that happens
   to run on R2 internally. If you want images on *your* R2 bucket, use the GitHub Actions sync — don't rely on
   Keystatic Cloud Images.
3. **Sveltia's editorial workflow / branch-per-entry is not implemented yet** (deferred to v2.0, late 2026). The
   branch-PR workflow is a manual `cms` → `main` merge.
4. **Sveltia is a one-person project.** Yoshino has been responsive and shipped weekly through 2025–2026, and v1.0 is
   imminent, but bus-factor risk is real. Mitigation: it's MIT, the bundle is loaded from a pinned version on unpkg,
   your `config.yml` is Decap-compatible, so a freeze-point migration to Decap or a fork is always possible.
5. **Keystatic produces a YAML `discriminant` key when you use `fields.conditional`.** Your reader needs to consume it.
   If you want a clean union without a discriminator, you're writing a custom widget — accept the discriminator instead.
6. **`fields.mdx` produces `.mdx` files, `fields.markdoc` produces `.mdoc` files.** Your existing `body.{ru,en,de}.md`
   files would need to be either (a) converted to `.mdx`/`.mdoc` (trivial — most plain Markdown is valid in both) or (b)
   kept by configuring Markdoc with custom file extensions (not directly supported; you'd patch the reader instead).
7. **Don't enable `format.contentField` if you have multiple body fields.** Keystatic only allows one contentField per
   entry; setting it kills the multi-locale-body pattern.

### Migration path: ship Sveltia first, switch to Keystatic later (or vice versa)

Both write plain YAML/Markdown to your repo. Switching CMSes is a config change plus a content-shape migration script (
one afternoon). The content itself is portable. If you want zero-risk: start with Sveltia (faster initial setup, drop-in
replacement of the `npm run upload-images` flow, mobile-friendly UX for Roman this week), and migrate to Keystatic later
if and when you decide the dual-shape conditional editor and Reader API are worth the file rename. There's no
irreversible commitment in either direction.

## Recommendations

**Stage 1 (this week — ship something Roman can use):**

- **Decision rule:** if you want Keystatic's superior schema and you're OK with `bodyRu.mdx`/`bodyEn.mdx`/`bodyDe.mdx`
  instead of `body.ru.md`/`body.en.md`/`body.de.md`, go to Stage 2A. If you'd rather keep three Markdown files at the
  cost of triplicate frontmatter, go to Stage 2B.
- Drop the `output: 'export'` requirement from `next.config.js`. Confirm Vercel still serves the public site at the same
  speed (it will — it auto-static-optimizes pages without `getServerSideProps`).

**Stage 2A — Keystatic path (recommended):**

1. Add `@keystatic/core` and `@keystatic/next`. Mount `/keystatic` and `/api/keystatic/[[...params]]` per the Next.js
   install guide.
2. Write the `keystatic.config.ts` shown above. Use `fields.conditional` for every `L10nString` field.
3. Create one production via the local admin UI to generate a sample
   `content/productions/<slug>/{index.yaml, bodyRu.mdx, bodyEn.mdx, bodyDe.mdx}`. Verify the file shapes match what you
   want.
4. Write a one-shot migration script: walk existing `content/productions/<slug>/`, rename `body.ru.md` → `bodyRu.mdx`,
   parse existing YAML, normalize `L10nString` values to the conditional discriminator shape. ~50 LOC.
5. Update `lib/content.ts` to use Keystatic's `createReader` API (typed, ergonomic) or just patch your existing parser
   to look for the new file names.
6. Add the R2 sync GitHub Action shown above. Delete `scripts/upload-images.ts` and the `npm run upload-images` step.
7. Sign Roman up for a Keystatic Cloud team (free, 3 users) so he gets email-magic-link login without needing a GitHub
   account.
8. Configure `branchPrefix: 'cms/'` in storage so all CMS commits land on `cms/*` branches; Daniil reviews and merges
   via the GitHub mobile app.

**Stage 2B — Sveltia path (fast-ship fallback):**

1. Add `public/admin/index.html` with the Sveltia script tag, plus the `config.yml` shown above.
2. Deploy `sveltia-cms-auth` to Cloudflare Workers (free, ~5 min).
3. Add the R2 sync Action.
4. Migrate existing content to the `content/productions/<slug>/index.<locale>.md` shape via a one-shot script (you
   currently have `body.ru.md` etc.; the script reads each, merges with `index.yaml`, and writes one `index.<locale>.md`
   per locale with shared frontmatter).
5. Update `lib/content.ts` to read metadata from `index.md` (default locale) and bodies from each locale file.

**Benchmarks that would change my recommendation:**

- **If Roman's primary editing surface is genuinely a phone, not an iPad/laptop:** flip to Sveltia regardless of the
  schema cost. Mobile UX is its standout feature and Keystatic's mobile experience is materially weaker.
- **If `L10nString` is used for fewer than 3 fields:** the conditional-field advantage of Keystatic shrinks; Sveltia's
  simpler `i18n: true | duplicate` may be enough.
- **If you want to add anonymous/open-authoring contributions in the future** (e.g., let collaborators submit production
  drafts as PRs without Daniil's involvement): Sveltia and Decap have community Open Authoring patterns; Keystatic does
  not (open feature request). Pick Sveltia.
- **If Sveltia v1.0 ships with the editorial workflow before you migrate:** revisit. Branch-per-entry would put Sveltia
  ahead on workflow, though Keystatic still wins on schema.
- **If you ever need to drop Vercel and serve fully from a static-only host (Cloudflare Pages, S3, GitHub Pages):** flip
  to Sveltia. Keystatic admin can't run there.

## Caveats

- **Both Keystatic and Sveltia are small projects** (Keystatic: Thinkmill team of a few people; Sveltia: solo). Both are
  MIT and your content is portable. The bus-factor risk is symmetric and bounded — your `content/productions/` directory
  is yours.
- **Keystatic has no native i18n layer**; the multi-document-field workaround is idiomatic per the maintainers' own
  answers in GitHub Discussion #361, but it's not labeled "i18n" in the Keystatic docs and the editor UI shows it as
  three separate fields, not as language tabs. For three locales, this is fine; if you ever go to ten, the form gets
  cluttered. (There is an open feature request — Discussion #1423 — for native i18n, no shipped implementation as of May
  2026.)
- **Sveltia's `omit_default_locale_from_filename` option works only with the `multiple_files` structure**, not
  `multiple_folders`. If you change to a folder-per-locale layout later, this convenience disappears.
- **The `npm run upload-images` removal is what actually retires the "ping Daniil" handoff** — not the CMS choice. Both
  Keystatic and Sveltia commit images to Git; the GitHub Action, not the CMS, mirrors them to R2. This means even if you
  later switch CMSes, your image pipeline keeps working.
- **Keystatic Cloud's free tier is 3 users per team forever** as of the docs at keystatic.com/docs/cloud (May 2026).
  Pricing changes are always possible; if Thinkmill ever raises floor pricing, you can switch to self-hosted GitHub mode
  in an afternoon (storage config change only) — the content stays put.
- **All sources cited reflect their state at search time in early May 2026**; some (Sveltia release cadence, Decap
  richtext widget rollout) are moving fast. Expect ground-truth on specific config flags and version numbers to drift
  over months.
