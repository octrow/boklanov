# Plan: boklanov

Open bugs, plans, features and ideas in one place; date 2026-11-05. Rule: a closed item is deleted or marked ✅ with a commit link.

## Bugs

- [ ] MEDIUM (question for the owner): untranslated pages stay indexable, self canonicals, full hreflang and sitemap entries for all three locales; decide `noindex` / drop from sitemap / keep. [plan #7](docs/plans/2026-11-05-logic-map-fixes.md), [logic-map Known gaps](docs/logic-map.md)
- [ ] MEDIUM: R2 is the only copy of admin uploads, backup scripts removed 2026-11-05, restore never verified (data-loss risk). [docs/r2-operations.md](docs/r2-operations.md), [system-design Risks](docs/system-design.md)
- [x] ✅ 2026-11-05 MEDIUM: `limit: 500` in the productions query truncated silently; now a named `PRODUCTIONS_LIMIT` plus `warnIfTruncated` console warning when the cap is hit (no pagination), test in `lib/content.l10n.test.ts`; не закоммичено.
- [ ] MEDIUM: bundle stays under Vercel's 250 MB only by an exclude glob; a new media extension in `public/productions` breaks the deploy. [next.config.js:24-32](next.config.js)
- [ ] MEDIUM (partly ✅ 2026-11-05: timing and key count now logged per listing, не закоммичено): `ListObjectsV2` loop is still unbounded, no page cap. [lib/content.ts:552-575](lib/content.ts)
- [ ] LOW: peer revalidate adds up to 3 s per peer to a save; sequential vs parallel not checked. [hooks/revalidate-peers.ts:30](hooks/revalidate-peers.ts)
- [ ] LOW: `/api/og/*` is a CPU-heavy public render with a remote poster fetch and no rate limit. [app/api/og/[slug]/route.tsx](app/api/og/[slug]/route.tsx)
- [ ] LOW: no retry or circuit breaker toward Neon or R2 on any path. [system-design Risks](docs/system-design.md)

All other logic-map findings (#1-#6, #8-#15) are ✅ in [the plan](docs/plans/2026-11-05-logic-map-fixes.md).

## Планы и фичи

- [ ] Cutover step 4.1: send the editor the admin URL and a Saved vs Published walkthrough. [tasks.md:40](openspec/changes/keystatic-to-payload-cutover/tasks.md)
- [ ] Cutover step 4.2: remove or archive the Keystatic config and routes once rollback is not needed. [tasks.md:41](openspec/changes/keystatic-to-payload-cutover/tasks.md)
- [ ] Logic-map plan "Done when": every finding has ✅ or a "keep as is" reason; Known gaps lists every open HIGH and MEDIUM. [plan](docs/plans/2026-11-05-logic-map-fixes.md)
- [ ] Rehearse a Neon PITR restore (never verified). [system-design §6](docs/system-design.md)

## Идеи

- Next rung, bundle: add a bundle-size budget check when `public/` passes ~150 MB or the function nears 250 MB. [system-design §8](docs/system-design.md)
- Next rung, cache: split the `productions` cache tag per slug when a refill takes over 5 s (add a timing log first). [system-design §8](docs/system-design.md)
- Trigger: if traffic passes ~1k req/s, only the OG route and R2 egress matter. [system-design §8](docs/system-design.md)

## Подробные планы

- [docs/plans/2026-11-05-logic-map-fixes.md](docs/plans/2026-11-05-logic-map-fixes.md): logic-map findings and live-run set
- [docs/system-design.md](docs/system-design.md): rung, napkin math, failures, Risks; all repos: `~/dev/docs/system-design-report-2026-11-05.md`
- [docs/logic-map.md](docs/logic-map.md): request and admin-save flow, Known gaps
- [docs/r2-operations.md](docs/r2-operations.md): R2 operations
- [openspec/changes/keystatic-to-payload-cutover/](openspec/changes/keystatic-to-payload-cutover/): open cutover change
