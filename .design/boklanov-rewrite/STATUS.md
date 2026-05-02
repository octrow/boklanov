# STATUS

Current state + open work. Updated: 2026-05-02 (session 4).

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
| 1 Discovery + brief             | done         | D1-D15 locked (history: `archive/DESIGN_BRIEF.md`)                                                                                                           |
| 2 Visual identity               | done         | `DESIGN.md` + `app/globals.css`                                                                                                                              |
| 3 Content migration             | done         | Notion deps removed in F8                                                                                                                                    |
| 4 Frontend rebuild              | done (11/11) | Last: `ab2ce8b`                                                                                                                                              |
| 5 i18n + SEO + OG               | done (5/5)   | sitemap hreflang RU<->EN, RSS RU+EN, JSON-LD, `app/api/og/[slug]`, PostHog                                                                                   |
| 6 Polish                        | done (5/5)   | I1, I4, P1, P2, P3. I5 cut. Last: `09d5005`                                                                                                                  |
| 6.5 R1 review + R1.fix + polish | done         | Zero §11 violations. `73620e6` `871f287` `09d5005`                                                                                                           |
| 6.6 Q1-Q8                       | done         | `10f951f` `b3bded7` `fdbae94` `99299de` `8dae0b2` `c7647bf`. 24 productions clean.                                                                           |
| 7 Deploy + cutover              | partial      | R2 closed; D1 live `boklanov.vercel.app`; D2 Vercel stays; D3/D4 deferred                                                                                    |
| 7.5 Editorial fingerprints      | done         | R1 `c7a1b50` folio+cue+stamp. R2 `0bebf3c` credits+slate+geos+PREM+tour[]. R3 `7c26402` slate-strike+frame fallback.                                         |
| 7.6 Editorial polish            | in progress  | Tier 1 done `00c2501`. DA-7.6.J done `e1920af`. DA-7.6.I OG remains.                                                                                       |
| 8 Authoring handoff             | in progress  | 8.1 `11bef4d` Obsidian config. 8.2 `8339141` R2 code. 8.3-8.5 `c1c4436` overlay folded + `AUTHORING.ru.md` + orphan audit. R2 CDN blocked on Cloudflare DNS. |
| 9 Decap CMS layer               | deferred     | Activates on Roman demand. Locks: `editorial_workflow:false`, `backend.branch:draft`. ~2 days.                                                               |

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

- DA-7.6.I OG image chrome upgrade (programme-grammar via satori `ImageResponse`)
- DA-7.6.J ✓ editorial empty states — `EmptyState` component: hairline + ERRATA label + italic Lora body + action slot. Filter, search, archive, awards, press. `e1920af`

Rationale ledger (history, read-only): `archive/DESIGN_AMBITION.md` §15.

## Build state

`main` branch: clean. Last: `e1920af`.

## Recent commits

```
e1920af feat(7.6-tier3-j): editorial empty states — ERRATA register
00c2501 feat(7.6-tier1): marginalia, print stylesheet, director's note, run-of-show
3106d26 feat(7.6-tier2): award count, slate LANGUAGE row, no-poster year anchor
8d3c4fd docs: merge docs/update-planning-docs branch
c1c4436 feat(phase-8): fold overlay + authoring handoff (8.3-8.5)
2cee460 docs: update planning — R2 closed, 8.1/8.2 done
11bef4d feat(phase-8.1): Obsidian vault config + lint-mdx
8339141 feat(phase-8.2): R2 image CDN — upload script + cdnUrl
70eb044 content: 2021 RGISI milestone + fix awards
4ad3743 docs: D1 live + all rounds done
```

## Next actions (in order)

1. Roman onboarding: install Obsidian + obsidian-git + mdx-as-md plugins. Walk through `content/AUTHORING.ru.md`.
2. Roman closes orphan-title audit + photographer credits.
3. Phase 7.6 Tier 3: DA-7.6.I OG image chrome (satori `ImageResponse` upgrade).
4. D3/D4 cutover when reactivated.
