# Tasks

## 1. Port main fixes to feature/payloadcms

- [x] 1.1 Confirm `outputFileTracingExcludes` for `public/productions` media is present (df820fe); keep `lqip.json` traced
- [x] 1.2 Add `outputFileTracingIncludes` for `@fontsource` woff files under `/api/og/**`; verify the OG route's `.nft.json` lists them
- [x] 1.3 Add `lib/translit.ts` and use it in `components/CommandPalette.tsx`
- [x] 1.4 Transliterate and timestamp-suffix upload names in `app/api/r2-asset/route.ts`
- [x] 1.5 Payload `Media` uploads use the same naming: `uploadFilename()` in `lib/translit.ts` (shared with `r2-asset`), applied in a `beforeOperation` hook
- [x] 1.6 Use the page-locale title for the poster alt in `app/[locale]/productions/[slug]/page.tsx`

## 1b. Payload upgrade and schema management

- [x] 1b.1 Upgrade Payload 3.84.1 → 3.90.2 (security release); regenerate types
- [x] 1b.2 Add `media._objectkey` and `users.reset_password_requested_at` to Neon by hand (pg_dump backup first: `~/backups/boklanov/neon-2026-10-05-pre-payload-3.90.dump`)
- [x] 1b.3 Move schema changes to Payload migrations: baseline the current push-managed schema, mark it applied, commit `migrations/`, and run `payload migrate` in the deploy. In production push is off, so every future schema change needs a migration
- [x] 1b.4 Separate dev and prod databases: local docker PG 17 (`docker-compose.yml`, `npm run db:dev-refresh`), prod as `NEON_*` env, config refuses Neon outside Vercel without `ALLOW_PROD_DB=1`

## 2. Content delta port script

- [x] 2.1 Write a per-slug port script: parse YAML at `4e7497e` and at a target ref, deep-diff the values with whitespace normalised, and output creates/updates
- [x] 2.2 Add a three-way check against current Payload values and report conflicts instead of writing them
- [x] 2.3 Map YAML field paths to Payload fields, reusing `seed-payload.ts` mapping and MDX→Lexical conversion
- [x] 2.4 Dry run by default; write only with `--apply`
- [x] 2.5 Dry-run against current `main` and review the plan (expect: create `vaikenemisen-kielioppi`, `dialogi-po-povodu-dzhaza` status, aiaccio / beware-of-the-dog / oskar-und-die-dame-in-rosa edits)

## 3. Cutover

Run 2026-10-05: frozen `main` = `96056047`; backup `~/backups/boklanov/neon-2026-10-05-2327-dev-refresh.dump`; port applied to Neon (178 writes, 0 conflicts; re-run = 0). The port writes with `disableRevalidate`, so a running deploy needs `/api/revalidate` with tag `productions` to show it.

- [x] 3.1 Agree a cutover date with the editor and announce the freeze
- [x] 3.2 Freeze Keystatic Cloud editing
- [x] 3.3 Record the frozen `main` sha; run the port with `--target <sha>`: dry run, resolve conflicts, then `--apply` (`ALLOW_PROD_DB=1 DATABASE_URL="$NEON_DATABASE_URL_UNPOOLED"`)
- [x] 3.4 Verify every delta slug on the Payload preview in RU/EN/DE
- [x] 3.5 Promote (#17, 00bda36; the domain was already on `boklanov_v2`, so no move; Neon `production` branch replaced with the preview branch data, see PAYLOAD_MIGRATION_PLAN §13): on the branch `git merge -s ours <frozen sha>`, PR into `main` merged with a merge commit (not squash), check `boklanovv2.vercel.app`, move `boklanov.com` to `boklanovs-projects/boklanov_v2`
- [ ] 3.6 Smoke-test production: sitemap URLs 200, `/api/og/*` 200 `image/png`, `/feed` (done: 186/186, canonical fixed in #18); an admin save Published without a deploy (pending)

## 4. Editor handover

- [ ] 4.1 Send the editor the admin URL and a short Saved vs Published walkthrough
- [ ] 4.2 Remove or archive the Keystatic config and routes once rollback is no longer needed
