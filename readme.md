# boklanov.ru / boklanov.com

98/98 SSG pages. Lighthouse mobile ≥95. Zero §11 anti-patterns.

## Layout

```
app/[locale]/             RU default (no prefix), /en, /de
  page.tsx                Home
  productions/{page,[slug]/page}.tsx
  about/ awards/ press/ contact/ archive/
  api/og/[slug]/          Per-production OG (1200x630)
  feed/route.ts           RSS RU+EN
  sitemap.ts robots.ts

components/               ProductionCard, SiteHeader, SiteFooter,
                          CommandPalette, ThemeToggle, FilteredProductionsPanel, Cue, ...

content/
  productions/<slug>/
    index.yaml                     data fields (hand-edited as plain YAML)
    body.{ru,en,de}.md             long-form prose, one file per locale
  about/{ru,en,de}.{yaml,md}       data + prose split per locale
  AUTHORING.ru.md                  Roman's day-to-day RU guide
  _PRODUCTION_TEMPLATE.yaml        starter template for new productions

lib/
  content.ts              getAllProductions, getProduction, getRelated
  search.ts               buildSearchIndex
  cdn.ts                  cdnUrl(path) helper
  i18n/

messages/{ru,en,de}.json  ~80 keys per locale

scripts/
  upload-images.ts            S3-compatible R2 upload (`npm run upload-images`)
  lint-content.ts             CI guard against ![[wikilink]] (`npm run lint-content`)
  lint-tokens.ts              CI guard against scoped-token leak (`npm run lint-tokens`)
  translate-content.ts        fill missing ru/en/de fields in content/ (`npm run translate-content`)
  migrate_mdx_to_yaml.py      one-shot mdx→yaml split (2026-05-04)
  _legacy/                    sync-from-notion, fold-overlay, migrate-body-to-frontmatter — FROZEN

public/
  fonts/                  Lora + Inter + JetBrains Mono woff2 subsetted
  productions/<slug>/     poster + gallery (until R2 activates)

.obsidian/                Vault config: app, community-plugins
```

## Dev

```bash
npm install                # Node ≥ 22, npm ≥ 10
npm run dev                # http://localhost:3000
npm run build && npm start
npm test                   # runs lint + typecheck
npm run lint-content       # block ![[wikilink]] in content/**/*.md
npm run lint-tokens        # block scoped CSS tokens leaking outside owning module
npm run upload-images      # S3 upload to R2 (post-DNS-cutover)
```

`npm run sync` is retired (echoes stub). Content edits flow through Obsidian.

## Editing content

Single source of truth per production: `content/productions/<slug>/index.yaml` (data) + `body.{ru,en,de}.md` (prose).
Edit YAML as plain text; edit `.md` in Obsidian. Commit-and-push from obsidian-git sidebar -> Vercel rebuilds.

Full workflow: `.design/boklanov-rewrite/CONTENT.md`. Roman-facing RU walkthrough: `content/AUTHORING.ru.md`.

## Translating content

Fill missing `en` / `de` (and rarely `ru`) fields across `content/productions/*/index.yaml`,
`body.{ru,en,de}.md`, and `content/about/*` from whichever locale already exists. Source priority
`ru → en → de`. Fill-only by default — never overwrites existing prose. Skips `awards`, `festivals`,
`externalLinks`, proper names, urls, enums.

```bash
set -a && source .env && set +a   # load API key

npm run translate-content -- --report                      # gap inventory; no API calls
npm run translate-content -- --dry-run --slug going-in-twos
npm run translate-content                                  # full run, fill-only
npm run translate-content -- --target de --only fields     # narrow scope
npm run translate-content -- --budget 2 --limit 10         # cost cap
npm run translate-content -- --force --slug aiaccio        # overwrite existing prose
```

Provider auto-detected by env key: `ANTHROPIC_API_KEY` (Anthropic) > `CEREBRAS_API_KEY` >
`OPENROUTER_API_KEY` > `GEMINI_API_KEY`. Override with `--provider <name>`. Cache at
`.cache/translate/` (gitignored). After run: `git diff content/` and commit. Spec:
`.design/boklanov-rewrite/TRANSLATE_PLAN.md`.

## Deploy

Vercel project `octrows-projects/boklanov`. `main` auto-deploys.
D3/D4: DNS at Spaceship.com -> add A `@ -> 76.76.21.21` + CNAME `www -> cname.vercel-dns.com` TTL 300. Vercel:
Settings -> Domains -> add `boklanov.com` + `www.boklanov.com`.
R2 CDN deferred until `boklanov.com` moves to Cloudflare DNS.

## Docs

**Cold-read order:** this README -> `.design/boklanov-rewrite/MAP.md` -> the doc you need.
**Start a new conversation:** paste the prompt at `MAP.md` §8 (continue-work).
**After shipping:** paste the prompt at `MAP.md` §7 (post-implementation update).

| Doc                                   | Role                                                |
|---------------------------------------|-----------------------------------------------------|
| `.design/boklanov-rewrite/MAP.md`     | Index of all docs + cascade rules                   |
| `.design/boklanov-rewrite/STATUS.md`  | Phase status, open tasks, next actions, constraints |
| `.design/boklanov-rewrite/CONTENT.md` | Authoring workflow + content file shape             |
| `DESIGN.md`                           | Visual identity + IA + tokens + anti-patterns       |
| `content/AUTHORING.ru.md`             | Roman's RU day-to-day                               |

Frozen history: `.design/boklanov-rewrite/archive/` (D1-D15 brief, R1+R2 review, Phase 7.5 ambition, 9-option content
matrix, full IA, token rationale, photo audit, origin PLAN, HANDOFF + TASKS commit ledgers). Each doc has a
`*_compress.md` - read that first.

## License

Site code: MIT. Photos, posters, bio: property of Roman Boklanov + credited photographers; do not redistribute.
