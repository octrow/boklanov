# TRANSLATE_PLAN — `scripts/translate-content.ts`

**Status: SHIPPED.** Script lives at `scripts/translate-content.ts`.

---

## 1. Constraints

- Past-tense `ГДЕ СТАВИЛ` / `STAGED IN` / `INSZENIERTE IN` — translation must preserve past tense.
- **Default: every text field is translatable.** Verbatim-only exceptions:
  - Scalars: numbers, booleans, nulls.
  - Identifiers / addresses: `slug`, `notionIds`, every `url`, `theatre.country` (ISO code), `press[].language` (ISO code).
  - Enums: `form`, `lineage`, `role`, `ageRating`, `tags`, `videos[].provider` / `id`.
  - Proper names of people: `credits[].name` is mirrored verbatim across all three locales (transliteration is the editor's job, not the script's).
  - Asset paths: `gallery[].src`, `poster.src`, `techRider`, `pressKit`.
- DE is best-effort; production-card chrome strings still live in `messages/de.json`, not in `content/`.
- Theatre / venue names, award names, festival names: **translatable** (`lib/content.ts` now accepts `L10nString` for all of these — see §3). Script writes a `{ru, en, de}` object; if user wants a verbatim original, they can keep the field as a plain string (resolver supports both).

## 2. Source-of-truth rules

Source locale priority per field: `ru → en → de`. First non-null wins. If all three are null, skip.

Fill rule: only write into a target locale when its current value is `null`, missing, or empty string.
Use `--force` to overwrite existing prose.

## 3. Translatable surface

`lib/content.ts` exports `L10nString = string | { ru?, en?, de? }`. Plain strings stay valid
everywhere; the script upgrades them to `{ru, en, de}` objects when filling locales.

| Path | Translated | Skipped |
|------|-----------|---------|
| `index.yaml` `title.{ru,en,de}` | yes | — |
| `index.yaml` `synopsis.{ru,en,de}` | yes | — |
| `index.yaml` `tagline.{ru,en,de}` | yes | — |
| `index.yaml` `directorsNote.{ru,en,de}` | yes | — |
| `index.yaml` `bookingCtaLabel.{ru,en,de}` | yes | — |
| `index.yaml` `premiereDate.{ru,en,de}` | yes (locale-formatted date) | — |
| `index.yaml` `theatre.{name,shortName,city}` | yes (L10nString — upgrade plain string in place) | `country`, `url` |
| `index.yaml` `tour[]` | yes (each entry is `L10nString`; plain-string entries are upgraded to `{ru,en,de}` objects) | — |
| `index.yaml` `credits.{ru,en,de}[].role` | yes | `name`, `url` (proper names verbatim) |
| `index.yaml` `gallery[].caption.{ru,en,de}` | yes (when any source caption exists) | `src`, `credit` |
| `index.yaml` `awards[].{name,category,city}` | yes (L10nString) | `year` |
| `index.yaml` `festivals[].{name,category,city}` | yes (L10nString) | `year` |
| `index.yaml` `externalLinks[].label` | yes (L10nString) | `url` |
| `index.yaml` `runs[].{venue,city,count}` | yes (L10nString) | `yearFrom`, `yearTo` |
| `index.yaml` `press[].title` | yes — plain string upgraded to `{ru,en,de}` object | `url`, `outlet`, `language` |
| `index.yaml` enums + scalars (`form`, `lineage`, `role`, `ageRating`, `tags`, `featured`, `year`, `listOrder`, `durationMin`, `videos[]`, `notionIds`, `slug`, asset paths) | **no** | all |
| `body.{ru,en,de}.md` | yes (only if missing/empty) | preserve YAML frontmatter if any |
| `content/about/{ru,en,de}.yaml` | `milestones[].label`, `lineage[].role`, `lineage[].note`, `marginalia[]`, any other text field | `name`, `key`, `institution`, `year`, urls |
| `content/about/{ru,en,de}.md` | yes (only if missing/empty) | — |

**Generic rule for any future field:** if it's a string carrying human prose → translate. If it's a
URL, ISO code, slug, enum value, or scalar → skip. Proper names of people are mirrored verbatim.

## 4. Algorithm (per production / about page)

```
1. Parse index.yaml with yaml.parseDocument (stable key order, comments preserved).
2. For each locale-keyed field group (title, synopsis, tagline, directorsNote, bookingCtaLabel,
   premiereDate, credits, gallery captions):
     pick source = first non-empty in [ru, en, de]
     for target in {ru,en,de} \ source where value is null/empty:
        translation = LLM(source, src_locale, target_locale, field_kind)
        doc.setIn([...path, locale], translation)
3. For each L10nString field (theatre.{name,shortName,city}, awards[].*, festivals[].*,
   externalLinks[].label, runs[].*, press[].title, tour[]):
     read current value
     if plain string s:  src_locale = inferred (RU heuristic if Cyrillic, else 'en');
                         upgrade to object { src: s }
     for target in {ru,en,de} where missing:
        translate from any present locale (priority ru→en→de)
4. credits[].{ru,en,de}: align by index. If target locale list empty/missing, clone source list,
   translate `role`, keep `name` + `url` verbatim.
5. gallery[].caption: per item, fill missing locale captions when any locale has a caption.
6. body.<lang>.md: if missing while a sibling exists, translate sibling whole.
7. about/{locale}.{yaml,md}: if locale file missing, clone source then translate text fields.
8. Write file only if changed. Lint-content runs after; failures restore from .bak.
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
- New fields beyond existing schema.
- Transliteration of `credits[].name` (proper names of people stay verbatim across locales).
- URL / slug / enum / scalar mutation.

> **Note on MAP §8 hard rule "Awards/press original-language only":** superseded 2026-05-05 by
> owner request — every text field is now translatable by default. STATUS.md constraint list and
> the relevant archive D-row need a supersession note on next ship. Flag at commit time.

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
