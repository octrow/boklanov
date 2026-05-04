# TRANSLATE_PLAN — `scripts/translate-content.ts`

**Status: SHIPPED.** Script lives at `scripts/translate-content.ts`.

---

## 1. Constraints

- Past-tense `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN` — translation must preserve past tense.
- `notionIds`, slugs, URLs, dates (scalars), enums (`form`, `lineage`, `role`, `ageRating`, `tags`) → never touched.
- Proper names (people, theatres, cities) → never translated; `credits[].role` is translated, `credits[].name` is not.
- DE is best-effort; may stay empty for production-card chrome (that lives in `messages/de.json`, not here).

## 2. Source-of-truth rules

Source locale priority per field: `ru → en → de`. First non-null wins. If all three are null, skip.

Fill rule: only write into a target locale when its current value is `null`, missing, or empty string.
Use `--force` to overwrite existing prose.

## 3. Translatable surface

| Path | Translated | Skipped |
|------|-----------|---------|
| `index.yaml` `title.{ru,en,de}` | yes | — |
| `index.yaml` `synopsis.{ru,en,de}` | yes | — |
| `index.yaml` `directorsNote.{ru,en,de}` | yes | — |
| `index.yaml` `premiereDate.{ru,en,de}` | yes (locale-formatted date) | — |
| `index.yaml` `credits.{ru,en,de}[]` | `role` only; `name` + `url` mirrored verbatim | `name`, `url` |
| `index.yaml` `press[].title` | yes — plain string upgraded to `{ru,en,de}` object; existing locale-keyed titles filled | `url`, `outlet`, `language` |
| `index.yaml` `gallery[].caption.{ru,en,de}` | yes (when any source caption exists) | `src`, `credit` |
| `index.yaml` `awards`, `festivals`, `externalLinks` | **no** | all |
| `index.yaml` `theatre.*`, `tour`, `tags`, enums, scalars | no | all |
| `body.{ru,en,de}.md` | yes (only if missing/empty) | preserve YAML frontmatter if any |
| `content/about/{ru,en,de}.yaml` | `milestones[].label`, `lineage[].role`, `lineage[].note`, `marginalia[]` | `name`, `key`, `institution`, `year` |
| `content/about/{ru,en,de}.md` | yes (only if missing/empty) | — |

**Note on `press[].title`:** the site already handles both `title: "string"` and `title: {ru, en, de}` (see `lib/content.ts:331`). The script upgrades plain strings in place, preserving all other press fields.

## 4. Algorithm (per production / about page)

```
1. Parse index.yaml with yaml.parseDocument (stable key order, comments preserved).
2. For each translatable field group:
     pick source = first non-empty in [ru, en, de]
     for target in {ru,en,de} \ source where value is null/empty:
        translation = LLM(source, src_locale, target_locale, field_kind)
        doc.setIn([...path, locale], translation)
3. credits: if target locale list is empty, copy source list, translate role, keep name/url.
4. press[].title: if plain string, treat item.language (or 'ru') as source locale, wrap in object,
   fill missing locales. If already locale-keyed, fill gaps.
5. gallery[].caption: per item, fill missing locale captions when any locale has a caption.
6. Write file only if changed. Lint-content runs after; failures restore from .bak.
7. body.<lang>.md: if missing while a sibling exists, translate sibling whole.
8. about/{locale}.yaml: if locale file missing, clone source doc then translate text fields.
```

## 5. CLI

```
npm run translate-content -- [flags]
tsx scripts/translate-content.ts [flags]

Flags:
  --dry-run            print what would change; write nothing (default: off)
  --slug <slug>        restrict to one production; repeatable
  --target en|de|ru    restrict to one target locale; repeatable
  --force              overwrite existing non-empty values
  --only fields|body|about  narrow scope
  --limit N            stop after N productions (cost cap during dev)
  --report             print gap table only; no translation
  --budget <usd>       abort if estimated cost exceeds this
  --provider <name>    force provider (see §6); default: auto-detect from env
```

Default run = whole `content/`, fill-only mode.

## 6. Translation backend

Provider is auto-detected from env in this priority order:

| Provider | Env key | Prose model | Short model | Notes |
|----------|---------|-------------|-------------|-------|
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-opus-4-7` | `claude-haiku-4-5-20251001` | best quality |
| `cerebras` | `CEREBRAS_API_KEY` | `llama-3.3-70b` | `llama3.1-8b` | free tier, ultra-fast |
| `openrouter` | `OPENROUTER_API_KEY` | `google/gemini-2.0-flash-001` | `google/gemini-2.0-flash-lite-001` | multi-model gateway |
| `gemini` | `GEMINI_API_KEY` | `gemini-2.0-flash` | `gemini-2.0-flash-lite` | direct Gemini API |

Anthropic uses `@anthropic-ai/sdk` natively. All others use the `openai` npm package via OpenAI-compatible endpoints.

`--provider <name>` overrides auto-detection.

Prose fields (synopsis, directorsNote, body, about) → prose model. All other fields → short model.

Prompt skeleton:
```
System: You translate theatre production metadata for boklanov.com.
        Output ONLY the translated string. No quotes, no commentary.
        Preserve past tense. Don't translate proper names. Terse register.
        Dates: RU "10 октября 2021 г.", EN "October 10, 2021", DE "10. Oktober 2021".
User:   <field_kind=title|synopsis|...>
        <src_locale> → <tgt_locale>
        ---
        <source text>
```

Retry: 1 retry on 5xx / rate limit, 2 s delay. Hard-fail on 4xx.

## 7. Caching + cost control

- Cache key: `sha256(src_locale + tgt_locale + field_kind + source_text)` → `.cache/translate/<sha>.txt` (gitignored).
- Concurrency: 4 parallel calls via `p-map` for credits list; productions are processed one at a time.
- Running token totals + rough cost printed at end.
- `--budget <usd>` aborts before the next API call if estimate is exceeded.

## 8. Safety

- **Never edits `archive/*`.**
- **Never `git push`.** Script writes files only; user reviews diff and commits.
- Before each write: saves `.bak` next to the file.
- After all writes: runs lint-content (inline wikilink check). On failure: restores all `.bak` files and exits 1.
- On success: deletes `.bak` files.
- YAML round-trip: `parseDocument` → `doc.setIn()` → `doc.toString()` — key order and comments preserved.

## 9. Files shipped

- `scripts/translate-content.ts` — new
- `package.json` — added `translate-content` script; deps `@anthropic-ai/sdk`, `openai` (yaml + p-map were already present)
- `.gitignore` — added `.cache/translate/`

## 10. Out of scope

- Notion sync (frozen).
- `awards`, `festivals`, `externalLinks` translation (original-language items).
- `tagline`, `bookingCtaLabel` (not included; can be added with `--force` on specific slugs if needed).
- New fields beyond existing schema.

## 11. Running the full translation

```bash
# 1. Load API keys
set -a && source .env && set +a

# 2. Preview all gaps (no API calls)
npm run translate-content -- --report

# 3. Dry-run a single production
npm run translate-content -- --dry-run --slug going-in-twos

# 4. Translate everything
npm run translate-content

# 5. Or scope by provider / locale / scope
npm run translate-content -- --provider openrouter --target de --only fields
npm run translate-content -- --budget 2 --limit 10
```

After the run: `git diff content/` to review, then commit.
