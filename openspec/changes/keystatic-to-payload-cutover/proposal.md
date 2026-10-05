# Proposal

## Why

Production (`main`) still runs on Keystatic while `feature/payloadcms` moved content into Payload on 2026-05-12 (fork point `4e7497e`). The editor keeps working in Keystatic until cutover (decided 2026-10-05), so the Content delta grows with every save. On 2026-10-05 it already holds a new production (`vaikenemisen-kielioppi`), a status flip, and real edits to three more productions. Two prod fixes from that day (#14, #15) also exist only on `main`. A naive cutover (full `payload:seed`) would overwrite Payload-side fixes, and skipping the delta would silently lose the editor's work.

## What Changes

- Freeze Keystatic edits on `main` at cutover.
- Move the Content delta (`4e7497e..main` in `content/productions/`) into Payload per slug and per field, never through a full re-seed.
- Port the `main` fixes to `feature/payloadcms`: media excluded from function traces (#14), OG fonts traced (#15), transliterated, collision-safe upload names in `app/api/r2-asset` (#15), poster alt in the page locale (#15).
- Switch production to the Payload build. Saved edits are then Published by on-save revalidation instead of a full deploy.

## Capabilities

### New Capabilities

- `content-cutover`: one-time rules for moving editing from Keystatic to Payload without losing either side's edits.

### Modified Capabilities

- `content-publishing`: after cutover, a Saved edit is Published by on-save revalidation instead of a production deploy.

## Impact

- `scripts/`: new per-slug delta port script, or a slug filter on `scripts/seed-payload.ts`.
- `next.config.js`, `app/api/r2-asset/route.ts`, `app/[locale]/productions/[slug]/page.tsx`, new `lib/translit.ts` on `feature/payloadcms`.
- Keystatic Cloud project: editing disabled after the freeze.
- Vercel: production branch / project switch (`boklanov` vs `boklanov_v2`).
- Editor workflow: new admin URL and a short walkthrough for the editor.
