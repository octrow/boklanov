# Handoff prompt — boklanov.com rewrite, Phase 8 complete

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo to continue.

---

## Prompt

I'm continuing the boklanov.com rewrite on branch `docs/update-planning-docs`.
This is a Russian/English/German site for theatre director
Roman Boklanov (puppet / object / family theatre, 30+ productions).

**Two structural facts that affect copy and proposals:**
1. Roman is a director **without a permanent troupe**. He stages
   productions at producing theatres (Бремен · Алматы · Вена · Берлин ·
   Ташкент …) and tours one solo show, *Похороните меня за плинтусом*
   ("the Plinth"), alone — no company travels with him.
2. Roman has **not been in Russia since the 2022 mobilisation**.
   Productions he directed in Russia before 2022 remain part of the body
   of work, but no copy may claim present-tense work in Russia. Colophon
   is city-free; staging-geography labels use past-tense.

**IMPORTANT — birthday surprise:** The site is a birthday present for
Roman (born 7 May 1993). Do **not** reveal the domain, design, or any
details to Roman until D4 is live. Deadline: before 6 May 2026.

---

**Current state — Phase 8 complete. D4 cutover is the only remaining blocker.**

### What shipped (branch `docs/update-planning-docs`, 4 commits ahead of main)

**Phase 8.3–8.5** — commit `c1c4436` (2026-05-02):

- **8.3 — Fold overlay + retire Notion sync:**
  - `scripts/fold-overlay.ts`: one-shot script merged all 24
    `metadata.yml` overlays into `index.mdx` frontmatter
    (overlay-wins); all `metadata.yml` files deleted
  - `lib/content.ts`: simplified — `merge()`/`pick()` removed;
    replaced by lean `fromFm()` that reads frontmatter directly;
    `yaml` import dropped
  - `scripts/sync-from-notion.ts` → `scripts/_legacy/` with
    FROZEN header; `npm run sync` → echo message
  - `content/README.md` rewritten; no `metadata.yml` section

- **8.4 — `content/AUTHORING.ru.md`:**
  Russian-language Obsidian onboarding written: one-time install
  (desktop + mobile), Properties editing, prose editing,
  commit-and-push, draft branch, add new productions, swap
  photos, troubleshooting (5 cases).

- **8.5 — Orphan audit log:**
  `.design/boklanov-rewrite/orphan-audit-2026-05.md` lists
  `sugar-kid` + `kasztanka` (MANUAL_SIBLING_PAIRS orphans) for
  Roman to confirm titles in Obsidian after onboarding.

**Earlier on branch:**
- `2cee460` docs: R2 QA closed, Phase 8.1/8.2 notes
- `11bef4d` feat(phase-8.1): Obsidian vault config + MDX wikilink linter
- `8339141` feat(phase-8.2): R2 CDN upload script + cdnUrl helper
- `70eb044` content: 2021 RGISI milestone + fix cinderella/sugar-kid awards

**Build state:** clean (`npm run build` passes, 98/98 pages SSG).

**Branch state:** `docs/update-planning-docs` is 4 commits ahead of `main`.
User must run `! git push origin docs/update-planning-docs` then merge via PR.
(Direct push to main is blocked by a safety hook — always ask the user to push.)

---

**Remaining milestones:**

1. ~~Phase 7.5 Round 1~~ ✅
2. ~~Phase 7.5 Round 2~~ ✅
3. ~~Phase 7.5 Round 3~~ ✅
4. ~~D1 Vercel preview~~ ✅ https://boklanov.vercel.app/
5. ~~R2 real-device QA~~ ✅ closed 2026-05-02
6. ~~D2 Hosting decision~~ ✅ Vercel stays
7. **D3/D4 — boklanov.com cutover** 🟡 **deadline 6 May 2026** skip for now
   - Domain: `boklanov.com` (canonical) + `www.boklanov.com` (→ 301)
   - DNS currently at **Spaceship.com**
   - Old Notion-based site still live at boklanov.com — OK to cut over
   - **DNS records to add at Spaceship:**
     - A `@` → `76.76.21.21`
     - CNAME `www` → `cname.vercel-dns.com`
   - **Vercel:** Settings → Domains → Add `boklanov.com` + `www.boklanov.com`
   - TTL 300 → propagation ~5 min to few hours
8. ~~Phase 8.1~~ ✅ done (`11bef4d`)
9. ~~Phase 8.2~~ ✅ code done (`8339141`); CDN activation pending Cloudflare
10. ~~Phase 8.3~~ ✅ done (`c1c4436`)
11. ~~Phase 8.4~~ ✅ done (`c1c4436`)
12. ~~Phase 8.5~~ ✅ audit log created (`c1c4436`)

---

### D1 — ✅ done (2026-05-02)

- Live at https://boklanov.vercel.app/
- Vercel project: https://vercel.com/octrows-projects/boklanov
- `main` branch auto-deploys on every push.
- `NEXT_PUBLIC_BASE_URL` not yet set (defaults to `https://boklanov.com`
  — fine until D4 cutover).

---

### D2 — ✅ decided (2026-05-02)

Vercel stays. No migration to Cloudflare Pages or Yandex Cloud.

---

### D3/D4 — 🟡 in progress (deadline 6 May 2026)

**boklanov.com** is the canonical domain (`.ru` deferred).
Old site at boklanov.com is Notion-based — cutting over is fine.
DNS at Spaceship.com. Steps documented above in milestone list.

R2 CDN note: `cdn.boklanov.com` cannot be connected to R2 until
boklanov.com moves to Cloudflare DNS. Skipped for now — revisit if/when
user migrates DNS to Cloudflare. Images serve from `public/` via Vercel
(`NEXT_PUBLIC_CDN_BASE` unset).

---

### Phase 8 — ✅ complete (authoring handoff)

Source of truth: Obsidian + obsidian-git (vault = repo).
`metadata.yml` overlay retired — frontmatter is single source of truth.
Image hosting: Cloudflare R2 (code ready; CDN activation pending domain move).
Editorial workflow: trust-on-publish + `draft` branch for WIP.
Decap CMS deferred — activate only if Roman requests web editing (Phase 9).

**Obsidian plugins Roman must install manually (one-time):**
1. `obsidian-git` — commit/push from sidebar button
2. `mdx-as-md` — opens `.mdx` files as editable markdown

---

### Open content tasks (Roman fills these via Obsidian)

- Photographer credits per gallery image → `gallery[].credit` in `index.mdx`
- Any new productions → add folder + `index.mdx` following existing pattern
- Confirm `sugar-kid` + `kasztanka` titles in Obsidian Properties
  (orphan-audit-2026-05.md has the checklist)

---

### Important constraints (do not violate)

- No live Notion API. Content is static MDX.
- `hreflang` on RU↔EN only — DE excluded.
- Production-card text stays RU/EN regardless of locale.
- No glassmorphism, no AI-purple, no hero video, no bento grid,
  no `rounded-2xl shadow-xl` (`DESIGN.md` §11 anti-patterns).
- Analytics: only `booking_cta_click` — never expand autocapture.
- I5 is **cut**, not deferred.
- Awards / press: original-language only (DESIGN §3).
- The production-detail sticky booking CTA stays mailto.
- Staging geography labels are **past-tense** (`ГДЕ СТАВИЛ` /
  `STAGED IN`). Never present-tense.
- No city links in the staging-geography row.
- DA-3.A (slate-strike) ships with static edition-frame fallback. ✅
- Direct `git push origin main` is **blocked by safety hook** — always
  ask the user to push themselves (`! git push origin docs/update-planning-docs`
  then merge, or `! git push origin main` on main).

---

### Recent commits

```
c1c4436  feat(phase-8): fold overlay + authoring handoff (8.3–8.5)
2cee460  docs: update HANDOFF + TASKS — R2 QA closed, Phase 8.1/8.2 done
11bef4d  feat(phase-8.1): Obsidian vault config + MDX wikilink linter
8339141  feat(phase-8.2): R2 image CDN — upload script + cdnUrl helper
70eb044  content: add 2021 RGISI milestone + fix festival names in awards
4ad3743  docs: update planning docs to reflect D1 live + all rounds done
```

**Build state:** clean. Branch `docs/update-planning-docs` ready to push.

---
we have many docs related to rewrite/rebuild current site:
1) @.design/boklanov-rewrite/CONTENT_WORKFLOW.md - about how we can update/change data on site
2) @.design/boklanov-rewrite/DESIGN_AMBITION.md - about how we can improve design of site
3) @.design/boklanov-rewrite/DESIGN_BRIEF.md - some questions and
4) @.design/boklanov-rewrite/DESIGN_REVIEW.md
5) @.design/boklanov-rewrite/HANDOFF.md - we use it like a promt for next conversation
6) @.design/boklanov-rewrite/INFORMATION_ARCHITECTURE.md
7) @.design/boklanov-rewrite/orphan-audit-2026-05.md
8) @.design/boklanov-rewrite/photo-audit.md
9) @.design/boklanov-rewrite/TASKS.md
10) @.design/boklanov-rewrite/tokens.css
11) @.design/boklanov-rewrite/tokens.md
12) @contributing.md
13) @DESIGN.md
14) @PLAN.md - main plan for work rebuild site
15) @readme.md

i need:
- merge some of them into one, we have too many docs
- make clear and easy workflow if we update one of them how we need to change others, etc
- sync all of them between
