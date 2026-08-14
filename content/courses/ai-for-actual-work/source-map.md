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
- [ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275/), checked 14 August 2026: ChatGPT Work as the OpenAI surface for longer multi-step professional work and Codex as the dedicated software-development and technical-work surface.
- [Get started with Claude Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork), checked 14 August 2026: Claude Cowork as Anthropic's agentic knowledge-work surface, with current platform and plan caveats.
- [Microsoft 365 Copilot overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-overview), checked 14 August 2026: Microsoft 365 Copilot integration with Microsoft work applications, Graph and organisational data, subject to licensing and configuration.
- [Copilot Cowork overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/), last updated 13 July 2026 and checked 14 August 2026: Copilot Cowork as a separate Microsoft 365 Copilot experience that carries out multi-step actions with user approval.
- [Copilot Cowork is now generally available](https://www.microsoft.com/en-us/microsoft-365/blog/2026/06/16/copilot-cowork-is-now-generally-available/), dated 16 June 2026: the correction from the March research preview to worldwide general availability. Adoption, cost and comparative claims in the same announcement are excluded.
- [ChatGPT Work product announcement](https://openai.com/index/chatgpt-for-your-most-ambitious-work/), dated 9 July 2026 and checked 14 August 2026: source for the public ChatGPT Work selector screenshot and the distinction from Codex.
- [Claude Cowork product page](https://claude.com/product/cowork), checked 14 August 2026: source for the public example showing a recurring report request, connected sources and the resulting slide deck.
- [Get started with Microsoft Cowork](https://support.microsoft.com/en-us/microsoft-365-copilot/get-started-with-cowork), checked 14 August 2026: source for the public Cowork home screenshot and its Chat/Cowork entry route.

Boundaries: vendor documentation establishes intended capability and current naming, not quality, accuracy, time saved or suitability for a learner's job. Every product statement in the lesson is labelled `As of 14 August 2026`. The learner must inspect their actual account, plan, organisational approval and live result.

### Lesson 17: `write-and-test-a-skill`

- `ai-work-school-skills-evidence.md`: the `skill-creator` method of beginning with real examples, choosing degrees of freedom from task fragility, keeping core instructions concise, routing optional detail to references, scripts and assets, validating the package and forward-testing without answer leakage.
- [Agent Skills overview](https://agentskills.io/home), checked 14 August 2026: the open folder format and the distinction between portable instructions and host-specific support.
- [Skills in ChatGPT](https://help.openai.com/en/articles/20001066), checked 14 August 2026: current ChatGPT access, creation, upload, sharing and surface-specific synchronisation limits.
- [Agent Skills in Claude](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview), checked 14 August 2026: current Claude host behaviour and progressive loading.
- [Customize Microsoft 365 Copilot Cowork](https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/cowork-customize), checked 14 August 2026: current Microsoft skill and plugin management surface.

Boundaries: the course defines a skill at the workflow level and does not teach a product-specific packaging format or installation path. A skill does not grant external access or authority. Blind tests cover normal, ambiguous and out-of-scope cases, but they do not prove performance outside the tested job.

### Lesson 18: `separate-skills-from-mcp-connections`

- `ai-work-school-public-research.md`: current product integration terminology, permission limits and the rule that access and action boundaries must be distinguished from instructions.
- `ai-work-school-skills-evidence.md`: the workflow-packaging side of the skill versus connection decision and the explicit evidence gap that required a primary MCP source.
- [What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro), checked 14 August 2026: MCP as an open-source standard connecting AI applications to external systems through data sources, tools and workflows.
- [MCP architecture overview](https://modelcontextprotocol.io/docs/learn/architecture), checked 14 August 2026: the host, client and server roles plus the tools, resources and prompts primitives.
- [MCP tools specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools), checked 14 August 2026: tools as model-controlled calls and the requirement for visible, deniable human control around tool use.
- [Official MCP Registry](https://registry.modelcontextprotocol.io/), checked 14 August 2026: a discovery source for public server metadata, not an approval list.
- [ChatGPT Plugin Directory](https://chatgpt.com/plugins), checked 14 August 2026: current OpenAI discovery surface and source for the sealed directory screenshot.
- [Claude Connectors](https://claude.com/connectors), checked 14 August 2026: current Anthropic connector catalogue.
- [Use plugins with Microsoft 365 Copilot Cowork](https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/cowork-plugins), checked 14 August 2026: current Microsoft plugin discovery, connection and administrator caveats.

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

## Pedagogy provenance

The lesson shell is a teaching dependency, not a new set of domain claims. Each lesson now asks for a written prediction before explanation, demonstrates one complete case, guides one partly completed case, sends the learner back to their own work, asks for teach-back, changes the case, and offers three graduated hints. The static CourseLit page cannot hide answers or store predictions, so the learner is explicitly told to write before scrolling. The artefact remains the evidence of work.

- `Teaching Senior Engineers.md`: prior-model elicitation, predict-before-run, one load-bearing concept, gradual release, productive struggle, teach-back, varied practice and visible artefacts.
- `PRIMM.md`: prediction as a diagnostic step, comparison with observed evidence, investigation, modification and transfer to a new case.
- `Gradual Release of Responsibility.md`: demonstrate once, complete one together, then make the learner own the consequential decision.
- `Cognitive Load Theory.md`: one job, one artefact and one load-bearing decision per lesson; supporting mechanics stay subordinate.
- `Productive Struggle.md`: let the learner's check expose the mismatch, then add structure only when they cannot name a next move.
- `Expert Blind Spot.md`: start from familiar professional practice, state where the analogy breaks, and fade support only after demonstrated understanding.
- `Socratic Pressure in Teaching.md`: probe confident claims with a boundary case and descend a prerequisite when the learner is lost.
- `Evidence Posture in Teaching.md`: distinguish a verified fact, a trade-off, a recurring trap, a misconception and an open gap.
- `Source Maps for Learning Curricula.md`: teach prerequisites before dependent concepts and attach a diagnostic probe to each lesson.
- `Shippable Increment Per Session.md`: every lesson leaves one reviewable improvement to a learner-owned work artefact.
- `Teaching Agent.md`: durable chapters may be complete documents, but learners still need explicit stop points and calibration.
- `AI-Era Learning.md`: retain framing, review and understanding even when execution is delegated.

Boundaries: these notes record BK's working teaching method and a small number of technical teaching sessions. They do not prove universal learning outcomes for non-technical professionals. The course uses the methods as a coherent design position and keeps the capstone rubric provisional until it has been piloted.

## Sealed course media

The source assets, hashes, semantic targets and alt text are locked in `content/site/ai-work-school/asset-contracts.json`. The independently owned MediaLit records and exact HTTPS URLs are locked in `content/site/ai-work-school/media.json`. Lesson prose remains complete when the images are unavailable. Each image is followed by visible caption prose copied exactly from its sealed media record.

- Course featured image, `course-featured-image`: `https://media.bhekani.com/p/CvBV8mXoM8P2VdfimD-vOuwFCj5E9CwOO91sJ2SX/main.webp`. The complete Media object is copied into `course.featuredImage` without sharing the landing-page MediaLit ID.
- Lesson 2 diagram, `behaviour-card-comparison-lesson`: after the prediction-to-evidence demonstration and before "Loyalty is not literacy". URL: `https://media.bhekani.com/p/OyoQwlb9jhJT_UGtw4zVGPtCrSqhvRBGNlIueJlq/main.webp`. Alt: "Two runs use the same job, input and finish condition while one variable changes; observations are recorded separately from unsupported product rankings." Caption and title: "Compare the same job with one changed variable, then limit every conclusion to what the two runs actually show."
- Lesson 4 diagram, `context-router-lesson`: after the maintained-context demonstration and before "One big instruction file is the wrong shape". URL: `https://media.bhekani.com/p/B_XeC0UdWLg30QBjTlinflSeTcJCMIG2UOBQ5z-Q/main.webp`. Alt: "A context router selects standing rules, procedures, explanations and current evidence for the job, with a named owner and update trigger below them." Caption and title: "Route context by its job and change rhythm; every durable item needs an owner and an update trigger."
- Lesson 5 diagram, `mechanism-ladder-lesson`: after the lowest-sufficient-mechanism demonstration and before "Three ways to allocate judgement". URL: `https://media.bhekani.com/p/4xappc5WAehv7fhmaI6gwMiWJL9rk1irNcg07Vul/main.webp`. Alt: "A three-rung mechanism ladder places a known choice in policy, a known sequence in a workflow and bounded runtime judgement with an agent." Caption and title: "Use the lowest sufficient mechanism: policy for known choices, workflow for known order, and an agent only for bounded judgement."
- Lesson 15 diagram, `work-surface-choice-lesson`: after the chat-versus-delegated-work demonstration and before "Choose from the job, not the button". URL: `https://media.bhekani.com/p/7plFDkUb_zdrXVTp8wZ5UggLQk9FO_ZDW1O_bcLY/main.webp`. Alt: "A decision tree routes a present, steerable exchange to chat, a bounded job with a finish condition to delegated work, and unauthorised judgement to a person." Caption and title: "Choose chat, delegated work or person-only judgement from the shape and authority of the job."
- Lesson 16 OpenAI screenshot, `chatgpt-work-interface-lesson`: in the dated product map before "Use four evidence states". URL: `https://media.bhekani.com/p/6ZLWTJ-6808I-0rnctAqx0KqRDWgeIT_-eRfEZve/main.webp`. Alt: "OpenAI’s desktop menu showing ChatGPT Work selected for general work, with Codex listed separately for developers." Caption and title: "Open ChatGPT, then choose Work for a bounded multi-step job or Codex for repository work. Interface captured from OpenAI on 14 August 2026."
- Lesson 16 Anthropic screenshot, `claude-cowork-interface-lesson`: immediately after the OpenAI screenshot and caption. URL: `https://media.bhekani.com/p/8bZNTIFxUfOLiOBCxW2A8SLsAexVhNIJWQS72iPc/main.webp`. Alt: "Claude Cowork example with a recurring report request, Amplitude and Microsoft 365 connectors, and a finished PowerPoint deck." Caption and title: "Claude Cowork shows the request, connected sources and finished slide deck in one task view. Interface captured from Anthropic on 14 August 2026."
- Lesson 16 Microsoft screenshot, `microsoft-cowork-interface-lesson`: immediately after the Anthropic screenshot and caption. URL: `https://media.bhekani.com/p/s1_GaaDD-xUpd3It_ehubb3QR3zS31iqj8WXu68v/main.webp`. Alt: "Microsoft 365 Copilot home screen with Chat and Cowork tabs, a task box and suggested tasks for inbox, calendar and company research." Caption and title: "Open Microsoft 365 Copilot and switch from Chat to Cowork before starting a multi-step task. Interface captured from Microsoft Support on 14 August 2026."
- Lesson 7 diagram, `check-repair-lesson`: after the weak-check repair demonstration and before "Where expected results come from". URL: `https://media.bhekani.com/p/7PCPUETILaIq2CPQ_N1CLjJU781swtVnClt1ueUu/main.webp`. Alt: "A totals-only check passes a duplicated and missing invoice, while a repaired row-level check produces a visible missing-ID and duplicate-ID failure." Caption and title: "Name a plausible wrong result first; a check earns its place only when that result visibly fails."
- Lesson 10 diagram, `decision-trace-lesson`: after the replayable-trace demonstration and before "The record is the explanation". URL: `https://media.bhekani.com/p/KIGSO650HCXX2a1K0IYQX4XGv_FkSzplX9VoV-v-/main.webp`. Alt: "A source and rule version lead through a rejected alternative to a decision and owner, followed by a boundary showing the external action is still unproved." Caption and title: "A trace lets another person replay the decision; only destination evidence proves what happened afterwards."
- Lesson 11 diagram, `closure-states-lesson`: after the completion-state demonstration and before "A stopped worker is not a delivered result". URL: `https://media.bhekani.com/p/YovnjEwdKfLiA-Qs6i2jueLjb-10k9X7xyxD14Ul/main.webp`. Alt: "Work progresses from produced to reviewed, accepted or rejected, integrated and cleaned, with fresh evidence required between each closure state." Caption and title: "Done is a claim: fresh reviewer and destination evidence moves work through each closure state."
- Lesson 17 raster, `skill-lesson`: after the "Choose the degree of freedom" list and its following paragraph. URL: `https://media.bhekani.com/p/YqmA5jy23g5GnCu4uDrQEZX61didR3-BtdmPe81a/main.webp`. Alt: "A professional packing a field kit with the materials for a job while two colleagues review what belongs in it." Caption and title: "A reusable skill is a packed kit: context, steps, examples and checks, ready to open next week."
- Lesson 17 diagram, `skill-package-lesson`: immediately after the lesson 17 raster and caption. URL: `https://media.bhekani.com/p/aZoZonTLcZIGwlV4KNLDEVKiqmoIxXiq2waYtjSx/main.webp`. Alt, caption and title: "A reusable skill packages the job, written context, ordered steps, worked examples, checks and source limits so the same task can be run to the same standard later."
- Lesson 18 raster, `mcp-lesson`: after the introductory paragraph ending "Check the current client and approved server before relying on any connection." URL: `https://media.bhekani.com/p/2qJn1ZyE7P8mMNAwrQsfbgpGYZokBA_ojC5JkZsI/main.webp`. Alt: "An operator routes records through three separate permission gates, each recording what may pass." Caption and title: "Identity, scope and action are separate decisions. A governed connection records all three."
- Lesson 18 diagram, `mcp-connection-lesson`: immediately after the lesson 18 raster and caption. URL: `https://media.bhekani.com/p/iLYyEZx2o2hLRmF4SGL6FIYnWtLGsjOuRu4PZCy5/main.webp`. Alt, caption and title: "A request names the source it needs, passes separate identity, scope and action gates, reaches an approved source, and returns an answer with its source. A refusal is recorded too."
- Lesson 18 directory screenshot, `chatgpt-plugin-directory-lesson`: after the current-directory guidance and before "Test access without testing damage". URL: `https://media.bhekani.com/p/m0xhJnv1WtU5OvHk7JGrrt2QiwqLogWcQXOoyJr5/main.webp`. Alt: "ChatGPT Plugin Directory listing work apps such as Google Drive, Outlook, Gmail, Teams, Slack, SharePoint, Salesforce and Adobe Acrobat." Caption and title: "A directory is a discovery surface, not an approval. Inspect the publisher, exact permissions and data boundary before connecting an app. Interface captured from OpenAI on 14 August 2026."
- Lesson 19 diagram, `claim-argument-map-lesson`: after the research-evidence demonstration and before "Name the decision before the topic". URL: `https://media.bhekani.com/p/Rbvtux50mu8VtvN-dw8fjew40UM66-vxbhM8Xogj/main.webp`. Alt: "Approved sources support claims with explicit status; claims, counterarguments and open gaps form an argument map that leads to a decision before drafting." Caption and title: "Map claims, support, counterarguments and open gaps before prose turns them into a smooth story."
- Lesson 20 raster, `editorial-partnership-lesson`: after the three paragraphs under "Rebuild the map after revision" and before "Repair AI writing without fabricating humanity". URL: `https://media.bhekani.com/p/jhuEmKYgPbl-UjrbkG2ehYPEQO1elN6GKsZmNJkR/main.webp`. Alt: "An editor turns an idea map into a sourced draft, revises the argument and sets rejected suggestions aside." Caption and title: "Keep the argument, the source check and the edit. Reject suggestions that weaken the work."
- Lesson 21 raster, `checked-work-lesson`: after the opening three paragraphs and before "Document lane". URL: `https://media.bhekani.com/p/v_YQWyIXAdGFbl9GQRx3GljM1D5NNfOlnIwudC35/main.webp`. Alt: "Four colleagues assemble a document, check it against sources, add citations and sign it off." Caption and title: "Assemble, check, cite, decide. The same moves make the work reviewable."
- Lesson 21 diagram, `checked-workflow-lesson`: immediately after the lesson 21 raster and caption. URL: `https://media.bhekani.com/p/Y1CVNTysd20XWcmk-WQK7GO1oSE6IV7WHRV-BkVJ/main.webp`. Alt, caption and title: "Written context becomes a draft, which is checked against sources and cited. A person approves it or sends it back with a reason before the decision is recorded and handed over."
- Lesson 22 diagram, `authority-sequence-lesson`: after the safe-action demonstration and before "Drafting is not authority". URL: `https://media.bhekani.com/p/wtDdSo9RExjLA22S1VD9b3YKhNvK9OYu1Ux65r6g/main.webp`. Alt: "An authority sequence inspects evidence, proposes an exact action, gets approval, acts and verifies external state, while missing approval routes to stop and record." Caption and title: "Authority is a sequence: inspect, propose, approve the exact action, act, then verify external state."
- Lesson 14 diagram, `capstone-loop-lesson`: after the miss-triage demonstration and before "Sort the misses before you fix anything". URL: `https://media.bhekani.com/p/5eBVQRO1s3srRhTrlGfygKW_xySd8xR4MZ6ybz58/main.webp`. Alt: "A fresh run moves from brief and source contract to checks and evidence, decision and handover, then routes a miss through one setup change into a rerun." Caption and title: "Run the whole method once, keep the miss, change one part of the setup, and compare fresh evidence."

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
