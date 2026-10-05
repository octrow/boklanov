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
- **Production moves to the `boklanov_v2` Vercel project** (decided 2026-10-05). It already has the Payload env, `vercel-build` migrations and Lighthouse runs; it builds `main`. Steps: merge `feature/payloadcms` into `main`, check `boklanovv2.vercel.app`, then move the `boklanov.com` domain from `octrows-projects/boklanov` to `boklanovs-projects/boklanov_v2`. Alternative rejected: add Payload env to `octrows-projects/boklanov` (secrets in two teams, rollback needs a revert + rebuild instead of a domain move).
- **Merge with `-s ours`, then a merge commit** (decided 2026-10-05). On the branch, `git merge -s ours <frozen main sha>` records `main`'s history but keeps the branch tree (no `content/productions`, no Keystatic); the PR into `main` is merged with "Create a merge commit", a one-off exception to squash merges, so the Payload history survives. A normal merge would mean ~170 modify/delete conflicts; squash would collapse 152 commits. Since `main` loses the YAML after the merge, the port runs before it with `--target <frozen main sha>`.
- **Port fixes before the switch, not after.** Otherwise the first Payload prod deploy reintroduces the OG 500s and the dash-only upload names.

## Risks / Trade-offs

- [Conflicting field edits] → conflicts are listed and resolved by hand. The delta is small (7 commits as of 2026-10-05).
- [Rich text: MDX on main vs Lexical in Payload] → body MDX changes go through the existing MDX→Lexical conversion used by the seed, and the result is reviewed per slug.
- [Merging into `main` ends Keystatic] → the branch has no Keystatic config or routes, so freeze (3.2) and port (3.3) must happen before the merge.
- [Editor saves in Keystatic after the freeze] → disable Keystatic Cloud editing and tell the editor the cutover date in advance.
- [Rollback] → move `boklanov.com` back to `octrows-projects/boklanov` and Instant Rollback it to the last Keystatic deploy (its build of the new `main` fails, the old deploy keeps serving), and any edits made in Payload after cutover would then need the reverse port.
