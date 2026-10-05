# Cutover session prompts (2026-10-05)

Two prompts: one to compact the current session, one to resume work on
`openspec/changes/keystatic-to-payload-cutover` in a fresh or compacted session.

---

## 1. `/compact` instructions

Paste after `/compact `:

```text
Keep for the Keystatic → Payload cutover work on boklanov:

1. Decisions (all by the user, 2026-10-05):
   - Roma keeps editing in Keystatic on `main` until cutover; then freeze Keystatic.
   - Content delta is ported per field with scripts/port-content-delta.ts, never a full `payload:seed`.
   - Port runs close to cutover, not now. Payload stays the CMS choice; alternatives (Directus, Strapi, Tina, Decap, Hugo, etc.) were rejected.
   - Every main fix goes through a PR, checked on Vercel preview, merged on explicit user OK.
   - Schema: push off, committed migrations, Option 1 (manual ALTER) used once for the 3.90 columns.
2. State of main (prod, boklanov.com, Vercel `octrows-projects/boklanov`): PRs #14 (media excluded from function trace), #15 (OG fonts trace, transliterated collision-safe upload names via lib/translit.ts, localized poster alt), #16 (production bodies read from and moved to content/productions/<slug>/identity/body*.mdx) are merged and deployed green.
3. State of feature/payloadcms (pushed, HEAD 6f14f4d, Vercel `boklanovs-projects/boklanov_v2` green, GitHub Build green): #15 fixes ported; Payload 3.90.2; push:false + migrations/20261005_173122_baseline + vercel-build (migrate over DATABASE_URL_UNPOOLED, then npm run build); CI with postgres:17 service; scripts/production-mapping.ts (shared mapping, year/durationMin fixed into the `production` group); scripts/port-content-delta.ts (`npm run payload:port-delta`, dry run default, --fill-missing, --apply); openspec specs + cutover change; CONTEXT.md glossary; PAYLOAD_MIGRATION_PLAN.md §13.
4. Facts that are easy to lose:
   - Local runs use docker PG 17 on :5433 (`npm run db:dev-refresh`); prod Neon (ep-misty-darkness) is `NEON_DATABASE_URL{,_UNPOOLED}` in .env and needs `ALLOW_PROD_DB=1`.
   - pg_dump must be v17: `docker run --rm --network host postgres:17-alpine pg_dump ...`. Backups are in ~/backups/boklanov/.
   - Neon payload_migrations holds only the baseline row (batch 1).
   - Auto mode blocks writes to the prod DB, so the user runs those commands.
   - Port dry run on a PG17 restore of prod: 12 updates + 165 fills + 1 create (vaikenemisen-kielioppi), 0 conflicts, idempotent.
   - Vercel project `boklanov` always fails on feature/payloadcms (no Payload env). This predates the session.
   - zsh: quote globs in args, and don't word-split a $var package list.
5. Open tasks: groups 3–4 in openspec/changes/keystatic-to-payload-cutover/tasks.md.

Drop: tool output, intermediate diffs, search failures, verification command details.
```

---

## 2. Resume prompt

```text
Continue the Keystatic → Payload cutover for boklanov (repo ~/dev/boklanov, branch feature/payloadcms).

Read first, in this order:
1. openspec/changes/keystatic-to-payload-cutover/{proposal,design,tasks}.md: plan and open tasks
2. CONTEXT.md: glossary (Saved, Published, Content delta, Cutover)
3. .design/boklanov-rewrite/PAYLOAD_MIGRATION_PLAN.md §13: migrations, deploy, shared Neon DB, backups
4. scripts/port-content-delta.ts header: how the delta port works
5. Memory: keystatic-until-cutover, payload-shared-neon-db, prod-deploy-trace-limit

Where things stand:
- Prod = `main` on Keystatic (boklanov.com, Vercel `octrows-projects/boklanov`). Roma still edits there until the freeze.
- Payload = `feature/payloadcms` (Vercel `boklanovs-projects/boklanov_v2`), Payload 3.90.2, migrations-based schema, CI green.
- Done: groups 1, 1b, 2.

Open tasks, in suggested order:
1. (done) 1b.4: local docker dev DB.
2. (done) 1.5: Media uploads use lib/translit uploadFilename.
3. Group 3, cutover. Agree the date with the user, freeze Keystatic, fresh pg17 backup, then
   `npm run payload:port-delta -- --fill-missing` (dry run; resolve conflicts), then `--apply`
   (the user runs this with `ALLOW_PROD_DB=1 DATABASE_URL="$NEON_DATABASE_URL_UNPOOLED"`: auto mode blocks prod DB writes). Verify delta slugs on the preview in RU/EN/DE.
   Production = `boklanov_v2`; merge via `merge -s ours` + merge commit (decided, see design.md). Promote, then smoke-test: sitemap 200, /api/og/* image/png, /feed, an admin save Published without a deploy.
4. Group 4: editor handover (admin URL + Saved vs Published walkthrough for Roma).

Rules for this work:
- Grill style: one decision at a time, with your recommendation. Look facts up yourself; put decisions to the user.
- Never write to the prod Neon DB yourself. Prepare the exact command; the user runs it.
- Test DB-touching scripts on a local postgres:17 restore of a fresh prod dump first. Diff all tables before and after.
- Fixes to `main` go via PR → Vercel preview → user OK → squash merge → verify on boklanov.com.
- Before running the port, re-run the dry run against current origin/main: Roma may have added edits since 2026-10-05.
- Keep openspec tasks.md, CONTEXT.md and PAYLOAD_MIGRATION_PLAN.md §13 current as tasks close.
```
