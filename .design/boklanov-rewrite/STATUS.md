# STATUS

Current state + open work. Updated: 2026-05-02 (session 6).

Owns: phase status, open tasks, commit hashes, next actions.
Update: every shipped task. Status flows here -> nowhere (terminal).

## Constraints

- Birthday surprise: no reveal to Roman until the site goes live on its production domain. Original 2026-05-06 deadline lapsed; D3/D4 deferred (see below).
- Roman has no troupe. Not in Russia since 2022 mobilisation. Past-tense `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`.
  Year-only colophon. No present-tense Russia work.
- `git push origin main` blocked by safety hook. Always ask user to push.
- I5 signature gesture cut formally. DA-3.A slate-strike + DA-3.C edition-frame fallback shipped instead.
- Production-card text stays RU/EN regardless of locale. DE chrome only.
- `hreflang` RU<->EN only. DE excluded.
- Awards/press original-language only.
- Sticky booking CTA stays mailto.
- Analytics: only `booking_cta_click`. Never expand autocapture.
- §11 anti-patterns: see `DESIGN.md` §11.

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
| 8 Authoring handoff             | in progress  | 8.1 `11bef4d` Obsidian config. 8.2 `8339141` R2 code. 8.3-8.5 `c1c4436` overlay folded + `AUTHORING.ru.md` + orphan audit. R2 CDN blocked on Cloudflare DNS. |
| 9 v2 visual refresh (Vitrine)   | in progress  | See `DESIGN_v2_PROPOSAL.md` + Phase-9 sub-table below. 7 of 8 code phases done (9.0a/b/c, 9.1, 9.2, 9.3, 9.5, 9.6, 9.7, 9.8). 9.4 Marginalia louder deferred — needs detail-page layout restructure. |
| 10 Decap CMS layer              | deferred     | Activates on Roman demand. Locks: `editorial_workflow:false`, `backend.branch:draft`. ~2 days.                                                               |

## D3/D4 cutover (deferred)

Not a current blocker. Site stays at `boklanov.vercel.app` until activated.

When ready:

- Domain: `boklanov.com` canonical + `www.boklanov.com` 301. Old Notion site at boklanov.com — OK to overwrite.
- DNS at Spaceship.com: A `@` -> `76.76.21.21`, CNAME `www` -> `cname.vercel-dns.com`, TTL 300.
- Vercel: Settings -> Domains -> add `boklanov.com` + `www.boklanov.com`.

R2 CDN note: `cdn.boklanov.com` cannot connect to R2 until boklanov.com moves to Cloudflare DNS. R2 activation deferred with the cutover. `NEXT_PUBLIC_CDN_BASE` unset -> images serve from `public/` via Vercel.

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

`main` branch: clean. Last: `2bdd855` — STATUS hash backfill for Phase 9.8.

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
| §7 #1 | Stylelint scope rule for `--specimen-rule` | done (npm script) | this commit — `npm run lint-tokens` |
| §7 #1b | Playwright visual regression for non-photo card box-shadow | not implemented | no Playwright setup; lint-tokens covers static guard |
| CONTENT.md | TourRider null-field contract documented | done | this commit |

## Recent commits

```
(this commit) chore: lint-tokens scope guard + CONTENT.md TourRider contract + STATUS update
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

1. Daniil pushes remaining commits to `boklanov.vercel.app`; visual review of v2 across home / production grid / production detail / about. Acceptance gate is paper colour: `--paper #F2F0EA` must read as paper, not cream — if cream, `git revert 5558e16`.
2. Marginalia float-into-margin layout (proposal §4.3 ≥1024px float) — only outstanding v2 item. Needs production-detail restructure to coexist with TourRider right-rail. Separate session when prioritised.
3. Roman onboarding: install Obsidian + obsidian-git + mdx-as-md plugins. Walk through `content/AUTHORING.ru.md`.
4. Roman closes orphan-title audit + photographer credits.
5. D3/D4 cutover when reactivated.
