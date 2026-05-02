# MAP

Index of every doc. Updated: 2026-05-02. Update on add/rename/archive.

Status: A=active, O=open, F=frozen archive, X=stale (none after reorg).

## 1. Active (6)

| # | Path                                            | Role                                                                                        | Lines |
|---|-------------------------------------------------|---------------------------------------------------------------------------------------------|------:|
| 1 | `.design/boklanov-rewrite/STATUS.md`            | Phase status, open tasks, next actions, constraints                                         |   ~80 |
| 2 | `.design/boklanov-rewrite/CONTENT.md`           | Authoring workflow + frontmatter shape                                                      |   ~80 |
| 3 | `DESIGN.md`                                     | Visual identity + IA + tokens + anti-patterns                                               |  ~220 |
| 4 | `readme.md`                                     | Stack, dev, deploy, doc map                                                                 |   ~75 |
| 5 | `.design/boklanov-rewrite/DESIGN_v2_PROPOSAL.md` | Vitrine direction — 3 §11 unfreeze commits + 8 code phases, 6 components, decisions taken |  ~290 |
| 6 | `.design/boklanov-rewrite/DESIGN_v3_PROPOSAL.md` | Plakat direction (branch `design_v3`) — 9 §11 unfreezes, 10 phases, Bauhaus trio palette, Unbounded display, ALL CAPS wordmark, full DE | ~340 |

Plus `.design/boklanov-rewrite/MAP.md` (this file) and `content/AUTHORING.ru.md` (Roman's RU day-to-day, owned by
Roman).

**Entry point:** `readme.md` -> `MAP.md` -> the doc you need.

## 2. Frozen archive (`.design/boklanov-rewrite/archive/`)

Verbatim historical record. Cite by section, never edit. Source for non-derivable user answers.

**Reading order:** always read `*_compress.md` first — it covers 90 %+ of lookup needs at a fraction of tokens. Open the full original only when the compressed version lacks the specific detail needed.

| Path                                           | Preserves                                                                                                                                                                                                                                                    |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `archive/DESIGN_BRIEF_compress.md`             | Compressed. D1-D15 locked decisions; anti-patterns; frontmatter shape source.                                                                                                                                                                                |
| `archive/DESIGN_BRIEF.md`                      | Full. D1-D15 locked decisions; 2026-05-02 annotations (troupe, Russia, D3/D6/D8 supersessions, Q3-Q7 resolutions); §8 anti-patterns; frontmatter shape source.                                                                                              |
| `archive/DESIGN_AMBITION_compress.md`          | Compressed. Roman A1-A14.1 answers; Round 1/2/3 lock; key constraints; Phase 7.6 rationale ledger.                                                                                                                                                          |
| `archive/DESIGN_AMBITION.md`                   | Full. Roman A1-A14.1 answers; Round 1/2/3 lock; past-tense `ГДЕ СТАВИЛ`/`STAGED IN`/`INSZENIERTE IN`; year-only colophon; 10-city tour cap; cuts §3.D §3.J; §13 ui-ux-pro-max review; §14 follow-ups; §15 Phase 7.6 rationale ledger.                       |
| `archive/DESIGN_REVIEW_compress.md`            | Compressed. R1 Must/Should/Could items; compliance table; I5 cut; R2 closed.                                                                                                                                                                                 |
| `archive/DESIGN_REVIEW.md`                     | Full. R1 Must/Should/Could items with file:line; §11 compliance table; I5 cut + reason; curator-90s goal-backward check; R2 closed.                                                                                                                          |
| `archive/CONTENT_WORKFLOW_compress.md`         | Compressed. 9-option matrix decision (Obsidian chosen); migration plan; authoring flow.                                                                                                                                                                      |
| `archive/CONTENT_WORKFLOW.md`                  | Full. 9-option matrix (A=Notion, B=GitHub, C=Decap, D=Tina, E=Sanity, F=Obsidian chosen, G=Logseq, H=Anytype/AppFlowy/SiYuan, I=GDocs+R2); §6 migration plan 8.1-8.5; §6.5 AUTHORING.ru.md skeleton; §6B Decap deferred plan; §8/§9/§11 Roman+Daniil verbatim Q&A. |
| `archive/INFORMATION_ARCHITECTURE_compress.md` | Compressed. Per-route content blocks; URL strategy; RU/EN naming; user flows; Phase 7.5/7.6 annotations.                                                                                                                                                    |
| `archive/INFORMATION_ARCHITECTURE.md`          | Full. Full per-route content blocks + gating; URL strategy (slugs, query params, hreflang policy excluding DE); RU/EN naming table; user flows; growth plan; Phase 7.5/7.6 per-route annotations.                                                           |
| `archive/PLAN_compress.md`                     | Compressed. Origin record; D1-D6 trade-off table.                                                                                                                                                                                                           |
| `archive/PLAN.md`                              | Full. Origin record. §0 pre-rewrite snapshot; §6 reusable prompts; §7 D1-D6 trade-off table.                                                                                                                                                                |
| `archive/HANDOFF_compress.md`                  | Compressed. Pre-reorg next-conversation prompt + key chronological context.                                                                                                                                                                                  |
| `archive/HANDOFF.md`                           | Full. Pre-reorg next-conversation prompt + chronological context for the rewrite.                                                                                                                                                                            |
| `archive/TASKS_compress.md`                    | Compressed. Per-phase task ledger; Q1-Q8 resolutions.                                                                                                                                                                                                       |
| `archive/TASKS.md`                             | Full. Per-phase task ledger with commit hashes; Q1-Q8 resolutions.                                                                                                                                                                                          |
| `archive/tokens_compress.md`                   | Compressed. Per-token rationale; locked palette; deviations.                                                                                                                                                                                                |
| `archive/tokens.md`                            | Full. Per-token rationale; §1.1 paper/ink locked palette; §10 nonexistent tokens; §11 deviations + justifications.                                                                                                                                          |
| `archive/photo-audit_compress.md`              | Compressed. 419 imgs / 56 records snapshot 2026-04-30; key counts.                                                                                                                                                                                          |
| `archive/photo-audit.md`                       | Full. 419 imgs / 56 records snapshot 2026-04-30. Counts: Nikita 33, Дель-Арте 28, Лина-Марлина 27, Гипс 25, Злая собака 25, Ape Star 25, Хаврошечка 24. 24 records MD-only. 4 productions have poster.                                                      |
| `archive/RESEARCH_2026.md`                     | Frozen 2026-05-02. Research prompt for Visual v2 (Capital-V refresh). Methodology record; canonical proposal lives in `DESIGN_v2_PROPOSAL.md`.                                                                                                              |
| `archive/RESEARCH_OPUS.md`                     | Frozen 2026-05-02. Claude Opus 4.7 output — selected basis for `DESIGN_v2_PROPOSAL.md`. Four corrections applied (see proposal §0.1).                                                                                                                       |
| `archive/RESEARCH_GEMINI.md`                   | Frozen 2026-05-02. Gemini Pro 3.1 output — convergence evidence. Same trend/component skeleton as Opus; weaker source discipline. Not the basis.                                                                                                            |

## 3. Deleted (git history preserves)

- `contributing.md` — boilerplate from `nextjs-notion-starter-kit`. Refs `react-notion-x`, `yarn link`, `pages/`. Did
  not apply post-Phase 4.
- `.design/boklanov-rewrite/tokens.css` — Phase 4 seed. Live source = `app/globals.css`. Values still match.

## 4. Cascade (active docs only)

Archive is read-only backup. Daily editing never touches it.

```
DESIGN.md (look + IA + tokens) -> app/globals.css
   -> CONTENT.md (how Roman edits) -> content/AUTHORING.ru.md
   -> STATUS.md (current state, open tasks)

STATUS owns commit hashes. No downstream writers.
```

If you edit X, touch Y:

| Edit                                    | Update                                                                   |
|-----------------------------------------|--------------------------------------------------------------------------|
| Tokens (palette, type, motion, spacing) | `DESIGN.md` §3-6 + `app/globals.css`                                     |
| Routes / URLs / IA                      | `DESIGN.md` §8-9 + `app/[locale]/...` + `messages/*.json` + `sitemap.ts` |
| Anti-patterns (§11)                     | `DESIGN.md` §11                                                          |
| Component grammar                       | `DESIGN.md` §7 + the component files                                     |
| Frontmatter shape                       | `CONTENT.md` + `lib/content.ts` + `content/AUTHORING.ru.md`              |
| Authoring flow                          | `CONTENT.md` + `content/AUTHORING.ru.md`                                 |
| Phase status / shipped commit           | `STATUS.md`                                                              |
| Roman closes an orphan-title row        | Delete row from `STATUS.md` table                                        |
| Add/rename/archive/delete doc           | This file §1, §2, or §3                                                  |

## 5. Unfreeze events (rare)

Archive is not edited in normal work. Touching it means a locked decision is genuinely changing — treat as an
exceptional event, not a routine commit.

| Trigger                          | Action                                                                                                                                                                                                                            |
|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Locked D-decision changes        | Open `archive/DESIGN_BRIEF.md`, append `_Superseded YYYY-MM-DD: <reason>_` to the D-row (never overwrite). `grep -rn "D[0-9]" -- ':!archive'` and update each live caller. Mirror the new value in `DESIGN.md` if it's visual/IA. |
| §11 anti-pattern list changes    | Same procedure on `archive/DESIGN_BRIEF.md` §8. Mirror to `DESIGN.md` §11. The §13.1 audit in `archive/DESIGN_AMBITION.md` is historical only — don't re-edit.                                                                    |
| New doc reactivated from archive | `git mv archive/X.md ./X.md`, change inline banner, append to §1, drop from §2.                                                                                                                                                   |

## 6. Conventions

1. Each doc opens with status banner. Disagreement with §1: trust doc, fix §1.
2. Cite by section number, not quote.
3. Rationale lives once. Link, don't copy.
4. Status terminates in STATUS.md. No downstream.
5. New active doc -> append §1 same commit.
6. Archive is read-only. Edit only on §5 unfreeze events.

## 7. Post-implementation update prompt

Paste after shipping any work. Skip lines that don't apply. Active docs only.

```
Update planning docs for the work just shipped. Read .design/boklanov-rewrite/MAP.md §4 first. Touch active docs only — never archive/*.

1. STATUS.md — required every time:
   - Move shipped items out of "Open content tasks" or "Phase 7.6 backlog"
   - Append commit hash(es) to "Recent commits"
   - Update the row in "Phases" table (status + notes + commit)
   - Refresh "Next actions" if priorities shifted
   - Bump "Updated: YYYY-MM-DD" header

2. CONTENT.md — only if frontmatter shape, image flow, plugin set, or scripts changed.

3. DESIGN.md — only if palette, type, motion, spacing, route, IA, anti-pattern, or component grammar changed.

4. content/AUTHORING.ru.md — only if Roman's day-to-day flow changed (button, branch name, plugin).

5. MAP.md — only if an active doc was added, renamed, or moved (§1 + §3).

6. readme.md — only if dev commands or stack moved.

Do NOT edit archive/*. If a locked D-decision or §11 anti-pattern is genuinely changing, that is a MAP.md §5 unfreeze event — flag it and ask, do not silently edit.
Do NOT create new docs without appending to MAP.md §1 in the same commit.
Brutally brief: imperatives, no marketing, no apologies, every word essential.
Verify: git diff --stat -- '*.md'
```

## 8. Continue-work prompt

Paste at the start of a new conversation to load context without re-reading the world.

```
Continuing the boklanov.com rewrite. Context order:

1. Read .design/boklanov-rewrite/MAP.md fully — it is the index.
2. Read .design/boklanov-rewrite/STATUS.md — current phase, open tasks, constraints, next actions, recent commits. Treat constraints as hard rules.
3. Read .design/boklanov-rewrite/CONTENT.md only if the task touches authoring, frontmatter, Obsidian, R2, or images.
4. Read DESIGN.md only if the task touches visual identity, tokens, IA, routes, motion, components, or anti-patterns.
5. Skim readme.md for dev commands if you need to run anything.
6. Open archive/<file>.md ONLY if you need a non-derivable answer (D-decision, R-review item, A-answer from Roman, 9-option matrix, per-route detail). archive/* is read-only history. Always read `*_compress.md` first; open the full original only if the compressed version lacks the specific detail.

Hard rules (from STATUS.md Constraints, do not violate):
- Birthday surprise: no reveal to Roman until the site is live on its production domain. D3/D4 cutover currently deferred.
- Past-tense `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN`. No present-tense Russia work. Year-only colophon.
- `git push origin main` blocked by safety hook — always ask user to push.
- I5 cut. DA-3.A slate-strike + DA-3.C edition-frame fallback shipped, do not revisit.
- Production-card text RU/EN regardless of locale. DE chrome only. `hreflang` RU<->EN only.
- Sticky booking CTA stays mailto. Awards/press original-language only.
- Analytics: only `booking_cta_click`. Never expand.
- DESIGN.md §11 anti-patterns are absolute.
- Brutally brief docs: imperatives, no marketing, every word essential.

Then state in one sentence what you intend to ship and which doc(s) you'll touch per MAP.md §4. Wait for confirmation before editing if scope is unclear; otherwise execute.

After shipping: run the MAP.md §7 update prompt.
```

## 9. Non-doc sources of truth

Override docs on conflict.

- `app/globals.css` — runtime tokens
- `content/productions/<slug>/index.mdx` frontmatter — production data
- `content/AUTHORING.ru.md` — Roman's RU day-to-day
- `messages/{ru,en,de}.json` — UI chrome strings
- `.obsidian/{app,types,community-plugins}.json` — Properties panel types
- `scripts/lint-mdx.ts` — wikilink CI guard
