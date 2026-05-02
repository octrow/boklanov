# STATUS

Current state + open work. Updated: 2026-05-02.

Owns: phase status, open tasks, commit hashes, next actions.
Update: every shipped task. Status flows here -> nowhere (terminal).

## Constraints

- Birthday surprise: no reveal to Roman until D4 live. Deadline 2026-05-06.
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
| 7 Deploy + cutover              | in progress  | R2 closed; D1 live `boklanov.vercel.app`; D2 Vercel stays; D3/D4 pending                                                                                     |
| 7.5 Editorial fingerprints      | done         | R1 `c7a1b50` folio+cue+stamp. R2 `0bebf3c` credits+slate+geos+PREM+tour[]. R3 `7c26402` slate-strike+frame fallback.                                         |
| 7.6 Editorial polish            | pending      | 10 tasks, 3 tiers. Post-D4. None blocks launch.                                                                                                              |
| 8 Authoring handoff             | in progress  | 8.1 `11bef4d` Obsidian config. 8.2 `8339141` R2 code. 8.3-8.5 `c1c4436` overlay folded + `AUTHORING.ru.md` + orphan audit. R2 CDN blocked on Cloudflare DNS. |
| 9 Decap CMS layer               | deferred     | Activates on Roman demand. Locks: `editorial_workflow:false`, `backend.branch:draft`. ~2 days.                                                               |

## D3/D4 cutover (active blocker, deadline 2026-05-06)

Domain: `boklanov.com` canonical + `www.boklanov.com` 301. Old Notion site at boklanov.com — OK to overwrite.

DNS at Spaceship.com:

- A `@` -> `76.76.21.21`
- CNAME `www` -> `cname.vercel-dns.com`
- TTL 300

Vercel: Settings -> Domains -> add `boklanov.com` + `www.boklanov.com`.

R2 CDN note: `cdn.boklanov.com` cannot connect to R2 until boklanov.com moves to Cloudflare DNS. Defer R2 activation
until/unless DNS migrates. `NEXT_PUBLIC_CDN_BASE` unset -> images serve from `public/` via Vercel.

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

## Phase 7.6 backlog (post-D4)

Tier 1 (programme-grammar, ~3 days):

- DA-7.6.A marginalia ≥1280px on `/about` + synopses
- DA-7.6.B `@media print` stylesheet
- DA-7.6.C director's note block (italic Lora + mono attribution), gated by `directorsNote.{ru,en}` field
- DA-7.6.D run-of-show row `RUN · BTK · СПБ · 2020-2024 · ~80 PERFORMANCES`, gated by `runs[]`

Tier 2 (~2 hours):

- DA-7.6.E CUE-count tag on `/awards`
- DA-7.6.F theatre slate `LANGUAGE` row
- DA-7.6.G no-poster card year-anchor `margin-top: auto`
- DA-7.6.H DE chrome length audit (`INSZENIERTE IN` 13 chars at 1024-1100px)

Tier 3 (~1.5 days):

- DA-7.6.I OG image chrome upgrade (programme-grammar via satori `ImageResponse`)
- DA-7.6.J editorial empty states (filter, search, archive)

Rationale ledger (history, read-only): `archive/DESIGN_AMBITION.md` §15.

## Build state

`main` branch: clean. `npm run build` passes, 98/98 SSG pages.
Branch `docs/update-planning-docs`: 4 commits ahead of `main`.

## Recent commits

```
c1c4436 feat(phase-8): fold overlay + authoring handoff (8.3-8.5)
2cee460 docs: update planning — R2 closed, 8.1/8.2 done
11bef4d feat(phase-8.1): Obsidian vault config + lint-mdx
8339141 feat(phase-8.2): R2 image CDN — upload script + cdnUrl
70eb044 content: 2021 RGISI milestone + fix awards
4ad3743 docs: D1 live + all rounds done
```

## Next actions (in order)

1. User pushes `docs/update-planning-docs` -> merge PR.
2. D3/D4: add Spaceship DNS + Vercel domains. Wait propagation.
3. Roman onboarding: install Obsidian + obsidian-git + mdx-as-md plugins. Walk through `content/AUTHORING.ru.md`.
4. Roman closes orphan audit + photographer credits.
5. Phase 7.6 Tier 1+2 (post-D4, no blocker).
