# Handoff prompt — boklanov.com rewrite, Phase 8 in progress

Paste the block below into a fresh Claude Code conversation in the
`boklanov` repo (branch `main`) to continue.

---

## Prompt

I'm continuing the boklanov.com rewrite on branch `main`. This is a
Russian/English/German site for theatre director
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

**Current state — Phase 8 authoring handoff in progress. D4 cutover pending.**

### What shipped since D1 (branch `docs/update-planning-docs`, ready to merge)

Commits `70eb044`, `8339141`, `11bef4d` (2026-05-02):

- **Content fixes:**
  - `content/about/{ru,en}.mdx`: added 2021 RGISI graduation milestone
    (confirmed from Notion bio: "2021 — закончил РГИСИ, режиссёр театра
    кукол, мастерская Р.Р. Кудашова, курс при БТК")
  - `cinderella/metadata.yml`: awards override — heuristic had extracted
    category "Лучший спектакль о добре" instead of festival "XXX Международный
    фестиваль КУКАРТ"
  - `sugar-kid/metadata.yml`: awards override — both entries corrected
    ("Браво — 2022" + "V Всероссийский молодёжный фестиваль им. В.С. Золотухина")

- **Phase 8.2 — R2 CDN infrastructure (code done, CDN activation pending):**
  - `lib/cdn.ts`: `cdnUrl(path)` helper — prepends `NEXT_PUBLIC_CDN_BASE`
    in prod, no-op in local dev
  - `scripts/upload-images.ts`: S3-compatible upload to Cloudflare R2;
    skips unchanged files by size check; `--slug` and `--dry-run` flags
  - `components/ProductionCard.tsx`, `app/[locale]/productions/[slug]/page.tsx`:
    poster + gallery `src` wrapped in `cdnUrl()`
  - `next.config.js`: `images.remotePatterns` → `cdn.boklanov.com`
  - `package.json`: `npm run upload-images` script; `@aws-sdk/client-s3`
    + `dotenv` added as devDeps
  - `.env.example`: `NEXT_PUBLIC_CDN_BASE`, `R2_*` credentials documented
  - **CDN not yet active:** boklanov.com is NOT on Cloudflare, so
    `cdn.boklanov.com` custom domain cannot be connected to R2 yet.
    `NEXT_PUBLIC_CDN_BASE` is unset — images still served from `public/`
    via Vercel. Skip R2 activation until domain moves to Cloudflare.

- **Phase 8.1 — Obsidian vault config (done):**
  - `.obsidian/app.json`: `useMarkdownLinks:true`, spellcheck ru+en,
    source view default — prevents `![[wikilink]]` from being created
  - `.obsidian/types.json`: property types for `year`/`featured`/
    `ageRating`/`durationMin`/`ticketsUrl`/`form`/`lineage`/`tour`/`tags`
  - `.obsidian/community-plugins.json`: `["obsidian-git", "mdx-as-md"]`
    (Roman installs these manually in Obsidian)
  - `.gitignore`: ignores `workspace.json`, `cache`, `plugins/`
  - `scripts/lint-mdx.ts`: CI guard — fails on `![[wikilink]]` in `content/`
  - `package.json`: `npm run lint-mdx` script added

**Build state:** clean (`npm run build` passes, 98/98 pages SSG).

**Branch state:** `docs/update-planning-docs` is ahead of `main` by 3 commits.
User must run `! git push origin main` or merge via PR to deploy.
(Direct `git push origin main` is blocked by a safety hook — always ask
the user to push themselves.)

---

**Next milestones, in order:**

1. ~~Phase 7.5 Round 1~~ ✅ `c7a1b50`
2. ~~Phase 7.5 Round 2~~ ✅ `0bebf3c`
3. ~~Phase 7.5 Round 3~~ ✅ `7c26402`
4. ~~D1 Vercel preview~~ ✅ live — https://boklanov.vercel.app/
5. ~~R2 real-device QA~~ ✅ closed 2026-05-02 — Daniil checked desktop +
   mobile, site looks ok. `?gesture=off` gate lifted (animation live).
6. ~~D2 Hosting decision~~ ✅ Vercel stays — no migration needed.
7. **D3/D4 — boklanov.com cutover** 🟡 **in progress, deadline 6 May**
   - Domain: `boklanov.com` (canonical) + `www.boklanov.com` (alias → 301)
   - DNS currently at **Spaceship.com** (https://www.spaceship.com/domains/)
   - Old Notion-based site still live at boklanov.com — OK to cut over
   - **DNS records to add at Spaceship:**
     - A `@` → `76.76.21.21`
     - CNAME `www` → `cname.vercel-dns.com`
   - **Vercel steps:** Settings → Domains → Add `boklanov.com` + `www.boklanov.com`
   - TTL 300 → propagation ~5 min to few hours
8. **Phase 8.1** ✅ done (`11bef4d`)
9. **Phase 8.2** 🟡 code done, CDN activation blocked (needs boklanov.com on Cloudflare)
10. **Phase 8.3** — fold overlay + retire Notion sync ⬜
11. **Phase 8.4** — `content/AUTHORING.ru.md` for Roman ⬜
12. **Phase 8.5** — Cyrillic-only-Name orphan audit ⬜

---

### R2 QA — ✅ closed (2026-05-02)

Daniil checked desktop + mobile on https://boklanov.vercel.app/.
Site looks correct. All R2 checklist items considered passed.
`?gesture=off` gate on slate-strike is **lifted** — animation ships to
all users on first visit. `?gesture=off` remains as a permanent debug
escape hatch.

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
Reason: no CN/RU blocking issues reported, zero migration cost.

---

### D3/D4 — 🟡 in progress (deadline 6 May 2026)

**boklanov.com** is the canonical domain (`.ru` deferred).
Old site at boklanov.com is Notion-based — cutting over is fine.
DNS at Spaceship.com. Steps documented above in milestone list.

R2 CDN note: `cdn.boklanov.com` cannot be connected to R2 until
boklanov.com moves to Cloudflare DNS. Skipped for now — revisit if/when
user migrates DNS to Cloudflare. In the meantime, images serve from
`public/` via Vercel with no NEXT_PUBLIC_CDN_BASE set.

---

### Phase 8 scope (authoring handoff)

Locked 2026-05-02 in `CONTENT_WORKFLOW.md`.
Source of truth: Obsidian + obsidian-git (vault = repo).
Image hosting: Cloudflare R2 (code ready; activation pending domain move).
Editorial workflow: trust-on-publish + `draft` branch for WIP.
Decap CMS deferred — activate only if Roman requests web editing.

**Status:**
- 8.1 Vault config: ✅ done
- 8.2 R2 code: ✅ done (CDN activation pending)
- 8.3 Fold overlay + retire sync: ⬜ not started
- 8.4 AUTHORING.ru.md: ⬜ not started
- 8.5 Orphan audit: ⬜ not started

**Obsidian plugins Roman must install manually (one-time):**
1. `obsidian-git` — commit/push from sidebar button
2. `mdx-as-md` — opens `.mdx` files as editable markdown

---

### Open content tasks (Roman fills these via Obsidian after Phase 8)

- Photographer credits per gallery image → `metadata.yml` `gallery[].credit`
- Canonical Plinth tour city list → extend `tour[]` in
  `content/productions/bury-me-behind-the-baseboard/metadata.yml`
- Any new productions → add folder + `index.mdx` following existing pattern

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
  `STAGED IN`). Never present-tense ("stages in" / "ставит в").
- No city links in the staging-geography row.
- DA-3.A (slate-strike) ships with static edition-frame fallback. ✅ Done.
- Direct `git push origin main` is **blocked by safety hook** — always
  ask the user to push themselves (`! git push origin main`).

---

### Recent commits

```
11bef4d  feat(phase-8.1): Obsidian vault config + MDX wikilink linter
8339141  feat(phase-8.2): R2 image CDN — upload script + cdnUrl helper
70eb044  content: add 2021 RGISI milestone + fix festival names in awards
4ad3743  docs: update planning docs to reflect D1 live + all rounds done
b1210b7  docs: mark D1 live; refresh HANDOFF for R2 QA
476af22  Merge pull request #3 from octrow/fix/nextjs-version
```

**Build state:** clean. Branch `docs/update-planning-docs` ready to push.
