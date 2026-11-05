<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agents: start here

1. `CONTEXT.md`: the domain terms.
2. `docs/logic-map.md`: how a request or an admin save becomes a page: every step, every branch, the module behind it.
3. `docs/plans/`: `2026-11-05-logic-map-fixes.md` lists the known logic gaps.
4. Open bugs, plans and ideas: [PLAN.md](PLAN.md).

Rules:

- Change a step or a branch → update `docs/logic-map.md` in the same commit.
- `scripts/check-logic-map.sh` fails when a `Module:` line in the map points to a module that is gone. Run it after renaming or moving files.
