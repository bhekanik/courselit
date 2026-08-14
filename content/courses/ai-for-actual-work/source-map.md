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
- The capstone run instructions and the seven assessment checks embedded in lesson 14.

The source notes are engineering-heavy and contain no worked non-coding cases. Everything above exists because that gap had to be filled with original material rather than by renaming the nouns in a software example.
