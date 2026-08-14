# Source map

What each lesson draws on, and where the material stops.

Source notes are private research notes. Only the exact filenames appear here and in the manifest's `sourceNotes` fields. No vault location, employer, client, project or unpublished workplace detail appears anywhere in learner-facing content.

One filename, `You Don’t Need to Be an AI Expert to Build with Generative AI.md`, contains a typographic apostrophe. It is reproduced exactly because the verifier compares source lists byte for byte.

## Core lessons

### Lesson 1: `stop-asking-isolated-questions`

- `Using AI to do actual work.md`: the audience framing, the distinction between asking a question and putting work in front of a model, and the point that a free tier with a default model and a quick question is a misleading trial.
- `Workflow for building with AI.md`: used only as a contrast. It is two bullets and a broken reference, not a developed method, and nothing in the lesson presents it as one.
- `You Don’t Need to Be an AI Expert to Build with Generative AI.md`: the low-barrier entry point only. Its prose and examples are an early generic draft and none of it is reproduced.

Boundaries: the claim in the first note that professionals have a twelve-month window of advantage is excluded. The permission and data-classification flow is original course material because the notes do not cover it.

### Lesson 2: `test-behaviour-not-brand-loyalty`

- `A Miss Is a Bug Report Against Your Setup.md`: the verdict reflex against the bug-report reflex, and the filter that separates a recurring gap from a current ceiling.
- `AI Workflow Talk - Overview.md`: interrupts read as context-access failures, and the raise-your-aspirations framing.
- `AI Workflow Talk - Script.md`: practical ambition and the honest trust boundary.
- `Using AI to do actual work.md`: literacy about behaviour rather than loyalty to a tool.

Boundaries: no stable taxonomy of model philosophies and no vendor-specific failure modes. That material dates quickly and the notes contain no current verified comparison. The lesson teaches observation and requires the learner to date their own conclusions. The claim that every interrupt is a context failure is deliberately softened, with ambiguity, missing authority and current limits kept as alternative causes.

### Lesson 3: `turn-answers-into-reusable-rules`

- `AI Workflow Talk - Overview.md`: policy over answers, and the cache framing for interrupts.
- `Knowledge Bank as Agent Working Memory.md`: the read, verify, use and revise loop, and the point that a field with no maintenance trigger becomes noise.
- `Knowledge Work Should Accrete.md`: the accretion argument.

Boundaries: the accretion note is a literature note, not original argument. The lesson attributes the idea to Andy Matuschak and names Soenke Ahrens for the permanent-reservoir point, as the note does. The compound-interest rate figures quoted in that note are excluded because they support no claim this course makes.

### Lesson 4: `route-context-and-give-it-an-update-trigger`

- `Agent Harnesses Need Update Loops.md`: committed context is a generated surface and needs a regeneration path.
- `Agentic Memory as Lifecycle.md`: the six stages, and the argument that maintenance between storage and retrieval is the neglected one.
- `Always-On Agent Context Is a Router.md`: the routing model and the four homes for context.
- `CoALA Memory Taxonomy.md`: the four memory types, used to make "give it more context" a precise request.
- `Conventions AGENTS.md vs Skills.md`: the two-question filter and the delete, move, keep triage.
- `Generated Docs as Drift Defense.md`: generated reference protects mechanical surfaces and not hand-written explanation.
- `Golden Context as Context Substrate.md`: evidence pools are inputs rather than context, and the drift rules for docs against live sources.

Boundaries: the memory taxonomy is attributed as the note carries it, to Sumers and colleagues in 2023. Repository file names, company examples and internal page references from these notes are excluded from the core lesson and appear only in the optional extension where they are generic.

### Lesson 5: `use-policy-workflow-or-agent-on-purpose`

- `AI-Native Product Development Working Model.md`: explicit constraints in place of repeated permission gates, and approval as an exception rather than a routine.
- `Governed Agent Architecture.md`: layer separation and the graduation loop, including the rule that a system may draft a promotion but a person approves it.
- `Policy vs Workflow vs Agent.md`: the definitions and the ordered decision test.

Boundaries: the working-model note is an internal document. Its operating principles are used; its author, employer, internal examples and figures are not. The standards body reference in the ladder note is not reproduced because the course carries no learner-facing links.

### Lesson 6: `audit-the-substrate-before-adding-ai`

- `Deterministic Before LLM.md`: the exact-work-first rule, the honest behaviour required when the model is unavailable, and the decision test.
- `Governed Agent Architecture.md`: the model as a bounded interpreter inside a system that keeps the decision.
- `Substrate Audits Before AI Features.md`: the audit checklist and the prerequisite-work framing.

Boundaries: the seven checks are translated out of software vocabulary into process vocabulary. No guarantee is made that a deterministic-first design always costs less or performs better; the notes give a design rule and cases, not benchmark evidence. The stakeholder-update case is original.

### Lesson 7: `derive-expectations-from-the-requirement`

- `AI-Era Learning.md`: framing and drift detection as the two things that cannot be outsourced without cost.
- `Teaching Senior Engineers.md`: predict before you run, verify before you publish, and the demonstrable-artefact posture.
- `Tests Fail on Realistic Bugs.md`: the five-question gate and the banned weak patterns.

Boundaries: the teaching note is pedagogy built for one project and one learner. Only the transferable rules are used, and none of its project setup, tooling or session conventions appear. All three worked check repairs are original course material.

### Lesson 8: `fail-cheaply-before-you-mutate`

- `AI-Native Product Development Working Model.md`: build-first validation and the coherence risk that comes with it.
- `Front-Load the Checks That Can Fail.md`: ordering by failure likelihood and by cost or irreversibility, and the preflight, snapshot, mutate shape.
- `Scenario-Driven Development.md`: situation, outcome criteria, validation evidence, then implementation work.
- `The Type System Is the Recovery Oracle for a Dead Agent.md`: recovery evidence, used in the optional extension rather than the core.

Boundaries: the scenario note is an internal draft. The pattern is used; its internal outcome figures and named individuals are excluded. Core exercises keep every side effect simulated or low risk.

### Lesson 9: `stop-the-system-from-guessing`

- `Citations Required, Validator Enforces.md`: the two halves of the evidence contract, filters applied before the prompt, citation adjacency in human-facing documents, the refusal path, and the separation of provenance from support.
- `Guardrails Are the Product.md`: the guessing test, assumptions treated as evidence, and explainability as inspectable artefacts.
- `Substrate Audits Before AI Features.md`: the privacy gate and evidence shape.

Boundaries: no claim that a valid citation proves a claim is supported. The supplier-review source contract is original and contains no code or query examples, because the notes' examples are software-specific.

### Lesson 10: `leave-a-replayable-decision-trace`

- `Decision Trace Is the Explanation.md`: the trace fields, replay, and the explicit limits of what a trace proves.
- `Governed Agent Architecture.md`: the separation of evidence, policy, workflow and action.
- `Guardrails Are the Product.md`: assumptions as evidence, and inspectable artefacts instead of hidden reasoning.
- `Review maps for agent-written PRs.md`: the map shape, its length limits, and the author-map against reviewer-map distinction.

Boundaries: the lesson states in the learner text that a trace proves propagation through a rule and nothing more. The policy-engine decision-log prior art is described generically in the optional extension with no product named.

### Lesson 11: `treat-done-as-a-claim`

- `AI Workflow Talk - Script.md`: full automation as a deliberate risk choice, with trust and learning as the honest reasons to stay in the loop.
- `Parallel Agent Work Needs a Closing Ledger.md`: the state model and the closing fields.
- `Review maps for agent-written PRs.md`: the relationship between a map for one artefact and a ledger for a batch.

Boundaries: the ledger is generalised so it works when delegation means asking a colleague or a general tool. Branch, worktree and thread vocabulary stays in the optional extension.

### Lesson 12: `design-for-automation-failure`

- `AI Workflow Talk - Overview.md`: minimal blast radius, and reporting adjacent observations instead of acting on them.
- `Automation Outruns the Prompt.md`: the readiness race, the rule to suspect timing before content, and the harmless diagnostic that proves it without submitting anything.
- `Front-Load the Checks That Can Fail.md`: preflight ordering.
- `Rules for AI in cursor.md`: only the durable principles, namely small changes, frequent checks, considering at least three causes before choosing one, and stating the problem plainly before fixing it.

Boundaries: the rules file mixes durable principles with stack-specific and dated advice, and it carries a no-interruption stance that conflicts with the more careful trust position elsewhere in the material. It is not presented as a model ruleset and none of its framework, package or tooling rules are used. The specific vendor product and credential mechanism in the timing note are not named.

### Lesson 13: `pay-back-some-of-the-speed`

- `AI-Era Learning.md`: understanding as the scarce input, and the budget reframe.
- `Outsource the work, not the understanding.md`: five investigation questions plus the sixth explain-it-closed test, and the distinction between review and investigation.
- `Teaching Senior Engineers.md`: teach-back and predict-before-you-check.

Boundaries: the source essay's repayment shape is presented as one practitioner's rule on their own projects, not as a ratio to copy. No fixed time saving is claimed anywhere. The essay's product, protocol and provider details are excluded.

### Lesson 14: `turn-misses-into-system-improvements`

- `A Miss Is a Bug Report Against Your Setup.md`: the triage filter and the timebox, including the author's own stated failure mode.
- `Agent Harnesses Need Update Loops.md`: system improvements need a maintenance path.
- `Craft Relocates, It Doesn't Die.md`: the loop is portable, and what is genuinely lost is narrower than the whole craft.
- `Knowledge Bank as Agent Working Memory.md`: the working loop and the stale-metadata lesson.
- `Knowledge Work Should Accrete.md`: durable learning should accumulate rather than disappear.
- `LLMs Unbundled the Two Rewards of Programming.md`: the reward split and its caveat.
- `Which Reward Were You Chasing.md`: the fuller argument and the honest catch.

Boundaries: the two-rewards material is written so it cannot read as a personality test, and the caveat that most people feel both rewards in some ratio is kept in the learner text. The named article and author that prompted the source essay are not reproduced. The capstone instructions embedded in this lesson are original course material.

### Lesson 15: `separate-chat-from-delegated-work`

- `ai-work-school-public-research.md`: the current cross-product distinction between quick conversation and delegated multi-step work, plus the durable findings that a job needs scope, inputs, permissions, checks and escalation and that human responsibility remains attached to adopted output.
- [We're building the culture of AI work right now](https://www.bhekani.com/posts/were-building-the-culture-of-ai-work-right-now/), dated 16 March 2026: the shift from raw drafting towards direction, evaluation and judgement, and the argument that adoption keeps responsibility with the person who stands behind the result.

Boundaries: the lesson teaches a vendor-neutral work-surface decision. It does not claim that delegated work is always preferable, that a product can absorb professional responsibility, or that multi-step execution is reliable merely because it is documented.

### Lesson 16: `map-current-work-surfaces`

- `ai-work-school-public-research.md`: the dated product terminology and capability inventory, evidence limits and plan, platform, licence and administrator caveats.
- [ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex), checked 14 August 2026: ChatGPT Work as the OpenAI surface for longer multi-step professional work and Codex as the dedicated software-development and technical-work surface.
- [Get started with Claude Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork), checked 14 August 2026: Claude Cowork as Anthropic's agentic knowledge-work surface, with current platform and plan caveats.
- [Microsoft 365 Copilot overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-overview), checked 14 August 2026: Microsoft 365 Copilot integration with Microsoft work applications, Graph and organisational data, subject to licensing and configuration.
- [Copilot Cowork overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/), last updated 13 July 2026 and checked 14 August 2026: Copilot Cowork as a separate Microsoft 365 Copilot experience that carries out multi-step actions with user approval.
- [Copilot Cowork is now generally available](https://www.microsoft.com/en-us/microsoft-365/blog/2026/06/16/copilot-cowork-is-now-generally-available/), dated 16 June 2026: the correction from the March research preview to worldwide general availability. Adoption, cost and comparative claims in the same announcement are excluded.

Boundaries: vendor documentation establishes intended capability and current naming, not quality, accuracy, time saved or suitability for a learner's job. Every product statement in the lesson is labelled `As of 14 August 2026`. The learner must inspect their actual account, plan, organisational approval and live result.

### Lesson 17: `write-and-test-a-skill`

- `ai-work-school-skills-evidence.md`: the `skill-creator` method of beginning with real examples, choosing degrees of freedom from task fragility, keeping core instructions concise, routing optional detail to references, scripts and assets, validating the package and forward-testing without answer leakage.

Boundaries: the course defines a skill at the workflow level and does not teach a product-specific packaging format or installation path. A skill does not grant external access or authority. Blind tests cover normal, ambiguous and out-of-scope cases, but they do not prove performance outside the tested job.

### Lesson 18: `separate-skills-from-mcp-connections`

- `ai-work-school-public-research.md`: current product integration terminology, permission limits and the rule that access and action boundaries must be distinguished from instructions.
- `ai-work-school-skills-evidence.md`: the workflow-packaging side of the skill versus connection decision and the explicit evidence gap that required a primary MCP source.
- [What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro), checked 14 August 2026: MCP as an open-source standard connecting AI applications to external systems through data sources, tools and workflows.
- [MCP architecture overview](https://modelcontextprotocol.io/docs/learn/architecture), checked 14 August 2026: the host, client and server roles plus the tools, resources and prompts primitives.
- [MCP tools specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools), checked 14 August 2026: tools as model-controlled calls and the requirement for visible, deniable human control around tool use.

Boundaries: the core contains no setup command, server recommendation or claim that every product supports the same MCP features. It teaches the difference between instruction and connection, the choice of skill, MCP, both or neither, and least permission. Any later setup lab needs a new live verification against the target client and server.

### Lesson 19: `research-before-you-draft`

- `ai-work-school-public-research.md`: fluent output is not evidence, false-premise risk, primary-source checking, counterargument and claim-provenance limits.
- `ai-work-school-skills-evidence.md`: the `edit-bk-essays`, `support-casebook` and `competitor-research` methods for defining the edit, verifying facts, mapping ideas, distinguishing observed, inferred, disproved and unknown claims, testing the thesis and gathering missing material before drafting.
- [Your AI is confidently wrong](https://www.bhekani.com/posts/your-ai-is-confidently-wrong/), dated 3 March 2026: the false-premise problem and the need to cross-check important claims. Exact model percentages and benchmark rankings are excluded.
- [Writing is Thinking](https://www.bhekani.com/posts/writing-is-thinking/), dated 19 July 2023: writing as meaning-making and the useful separation between exploratory articulation and critical revision.

Boundaries: the claim-status table and research pack are course constructions derived from the selected methods. A citation proves provenance, not support. The lesson retains an insufficient-evidence route and does not turn vendor research features into proof that research is correct.

### Lesson 20: `edit-the-argument-and-repair-the-prose`

- `ai-work-school-public-research.md`: accountable authorship and the distinction between AI involvement and evidence of quality.
- `ai-work-school-skills-evidence.md`: the ordered `edit-bk-essays` pipeline of fact-check, idea map, thesis stress test, structure, rebuilt map, cutting, opening audit, line edit, second fact-check and cold read; plus the `humanizer` method of preserving supported claims, calibrating to a real sample, auditing pattern clusters and checking for fabrication.

Boundaries: AI-writing repair is not an AI detector and not a request to add decorative specificity. The lesson forbids invented quotes, experiences, facts, motives and feelings. Neutral prose can be the correct professional voice. Structural work precedes the line edit, and the accountable author records significant rejected suggestions.

### Lesson 21: `build-and-check-work-artifacts`

- `ai-work-school-skills-evidence.md`: the selected `documents`, `Spreadsheets` and `google-calendar-meeting-prep` methods. Documents require a content contract plus render inspection; spreadsheets require visible inputs, formula-driven calculations, error scans, reconciliation and rendered-sheet inspection; meeting preparation starts from the event and separates confirmed context, inferred purpose and missing inputs.

Boundaries: the clearly illustrative accountant exercise is original course material, not accounting advice, a measured case or a description of a real organisation. It keeps source reconciliation, formulas, missing-account flags and qualified sign-off separate. No generated file is treated as finished until both underlying content and rendered output pass review.

### Lesson 22: `act-only-with-explicit-authority`

- `ai-work-school-public-research.md`: vendor guidance on limiting access, approving consequential actions, testing out-of-scope cases, treating prompt injection as a live risk and retaining human responsibility.
- `ai-work-school-skills-evidence.md`: the `computer-use` inspect, act once and re-inspect method, explicit confirmation gates, untrusted visible instructions, secret-handling boundary and action-ledger teaching opportunity.
- [Claude Cowork safety guidance](https://support.claude.com/en/articles/13364135-use-claude-cowork-safely), checked 14 August 2026: limiting files, sites and tools, manually approving high-stakes actions and treating prompt injection and computer use as additional risks.
- [OpenAI agent safety guidance](https://help.openai.com/en/articles/12584461), checked 14 August 2026: permissions and confirmations for write actions and evaluation of connected applications.

Boundaries: the clearly illustrative lawyer and operations exercises are original course material, not legal advice, measured cases or descriptions of real organisations. Drafting does not authorise filing, sending, posting, assigning, scheduling or record mutation. Post-action evidence must come from fresh external state rather than a completion message.

## Visual insertion points

These are stable asset-role placeholders, not image nodes or URLs. Lesson prose is complete without them. Insert an image only after the final CDN URL, alt text and production rendering have been reviewed.

- `illustration-skill-lesson`: lesson 17, after the "Choose the degree of freedom" list and its following paragraph. Caption: "A reusable skill starts with real examples, routes only needed resources, and earns trust through blind tests."
- `illustration-mcp-lesson`: lesson 18, after the introductory paragraph ending "Check the current client and approved server before relying on any connection." Caption: "A skill carries the method. MCP carries the governed connection to tools and data. A workflow may need one, both, or neither."
- `illustration-editing-argument`: lesson 20, after the three paragraphs under "Rebuild the map after revision" and before "Repair AI writing without fabricating humanity". Caption: "Edit the argument before the prose: map, verify, restructure, then line edit and reject unsupported changes."
- `illustration-checked-work`: lesson 21, after the opening three paragraphs and before "Document lane". Caption: "Professional output needs separate proofs for sources, content, calculations or structure, and the rendered artefact."

## Technical extension provenance

Extensions are optional, are not prerequisites for any later section, and are the only place code or commands appear.

- Section 1, tool surface against context budget: `AI Workflow Talk - Overview.md`, `AI Workflow Talk - Script.md`. The scripts against declared tool schemas position is taught as a dated measurement rather than a permanent verdict, which is a deliberate departure from how the notes state it.
- Section 2, repository instructions and generated reference: `Always-On Agent Context Is a Router.md`, `Conventions AGENTS.md vs Skills.md`, `Generated Docs as Drift Defense.md`, `Agent Harnesses Need Update Loops.md`. Repository, company and package names from those notes are excluded and the commands are generic templates.
- Section 3, fact ledger, policy and trace: `Governed Agent Architecture.md`, `Deterministic Before LLM.md`, `Policy vs Workflow vs Agent.md`.
- Section 4, the build as recovery oracle: `The Type System Is the Recovery Oracle for a Dead Agent.md`.
- Section 5, citation validation, pure replay and shadow comparison: `Citations Required, Validator Enforces.md`, `Decision Trace Is the Explanation.md`, `Governed Agent Architecture.md`.
- Section 6, the ledger across branches, worktrees and threads: `Parallel Agent Work Needs a Closing Ledger.md`, `Review maps for agent-written PRs.md`.
- Section 7, explain the change before reading the diff: `Outsource the work, not the understanding.md`, `Teaching Senior Engineers.md`.

## Original course examples

The following are original course material written for this curriculum. They are illustrative teaching constructions, not source-derived cases, not descriptions of real organisations, and not measured results. Each one is labelled as invented in the learner-facing text.

- The research brief case in lesson 2 and its repaired check in lesson 7.
- The operational handover case in lesson 4 and its repaired check in lesson 7.
- The stakeholder update case in lesson 6 and the stakeholder communication check in lesson 7.
- The three non-code check repairs in lesson 7, including the weak first check, the plausible wrong result and the deliberate breakage.
- The permission and data-classification flow in lesson 1, including the approved-tool question, the data-class question, the retention question and the redact-or-invent routes.
- The quarterly supplier review source contract in lesson 9 and the short decision-trace sketch in lesson 10.
- The clearly illustrative accountant variance-workpaper exercise in lesson 21.
- The clearly illustrative lawyer contract-review and operations action-log exercises in lesson 22.
- The work-surface decision, dated product map, skill and MCP decision exercises in lessons 15 through 18.
- The research pack and editorial repair record in lessons 19 and 20.
- The capstone's five final run files and the eleven assessment checks embedded in lesson 14. The files consolidate or reference the lesson records that shaped the workflow and contain evidence from one fresh run; the lesson records are setup material, not separate capstone submissions.

The source notes are engineering-heavy and contain no worked non-coding cases. Everything above exists because that gap had to be filled with original material rather than by renaming the nouns in a software example.
