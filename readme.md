# boklanov.ru / boklanov.com

Director portfolio. Next.js 15 App Router, React 19, Node 22. SSG. Lighthouse 4×100 prod (`100/100/100/100`,
2026-05-04).

Live: `boklanov.vercel.app`. Apex `boklanov.com` cutover deferred.

## Stack

- `next@15` App Router, `react@19`
- `next-intl@4` — RU default (no prefix), `/en`, `/de`
- `@keystatic/core` + `@keystatic/next` — admin at `/keystatic`; cloud in prod, local in dev (gated by `NODE_ENV`, never
  custom env)
- `@vercel/og` `satori` — per-production OG `1200x630`
- `sharp` — LQIP inline in frontmatter
- `posthog-js`, `@vercel/analytics`, `@vercel/speed-insights`, `fathom-client`
- `@aws-sdk/client-s3` — Cloudflare R2 upload
- Self-hosted fonts: Lora-VF, Inter, JetBrains Mono, Unbounded-VF (v3). No Google CDN.

## Layout

```
app/
  [locale]/{page,layout}.tsx
  [locale]/{about,archive,awards,contact,press,productions}/
  [locale]/productions/[slug]/page.tsx
  [locale]/feed/route.ts            RSS RU+EN
  api/og/[slug]/route.tsx           per-production OG
  api/keystatic/[[...params]]/      Keystatic API
  api/keystatic-asset/route.ts      multipart image upload (dev only; 403 in prod)
  keystatic/                        admin UI mount, ImagePathPreview, KeystaticEnhancements
  sitemap.ts robots.ts globals.css
components/                         53 .tsx + .module.css. See DESIGN.md §7.
content/
  productions/<slug>/index.yaml     data (single source of truth per field)
  productions/<slug>/body.{ru,en,de}.md
  about/{ru,en,de}.{yaml,md}
  _PRODUCTION_TEMPLATE.yaml
  AUTHORING.ru.md                   Roman-facing RU
i18n/{routing,navigation,request}.ts
lib/                                content.ts, search.ts, cdn.ts, folio.ts, section-accent.ts
messages/{ru,en,de}.json            ~80 keys; RU+EN required, DE chrome-only
middleware.ts                       next-intl; matcher excludes api|_next|_vercel|fonts|keystatic
keystatic.config.ts
scripts/                            tsx + .py
public/{fonts,productions/<slug>/}
```

## Dev

Node 22.x. npm 10+.

```bash
npm install
npm run dev                                 # http://localhost:3000
npm run build && npm start
npm test                                    # lint + prettier (parallel)
npm run lint-content                        # block ![[wikilink]] in content/**/*.md
npm run lint-tokens                         # block --specimen-rule scope leak outside SpecimenPlate.module.css
npm run audit-keystatic                     # diff keystatic.config.ts vs lib/content.ts
npm run analyze                             # ANALYZE=true next build
```

`npm run sync` retired (stub).

## Content

Edit `content/productions/<slug>/index.yaml` as plain YAML. Edit `body.{ru,en,de}.md` as plain markdown. Keystatic at
`/keystatic` writes the same files. Commit + push → Vercel rebuilds `main`.

New production: copy `content/_PRODUCTION_TEMPLATE.yaml` → `content/productions/<slug>/index.yaml`. Latin slug, dashes.
Create `body.ru.md` + `body.en.md` (DE optional).

Frontmatter shape, null-field contract for TourRider, R2 deferral: `.design/boklanov-rewrite/CONTENT.md`. Roman
walkthrough: `content/AUTHORING.ru.md`.

Featured strip: set `featured: true`. Cards without poster filtered. Override poster on grid via `productionsPhoto.src`;
on home strip via `featuredPhoto.src` (chain: featured → productions → poster → typographic).

Production-card text RU/EN regardless of locale (D4). DE chrome only until ≥5 productions have real DE copy. `hreflang`
RU↔EN only; DE in sitemap without alternates.

## Images

`public/productions/<slug>/` = canonical mirror (committed). R2 bucket `boklanov-content` = production CDN. 291 files
uploaded 2026-05-02.

```bash
npm run upload-images -- --slug <slug>      # S3 upload, skip-unchanged-by-size
npm run upload-images -- --dry-run
npm run backup-r2-to-git                    # mirror R2 → public/ (CI on content/** push + daily cron)
```

`lib/cdn.ts` `cdnUrl()` resolves via `NEXT_PUBLIC_CDN_BASE`. Unset = serve from `public/` via Vercel. Set to
`cdn.boklanov.com` post-DNS-cutover.

R2 dev URL (rate-limited): `https://pub-eaffa56b38f2484cb3a48ab54ac582b0.r2.dev`. `cdn.boklanov.com` blocked until apex
DNS moves to Cloudflare.

Keystatic image upload: `/api/keystatic-asset` POST multipart `file` + `directory` writes
`public/<directory>/<filename>` (dev only, 403 prod). Path validation rejects traversal, overwrite, non-image, >25 MB.
`app/keystatic/ImagePathPreview.tsx` injects 240×180 preview thumbnails + per-row 48×36 thumbs into Keystatic admin via
`MutationObserver`.

## Translate

Fill missing `en`/`de`/`ru` fields across `content/productions/*/index.yaml`, `body.{ru,en,de}.md`, `content/about/*`.
Source priority `ru → en → de`. Fill-only by default — never overwrites existing prose. Translates every `L10nString`
field including `awards`, `festivals`, `externalLinks`, `theatre.name`, `runs[]`, `press[].title`. Verbatim-only:
scalars, URLs, slugs, ISO codes, enums (`form`, `lineage`, `role`, `ageRating`, `tags`), asset paths, `credits[].name`.

```bash
set -a && source .env && set +a
npm run translate-content -- --report                      # gap inventory; no API calls
npm run translate-content -- --dry-run --slug <slug>
npm run translate-content                                  # full run, fill-only
npm run translate-content -- --target de --only fields
npm run translate-content -- --budget 2 --limit 10
npm run translate-content -- --force --slug <slug>         # overwrite
```

Provider auto-detected by env: `ANTHROPIC_API_KEY` > `CEREBRAS_API_KEY` > `OPENROUTER_API_KEY` > `GEMINI_API_KEY`.
Override `--provider <name>`. Cache `.cache/translate/` (gitignored). Spec:
`.design/boklanov-rewrite/TRANSLATE_PLAN.md`.

## Theme

Two themes via `[data-theme]` on `<html>`. `gorky` default (dark, near-black `#080706`). `paper` opt-in (warm off-white
`#F2F0EA`). Anti-flash inline script in `app/[locale]/layout.tsx`. Legacy `theme=dark` → `gorky`, `theme=light` →
`paper`. Storage key `boklanov.theme`.

Tokens: `app/globals.css`. Source of truth: `DESIGN.md` §3–6.

## Deploy

Vercel project `octrows-projects/boklanov`. `main` auto-deploys.

`git push origin main` blocked by safety hook — ask user to push.

D3/D4 apex cutover (deferred): DNS at Spaceship — A `@ → 76.76.21.21`, CNAME `www → cname.vercel-dns.com`, TTL 300.
Vercel → Settings → Domains → add `boklanov.com` + `www.boklanov.com`. R2 CDN activates after apex moves to Cloudflare
DNS.

Branch `design_v3` (Plakat refresh) lives parallel to `main`. 9 §11 unfreezes, Bauhaus trio palette (vermillion /
cobalt / mustard), Unbounded ALL CAPS hero. Acceptance gates pending. Rollback: `git checkout main`.

## Design review

`.design/review/<YYYY-MM-DD>-<slug>/REPORT.md` + screenshots. Calibrated prompt: `.design/review/PROMPT.md`. Sweep
covers home, productions, production-detail, about, contact, archive at 1440 + 390. Path A: in-CLI Chrome MCP. Path B:
GoFullPage + claude.ai. Workflow: `.design/review/WORKFLOW.md`.

## Constraints (hard)

- Birthday surprise: no Roman reveal until apex cutover.
- Past-tense `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`. No present-tense Russia work. Year-only colophon.
- Production-card text RU/EN regardless of locale. DE chrome only.
- Sticky booking CTA = mailto. No forms, no CAPTCHA.
- Awards/press original-language only.
- Analytics: only `booking_cta_click`. Never expand autocapture.
- `DESIGN.md` §11 anti-patterns absolute.
- Wikilinks `![[...]]` blocked in `content/**/*.md` by `lint-content`.
- `--specimen-rule` scoped to `SpecimenPlate.module.css` only — `lint-tokens` enforces.

## Docs

Cold-read order: `readme.md` → `.design/boklanov-rewrite/MAP.md` → target doc.

| Doc                                                        | Role                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `.design/boklanov-rewrite/MAP.md`                          | Index + cascade rules + continue-work + post-implementation prompts |
| `.design/boklanov-rewrite/STATUS.md`                       | Phase status, open tasks, commit hashes, next actions               |
| `.design/boklanov-rewrite/CONTENT.md`                      | Authoring + frontmatter shape + TourRider null-field contract       |
| `.design/boklanov-rewrite/DESIGN_v2_PROPOSAL.md`           | Vitrine direction (shipped to `main`)                               |
| `.design/boklanov-rewrite/DESIGN_v3_PROPOSAL.md`           | Plakat direction (`design_v3`)                                      |
| `.design/boklanov-rewrite/FEATURED_STRIP_GRID_RESEARCH.md` | §2.4 broken-grid root-cause + options                               |
| `.design/boklanov-rewrite/KEYSTATIC_R2_ONLY_PLAN.md`       | Shipped 2026-05-06 — one-commit-per-save migration                  |
| `.design/boklanov-rewrite/LIGHTHOUSE_IMPROVEMENT_PLAN.md`  | 4×100 plan + per-fix detail                                         |
| `.design/boklanov-rewrite/TRANSLATE_PLAN.md`               | translate-content spec                                              |
| `DESIGN.md`                                                | Visual identity + IA + tokens + anti-patterns                       |
| `content/AUTHORING.ru.md`                                  | Roman RU day-to-day                                                 |
| `docs/r2-operations.md`                                    | R2 ops                                                              |

`.design/boklanov-rewrite/archive/` = read-only history. Read `*_compress.md` first; open full only if detail missing.
Edit only on `MAP.md` §5 unfreeze events.

## License

Code: MIT. Photos, posters, bio: property of Roman Boklanov + credited photographers. Do not redistribute.
