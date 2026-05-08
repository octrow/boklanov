# Prompt Authoring Guide

Reference for agents authoring or revising prompt text — agent skill definitions (SKILL.md), standalone system prompts, embedded subagent templates, and tool `description` fields. Organized around eight evaluator lenses; each section maps to a lens prefix (SI, IC, LIR, AE, TS, OC, SCL, TDQ) used in review findings.

**Targets:** Claude Opus 4.7 behavioral defaults. Applies to 4.x-family unless noted otherwise.

---

## Opus 4.7 Foundations

Three behavioral shifts drive every rule below:

- **Literal execution.** 4.7 takes instructions as written on first read. It does not silently generalize from a singular object to a set, does not infer requests you didn’t make, and does not compensate for ambiguity by trying alternative readings. Scope must be stated.
- **Effort as the primary depth lever.** Sampling (`temperature`, `top_p`, `top_k`) and manual `thinking` budgets now return 400. `effort` (low / medium / high / xhigh / max) replaces them. Lower effort = tighter literalism, combined tool calls, terser output.
- **Conservative tool and subagent defaults.** Fewer tool calls and fewer subagents than 4.6 at equivalent effort. Capability-framed references (“you can use subagents”) under-fire; dispatches need explicit triggers.

Paired consequences: emphasis markers (CRITICAL, MUST, ALWAYS, ALL-CAPS) overtrigger on 4.7 — dial back what worked on 4.6. Prefill-based output shaping is gone — the last assistant turn cannot be prefilled. Response length auto-calibrates to perceived task complexity — state it positively if it matters.

---

## Structural Integrity (SI)

- **Every conditional has all branches defined.** If/else, when/unless, flag present/absent — no implicit “do nothing” paths. Dangling conditionals on destructive operations are the highest-severity structural defect; 4.7 hits the false branch with no fallback and halts.
- **Every file path reference resolves.** Relative paths must work from the prompt’s directory. Every internal section reference maps to an actual heading. Test with a fresh checkout.
- **One level of reference depth.** Prompt → reference file. Don’t nest further. A reference file that is long for its purpose needs a table of contents or clear section structure — use judgment rather than a fixed line count.
- **Pass paths to subagents, not content.** Subagents read files independently. Embedding file content in dispatch prompts wastes tokens in both contexts and biases the subagent toward the orchestrator’s framing.
- **Progress signals only when a downstream stage consumes them.** Keep stage-boundary checkpoints, log lines that recovery depends on, synthesis-input markers. Remove forced “after every N tool calls, summarize” instructions — 4.7 emits progress natively during agentic traces, and forced cadence competes with native behavior and causes overcompliance.
- **Internal self-consistency.** Output templates match generation instructions. Examples match stated rules. Argument defaults in a table match pipeline-body handling. Output schemas match what the generation step produces.
- **Prompt length matches instruction density.** No duplication between primary prompt and reference files. No explanations of concepts the model already knows (JSON syntax, markdown formatting, standard imperative constructions).
- **For skill targets: primary prompt stays proportional to its role.** If the SKILL.md is disproportionately long for its purpose and carries domain content that could move to reference files, move it. Use judgment, not a fixed line count.
- **For skill targets: frontmatter follows the agentskills.io spec.** `name` is lowercase-with-hyphens (≤64 chars). `description` is third-person, contains trigger phrases, describes what not how (≤1024 chars). `allowed-tools` lists tools the pipeline invokes.

## Instruction Clarity (IC)

- **Imperative voice for actions.** “Read the file at X” — not “The file should be read” or “Consider reading it.”
- **Declarative voice for rules.** “Validation is advisory, never blocking.” State invariants as facts; no “usually,” “typically,” “in most cases” on absolute rules.
- **One term per concept.** Don’t alternate between “spec” and “specification” and “spec document” for the same artifact. Fix the terminology when it is introduced and use it everywhere afterward.
- **Pronouns have one antecedent.** “Run the script. If it fails…” — “it” refers unambiguously to the script. Avoid pronouns when two plausible referents exist in the same scope. 4.7 does not re-read for alternative readings.
- **Constraints at the point of action.** A centralized block is fine — reinforce inline where the action happens. Don’t rely on the model remembering a rule from 100 lines earlier.
- **Sequence explicit.** “Step 1 completes before Step 2” or “Launch in parallel, in a single message” — document position alone is not a reliable ordering signal on 4.7 at lower effort levels.
- **Degrees of freedom match fragility.** File writes, git commands, destructive operations get exact instructions. Analysis, review, and judgment steps allow model discretion.
- **Contradictory readings are the worst case.** A directive with two plausible readings and no disambiguator is CRITICAL. A negatively-framed rule that could invert its intended meaning is CRITICAL. Positive framing (“do X”) is preferred; reach for a negative only when the prohibition itself is the point.

## Literal Interpretation Risk (LIR)

- **State scope with universal quantifiers.** “Every section,” “each finding,” “all files” — not “the section” when multiple exist. 4.7 applies singular-object instructions to whichever referent is syntactically closest and stops.
- **Specific verbs on fragile operations.** “Write the report to [PATH]” beats “handle the output.” “Emit a finding for every criterion scoring below 3” beats “process the results.” Vague verbs on file writes, destructive actions, or output generation produce under-execution rather than confident inference.
- **Generalizations stated explicitly.** If a rule applies to every item in a set, say so. Don’t spell out case 1 in detail and expect inference to cases 2 through N from a parenthetical like “(the remaining criteria follow the same pattern).”
- **Define team-specific context.** “Standard format,” “typical convention,” “common pitfalls” — if the meaning is team-specific, state it or cite a reference. Well-known domain conventions (standard JSON syntax, HTTP status codes) can stay implicit.
- **Literally-evaluable conditions.** “If the file exists” beats “when appropriate.” Subjective conditions need concrete criteria for the judgment — otherwise 4.7 at medium effort skips the branch.
- **Negative constraint scope is specific.** “Do not modify the target file” is specific. “Avoid unnecessary complexity” requires inferring what counts as unnecessary and may be skipped.
- **Vague verbs on destructive operations = CRITICAL.** “Handle,” “process,” “deal with,” “manage” applied to file writes, deletes, or state mutations. Replace with the concrete action, object, and destination.

## Attention Economy (AE)

- **Emphasis rare enough that each carries signal.** CRITICAL / MUST / ALWAYS / NEVER / ALL-CAPS are scarce tokens — the first carries strong weight, every subsequent instance diminishes the first. Judge qualitatively: if you can’t say which emphasized items are genuinely more consequential than the non-emphasized ones, you’ve overspent. 4.7 is more sensitive to emphasis than prior models — dial back what worked on 4.6.
- **Drop aggressive mandates on tools.** “Use this tool when…” beats “CRITICAL: You MUST use this tool when…” The aggressive framing now overtriggers on 4.7 rather than calibrating.
- **Motivate restrictions.** “Do not modify the target — the user reviews all changes, and modification corrupts re-run comparability” beats a bare “Do not modify the target.” Motivation lets the model generalize the rule to edge cases the prompt didn’t anticipate and weigh it against competing instructions.
- **Positive framing first.** “Write output to the cache directory” beats “Do not write output elsewhere.” When a negative is necessary, pair it with a positive alternative in the same sentence or bullet. Exception: documented 4.x-family anti-patterns you are explicitly suppressing (e.g., preamble suppression — “Do not start with ‘Here is…’”).
- **Every line serves the executing model.** Design rationale, extensibility notes, and maintainer commentary belong in documentation. Text that explains why the prompt was designed a certain way is not executable instruction and competes with surrounding instructions. Apply the removal test: if deleting a line would not change execution behavior, it belongs in docs.
- **Long prompts need navigable section structure.** When a prompt is long enough that linear attention drifts, replace wall-of-text paragraphs with sections, numbered stages, and consistent heading conventions so the model can locate an instruction at its point of need. Critical instructions stated once in a top-of-prompt introduction and never reinforced near the relevant action don’t survive the drift.
- **Tables need a “process every row” directive when diverse.** Short, uniform tables fit without extra instruction. Tables dense enough to compete with prose for attention — diverse behavior across rows, many rows, mixed cell formats — need an explicit “evaluate every row” directive. Place tables near their point of use.

## Trigger Specificity (TS)

- **Tool mentions need trigger conditions.** “Use the search tool when the user asks about recent events” — not just “the model has access to the search tool.” 4.7 uses tools less by default; implicit-trigger tools under-fire.
- **Subagent dispatch needs explicit conditions.** “Dispatch one subagent per dimension, in parallel, in a single message” — not “you can use subagents for complex work.” 4.7 spawns fewer subagents by default; capability-framed references may not produce dispatches.
- **For parallel tool use, include the canonical snippet or an equivalent explicit imperative.** Anthropic’s documented snippet:

  ```
  <use_parallel_tool_calls>
  For maximum efficiency, whenever you perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
  </use_parallel_tool_calls>
  ```

  Presence of this snippet or an explicit imperative like “Dispatch all X in a single message as parallel foreground subagents” satisfies the contract; absence with vague “run in parallel” language will produce sequential dispatch.

- **Judgment steps need reasoning cues.** “Think carefully about the tradeoffs before choosing” beats a bare “Evaluate the options.” Mechanical steps (read, write, compare, count) don’t need cues — synthesis, analysis, and tradeoff decisions do.
- **Exploratory actions need bounds or declared effort.** “Thoroughly investigate” without bounds under-delivers at low effort. Either bound the exploration (“check three representative cases”) or declare the required effort level for the operation.
- **Name decision points.** When the model must choose between approaches, name the choice and state the criteria. Implicit decisions get skipped on 4.7 — the model follows one path without recognizing the branch.

## Output Contract (OC)

- **Response length stated positively.** “Two to three sentences per finding” or “a concise summary under 100 words” beats “avoid being verbose.” 4.7 calibrates length to perceived complexity; unspecified length produces unpredictable output.
- **Format specified with schema, template, or example.** JSON outputs need a schema or template. Markdown reports need a section structure. Don’t rely on the model inferring format from context.
- **No prefill-dependent output.** Trailing assistant prefill returns 400 on 4.6+. Specify the full output format via instructions or structured-output mechanisms. Suppress preambles with direct instruction (“Respond directly without preamble — do not start with phrases like ‘Here is’ or ‘Based on’”) rather than prefill scaffolding.
- **Voice via positive exemplars.** “Use a warm, collaborative tone; acknowledge the user’s framing before answering,” with a short example of the target voice, beats “don’t be robotic.” 4.7’s default tone is more direct and opinionated than earlier models, so prompts that relied on a warmer baseline need explicit voice guidance.
- **Format matches the consumer.** Machine-consumed outputs use Structured Outputs (see SCL below). Human-read outputs use markdown. Don’t mix signals — markdown-heavy prompt style can bleed into free-text fields of JSON outputs in unintended ways.
- **Mixed “be concise but thorough” signals collapse.** The model resolves the contradiction by picking one. Pick one yourself and state it.

## Schema Constraint Legality (SCL)

- **Use Structured Outputs for any machine-consumed JSON.** `output_config.format` with `type: "json_schema"` on Messages API; `strict: true` on tool definitions. GA on Opus 4.7 and 4.5+, Sonnet 4.6/4.5, Haiku 4.5. First-use compilation cost; cached 24 hours. Incompatible with Citations and message prefilling.
- **Supported schema keywords only.** `type`, `properties`, `required`, `enum`, `description`, `additionalProperties`. Unsupported and silently dropped or failure-inducing in strict mode: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`, `minLength`, `maxLength`, `pattern` (beyond basic regex), `minItems`, `maxItems`, `uniqueItems`, `minProperties`, `maxProperties`.
- **Set `additionalProperties: false`.** Required for strict mode; omission is a common gap.
- **Limits.** 20 strict tools per request. 24 optional parameters max per tool. 16 union-typed parameters max across all tools. Recursive schemas unsupported.
- **Hard numeric/length constraints in prose trigger verification loops.** “Between 1 and 100,” “exactly 5 items,” “no bundle exceeds 6 elements” as invariants the model must self-verify before emitting cause hyper-literal verification loops on 4.x — the model counts its output, fears violation, reshuffles, recounts. Either soften to intent (“aim for roughly 5 items when the data supports it”) or pair with a downstream validator and frame the constraint as advisory.
- **Required properties appear first in Structured Outputs regardless of schema order.** Plan field ordering accordingly if consumers depend on stable layout.
- **Migration note.** If the prompt relies on `temperature`, `top_p`, `top_k`, manual `thinking.budget_tokens`, or assistant prefill, it returns 400 on 4.7. Remove them; use `effort` and Structured Outputs instead.

## Tool Description Quality (TDQ)

- **Tool `description` fields are prompt text.** They are injected into the system prompt and read as instructions. Every rule in the other lenses applies.
- **Drop emphasis markers in tool descriptions.** “CRITICAL: You MUST use this tool when…” and “ALWAYS call this before responding” overtrigger invocation on Opus 4.x. Use calm imperative: “Use this tool when [condition].”
- **State when to invoke, not only what the tool does.** A description that only describes capability leaves the trigger implicit. “Searches the code index and returns matches” becomes “Searches the code index when the user asks about symbols, file contents, or references. Returns ranked matches with file paths and line numbers.”
- **Calibrate parameter descriptions.** Wall-of-text descriptions on obvious parameters (name already tells the model everything) inflate token cost with no signal. Bare descriptions on genuinely ambiguous parameters leave the model to literalize an arbitrary interpretation — shape the parameter explicitly when its form is non-obvious.
- **Discipline the tool set.** Near-duplicate tools force the model to choose without stated criteria. Tools used so rarely that fixed overhead (~313–346 tokens per tool before parameters) dominates value should be removed. Prefer one capable tool with clear invocation conditions over two overlapping ones.
- **Test coverage of invocation.** On 4.7, default invocation is more conservative than 4.6. Tools whose triggers depend on inference may never fire — pay fixed cost for no value.

---

## Quick Authoring Checklist

Before shipping a prompt, verify:

1. **Scope** — Every instruction uses a universal quantifier when it applies to a set. No singular-object instruction where multiple referents exist.
2. **Branches** — Every conditional has both paths defined. Every error path reaches a terminal state.
3. **References** — Every path and internal section reference resolves. Subagent dispatches pass paths, not content.
4. **Emphasis budget** — Scan CRITICAL / MUST / ALWAYS / NEVER / ALL-CAPS markers. If you cannot name why each emphasized item is more consequential than the non-emphasized ones, cut until the remaining emphasis carries signal.
5. **Triggers** — Every tool mention, subagent dispatch, and reasoning-heavy step has an explicit trigger or reasoning cue. Parallel dispatch includes the canonical snippet or equivalent.
6. **Output contract** — Length stated positively. Format specified via schema, template, or example. No prefill dependence.
7. **Schema legality** — Only supported JSON Schema keywords. `additionalProperties: false` where needed. Hard numeric constraints softened or paired with a validator.
8. **Tool descriptions** — When-to-use clauses present. Emphasis markers removed. Parameter descriptions calibrated.
9. **Self-consistency** — Examples match stated rules. Output schemas match generation instructions. Argument defaults in tables match body handling.
10. **Every line earns its place** — Design rationale, maintainer commentary, and capability explanations live in docs. Remove anything whose deletion would not change execution behavior.
