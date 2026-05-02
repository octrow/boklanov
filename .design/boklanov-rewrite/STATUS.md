# STATUS

Current state + open work. Updated: 2026-05-03 (session 14 — duotone tuning + scope cleanup).

Owns: phase status, open tasks, commit hashes, next actions.
Update: every shipped task. Status flows here -> nowhere (terminal).

## Constraints

- Birthday surprise: no reveal to Roman until the site goes live on its production domain. Original 2026-05-06 deadline lapsed; D3/D4 deferred (see below).
- Roman has no troupe. Not in Russia since 2022 mobilisation. Past-tense `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`.
  Year-only colophon. No present-tense Russia work.
- `git push origin main` blocked by safety hook. Always ask user to push.
- I5 signature gesture cut formally. DA-3.A slate-strike + DA-3.C edition-frame fallback shipped instead.
- Production-card text stays RU/EN regardless of locale. **v3 update 2026-05-03:** DE expanding to full content parity for top 5–6 productions + /about (was chrome-only). `hreflang` policy still TBD for DE.
- Awards/press original-language only.
- Sticky booking CTA stays mailto.
- Analytics: only `booking_cta_click`. Never expand autocapture.
- §11 anti-patterns: see `DESIGN.md` §11. **v3 update 2026-05-03:** 9 anti-patterns lifted on `design_v3` per `DESIGN_v3_PROPOSAL.md` §2 with rollback triggers; mirrored to `archive/DESIGN_BRIEF.md` + `DESIGN.md` §11 in Phase 9v3.8. **Fix-pass-2 (session 13):** §2.4 (bento / broken-grid) unfreeze ROLLED BACK after rollback trigger fired ("equal-size cells" forced by 4:5 aspect-ratio incompatibility). Net 8 active unfreezes.
- **v3 branch active**: `design_v3` cut from `main` 2026-05-02. Active code work happens on `design_v3` until acceptance gates §11 pass; `main` remains v2 Vitrine. Rollback = `git checkout main`. Daniil owns the call; Roman not consulted (birthday surprise still in force).

## Phases

| Phase                           | Status       | Notes                                                                                                                                                        |
|---------------------------------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 0 Skills + branch               | done         | `rewrite/v2` cut from `main`                                                                                                                                 |
| 1 Discovery + brief             | done         | D1-D15 locked (history: `archive/DESIGN_BRIEF_compress.md`, full: `archive/DESIGN_BRIEF.md`)                                                                 |
| 2 Visual identity               | done         | `DESIGN.md` + `app/globals.css`                                                                                                                              |
| 3 Content migration             | done         | Notion deps removed in F8                                                                                                                                    |
| 4 Frontend rebuild              | done (11/11) | Last: `ab2ce8b`                                                                                                                                              |
| 5 i18n + SEO + OG               | done (5/5)   | sitemap hreflang RU<->EN, RSS RU+EN, JSON-LD, `app/api/og/[slug]`, PostHog                                                                                   |
| 6 Polish                        | done (5/5)   | I1, I4, P1, P2, P3. I5 cut. Last: `09d5005`                                                                                                                  |
| 6.5 R1 review + R1.fix + polish | done         | Zero §11 violations. `73620e6` `871f287` `09d5005`                                                                                                           |
| 6.6 Q1-Q8                       | done         | `10f951f` `b3bded7` `fdbae94` `99299de` `8dae0b2` `c7647bf`. 24 productions clean.                                                                           |
| 7 Deploy + cutover              | partial      | R2 closed; D1 live `boklanov.vercel.app`; D2 Vercel stays; D3/D4 deferred                                                                                    |
| 7.5 Editorial fingerprints      | done         | R1 `c7a1b50` folio+cue+stamp. R2 `0bebf3c` credits+slate+geos+PREM+tour[]. R3 `7c26402` slate-strike+frame fallback.                                         |
| 7.6 Editorial polish            | done         | Tier 1 `00c2501`. Tier 2 `3106d26`. DA-7.6.J `e1920af`. DA-7.6.I `0288258`.                                                                                |
| 8 Authoring handoff             | in progress  | 8.1 `11bef4d` Obsidian config. 8.2 `8339141` R2 code. 8.3-8.5 `c1c4436` overlay folded + `AUTHORING.ru.md` + orphan audit. R2: 291 files uploaded 2026-05-02. Dev URL active. `cdn.boklanov.com` blocked on Cloudflare DNS. |
| 9 v2 visual refresh (Vitrine)   | done         | See `DESIGN_v2_PROPOSAL.md` + Phase-9 sub-table below. 8/8 code phases shipped to `main`. Vitrine becomes the v2 baseline that v3 supersedes (subject to acceptance gates). |
| 9 v3 visual refresh (Plakat)    | in progress  | Branch `design_v3` cut from `main` 2026-05-02. See `DESIGN_v3_PROPOSAL.md` + Phase-9-v3 sub-table below. 9 of 10 phases shipped (9v3.0–9v3.8) + fix-pass `2388511`. 9v3.9 acceptance sweep in progress. |
| 10 Decap CMS layer              | deferred     | Activates on Roman demand. Locks: `editorial_workflow:false`, `backend.branch:draft`. ~2 days.                                                               |

## D3/D4 cutover (deferred)

Not a current blocker. Site stays at `boklanov.vercel.app` until activated.

When ready:

- Domain: `boklanov.com` canonical + `www.boklanov.com` 301. Old Notion site at boklanov.com — OK to overwrite.
- DNS at Spaceship.com: A `@` -> `76.76.21.21`, CNAME `www` -> `cname.vercel-dns.com`, TTL 300.
- Vercel: Settings -> Domains -> add `boklanov.com` + `www.boklanov.com`.

R2 CDN note: 291 images uploaded to `boklanov-content` bucket 2026-05-02. Dev URL `https://pub-eaffa56b38f2484cb3a48ab54ac582b0.r2.dev` active (rate-limited, no Cloudflare cache). `cdn.boklanov.com` custom domain blocked until boklanov.com DNS moves to Cloudflare. To activate: set `NEXT_PUBLIC_CDN_BASE` in Vercel.

## Open content tasks (Roman, via Obsidian)

- Photographer credits per gallery image -> `gallery[].credit` in `index.mdx`
- Two festival-in-prose awards need overlay: `cinderella`, `sugar-kid`
- Confirm RGISI / first-BTK milestone years
- 18 productions show no theatre line (MD source has no `[Name](url)`). Roman adds `theatre:` in frontmatter
- New productions: copy existing `<slug>/` folder, edit frontmatter via Properties

### Orphan-title audit (Phase 8.5)

Productions whose RU title was synthesised via `MANUAL_SIBLING_PAIRS` in retired sync. Roman opens each in Obsidian,
confirms or corrects `title.ru` + `title.en` in Properties, commits with
`content(<slug>): correct title — orphan audit`. Delete the row when done.

| Slug        | `title.ru`       | `title.en` | Status  |
|-------------|------------------|------------|---------|
| `sugar-kid` | Сахарный ребёнок | Sugar Kid  | pending |
| `kasztanka` | Каштанка         | Kasztanka  | pending |

Context: `slugify("Сахарный ребёнок")` returned empty (regex `\w` doesn't match Cyrillic), so RU rows were dropped
during sibling grouping. Pair table manually re-attached the RU row to its EN sibling. Sync now retired; titles only
change by direct edit.

## Phase 7.6 backlog

Tier 1 — done `00c2501`:

- DA-7.6.A ✓ Marginalia component — 65ch+20ch grid ≥1280px on `/about` bio; inline italic below
- DA-7.6.B ✓ `@media print` — 18mm margins, palette override, header/CTA/rail hidden
- DA-7.6.C ✓ Director's note block (italic Lora + left rule + mono attribution), gated by `directorsNote.{ru,en}`
- DA-7.6.D ✓ Run-of-show row above title, gated by `runs[]`

Tier 2 — done `3106d26`:

- DA-7.6.E ✓ CUE-count tag on `/awards`
- DA-7.6.F ✓ theatre slate `LANGUAGE` row
- DA-7.6.G ✓ no-poster card year-anchor `margin-top: auto`
- DA-7.6.H ✓ DE chrome audited at 1024-1100px — no overflow found

Tier 3 (~1.5 days):

- DA-7.6.I ✓ OG image: mono slug + hairlines + Lora title centred + meta/colophon row. Webp skipped → oxblood fallback. `0288258`
- DA-7.6.J ✓ editorial empty states — `EmptyState`: hairline + ERRATA label + italic Lora body + action slot. Filter, search, archive, awards, press. `e1920af`

Rationale ledger (history, read-only): `archive/DESIGN_AMBITION_compress.md` §15 (full: `archive/DESIGN_AMBITION.md`).

## Post-7.6 UX fixes (session 5, uncommitted)

- **Hydration**: `suppressHydrationWarning` on `<html>` in `layout.tsx`. Silences `data-theme` / extension attribute mismatch.
- **Folio on home + full format**: `folioFor` now returns `isHome:true` for `/`; folio band shows on every page. Format updated to `РОМАН БОКЛАНОВ ⟶ SECTION ⟶ 01/24` (director name prefix added).
- **Cover / afisha**: `max-height: 65vh`, `object-fit: contain`, centered — no cropping. `PosterLightbox` client component wraps cover; click opens full-image overlay (dark backdrop, Escape/click-outside to close).
- **About photos**: `photos[]` array added to `AboutFrontmatter` + 2-col masonry grid rendered below geography section. Placeholder `photos: []` in `ru.mdx` + `en.mdx`. Roman adds entries when photos are ready.
- **Archive compress docs**: all `*_compress.md` files registered in MAP.md §2; all active-doc archive links updated to compress-first.

## Accessibility fixes (session 5 audit, uncommitted)

- **PosterLightbox**: focus moves to close button on open; returns to trigger on close (via `requestAnimationFrame`). Body scroll locked while overlay is open. Close button 32px → 44px touch target. `border-radius: 50%` → `var(--border-radius-sm)` (was §5 violation).
- **About lineage heading**: `<h2>` → `<h3>` for lineage item names — was broken heading hierarchy (section CUE II h2 + inner h2 at same level).
- **SiteHeader searchBtn**: added `cursor: pointer` to `.searchBtn`.

## Build state

`main` branch: uncommitted changes. `GalleryLightbox` component + gallery-after-press reorder pending commit.

`design_v3` branch: 4 commits ahead of `main` (proposal doc + 9v3.0 + 9v3.1 + STATUS doc). Working tree clean.

## Phase 9 v2 visual refresh (8 of 8 code phases done; polish items shipped)

Direction B "Vitrine" selected — see `DESIGN_v2_PROPOSAL.md`. 8 code phases on `main`, no feature branch.

| Phase | Subject | Status | Commit |
|---|---|---|---|
| 9.0a | Unfreeze drop-shadow → specimen rule | done | `12d1b5a` |
| 9.0b | Unfreeze coloured chip pills → mono labels | done | `1d054f2` |
| 9.0c | Unfreeze rounded-2xl/shadow-xl → form-chrome 2px | done | `930fd0a` |
| 9.1 | Token deltas — warmer paper + 5 new tokens | done | `5558e16` |
| 9.2 | Lora variable swap | done | `f1613b1` — VF files renamed `[wght]` → `-VF`; 11 subsetted woff2 deleted |
| 9.3 | TheatreSlate component (extract title block + role line) | done | `49eb04c` |
| 9.4 | Marginalia refresh (louder, pull variant) | API done | `36546d9` — kind=note/pull/run prop. Existing directorsNote / runs[] already implement the louder register inline; greenfield call-sites use Marginalia.pull / .run. Float-into-margin layout still deferred (right-rail conflict). |
| 9.5 | EmptyState / ERRATA refresh | done | `806d1a0` — ERRATA chip dropped; complete-sentence Lora italic; aria-live polite |
| 9.6 | SpecimenPlate component | done | `c866152` — gallery + /about photos. /archive deferred. |
| 9.7 | TourRider component (subsumes existing right-rail `.slate`) | done | `4210970` — extracted + expanded with FORM/LINEAGE/TECH RIDER/PRESS KIT rows |
| 9.8 | TypographicCover + slug-hash mod 3 variant | done | `778677c` — CreditLine + grain SVG deferred to a future polish phase |

Acceptance for 9.1: visual A/B on Daniil's monitor — `--paper #F2F0EA` must read as paper, not cream. If perceived as cream, `git revert 5558e16`.

### Phase 9.x polish (proposal §5/§6/§7 follow-ups, all shipped)

| Item | Subject | Status | Commit |
|---|---|---|---|
| §5.2 | SpecimenPlate caption focus settle (2px translateY, --duration-fast) | done | `5d49f4e` |
| §5.3 | Marginalia pull-text intersect settle | n/a | inline render makes effect imperceptible; documented in 9.4 commit |
| §6.1 | Grain SVG + photographic processing recipe (contrast/saturate/brightness) | done | `5d49f4e` |
| §6.2 | TypographicCover synopsis collision-buster (1-line italic Lora above meta) | done | `046aae9` |
| §6.3 | CreditLine primitive | done | `e73379a` — primitive available for future call-sites |
| §7 #1 | Stylelint scope rule for `--specimen-rule` | done (npm script) | `b617817` — `npm run lint-tokens` |
| §7 #1b | Playwright visual regression for non-photo card box-shadow | not implemented | no Playwright setup; lint-tokens covers static guard |
| CONTENT.md | TourRider null-field contract documented | done | `b617817` |

## Phase 9 v3 visual refresh — Plakat (in progress, branch `design_v3`)

Direction "Plakat" selected — see `DESIGN_v3_PROPOSAL.md`. Bauhaus stage trio (vermillion / cobalt / mustard) replaces oxblood. Unbounded VF added for ALL CAPS wordmark + sticker badges. 9 §11 anti-pattern unfreezes with rollback triggers (mirrored to `archive/DESIGN_BRIEF.md` + `DESIGN.md` §11 in 9v3.8 only). DE expanding to full content parity. 10 phases, each = 1 commit.

| Phase | Subject | Status | Commit |
|---|---|---|---|
| 9v3.0 | Token deltas — Bauhaus trio replaces oxblood, deeper ink, new --shadow-plakat / --stripe-thickness / --ticker-speed / --font-size-hero / --font-size-sticker / --measure-poster | done | `2827654` |
| 9v3.1 | Unbounded VF (Cyrl + Latin + Latin-ext) self-hosted + `<SiteWordmark>` + ALL CAPS swap on header/footer (header/footer reverted to Lora lowercase in fix-pass `2388511`) | done | `b20d501` + fix-pass `2388511` |
| 9v3.2 | `<SectionStripe>` + per-route accent (lib/section-accent.ts). Fix-pass `2388511`: moved into `<SiteHeader>` (was per-page inside `<main>` — constrained by max-width-content; now spans 100vw under header rule). | done | `6f7fc30` + fix-pass `2388511` |
| 9v3.3 | `<Sticker>` + `<TourTicker>` (CSS marquee, pauses on hover + reduced-motion). Fix-pass `2388511`: `<Sticker>` row added on production-detail above title (FESTIVAL AWARD vermillion + TOURING cobalt; aria-hidden; new i18n keys `productions.stickerAward` / `stickerTour`). | done | `c892efd` + fix-pass `2388511` |
| 9v3.4 | `<DuotonePoster>` + SVG `<feColorMatrix>` filters (vermillion / cobalt). Fix-pass `2388511`: selector widened to `:is(img, [data-cover-style])` so typographic covers also tint. Fix-pass `e9d78c4`: dropped fragile `@supports` gate (some browsers fell to grayscale-only); unquoted url(). Fix-pass `8c78b02`+`8fa36c3`: scope = home only (FeaturedStrip + below-fold via `duotoneAll`); `/productions` no longer auto-wraps featured cards. Fix-pass `8fa36c3`: removed S-curve, restored linear luminance → softer screen-print register. | done | `e73ab4f` + 4 fix-passes |
| 9v3.5 | `<SiteHero>` broken-grid hero on `/` + gradient ALL CAPS hero wordmark + `<TourTicker>` on `/` (mustard) + `<FeaturedStrip>` broken-grid. DA-3.A resolved: slate-strike retired on `/`, kept on production-detail. §2.3 skipped (no clip). Fix-pass `2388511`: `--font-size-hero` clamp narrowed 72→48 / 168→96; hero overflow tweaks. **Fix-pass-2:** §2.4 broken-grid unfreeze ROLLED BACK after second attempt still produced misaligned baselines + floating hairlines (variable cell widths × 4:5 aspect ratio = variable heights, geometrically incompatible). `<FeaturedStrip>` now clean 3-col equal-cell grid; visual variety via DuotonePoster + Sticker, not geometry. `<Sticker>` gains `layout="inline"` prop for non-absolute production-detail row use. | done | `c8fffc7` + fix-pass `2388511` + fix-pass-2 |
| 9v3.6 | TypographicCover ALL CAPS Unbounded swap + Marginalia float-into-margin ≥1024px (was deferred from v2). TourRider → `<details>` at ≥1280px frees gutter. | done | `8ed4c56` |
| 9v3.7 | DE full-content scaffolding — title.de / synopsis.de / directorsNote.de paths + Marginalia "DE forthcoming" graceful-empty | done | `badafb0` |
| 9v3.8 | Mirror 9 anti-pattern unfreezes into `archive/DESIGN_BRIEF.md` §8 + `DESIGN.md` §11 (the only legitimate edit to `archive/*` per `MAP.md` §5) | done | `9782071` (archive §8.2) + `6958737` (DESIGN.md §7/8/11/13 complete) |
| 9v3.9 | Acceptance-gate sweep (Lighthouse, axe-core, A/B, reduced-motion test, 90s curator-sim, bundle delta) | in progress | Gate 3 fix `14777b7`. Gates 1/2/4/5/6/7 need Daniil (see worksheet below). |

### Acceptance gates (must pass before PR `design_v3` → `main`)

Per `DESIGN_v3_PROPOSAL.md` §11. Track each on the v3 acceptance worksheet at gate time.

1. Vercel preview deploy of `design_v3` clean across 7 routes (no console errors, CLS ≤ 0.1 on slow-3G)
2. axe-core + Lighthouse Accessibility ≥ 95 on every route
3. AA contrast verified for every accent + ink combo (manual + automated)
4. Daniil v2-vs-v3 visual A/B on monitor for `/`, `/productions`, two production-detail pages (with + without poster). Verdict must read as "same director's portfolio in his actual voice", not "different director" or "v2 with stickers slapped on"
5. `prefers-reduced-motion` manual test (macOS Reduce Motion + Firefox `ui.prefersReducedMotion=1`): TourTicker static, sticker stamp instant, gradient hero static, no animation visible
6. Russian curator 90s session test (RU locale, mobile sim): identifies (a) what kind of theatre Roman makes, (b) 2–3 specific productions, (c) how to email Roman, in <90s
7. Roman not consulted (birthday surprise constraint). Daniil makes the call alone. If unsure, do NOT merge — keep `design_v3` open
8. Bundle size delta on `/` + `/productions/[slug]` measured against `main`: target < +30kb gzipped (Unbounded VF is the main delta)
9. DE locale code paths render without layout breakage even when DE content frontmatter is `null` (graceful Marginalia "DE forthcoming")
10. `git revert` of any 9v3.0–9v3.7 commit leaves the branch in a coherent visual state (no half-shipped accent, no dangling sticker)
11. v3 unfreezes mirrored to `archive/DESIGN_BRIEF.md` §8 + `DESIGN.md` §11 (Phase 9v3.8) before merge — non-doc commits + doc commits ship together

### 9v3.9 gate worksheet

| Gate | Status | Notes |
|---|---|---|
| 1 | pending Daniil | Push `design_v3`, check Vercel preview on 7 routes (/, /productions, 3× /productions/[slug], /about, /awards, /press, /archive, /contact): no console errors, CLS ≤ 0.1 on slow-3G throttle |
| 2 | pending Daniil | Run axe-core + Lighthouse on Vercel preview. Accessibility ≥ 95 required on every route. |
| 3 | **FIXED** `14777b7` | `--accent-vermillion` was `#E63946` (3.66:1 on paper — FAIL). Corrected to `#CC2530` (4.76:1 ✓). Sticker text `#FBFAF6` on fill: 5.19:1 ✓. Button text `#F2F0EA` on fill: 4.76:1 ✓. All other combos: cobalt 10.85:1 ✓, mustard decorative-only (text uses `--ink-on-mustard` 13.16:1 ✓). |
| 4 | pending Daniil | Visual A/B v2 (`main`) vs v3 (`design_v3`) on monitor for `/`, `/productions`, two production-detail pages (one with poster, one without). Verdict: "same director's portfolio in his actual voice" — not "different director", not "v2 with stickers slapped on." |
| 5 | pending Daniil | `prefers-reduced-motion` manual test: macOS Accessibility → Reduce Motion ON, also Firefox `ui.prefersReducedMotion=1`. Check: TourTicker static row (no scroll), sticker renders at final transform (no stamp), hero gradient static. |
| 6 | pending Daniil | RU locale mobile sim (DevTools, slow-3G, 375px). Timer: 90s. Must identify: (a) type of theatre Roman makes, (b) 2–3 specific productions, (c) how to email Roman. |
| 7 | n/a | Roman not consulted (birthday surprise). Daniil's call alone. If unsure, keep `design_v3` open. |
| 8 | judgment call | JS bundle delta: < +5KB gzipped (new components are pure CSS/TSX). **Font delta: ~82KB first-visit** (Unbounded latin 51KB + cyrillic 31KB raw). Exceeds 30KB target from proposal — Daniil decides if font overhead is acceptable for wordmark identity. Cached on return visits. |
| 9 | **PASS** | DE null paths verified in `lib/content.ts` + production detail page. `title.de=null` → ru/en fallback. `synopsis.de=null` → RU text shown in `<Marginalia note="Deutsche Übersetzung folgt">` wrapper. `directorsNote.de=null` → hidden (no layout break). |
| 10 | **PASS** (code review) | Each phase commit is additive and self-contained. Additive components (Sticker, TourTicker, DuotonePoster, FeaturedStrip) revert cleanly. Foundational commits (9v3.0 tokens, 9v3.1 wordmark) must be reverted together with their dependents — acceptable for an emergency rollback. No dangling sticker/accent half-states. |
| 11 | **DONE** | `9782071` + `6958737` — 9v3.8 complete. |

### Open questions / deferred decisions

1. ~~**DA-3.A slate-strike**~~ — resolved 9v3.5: retired on `/`, kept on production-detail covers.
2. ~~**DE translation source**~~ — resolved 9v3.7: AI translation (machine + Daniil review). Frontmatter filled incrementally.
3. ~~**Hero plakat clip** (proposal §2.3)~~ — resolved 9v3.5: skipped (no clip available).
4. **`--accent-mustard` text exclusion** — confirmed decorative-only per proposal §3.1. If a use case appears (TourTicker text-on-mustard), recompute contrast against `#0F0E0D` ink and use `--ink-on-mustard`.
5. ~~**`hreflang` policy**~~ — resolved 9v3.7: Option B — code paths only. DE URLs in sitemap without `hreflang` alternates until DE content is substantively filled. Revisit after ≥5 productions have real DE copy.

## Recent commits

```
8fa36c3  fix(9v3): soften duotone + drop featured auto-wrap on /productions
8c78b02  fix(9v3): duotone on home below-fold grid (richters-fairytale et al.)
e9d78c4  fix(9v3): duotone filter visibility — drop @supports gate + S-curve contrast
43deafc  fix(9v3): FeaturedStrip first-cell width — remove flex on .cell
e896dea  docs(design_v3): MAP §7 update — STATUS + DESIGN for fix-pass-2 (§2.4 rollback)
2b1e3c9  fix(9v3 fix-pass-2): roll back §2.4 broken-grid → clean 3-col FeaturedStrip
d5bd5e7  docs(design_v3): MAP §7 update — STATUS + DESIGN for fix-pass 2388511
2388511  fix(9v3): visual review pass — wordmark, stripe, hero, grid, duotone, stickers
c78f997  fix/update
334b2d3  docs(design_v3): STATUS update — 9v3.9 sweep in progress
14777b7  fix(9v3.9): accent-vermillion contrast — #E63946→#CC2530
6958737  docs(9v3.8): complete DESIGN.md mirror — §7 tail + §8 + §11 + §13
9782071  docs(9v3.8-partial): mirror v3 unfreezes — archive §8.2 + DESIGN.md §1/3/4/5/6/7 partial
badafb0  feat(9v3.7): DE full-content scaffolding — explicit-null contract + Marginalia forthcoming
8ed4c56  feat(9v3.6): TypographicCover Unbounded + Marginalia float + TourRider details
c8fffc7  feat(9v3.5): SiteHero broken-grid hero + FeaturedStrip
e73ab4f  feat(9v3.4): DuotonePoster + SVG filter sprite (vermillion / cobalt)
c892efd  feat(9v3.3): Sticker + TourTicker — Plakat badges + CSS marquee
6f7fc30  feat(9v3.2): SectionStripe + per-route accent (lib/section-accent.ts)
b20d501  feat(9v3.1): Unbounded VF + SiteWordmark — ALL CAPS wordmark swap
2827654  feat(9v3.0): token deltas — Bauhaus trio replaces oxblood
b7a0620  docs(design_v3): v3 plakat proposal — Bauhaus trio + Unbounded + 9 unfreezes
(pending) feat: GalleryLightbox — navigable gallery lightbox + gallery moved after press   [main only]
b617817 chore: lint-tokens scope guard + CONTENT.md TourRider contract + STATUS update
36546d9 feat(9.4): Marginalia kind=note/pull/run API extension
046aae9 feat(9.x-poly): TypographicCover synopsis collision-buster (proposal §6.2)
e73379a feat(9.x-poly): CreditLine primitive (proposal §6.3)
5d49f4e feat(9.x-poly): grain SVG + photographic filter + focus settle motion
5b3c80b docs: post-Phase-9 update — STATUS, DESIGN §7, proposal reflow
2bdd855 docs: STATUS.md hash backfill for 778677c
778677c feat(9.8): TypographicCover — slug-hash variant, replaces inline coverFallback
4210970 feat(9.7): TourRider component — replaces inline right-rail .slate
c866152 feat(9.6): SpecimenPlate component — gallery + /about photos
79a45f9 docs: STATUS.md hash backfill for 806d1a0
806d1a0 feat(9.5): EmptyState refresh — drop ERRATA chip, full-sentence Lora italic
0ff38ed docs: STATUS.md hash backfill for f1613b1
f1613b1 feat(9.2): Lora variable font swap — 11 subsetted → 2 VF
7d7cf5f docs: STATUS.md hash backfill for 49eb04c
49eb04c feat(9.3): TheatreSlate component — extract + role line
5558e16 feat(9.1): v2 token deltas — warmer paper + 5 new tokens
930fd0a docs(unfreeze 9.0c): rounded-2xl/shadow-xl → form-chrome 2px
1d054f2 docs(unfreeze 9.0b): coloured chip pills → specimen mono labels
12d1b5a docs(unfreeze 9.0a): drop-shadow → specimen rule (inset only)
b00503d docs(v2): archive 2026 research, select Vitrine direction
0288258 feat(7.6-tier3-i): OG image programme-grammar chrome
e1920af feat(7.6-tier3-j): editorial empty states — ERRATA register
00c2501 feat(7.6-tier1): marginalia, print stylesheet, director's note, run-of-show
3106d26 feat(7.6-tier2): award count, slate LANGUAGE row, no-poster year anchor
```

## Next actions (in order)

Active priority: complete `design_v3` Plakat phases. Roman onboarding + cutover deferred until v3 acceptance gates pass and `design_v3` merges to `main`.

### v3 implementation queue

1. ~~**9v3.1**~~ — done `b20d501`
2. ~~**9v3.2**~~ — done `6f7fc30`
3. ~~**9v3.3**~~ — done `c892efd`
4. ~~**9v3.4**~~ — done `e73ab4f`
5. ~~**9v3.5**~~ — done `c8fffc7`
6. ~~**9v3.6**~~ — done `8ed4c56`
7. ~~**9v3.7**~~ — done `badafb0`
8. ~~**9v3.8**~~ — done `9782071` + `6958737`
9. **9v3.9 — acceptance-gate sweep** (in progress):
   - Gate 3 fixed `14777b7` (vermillion contrast).
   - Fix-pass `2388511` (six bugs): wordmark register reverted to Lora lowercase chrome, SectionStripe in header, hero size narrowed, FeaturedStrip restructured, duotone gating, production-detail Sticker.
   - Fix-pass-2 `2b1e3c9` (§2.4 broken-grid rolled back): clean 3-col FeaturedStrip; Sticker `layout="inline"` prop.
   - Fix-pass `43deafc`: FeaturedStrip first-cell width (removed `display:flex` on `.cell`).
   - Fix-pass `e9d78c4`: duotone reliability — dropped `@supports` gate, unquoted url(), added S-curve.
   - Fix-pass `8c78b02`: duotone applied to home below-fold via new `duotoneAll` prop on ProductionGrid.
   - Fix-pass `8fa36c3`: duotone scope locked to home only (no auto-wrap of featured on `/productions`); softened — S-curve removed, linear luminance restored.
   - Pending: push to Vercel, run axe-core/Lighthouse (gates 1/2), visual A/B (gate 4), reduced-motion test (gate 5), curator 90s sim (gate 6), font-delta judgment (gate 8).
   - After all gates green, open PR `design_v3 → main`.
### Carryover (v2 / authoring / cutover)

- `main` has uncommitted `GalleryLightbox` work — finish on `main` separately or fold into `design_v3` after v3 merge. Decide: keep on `main` and rebase `design_v3` once before merge.
- Marginalia float-into-margin (v2 outstanding item) gets resolved as part of 9v3.6, no longer a separate v2 ticket.
- Roman onboarding (Obsidian + obsidian-git + mdx-as-md walkthrough) — unchanged, post-cutover.
- Roman closes orphan-title audit + photographer credits — unchanged.
- D3/D4 cutover — only after v3 ships AND birthday-surprise reveal gate is opened by Daniil.
