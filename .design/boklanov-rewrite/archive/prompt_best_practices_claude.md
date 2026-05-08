https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

# Prompting best practice

Best practicesPrompt engineering

Comprehensive guide to prompt engineering techniques for Claude's latest models, covering clarity, examples, XML
structuring, thinking, and agentic systems.

This is the single reference for prompt engineering with Claude's latest models, including Claude Opus 4.7, Claude Opus
4.6, Claude Sonnet 4.6, and Claude Haiku 4.5. It covers foundational techniques, output control, tool use, thinking, and
agentic systems. Jump to the section that matches your situation.

For an overview of model capabilities, see
the [models overview](https://platform.claude.com/docs/en/about-claude/models/overview). For details on what's new in
Claude Opus 4.7,
see [What's new in Claude Opus 4.7](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7). For
migration guidance, see the [Migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide).

##

Prompting Claude Opus 4.7

Claude Opus 4.7 is our most capable generally available model, with particular strengths in long-horizon agentic work,
knowledge work, vision, and memory tasks. It performs well out of the box on existing Claude Opus 4.6 prompts. The
patterns below cover the behaviors that most often require tuning.

For API parameter changes when migrating from Claude Opus 4.6 (effort levels, task budgets, thinking configuration,
sampling-parameter removal, and tokenization), see
the [migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide#migrating-to-claude-opus-4-7).

###

Response length and verbosity

Claude Opus 4.7 calibrates response length to how complex it judges the task to be, rather than defaulting to a fixed
verbosity. This usually means shorter answers on simple lookups and much longer ones on open-ended analysis.

If your product depends on a certain style or verbosity of output, you may need to tune your prompts. As an example, to
decrease verbosity, you might add:

If you see specific examples of kinds of verbosity (i.e. over-explaining), you can add additional instructions in your
prompt to prevent them. Positive examples showing how Claude can communicate with the appropriate level of concision
tend to be more effective than negative examples or instructions that tell the model what not to do.

###

Calibrating effort and thinking depth

The [effort parameter](https://platform.claude.com/docs/en/build-with-claude/effort) allows you to tune Claude's
intelligence vs. token spend, trading off capability for faster speed and lower costs. Start with the new

```
xhigh
```

effort level for coding and agentic use cases, and use a minimum of

```
high
```

effort for most intelligence-sensitive use cases. Experiment with other effort levels to further tune token usage and
intelligence:

- \*\*
  ```
  max
  ```
  :\*\* Max effort can deliver performance gains in some use cases, but may show diminishing returns from increased token
  usage. This setting can also sometimes be prone to overthinking. We recommend testing max effort for
  intelligence-demanding tasks.
- \*\*
  ```
  xhigh
  ```
  (new):\*\* Extra high effort is the best setting for most coding and agentic use cases.
- \*\*
  ```
  high
  ```
  :\*\* This setting balances token usage and intelligence. For most intelligence-sensitive use cases, we recommend a
  minimum of
  ```
  high
  ```
  effort.
- \*\*
  ```
  medium
  ```
  :\*\* Good for cost-sensitive use cases that need to reduce token usage while trading off intelligence.
- \*\*
  ```
  low
  ```
  :\*\* Reserve for short, scoped tasks and latency-sensitive workloads that are not intelligence-sensitive.

Meaningfully changing from Claude Opus 4.6, Claude Opus 4.7 respects effort levels strictly, especially at the low end.
At

```
low
```

and

```
medium
```

, the model scopes its work to what was asked rather than going above and beyond. This is good for latency and cost, but
on moderately complex tasks running at

```
low
```

effort there is some risk of under-thinking.

If you observe shallow reasoning on complex problems, raise effort to

```
high
```

or

```
xhigh
```

rather than prompting around it. If you need to keep effort at

```
low
```

for latency, add targeted guidance:

We expect effort to be more important for this model than for any prior Opus, and recommend experimenting with it
actively when you upgrade.

The triggering behavior for adaptive thinking is steerable. If you find the model thinking more often than you'd like —
which can happen with large or complex system prompts — add guidance to steer it. As always, measure the effect of any
prompting changes on performance. Example:

Conversely, if you're running hard workloads at

```
medium
```

and seeing under-thinking, the first lever is to raise effort. If you need finer control, prompt for it directly.

If you are running Claude Opus 4.7 at

```
max
```

or

```
xhigh
```

effort, set a large max output token budget so the model has room to think and act across its subagents and tool calls.
We recommend starting at 64k tokens and tuning from there.

###

Tool use triggering

Claude Opus 4.7 has a tendency to use tools less often than Claude Opus 4.6 and to use reasoning more. This produces
better results in most cases. However, increasing the effort setting is a useful lever to increase the level of tool
usage, especially in knowledge work.

```
high
```

or

```
xhigh
```

effort settings show substantially more tool usage in agentic search and coding. For scenarios where you want more tool
use, you can also adjust your prompt to explicitly instruct the model about when and how to properly use its tools. For
instance, if you find that the model is not using your web search tools, clearly describe why and how it should.

###

User-facing progress updates

Claude Opus 4.7 provides more regular, higher-quality updates to the user throughout long agentic traces. If you've
added scaffolding to force interim status messages ("After every 3 tool calls, summarize progress"), try removing it. If
you find that the length or contents of Claude Opus 4.7's user-facing updates are not well-calibrated to your use case,
explicitly describe what these updates should look like in the prompt and provide examples.

###

More literal instruction following

Claude Opus 4.7 interprets prompts more literally and explicitly than Claude Opus 4.6, particularly at lower effort
levels. It will not silently generalize an instruction from one item to another, and it will not infer requests you
didn't make. The upside of this literalism is precision and less thrash, and it generally performs better for API use
cases with carefully tuned prompts, structured extraction, and pipelines where you want predictable behavior. If you
need Claude to apply an instruction broadly, state the scope explicitly (for example, "Apply this formatting to every
section, not just the first one").

###

Tone and writing style

As with any new model, prose style on long-form writing may shift. Claude Opus 4.7 is more direct and opinionated, with
less validation-forward phrasing and fewer emoji than Claude Opus 4.6's warmer style. If your product relies on a
specific voice, re-evaluate style prompts against the new baseline.

For instance, if your product voice is warmer or more conversational, add:

###

Controlling subagent spawning

Claude Opus 4.7 tends to spawn fewer subagents by default. However, this behavior is steerable through prompting; give
Claude Opus 4.7 explicit guidance around when subagents are desirable. A toy example for a coding use case:

###

Design and frontend defaults

Claude Opus 4.7 has stronger design instincts than Claude Opus 4.6, with a consistent default house style: warm
cream/off-white backgrounds (~

```
#F4F1EA
```

), serif display type (Georgia, Fraunces, Playfair), italic word-accents, and a terracotta/amber accent. This reads well
for editorial, hospitality, and portfolio briefs, but will feel off for dashboards, dev tools, fintech, healthcare, or
enterprise apps — and it appears in slide decks as well as web UIs.

This default is persistent. Generic instructions ("don't use cream," "make it clean and minimal") tend to shift the
model to a different fixed palette rather than producing variety. Two approaches work reliably:

**1\. Specify a concrete alternative.** The model follows explicit specs precisely:

**2\. Have the model propose options before building.** This breaks the default and gives users control. If you
previously relied on

```
temperature
```

for design variety, use this approach — it produces meaningfully different directions across runs. Example prompt:

Additionally, Claude Opus 4.7 requires less frontend design prompting than previous models to avoid generic patterns
that users call the "AI slop" aesthetic. With earlier models, we recommended a lengthier prompt snippet in
our [frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).
However, Claude Opus 4.7 generates distinctive, creative frontends with more minimal prompting guidance. This prompt
snippet works well with the above prompting advice for variety:

###

Interactive coding products

Claude Opus 4.7's token usage and behavior can differ between autonomous, asynchronous coding agents with a single user
turn and interactive, synchronous coding agents with multiple user turns. Specifically, it tends to use more tokens in
interactive settings, primarily because it reasons more after user turns. This can improve long-horizon coherence,
instruction following, and coding capabilities in long, interactive coding sessions, but also comes with more token
usage. To maximize both performance and token efficiency in coding products, we recommend using

```
xhigh
```

or

```
high
```

effort, adding autonomous features like an auto mode, and reducing the number of human interactions required from your
users.

Of course, when limiting the number of required user interactions, it's important to specify the task, intent, and
relevant constraints upfront in the first human turn. Providing well-specified, clear, and accurate task descriptions
upfront can help maximize autonomy and intelligence while minimizing extra token usage after user turns. We find that
because Claude Opus 4.7 is more autonomous than prior models, this usage pattern helps to maximize performance. In
contrast, ambiguous or underspecified prompts conveyed progressively over multiple user turns tend to relatively reduce
token efficiency and sometimes performance.

###

Code review harnesses

Claude Opus 4.7 is meaningfully better at finding bugs than prior models, and has both higher recall and precision in
our evals — 11pp better recall in one of our hardest bug-finding evals based on real Anthropic PRs. However, if your
code-review harness was tuned for an earlier model, you may initially see lower recall. This is likely a harness effect,
not a capability regression. When a review prompt says things like "only report high-severity issues," "be
conservative," or "don't nitpick," Claude Opus 4.7 may follow that instruction more faithfully than earlier models did —
it may investigate the code just as thoroughly, identify the bugs, and then not report findings it judges to be below
your stated bar. This can show up as the model doing the same depth of investigation but converting fewer investigations
into reported findings, especially on lower-severity bugs. Precision typically rises, but measured recall can fall even
though the model's underlying bug-finding ability has improved.

Some recommended prompt language:

This prompt can be used without having an actual second step, but moving confidence filtering out of the finding step
often helps. If your harness has a separate verification, deduplication, or ranking stage, tell the model explicitly
that its job at the finding stage is coverage rather than filtering.

If you do want the model to self-filter in a single pass, be concrete about where the bar is rather than using
qualitative terms like "important" — for example, "report any bugs that could cause incorrect behavior, a test failure,
or a misleading result; only omit nits like pure style or naming preferences."

We recommend iterating on prompts against a subset of your evals or test cases to validate recall or F1 score gains.

###

Computer use

[Computer use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool) capability works across
resolutions, up to a new maximum resolution of 2576px / 3.75MP. In our computer use testing, we find that sending images
at 1080p provides a good balance of performance and cost.

For particularly cost-sensitive workloads, we recommend 720p or 1366×768 as lower-cost options with strong performance.
We recommend that you conduct your own testing to find the ideal settings for your use case; experimenting with effort
settings can also help tune the model's behavior.

##

General principles

###

Be clear and direct

Claude responds well to clear, explicit instructions. Being specific about your desired output can help enhance results.
If you want "above and beyond" behavior, explicitly request it rather than relying on the model to infer this from vague
prompts.

Think of Claude as a brilliant but new employee who lacks context on your norms and workflows. The more precisely you
explain what you want, the better the result.

**Golden rule:** Show your prompt to a colleague with minimal context on the task and ask them to follow it. If they'd
be confused, Claude will be too.

- Be specific about the desired output format and constraints.
- Provide instructions as sequential steps using numbered lists or bullet points when the order or completeness of steps
  matters.

###

Add context to improve performance

Providing context or motivation behind your instructions, such as explaining to Claude why such behavior is important,
can help Claude better understand your goals and deliver more targeted responses.

Claude is smart enough to generalize from the explanation.

###

Use examples effectively

Examples are one of the most reliable ways to steer Claude's output format, tone, and structure. A few well-crafted
examples (known as few-shot or multishot prompting) can dramatically improve accuracy and consistency.

When adding examples, make them:

- **Relevant:** Mirror your actual use case closely.
- **Diverse:** Cover edge cases and vary enough that Claude doesn't pick up unintended patterns.
- **Structured:** Wrap examples in
  ```
  <example>
  ```
  tags (multiple examples in
  ```
  <examples>
  ```
  tags) so Claude can distinguish them from instructions.

Include 3–5 examples for best results. You can also ask Claude to evaluate your examples for relevance and diversity, or
to generate additional ones based on your initial set.

XML tags help Claude parse complex prompts unambiguously, especially when your prompt mixes instructions, context,
examples, and variable inputs. Wrapping each type of content in its own tag (e.g.

```
<instructions>
```

,

```
<context>
```

,

```
<input>
```

) reduces misinterpretation.

Best practices:

- Use consistent, descriptive tag names across your prompts.
- Nest tags when content has a natural hierarchy (documents inside
  ```
  <documents>
  ```
  , each inside
  ```
  <document index="n">
  ```
  ).

###

Give Claude a role

Setting a role in the system prompt focuses Claude's behavior and tone for your use case. Even a single sentence makes a
difference:

###

Long context prompting

When working with large documents or data-rich inputs (20k+ tokens), structure your prompt carefully to get the best
results:

- **Put longform data at the top**: Place your long documents and inputs near the top of your prompt, above your query,
  instructions, and examples. This can significantly improve performance across all models.

  Queries at the end can improve response quality by up to 30% in tests, especially with complex, multi-document inputs.

- **Structure document content and metadata with XML tags**: When using multiple documents, wrap each document in

  ```
  <document>
  ```

  tags with

  ```
  <document_content>
  ```

  and

  ```
  <source>
  ```

  (and other metadata) subtags for clarity.

- **Ground responses in quotes**: For long document tasks, ask Claude to quote relevant parts of the documents first
  before carrying out its task. This helps Claude cut through the noise of the rest of the document's contents.

###

Model self-knowledge

If you would like Claude to identify itself correctly in your application or use specific API strings:

For LLM-powered apps that need to specify model strings:

##

Output and formatting

###

Communication style and verbosity

Claude's latest models have a more concise and natural communication style compared to previous models:

- **More direct and grounded:** Provides fact-based progress reports rather than self-celebratory updates
- **More conversational:** Slightly more fluent and colloquial, less machine-like
- **Less verbose:** May skip detailed summaries for efficiency unless prompted otherwise

This means Claude may skip verbal summaries after tool calls, jumping directly to the next action. If you prefer more
visibility into its reasoning:

###

Control the format of responses

There are a few particularly effective ways to steer output formatting:

1. **Tell Claude what to do instead of what not to do**

2. Instead of: "Do not use markdown in your response"
3. Try: "Your response should be composed of smoothly flowing prose paragraphs."

4. **Use XML format indicators**

5. Try: "Write the prose sections of your response in <smoothly_flowing_prose_paragraphs> tags."

6. **Match your prompt style to the desired output**

   The formatting style used in your prompt may influence Claude's response style. If you are still experiencing
   steerability issues with output formatting, try matching your prompt style to your desired output style as closely as
   possible. For example, removing markdown from your prompt can reduce the volume of markdown in the output.

7. **Use detailed prompts for specific formatting preferences**

   For more control over markdown and formatting usage, provide explicit guidance:

###

LaTeX output

Claude Opus 4.6 defaults to LaTeX for mathematical expressions, equations, and technical explanations. If you prefer
plain text, add the following instructions to your prompt:

###

Document creation

Claude's latest models excel at creating presentations, animations, and visual documents with impressive creative flair
and strong instruction following. The models produce polished, usable output on the first try in most cases.

For best results with document creation:

###

Migrating away from prefilled responses

Starting with Claude 4.6 models and [Claude Mythos Preview](https://anthropic.com/glasswing), prefilled responses on the
last assistant turn are no longer supported. On Mythos Preview, requests with prefilled assistant messages return a 400
error. Model intelligence and instruction following has advanced such that most use cases of prefill no longer require
it. Existing models will continue to support prefills, and adding assistant messages elsewhere in the conversation is
not affected.

Here are common prefill scenarios and how to migrate away from them:

##

Tool use

###

Tool usage

Claude's latest models are trained for precise instruction following and benefit from explicit direction to use specific
tools. If you say "can you suggest some changes," Claude will sometimes provide suggestions rather than implementing
them, even if making changes might be what you intended.

For Claude to take action, be more explicit:

To make Claude more proactive about taking action by default, you can add this to your system prompt:

On the other hand, if you want the model to be more hesitant by default, less prone to jumping straight into
implementations, and only take action if requested, you can steer this behavior with a prompt like the below:

Claude Opus 4.5 and Claude Opus 4.6 are also more responsive to the system prompt than previous models. If your prompts
were designed to reduce undertriggering on tools or skills, these models may now overtrigger. The fix is to dial back
any aggressive language. Where you might have said "CRITICAL: You MUST use this tool when...", you can use more normal
prompting like "Use this tool when...".

###

Optimize parallel tool calling

Claude's latest models excel at parallel tool execution. These models will:

- Run multiple speculative searches during research
- Read several files at once to build context faster
- Execute bash commands in parallel (which can even bottleneck system performance)

This behavior is easily steerable. While the model has a high success rate in parallel tool calling without prompting,
you can boost this to ~100% or adjust the aggression level:

##

Thinking and reasoning

###

Overthinking and excessive thoroughness

Claude Opus 4.6 does significantly more upfront exploration than previous models, especially at higher

```
effort
```

settings. This initial work often helps to optimize the final results, but the model may gather extensive context or
pursue multiple threads of research without being prompted. If your prompts previously encouraged the model to be more
thorough, you should tune that guidance for Claude Opus 4.6:

- **Replace blanket defaults with more targeted instructions.** Instead of "Default to using \[tool\]," add guidance
  like "Use \[tool\] when it would enhance your understanding of the problem."
- **Remove over-prompting.** Tools that undertriggered in previous models are likely to trigger appropriately now.
  Instructions like "If in doubt, use \[tool\]" will cause overtriggering.
- **Use effort as a fallback.** If Claude continues to be overly aggressive, use a lower setting for
  ```
  effort
  ```
  .

In some cases, Claude Opus 4.6 may think extensively, which can inflate thinking tokens and slow down responses. If this
behavior is undesirable, you can add explicit instructions to constrain its reasoning, or you can lower the

```
effort
```

setting to reduce overall thinking and token usage.

If you need a hard ceiling on thinking costs, extended thinking with a

```
budget_tokens
```

cap is still functional on Opus 4.6 and Sonnet 4.6 but is deprecated. Prefer lowering
the [effort](https://platform.claude.com/docs/en/build-with-claude/effort) setting or using

```
max_tokens
```

as a hard limit with [adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking).

###

Leverage thinking & interleaved thinking capabilities

Claude's latest models offer thinking capabilities that can be especially helpful for tasks involving reflection after
tool use or complex multi-step reasoning. You can guide its initial or interleaved thinking for better results.

Claude Opus 4.6 and Claude Sonnet 4.6
use [adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) (

```
thinking: {type: "adaptive"}
```

), where Claude dynamically decides when and how much to think. Claude calibrates its thinking based on two factors: the

```
effort
```

parameter and query complexity. Higher effort elicits more thinking, and more complex queries do the same. On easier
queries that don't require thinking, the model responds directly. In internal evaluations, adaptive thinking reliably
drives better performance than extended thinking. Consider moving to adaptive thinking to get the most intelligent
responses.

Use adaptive thinking for workloads that require agentic behavior such as multi-step tool use, complex coding tasks, and
long-horizon agent loops. Older models use manual thinking mode with

```
budget_tokens
```

.

You can guide Claude's thinking behavior:

The triggering behavior for adaptive thinking is promptable. If you find the model thinking more often than you'd like,
which can happen with large or complex system prompts, add guidance to steer it:

If you are migrating from [extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
with

```
budget_tokens
```

, replace your thinking configuration and move budget control to

```
effort
```

:

**Before (extended thinking, older models):**

**After (adaptive thinking):**

If you are not using extended thinking, no changes are required. Thinking is off by default when you omit the

```
thinking
```

parameter.

- **Prefer general instructions over prescriptive steps.** A prompt like "think thoroughly" often produces better
  reasoning than a hand-written step-by-step plan. Claude's reasoning frequently exceeds what a human would prescribe.
- **Multishot examples work with thinking.** Use
  ```
  <thinking>
  ```
  tags inside your few-shot examples to show Claude the reasoning pattern. It will generalize that style to its own
  extended thinking blocks.
- **Manual CoT as a fallback.** When thinking is off, you can still encourage step-by-step reasoning by asking Claude to
  think through the problem. Use structured tags like
  ```
  <thinking>
  ```
  and
  ```
  <answer>
  ```
  to cleanly separate reasoning from the final output.
- **Ask Claude to self-check.** Append something like "Before you finish, verify your answer against \[test criteria\]."
  This catches errors reliably, especially for coding and math.

When extended thinking is disabled, Claude Opus 4.5 is particularly sensitive to the word "think" and its variants.
Consider using alternatives like "consider," "evaluate," or "reason through" in those cases.

For more information on thinking capabilities,
see [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
and [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking).

##

Agentic systems

###

Long-horizon reasoning and state tracking

Claude's latest models excel at long-horizon reasoning tasks with exceptional state tracking capabilities. Claude
maintains orientation across extended sessions by focusing on incremental progress, making steady advances on a few
things at a time rather than attempting everything at once. This capability especially emerges over multiple context
windows or task iterations, where Claude can work on a complex task, save the state, and continue with a fresh context
window.

####

Context awareness and multi-window workflows

Claude 4.6 and Claude 4.5 models
feature [context awareness](https://platform.claude.com/docs/en/build-with-claude/context-windows#context-awareness-in-claude-sonnet-4-6-sonnet-4-5-and-haiku-4-5),
enabling the model to track its remaining context window (i.e. "token budget") throughout a conversation. This enables
Claude to execute tasks and manage context more effectively by understanding how much space it has to work.

**Managing context limits:**

If you are using Claude in an agent harness that compacts context or allows saving context to external files (like in
Claude Code), consider adding this information to your prompt so Claude can behave accordingly. Otherwise, Claude may
sometimes naturally try to wrap up work as it approaches the context limit. Below is an example prompt:

The [memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) pairs naturally with
context awareness for seamless context transitions.

####

Multi-context window workflows

For tasks spanning multiple context windows:

1. **Use a different prompt for the very first context window**: Use the first context window to set up a framework (
   write tests, create setup scripts), then use future context windows to iterate on a todo-list.

2. **Have the model write tests in a structured format**: Ask Claude to create tests before starting work and keep track
   of them in a structured format (e.g.,

   ```
   tests.json
   ```

   ). This leads to better long-term ability to iterate. Remind Claude of the importance of tests: "It is unacceptable
   to remove or edit tests because this could lead to missing or buggy functionality."

3. **Set up quality of life tools**: Encourage Claude to create setup scripts (e.g.,

   ```
   init.sh
   ```

   ) to gracefully start servers, run test suites, and linters. This prevents repeated work when continuing from a fresh
   context window.

4. **Starting fresh vs compacting**: When a context window is cleared, consider starting with a brand new context window
   rather than using compaction. Claude's latest models are extremely effective at discovering state from the local
   filesystem. In some cases, you may want to take advantage of this over compaction. Be prescriptive about how it
   should start:

5. "Call pwd; you can only read and write files in this directory."
6. "Review progress.txt, tests.json, and the git logs."
7. "Manually run through a fundamental integration test before moving on to implementing new features."

8. **Provide verification tools**: As the length of autonomous tasks grows, Claude needs to verify correctness without
   continuous human feedback. Tools like Playwright MCP server or computer use capabilities for testing UIs are helpful.

9. **Encourage complete usage of context**: Prompt Claude to efficiently complete components before moving on:

####

State management best practices

- **Use structured formats for state data**: When tracking structured information (like test results or task status),
  use JSON or other structured formats to help Claude understand schema requirements
- **Use unstructured text for progress notes**: Freeform progress notes work well for tracking general progress and
  context
- **Use git for state tracking**: Git provides a log of what's been done and checkpoints that can be restored. Claude's
  latest models perform especially well in using git to track state across multiple sessions.
- **Emphasize incremental progress**: Explicitly ask Claude to keep track of its progress and focus on incremental work

###

Balancing autonomy and safety

Without guidance, Claude Opus 4.6 may take actions that are difficult to reverse or affect shared systems, such as
deleting files, force-pushing, or posting to external services. If you want Claude Opus 4.6 to confirm before taking
potentially risky actions, add guidance to your prompt:

###

Research and information gathering

Claude's latest models demonstrate exceptional agentic search capabilities and can find and synthesize information from
multiple sources effectively. For optimal research results:

1. **Provide clear success criteria**: Define what constitutes a successful answer to your research question

2. **Encourage source verification**: Ask Claude to verify information across multiple sources

3. **For complex research tasks, use a structured approach**:

This structured approach allows Claude to find and synthesize virtually any piece of information and iteratively
critique its findings, no matter the size of the corpus.

###

Subagent orchestration

Claude's latest models demonstrate significantly improved native subagent orchestration capabilities. These models can
recognize when tasks would benefit from delegating work to specialized subagents and do so proactively without requiring
explicit instruction.

To take advantage of this behavior:

1. **Ensure well-defined subagent tools**: Have subagent tools available and described in tool definitions
2. **Let Claude orchestrate naturally**: Claude will delegate appropriately without explicit instruction
3. **Watch for overuse**: Claude Opus 4.6 has a strong predilection for subagents and may spawn them in situations where
   a simpler, direct approach would suffice. For example, the model may spawn subagents for code exploration when a
   direct grep call is faster and sufficient.

If you're seeing excessive subagent use, add explicit guidance about when subagents are and aren't warranted:

###

Chain complex prompts

With adaptive thinking and subagent orchestration, Claude handles most multi-step reasoning internally. Explicit prompt
chaining (breaking a task into sequential API calls) is still useful when you need to inspect intermediate outputs or
enforce a specific pipeline structure.

The most common chaining pattern is **self-correction**: generate a draft → have Claude review it against criteria →
have Claude refine based on the review. Each step is a separate API call so you can log, evaluate, or branch at any
point.

###

Reduce file creation in agentic coding

Claude's latest models may sometimes create new files for testing and iteration purposes, particularly when working with
code. This approach allows Claude to use files, especially python scripts, as a 'temporary scratchpad' before saving its
final output. Using temporary files can improve outcomes particularly for agentic coding use cases.

If you'd prefer to minimize net new file creation, you can instruct Claude to clean up after itself:

###

Overeagerness

Claude Opus 4.5 and Claude Opus 4.6 have a tendency to overengineer by creating extra files, adding unnecessary
abstractions, or building in flexibility that wasn't requested. If you're seeing this undesired behavior, add specific
guidance to keep solutions minimal.

For example:

###

Avoid focusing on passing tests and hard-coding

Claude can sometimes focus too heavily on making tests pass at the expense of more general solutions, or may use
workarounds like helper scripts for complex refactoring instead of using standard tools directly. To prevent this
behavior and ensure robust, generalizable solutions:

###

Minimizing hallucinations in agentic coding

Claude's latest models are less prone to hallucinations and give more accurate, grounded, intelligent answers based on
the code. To encourage this behavior even more and minimize hallucinations:

##

Capability-specific tips

###

Improved vision capabilities

Claude Opus 4.5 and Claude Opus 4.6 have improved vision capabilities compared to previous Claude models. They perform
better on image processing and data extraction tasks, particularly when there are multiple images present in context.
These improvements carry over to computer use, where the models can more reliably interpret screenshots and UI elements.
You can also use these models to analyze videos by breaking them up into frames.

One technique that has proven effective to further boost performance is to give Claude a crop tool
or [skill](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview). Testing has shown consistent
uplift on image evaluations when Claude is able to "zoom" in on relevant regions of an image. Anthropic has created
a [cookbook for the crop tool](https://platform.claude.com/cookbook/multimodal-crop-tool).

###

Frontend design

Claude Opus 4.5 and Claude Opus 4.6 excel at building complex, real-world web applications with strong frontend design.
However, without guidance, models can default to generic patterns that create what users call the "AI slop" aesthetic.
To create distinctive, creative frontends that surprise and delight:

For a detailed guide on improving frontend design, see the blog post
on [improving frontend design through skills](https://www.claude.com/blog/improving-frontend-design-through-skills).

Here's a system prompt snippet you can use to encourage better frontend design:

You can also refer to
the [full skill definition](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).

##

Migration considerations

When migrating to Claude 4.6 models from earlier generations:

1. **Be specific about desired behavior**: Consider describing exactly what you'd like to see in the output.

2. **Frame your instructions with modifiers**: Adding modifiers that encourage Claude to increase the quality and detail
   of its output can help better shape Claude's performance. For example, instead of "Create an analytics dashboard",
   use "Create an analytics dashboard. Include as many relevant features and interactions as possible. Go beyond the
   basics to create a fully-featured implementation."

3. **Request specific features explicitly**: Animations and interactive elements should be requested explicitly when
   desired.

4. **Update thinking configuration**: Claude 4.6 models
   use [adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) (

   ```
   thinking: {type: "adaptive"}
   ```

   ) instead of manual thinking with

   ```
   budget_tokens
   ```

   . Use the [effort parameter](https://platform.claude.com/docs/en/build-with-claude/effort) to control thinking depth.

5. **Migrate away from prefilled responses**: Prefilled responses on the last assistant turn are deprecated starting
   with Claude 4.6 models. See [Migrating away from prefilled responses](#migrating-away-from-prefilled-responses) for
   detailed guidance on alternatives.

6. **Tune anti-laziness prompting**: If your prompts previously encouraged the model to be more thorough or use tools
   more aggressively, dial back that guidance. Claude 4.6 models are significantly more proactive and may overtrigger on
   instructions that were needed for previous models.

For detailed migration steps, see
the [Migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide).

###

Migrating from Claude Sonnet 4.5 to Claude Sonnet 4.6

Claude Sonnet 4.6 defaults to an effort level of

```
high
```

, in contrast to Claude Sonnet 4.5 which had no effort parameter. Consider adjusting the effort parameter as you migrate
from Claude Sonnet 4.5 to Claude Sonnet 4.6. If not explicitly set, you may experience higher latency with the default
effort level.

**Recommended effort settings:**

- **Medium** for most applications
- **Low** for high-volume or latency-sensitive workloads
- Set a large max output token budget (64k tokens recommended) at medium or high effort to give the model room to think
  and act

**When to use Opus 4.7 instead:** For the hardest, longest-horizon problems (large-scale code migrations, deep research,
extended autonomous work), Opus 4.7 remains the right choice. Sonnet 4.6 is optimized for workloads where fast
turnaround and cost efficiency matter most.

####

If you're not using extended thinking

If you're not using extended thinking on Claude Sonnet 4.5, you can continue without it on Claude Sonnet 4.6. You should
explicitly set effort to the level appropriate for your use case. At

```
low
```

effort with thinking disabled, you can expect similar or better performance relative to Claude Sonnet 4.5 with no
extended thinking.

####

If you're using extended thinking

If you're using extended thinking with

```
budget_tokens
```

on Claude Sonnet 4.5, it is still functional on Claude Sonnet 4.6 but is deprecated. Migrate
to [adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) with
the [effort parameter](https://platform.claude.com/docs/en/build-with-claude/effort).

##### Migrating to adaptive thinking

Adaptive thinking is particularly well suited to the following workload patterns:

- **Autonomous multi-step agents:** coding agents that turn requirements into working software, data analysis pipelines,
  and bug finding where the model runs independently across many steps. Adaptive thinking lets the model calibrate its
  reasoning per step, staying on path over longer trajectories. For these workloads, start at
  ```
  high
  ```
  effort. If latency or token usage is a concern, scale down to
  ```
  medium
  ```
  .
- **Computer use agents:** Claude Sonnet 4.6 achieved best-in-class accuracy on computer use evaluations using adaptive
  mode.
- **Bimodal workloads:** a mix of easy and hard tasks where adaptive skips thinking on simple queries and reasons deeply
  on complex ones.

When using adaptive thinking, evaluate

```
medium
```

and

```
high
```

effort on your tasks. The right level depends on your workload's tradeoff between quality, latency, and token usage.

##### Keeping budget_tokens during migration

If you need to keep

```
budget_tokens
```

temporarily while migrating, a budget around 16k tokens provides headroom for harder problems without risk of runaway
token usage. This configuration is deprecated and will be removed in a future model release.

**For coding use cases** (agentic coding, tool-heavy workflows, code generation), start with

```
medium
```

effort:

**For chat and non-coding use cases** (chat, content generation, search, classification), start with

```
low
```

effort:

Was this page helpful?
