# Design

## Context

- `main`: content lives in `content/productions/<slug>/index.yaml` plus `identity/body{Ru,En,De}.mdx`, edited through Keystatic Cloud. Each save is a commit, and each commit is a production deploy.
- `feature/payloadcms`: `content/` is gone. Productions, About and Contact live in Payload/PostgreSQL. They were seeded once by `scripts/seed-payload.ts`, which upserts every slug it finds, and then fixed in place (Round-5 richText restores, About body restore).
- Keystatic re-serialises YAML on save (folded scalars, key order), so a textual diff of `4e7497e..main` mixes real edits with pure reformatting.
- Media paths are plain strings pointing at R2 keys and are the same on both branches. New Keystatic uploads land in R2 `uploads/` and need no copying.

## Goals / Non-Goals

**Goals:**

- Every edit Saved in Keystatic before the freeze is Published from Payload after cutover.
- No Payload-side fix is overwritten.
- Prod fixes made on `main` are not regressed by the switch.

**Non-Goals:**

- Two-way sync between Keystatic and Payload; editing stays single-writer at every moment.
- Migrating media out of `public/productions` or changing the R2 layout.
- Retiring the `backup-r2-to-git` workflow.

## Decisions

- **Semantic, per-field delta instead of a full re-seed.** Parse both YAML revisions (`4e7497e` and the frozen `main`), deep-compare the parsed values, and emit `{slug, fieldPath, old, new}`. Whitespace-only string changes are normalised away. Alternative rejected: run `payload:seed`, because it clobbers the Round-5 fixes.
- **Three-way check against Payload.** For each delta field, compare the Payload value with `old`. If they are equal, apply `new`. If they differ, both sides edited the field, so report a conflict for manual resolution instead of guessing.
- **Dry run first.** The port script prints the plan (new slugs, per-field updates, conflicts) and writes only with `--apply`.
- **Freeze before the final diff.** The diff is taken from `main` after the freeze, so nothing slips in between the diff and the switch.
- **Port fixes before the switch, not after.** Otherwise the first Payload prod deploy reintroduces the OG 500s and the dash-only upload names.

## Risks / Trade-offs

- [Conflicting field edits] → conflicts are listed and resolved by hand. The delta is small (7 commits as of 2026-10-05).
- [Rich text: MDX on main vs Lexical in Payload] → body MDX changes go through the existing MDX→Lexical conversion used by the seed, and the result is reviewed per slug.
- [Editor saves in Keystatic after the freeze] → disable Keystatic Cloud editing and tell the editor the cutover date in advance.
- [Rollback] → keep `main` deployable. Rolling back means pointing production back at `main`, and any edits made in Payload after cutover would then need the reverse port.
