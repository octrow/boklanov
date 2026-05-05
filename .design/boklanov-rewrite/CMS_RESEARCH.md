# CMS / Editor research — boklanov.com

> **Cross-checked against** `archive/CMS_RESEARCH_OPUS.md` and
> `archive/CMS_RESEARCH_GEMINI.md`. Several earlier claims in this doc
> were corrected after the cross-check; see §11 for the corrections log.


> Goal: give Roman (and future authors) a **clean, friendly editor** for
> adding/editing productions (and `content/about/*`, future blog, etc.)
> **without replacing** the current source of truth — `content/**` still
> stays as `index.yaml + body.{ru,en,de}.md + images in public/`.
> Images must keep flowing into Cloudflare R2 via `scripts/upload-images.ts`.

Date: 2026-05-05
Author: Daniil

---

## 1. Constraints we must respect

| # | Constraint | Why it matters |
|---|---|---|
| C1 | `content/productions/<slug>/index.yaml` + `body.{ru,en,de}.md` stays the source of truth | All page routes go through `lib/content.ts`; the build is a static `next build` from these files. No DB. |
| C2 | Must coexist with the current Obsidian + obsidian-git flow described in `content/AUTHORING.ru.md` | Roman already knows it; the new editor is *additional*, not replacing. |
| C3 | Multilingual fields = either string OR `{ ru, en, de }` object (`L10nString`) | The CMS schema must allow both shapes (or we normalize on save). |
| C4 | Images are written to `public/productions/<slug>/` and then **uploaded to R2** by `scripts/upload-images.ts`. The site reads them via `lib/cdn.ts`. | Whatever uploader the CMS ships with, we still need the R2 step. |
| C5 | Author has no terminal skills — currently we say "ping Daniil to run npm run upload-images" | The new flow should remove that hand-off. |
| C6 | Auth restricted to a tiny set of users (Roman, Daniil) | No public sign-ups; ideally GitHub OAuth or a single-tenant magic-link. |
| C7 | Hosting story should not add a stateful server. Vercel-friendly. | Site is a static export on Vercel; no DB exists. |
| C8 | Budget: ideally $0/month. SaaS only if free tier covers two seats indefinitely. | Personal site for a director. |
| C9 | **Free; open-source preferred.** Avoid paid tiers and avoid closed-source SaaS where reasonable. | Future-proofing — if the vendor folds, an OSS tool can be self-hosted. License (MIT/Apache/MPL) preferred over "source-available". |

---

## 2. Candidates evaluated

Eight options were considered. Five are summarised here; the rest were rejected up-front (Notion-as-CMS — tried and abandoned per `notion-data/`; Strapi/Directus — require a DB; Forestry/TinaCloud SaaS-only — paid).

### A. Keystatic (`@keystatic/core` + `@keystatic/next`)
- **What it is:** open-source, git-backed CMS by Thinkmill. Runs **inside** the Next.js app at e.g. `/keystatic`. ~2k stars, Thinkmill ships continuously, used on thinkmill.com.au.
- **Storage modes:** `local` (writes directly to disk in dev) and `github` (commits via GitHub App in prod). Optional `branchPrefix: 'cms/'` scopes commits to `cms/*` branches.
- **Schema:** TypeScript — `fields.text`, `fields.array`, `fields.object`, `fields.image`, `fields.markdoc/mdx`, **`fields.conditional`** (real, first-class — solves `L10nString` cleanly). Maps to the `Production` type in `lib/content.ts`.
- **Auth options:** (1) self-hosted GitHub App, both users need GitHub accounts; (2) **Keystatic Cloud** — free for ≤ 3 users forever, gives Roman an email-magic-link login so he never touches GitHub. (Cloud = Thinkmill-hosted auth + GitHub commit-back; content stays in your repo.)
- **Image handling:** `fields.image({ directory: 'public/productions/{slug}', publicPath: '/productions/{slug}/' })`. **No native R2/S3 backend** (Keystatic Cloud Images on R2 is Thinkmill's own CDN, not a configurable bucket). R2 sync handled by GitHub Action (§5).
- **YAML support:** `format: { data: 'yaml' }` keeps `index.yaml`. Body fields are `fields.mdx` (writes `.mdx`) or `fields.markdoc` (writes `.mdoc`) — **not plain `.md`**. See §6.1 for the migration cost.
- **DX:** type-safe schema, hot reload, lives in the same repo, `createReader` API gives typed content access for free.
- **Cost:** free, MIT.
- **Mobile UX:** ⚠️ desktop-first React app. Workable on tablet, awkward on phone (multiple third-party reviews concur). This is the one real point against it.
- **Runtime caveat:** **Cannot run under `next.config.js` `output: 'export'`** (Discussion #826). Verified ✅ — our `next.config.js` does not set static export, so this is already fine.
- **Risk:** must keep schema in sync with `lib/content.ts` types (mitigated by `createReader`).

### B. Sveltia CMS
- **What it is:** Decap rewrite in Svelte 5 by Kohei Yoshino (solo maintainer). ~2k stars, ~300 KB bundle vs Decap's 1.5 MB, weekly releases through 2025, v0.126 in late 2025, **v1.0 expected early/mid 2026**. Static SPA at `/admin/index.html`, no backend.
- **Schema:** YAML (`public/admin/config.yml`), Decap-compatible — drop-in script-tag replacement.
- **Auth:** GitHub OAuth via Sveltia's free hosted proxy *or* `sveltia-cms-auth` Cloudflare Worker (5 min, free). Both users need GitHub accounts (no email magic-link option).
- **Local dev:** uses **File System Access API** — browser writes directly to the local repo, no proxy server needed for `npm run dev`-equivalent.
- **Storage:** writes via GitHub GraphQL/REST API directly. No build step.
- **Image handling:** built-in media library, commits binaries to repo. Per-collection media folders supported. **No native R2/S3 backend** — same GitHub Action sidecar as Keystatic.
- **YAML/MD:** native support, with `output: { yaml: { quote, indent_size } }` for formatting control and `yaml_quote: true` to force quoted strings (prevents YAML parsing surprises). L10n via three structures: `multiple_folders`, `multiple_files`, or `single_file`. **Critical caveat:** none of them produce our exact "one shared `index.yaml` + three sibling body MD files" shape — see §6.1.
- **DX:** drop-in, fastest to ship. Mobile UX is **best-in-class** — explicit design goal, multiple 2025 reviewers confirm phone usability.
- **Cost:** free, MIT.
- **Risks:**
  - **Solo maintainer (bus factor).** Mitigations: MIT, Decap-compatible config means a fallback to Decap is one script-tag swap.
  - **No editorial/branch-per-entry workflow yet** — deferred to v2.0 (late 2026). Pragmatic substitute: point at a `cms` branch, Daniil merges to `main` via GitHub mobile.
  - **PRs not currently accepted** by upstream (per maintainer's policy).
  - `L10nString` shape (`string | { ru, en, de }`) has no clean primitive — must pick one shape.

### C. Pages CMS (pagescms.org)
- **What it is:** GitHub-only CMS at `app.pagescms.org`, configured via `.pages.yml` in the repo root. Hosted UI; no code in our app.
- **Auth:** GitHub OAuth **or magic-link email** — only candidate that ships email magic-link out of the box (and doesn't need a separate Cloud product to get it).
- **Storage:** GitHub API, commits to a branch.
- **DX:** zero-install. Slickest UI of the bunch; mobile UX reportedly excellent.
- **❌ Disqualifier: no i18n support at all.** Open issue #221, no implementation in sight. Cannot model our three-locale body files. Strike from the candidate list despite the otherwise great UX.

### D. Decap CMS (classic)
- Same idea as Sveltia but older, slower UI, semi-maintained. Listed for completeness — **prefer Sveltia**.

### E. TinaCMS
- Visual / inline editing inside the live page. Powerful, but: requires running `tinacms` backend or paying for Tina Cloud, schema lives in `tina/` and overlaps with our existing types, free tier has user/edit caps. **Not recommended** for a two-author personal site.

---

## 3. Comparison matrix

| Criterion | Keystatic | Sveltia | Pages CMS | Decap | Tina |
|---|---|---|---|---|---|
| Free | ✅ | ✅ | ✅ | ✅ | ⚠️ caps |
| OSS license (C9) | ✅ MIT | ✅ MIT | ⚠️ open core, single-vendor hosted UI | ✅ MIT | ⚠️ paid Tina Cloud for prod |
| No extra server | ✅ (Next.js admin route) | ✅ (static SPA) | ✅ (hosted) | ✅ | ❌ |
| Type-safe schema | ✅ TS | ❌ YAML | ❌ YAML | ❌ | ✅ TS |
| Mobile-friendly UX | ⚠️ desktop-first | ✅ best-in-class | ✅ | ❌ | ✅ |
| Round-trips our **`index.yaml + body.{ru,en,de}.md`** layout | ⚠️ requires rename to `bodyRu.mdx` etc. (§6.1) | ⚠️ closest is `index.<locale>.md` with **triplicated frontmatter** (§6.1) | ❌ no i18n at all | same as Sveltia | n/a |
| Handles `L10nString` (string \| {ru,en,de}) | ✅ `fields.conditional` (with discriminator key) | ⚠️ pick one shape, no clean union | ❌ | ⚠️ | ✅ |
| Email magic-link login (no GitHub account for Roman) | ✅ via Keystatic Cloud (free ≤ 3 users) | ❌ GitHub-only | ✅ native | ❌ | ✅ |
| Editorial / branch-per-entry workflow | ❌ | ❌ (deferred to v2.0) | ❌ | ⚠️ buggy legacy | ✅ |
| Static-export host compatible (CF Pages, S3, GH Pages) | ❌ needs server runtime | ✅ pure static | ✅ | ✅ | ❌ |
| Native R2/S3 media backend | ❌ | ❌ | ❌ | ❌ | ❌ |
| Active in 2026 | ✅ | ✅ (weekly) | ✅ | ⚠️ slow | ✅ |
| Time-to-ship | medium (2–3 days, includes file rename) | small (½–1 day) | n/a | small | large |

**Key takeaways:**
- **No CMS in 2026 has a configurable R2 backend.** Confirmed across Keystatic Discussion #491, Sveltia roadmap, Decap, Pages CMS. R2 sync is therefore solved out-of-band by a GitHub Action regardless of CMS choice (§5).
- **No CMS produces our exact on-disk layout for free.** Keystatic asks for a one-time file rename (`body.ru.md` → `bodyRu.mdx`). Sveltia asks us to accept triplicated frontmatter. There is no third option that preserves both the filenames *and* the single shared YAML.
- **Pages CMS is out** (no i18n). Decap is dominated by Sveltia. Tina fails on cost / OSS.

---

## 3a. Prior art — Phase 9 (deferred Decap layer)

`.design/boklanov-rewrite/archive/CONTENT_WORKFLOW_compress.md` already
specifies a Phase 9 "Decap CMS Layer" that was approved-but-deferred when
Phase 8 closed (2026-05-02). Its constraints are pre-decided architecture
and apply to whatever editor we ship — Decap, Sveltia, or Keystatic:

| Phase 9 constraint | Translation for Keystatic / Sveltia |
|---|---|
| `public/admin/index.html` + `public/admin/config.yml` | Sveltia matches verbatim. Keystatic equivalent: `app/keystatic/[[...params]]/page.tsx` + `keystatic.config.ts`. |
| Vercel serverless GitHub OAuth proxy | Sveltia: deploy `sveltia-cms-auth` Worker or use the hosted proxy. Keystatic: GitHub App handles auth — no proxy needed. ✅ Keystatic simpler here. |
| `editorial_workflow: false` (commit directly to branch) | Sveltia/Decap config flag. Keystatic equivalent: `storage.kind: 'github'` without branch/PR option. |
| `backend.branch: draft` — **never push direct to main, require manual merge** | **Important.** Both editors must be configured to write to a `cms` (or `draft`) branch, not `main`. Daniil reviews PR → merges. This overrides the "drafts" question in §8.4 — the prior decision is **PR workflow, not direct-to-main**. |
| No `_diagnostics.md` generation | Was a Decap quirk; n/a for Keystatic/Sveltia. |
| Media library uses S3-compatible R2 endpoint | Decap supports this natively; Sveltia inherits it. **Keystatic does not have a built-in R2 backend** — its image fields commit binaries to git. We solve this with the GitHub Action in §5 (commit → Action uploads to R2). Net effect is identical for the reader; the difference is just *where* the upload happens. |
| Schema mirrors frontmatter with Cyrillic labels | All three support `label_ru` / Russian labels in the schema. |

**Net effect on §4 recommendation:** unchanged — Keystatic still wins on DX
and on auth simplicity (no OAuth proxy). The Phase 9 lockdown shifts §6.4
"auth & deploy" to **branch=`cms`, PR-required** for both candidates.

## 4. Recommendation

**Primary: Keystatic.** It is the only option that gives us **type-safe schemas
sharing types with `lib/content.ts`**, runs inside our existing Next.js app
(no separate deploy), and supports the YAML+MD-on-disk model exactly. The
upfront cost (a day to model the schema) pays back as the schema evolves.

**Fallback / fast path: Sveltia CMS.** If we want a working editor in
half a day with zero Next.js coupling, ship Sveltia first; we can always
migrate to Keystatic later (the disk layout doesn't change).

**Third path — honour Phase 9 verbatim (Decap):** the archived plan
already specified Decap with explicit constraints. Sveltia is a strict
superset (Decap-config-compatible, same OAuth proxy, better UI), so we
gain by upgrading Decap → Sveltia at zero cost. Plain Decap is only
worth it if we want to follow the archived plan to the letter without
changing a single decision.

**Not recommended:** Pages CMS (vendor dependency on a hosted UI; soft fail
on C9), Tina (overkill / paid prod tier; fails C9).

Either way: **Obsidian + obsidian-git stays.** Power users (or Daniil) keep
editing raw YAML when needed; the CMS is for the 90% case.

---

## 5. Image pipeline — closing the R2 loop

**Confirmed by both deep-research memos:** no Git-backed CMS in 2026 has a
configurable R2/S3 media backend. (Keystatic Cloud Images on R2 is
Thinkmill's own CDN, not a configurable bucket — and it's a paid feature.)
Whichever CMS we pick, R2 sync happens out-of-band via a GitHub Action.

Two viable shapes for the Action:

### 5a. Reuse our existing `scripts/upload-images.ts` (smaller blast radius)

```yaml
# .github/workflows/upload-images.yml
name: Upload images to R2
on:
  push:
    branches: [main, 'cms/**']
    paths:
      - 'public/productions/**'
      - 'public/about/**'
jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run upload-images
        env:
          R2_ACCOUNT_ID: ${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET: ${{ secrets.R2_BUCKET }}
```

Pros: keeps the existing skip-if-same-size logic at `scripts/upload-images.ts:72`.
Needs a small extension to also walk `public/about/` (currently only walks `public/productions/`).

### 5b. Replace the script entirely with `aws s3 sync --delete` (per Opus memo)

```yaml
# .github/workflows/sync-r2.yml
name: Sync media to R2
on:
  push:
    branches: [main]
    paths:
      - 'public/productions/**'
      - 'public/about/**'
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
          aws s3 sync public/about/ \
            s3://${{ secrets.R2_BUCKET }}/about/ \
            --endpoint-url https://${{ secrets.R2_ACCOUNT_ID }}.r2.cloudflarestorage.com \
            --delete
```

Pros: ~15 lines, no Node install, no script maintenance, deletes orphaned
images automatically. **Recommend 5b** — eliminates `scripts/upload-images.ts`
as a dependency. (5a is the rollback if `--delete` semantics surprise us.)

Either way, this removes the "напиши Daniil" sentences from `AUTHORING.ru.md`
lines 195 and 210.

---

## 6. Implementation plan — Keystatic path

### Phase K1 — Install & mount (½ day)
1. `npm i @keystatic/core @keystatic/next`
2. Create `keystatic.config.ts` at repo root with:
   - `storage: process.env.NODE_ENV === 'development' ? { kind: 'local' } : { kind: 'github', repo: 'octrow/boklanov' }`
   - `ui: { brand: { name: 'boklanov' } }`
3. Add Next.js routes per Keystatic docs:
   - `app/keystatic/[[...params]]/page.tsx` — admin UI
   - `app/api/keystatic/[...params]/route.ts` — API
4. Verify `npm run dev` → `localhost:3000/keystatic` opens, lists no collections.

### Phase K2 — `productions` collection (1 day)
Schema mirrors `content/_PRODUCTION_TEMPLATE.yaml` exactly. Sketch:

```ts
productions: collection({
  label: 'Productions',
  slugField: 'slug',
  path: 'content/productions/*/',
  format: { contentField: 'body', data: 'yaml' },
  entryLayout: 'content',
  schema: {
    slug: fields.slug({ name: { label: 'Slug' } }),
    title: localizedString({ label: 'Title' }),       // helper that returns object {ru,en,de}
    synopsis: localizedString({ label: 'Synopsis' }),
    tagline: localizedString({ label: 'Tagline', allowEmpty: true }),
    directorsNote: localizedString({ label: "Director's note", allowEmpty: true }),
    theatre: fields.object({
      name: l10nOrString({ label: 'Theatre name' }),
      shortName: l10nOrString({ label: 'Short name', allowEmpty: true }),
      city: l10nOrString({ label: 'City' }),
      country: fields.text({ label: 'ISO country code', validation: { length: { min: 2, max: 2 } } }),
      url: fields.url({ label: 'Website', validation: { isRequired: false } }),
    }),
    year: fields.integer({ label: 'Year', validation: { min: 1900, max: 2100 } }),
    ageRating: fields.select({
      options: [{ value: '0+', label: '0+' }, { value: '6+', label: '6+' }, /* ... */]
    }),
    durationMin: fields.integer({ label: 'Duration (min)' }),
    role: fields.multiselect({ options: [/* director, performer, ... */] }),
    form: fields.multiselect({ options: [/* theater, puppet, solo ... */] }),
    poster: fields.object({
      src: fields.image({
        directory: 'public/productions/{slug}',
        publicPath: '/productions/{slug}/',
      }),
      credit: fields.text({ label: 'Photo credit', allowEmpty: true }),
    }),
    gallery: fields.array(
      fields.object({
        src: fields.image({ directory: 'public/productions/{slug}', publicPath: '/productions/{slug}/' }),
        credit: fields.text({ allowEmpty: true }),
        caption: localizedString({ allowEmpty: true }),
      }),
      { label: 'Gallery', itemLabel: (p) => p.fields.src.value ?? 'image' }
    ),
    awards: fields.array(/* name, year, category, city — l10nOrString fields */),
    festivals: fields.array(/* same shape */),
    press: fields.array(/* title, url, outlet, language */),
    runs: fields.array(/* venue, city, yearFrom, yearTo, count */),
    featured: fields.checkbox({ label: 'Show on home featured strip' }),
    featuredOrder: fields.integer({ label: 'Featured order', validation: { isRequired: false } }),
    listOrder: fields.integer({ label: 'List order', validation: { isRequired: false } }),
    body: fields.mdx({ label: 'Body' }), // writes body.md — see §6.1
  },
})
```

#### 6.1 The multi-locale body files problem (the make-or-break technical issue)

This is the most-corrected part of the analysis. Cross-referencing the Opus
and Gemini memos and Keystatic Discussion #361:

**Today's shape** — unusual: one shared `index.yaml` + three sibling
`body.{ru,en,de}.md` files per entry. *Metadata-shared, body-localized.*
No CMS i18n model targets this layout directly.

**Keystatic's idiomatic fit (Discussion #361, confirmed by Thinkmill):**
within a single collection, declare three peer document fields. The on-disk
filename for each non-primary document field is `<fieldKey>.<ext>` (e.g.
`bodyRu.mdx`):

```ts
collection({
  path: 'content/productions/*/',
  format: { data: 'yaml' },           // index.yaml only — no contentField
  schema: {
    // ...index.yaml fields...
    bodyRu: fields.mdx({ label: 'Body (RU)' }),
    bodyEn: fields.mdx({ label: 'Body (EN)' }),
    bodyDe: fields.mdx({ label: 'Body (DE)' }),
  },
})
```

Produces:

```
content/productions/<slug>/
  index.yaml
  bodyRu.mdx
  bodyEn.mdx
  bodyDe.mdx
```

**Migration cost:** one-shot `git mv body.ru.md bodyRu.mdx` (etc.) +
~30-line patch in `lib/content.ts`. Plain Markdown is valid MDX, so the
file *content* doesn't change. **Do not** set `format.contentField` —
Keystatic permits only one contentField per entry, and using it kills the
multi-body pattern.

**Sveltia's idiomatic fit:** Sveltia/Decap supports three i18n structures
(`multiple_folders`, `multiple_files`, `single_file`) — **none of them
produce one shared YAML + three body siblings**. The closest, with
`path: '{{slug}}/index'` + `i18n: { structure: 'multiple_files' }`:

```
content/productions/<slug>/
  index.ru.md      # full frontmatter
  index.en.md      # frontmatter duplicated
  index.de.md      # frontmatter duplicated
```

Field-level `i18n: duplicate` keeps the metadata in lockstep when edited
in the CMS, but the metadata is **physically triplicated on disk**.
Hand-editing one file's frontmatter divergently would silently split-brain.
This breaks our "one source of truth for metadata" architecture; we'd
need to pick one locale's `index.<locale>.md` as canonical for `lib/content.ts`
and ignore the other two's frontmatter.

**Verdict:**
- If we accept the file rename → **Keystatic wins decisively** (clean
  layout, no triplication, type-safe access via `createReader`).
- If we cannot rename → **Sveltia, with the triplication wart**.
- A third option — keep `body.{ru,en,de}.md` exactly and write a
  post-commit normalization Action — is possible but not worth the
  ongoing maintenance.

#### 6.2 The `L10nString` problem
Two helpers in `keystatic.config.ts`:

- `localizedString({ label, allowEmpty })` → `fields.object({ ru: text, en: text, de: text })` — for fields that are *always* per-locale.
- `l10nOrString({ label })` → `fields.conditional(fields.select({ options: [{value:'shared'},{value:'localized'}] }), { shared: fields.text(...), localized: fields.object({ ru, en, de }) })` — for fields where authors choose.

**Important on-disk wart (per Opus memo):** `fields.conditional` writes a
`discriminant: 'shared' | 'localized'` key into `index.yaml` next to the
value. So instead of:

```yaml
title: «Золушка»                       # current — bare string
# or
title: { ru: «Золушка», en: "Cinderella" }
```

we'll see:

```yaml
title:
  discriminant: shared
  value: «Золушка»
# or
title:
  discriminant: localized
  value: { ru: «Золушка», en: "Cinderella" }
```

`lib/content.ts`'s `ProjectionView` will need a one-line normalizer to
unwrap `{ discriminant, value }` back into our existing `L10nString`
shape. A clean primitive without the discriminator would require a
custom Keystatic widget — not worth it; accept the noise.

Alternative: drop the dual-shape and **always store the object form**
`{ ru, en, de }`. The runtime side already accepts both, so this is a
schema-simplification we could do for free. Question 6 in §8 asks the user.

### Phase K3 — `about` & singletons (¼ day)
- Singleton for `content/about/ru.yaml`, `en.yaml`, `de.yaml` — fields:
  `bio`, `quote`, `stats`, `whereTaught`, `photos[]`. Each photo object
  has `src` (image field) + `credit`.
- Markdown bios → singletons writing `content/about/{ru,en,de}.md`.

### Phase K4 — auth & deploy (½ day)
1. Create a GitHub App (per Keystatic docs) with `contents: write` for the repo.
2. Add app credentials to Vercel env vars.
3. Restrict the `/keystatic` route to authenticated repo collaborators only — Keystatic's GitHub mode handles this out of the box; double-check the Vercel deployment guards `/api/keystatic/*` behind auth.
4. Smoke test: open `/keystatic` on prod, edit a production title, verify a commit lands on `main`, Vercel rebuilds, R2 GitHub Action fires for image-touching commits.

### Phase K5 — author handoff (¼ day)
- Update `content/AUTHORING.ru.md`: add a **«Editor in browser»** section pointing to `https://boklanov.com/keystatic`. Keep the Obsidian section intact for power-user mode.
- Record a 3-min Loom for Roman.

### Phase K6 — fold image upload into the loop (¼ day)
- Ship the GitHub Action from §5.
- Remove the "написать Daniil" sentences from `AUTHORING.ru.md` lines 195
  and 210 — replace with «коммит → R2 обновится сам через 1–2 минуты».

**Total estimate: ~3 working days.**

---

## 7. Implementation plan — Sveltia fast path (alternative)

If we want to ship today and decide on the proper editor later:

1. `public/admin/index.html` (8 lines, loads Sveltia CDN bundle).
2. `public/admin/config.yml` — Decap schema mirroring §6 above (YAML, not TS). Roughly 200 lines, mechanical translation of `_PRODUCTION_TEMPLATE.yaml`.
3. Configure GitHub OAuth via Sveltia's hosted proxy (one-time, free) or self-host a 30-line OAuth Worker on Cloudflare Workers (`sveltia-cms-auth`).
4. Drop the `i18n: { structure: 'multiple_files' }` mode + `file: '{{slug}}/body.{{locale}}.md'` to round-trip the three-body layout.
5. Ship the same R2 GitHub Action from §5.

Estimate: half a day. UX is good but not as polished as Keystatic, and the schema is YAML strings — typos won't be caught at edit time.

---

## 8. Open questions for the user

The **two real decision drivers** (everything else is mechanical):

1. **Q1 — File-rename tolerance.** Are we OK renaming
   `body.{ru,en,de}.md` → `bodyRu.mdx` / `bodyEn.mdx` / `bodyDe.mdx`
   one-shot? (Plain Markdown is valid MDX; content unchanged; reader
   patches in `lib/content.ts` are ~30 lines.)
   - **Yes →** Keystatic.
   - **No →** Sveltia, with `index.<locale>.md` + triplicated frontmatter
     (acceptable, just less elegant).
2. **Q2 — Roman's primary editing surface: phone, or laptop/iPad?**
   - **Phone-first** → Sveltia regardless of Q1 (Keystatic mobile UX is
     the one materially weak point Thinkmill hasn't fixed).
   - **Laptop/iPad** → Keystatic is fine.

Mechanical follow-ups (don't change the recommendation):

3. **Editor URL:** `/keystatic` (or `/admin` for Sveltia) on the
   production domain, or a separate `edit.boklanov.com` subdomain for
   blast-radius isolation? Recommend same-domain for both — auth scopes
   are tight and Vercel project count stays at 1.
4. **Auth flavour for Roman:**
   - (a) Self-hosted GitHub OAuth — Roman keeps using his PAT/GitHub login (current state).
   - (b) **Keystatic Cloud free tier (3 users free forever)** — Roman gets an email-magic-link login, never sees GitHub. **Strong recommendation if we go Keystatic.**
   - (c) Sveltia + `sveltia-cms-auth` Worker — GitHub OAuth only, Roman needs a GitHub account.
5. ~~**Drafts:** direct-to-main vs PR workflow.~~ **Resolved by Phase 9
   prior art** (`CONTENT_WORKFLOW_compress.md` §"Deferred: Decap CMS
   Layer"): edits write to `cms/*` branch, Daniil merges to `main`.
   Confirm — Obsidian has been committing direct-to-main since
   2026-05-02 with no incidents, so we could relax this.
6. **L10nString simplification:** keep the dual `string | { ru, en, de }`
   shape (and accept Keystatic's `{ discriminant, value }` YAML noise),
   or normalize everything to the object form `{ ru, en, de }` once and
   forget the union? The runtime already accepts both. Recommend:
   **normalize to object form** — one-shot migration script, simpler
   schema, simpler reader. Authors can still leave `en`/`de` empty if
   the value is shared; there's just no shared shortcut on disk.
7. **R2 secrets:** already in repo Actions secrets, or only in Vercel env?
   (If Vercel-only, add to GitHub Actions secrets before shipping §5.)
8. **Image sync flavour:** §5a (reuse existing `upload-images.ts`) or
   §5b (replace with `aws s3 sync --delete`)? Recommend 5b unless we have
   files in R2 that are *not* in repo and would be deleted by `--delete`.

---

## 9. Files this plan would touch

```
.github/workflows/upload-images.yml           # new — R2 sync on push
keystatic.config.ts                           # new (if Keystatic path)
app/keystatic/[[...params]]/page.tsx          # new
app/api/keystatic/[...params]/route.ts        # new
public/admin/index.html                       # new (if Sveltia path)
public/admin/config.yml                       # new (if Sveltia path)
content/AUTHORING.ru.md                       # update §"Каждый день", drop "напиши Daniil"
package.json                                  # +@keystatic deps OR nothing for Sveltia
scripts/upload-images.ts                      # extend to walk public/about/ too (small)
```

**Update after cross-check:** `lib/content.ts` *will* change — either to
read `bodyRu.mdx` filenames (Keystatic path) or to merge metadata from
one canonical `index.<locale>.md` and ignore frontmatter triplication
(Sveltia path). The on-disk *layout* — folder per slug, YAML metadata,
locale bodies — stays the same shape.

---

## 10. Known footguns (consolidated from both deep-research memos)

1. **Keystatic + `output: 'export'` are mutually exclusive** (Discussion #826). Verified ✅ — our `next.config.js` doesn't set static export, so we're already fine. If we ever migrate off Vercel to a static-only host (Cloudflare Pages, GitHub Pages), Keystatic's admin breaks; we'd flip to Sveltia.
2. **Keystatic Cloud Images is *not* a configurable R2 adapter.** It's Thinkmill's CDN. To get images on *our* R2 bucket, use the §5 GitHub Action.
3. **Sveltia editorial workflow / branch-per-entry is not implemented** (deferred to v2.0, late 2026). Our manual `cms` → `main` merge is the substitute.
4. **Sveltia is a one-person project.** Yoshino has shipped weekly through 2025–2026 and v1.0 is imminent, but bus factor is real. Mitigations: MIT, config is Decap-compatible, fallback to Decap is a script-tag swap.
5. **Keystatic `fields.conditional` writes a `discriminant` key into YAML.** Reader needs a normalizer (see §6.2). A clean union without the discriminator requires a custom widget — not worth it.
6. **`fields.mdx` writes `.mdx`; `fields.markdoc` writes `.mdoc`. Plain `.md` is not produced.** Migration is a `git mv` (plain Markdown is valid MDX).
7. **Don't enable `format.contentField` if you have multiple body fields** in Keystatic — it permits only one contentField per entry, and using it kills the multi-locale-body pattern.
8. **Sveltia's `omit_default_locale_from_filename` works only with `multiple_files`**, not `multiple_folders`. Cosmetic, but worth knowing.
9. **Front Matter CMS, Outstatic, TinaCMS-OSS:** ruled out (VS Code extension dev-targeted, schema too narrow, paid prod tier respectively).
10. **Decap is not dead** (Plate-based richtext widget shipped April 2026) but Sveltia strictly dominates it on every axis we care about.

---

## 11. Corrections log — what cross-check changed

Cross-checked against `archive/CMS_RESEARCH_OPUS.md` and `archive/CMS_RESEARCH_GEMINI.md`. The following claims in earlier drafts of this doc were wrong and have been fixed:

| Earlier (wrong) claim | Corrected (this version) |
|---|---|
| "Sveltia natively supports our `body.{ru,en,de}.md` shape." | None of Sveltia's three i18n structures produces shared YAML + body siblings. Closest is `index.<locale>.md` with triplicated frontmatter. |
| "Keystatic body files via sibling singletons" (Option B in original §6.1). | The actual idiom (Discussion #361) is multiple peer document fields in one collection, producing `bodyRu.mdx` etc. — not singletons. |
| "Keystatic supports plain `.md` body files." | `fields.mdx` writes `.mdx`, `fields.markdoc` writes `.mdoc`. One-shot rename required. |
| "Auth via GitHub OAuth — repo collaborators only." | Adds **Keystatic Cloud** as a third auth option (free ≤ 3 users, magic-link, Roman skips GitHub entirely). |
| "Mobile-friendly UX ✅" for Keystatic. | Keystatic is desktop-first; **Sveltia is the mobile-friendly one**. Phone-first editing flips the recommendation. |
| "Pages CMS is a soft fail on C9." | **Pages CMS is a hard fail** — no i18n, period (issue #221, no implementation). Strike from candidate list. |
| "Decap (stale)" in rejection. | Decap is slow but not stale (richtext widget shipped April 2026). Still rejected — Sveltia dominates. |
| Static export (`output: 'export'`) constraint not addressed. | Confirmed not in use; called out as a future-direction footgun (#1). |
| "We can extend `upload-images.ts`" only. | Added §5b — `aws s3 sync --delete` replaces the script entirely. |
