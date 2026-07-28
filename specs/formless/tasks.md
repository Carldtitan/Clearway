# Implementation Plan: Formless

## Overview

This plan implements Formless as a responsive Next.js product with a deterministic rules core, one in-memory canonical applicant case, equivalent voice and typed interview paths, schema-constrained extraction, applicant review, server-side Anvil document generation, and a seeded medical-record tracker. V1 is the mandatory hackathon build and is complete at Task 17. V2 starts only after the V1 checkpoint and adds a minimal encrypted tracker projection, passwordless return access, scheduled and consented reminders, an optional avatar, carefully constrained assisted calling, and privacy-safe production operations.

All implementation must follow:

- `specs/formless/requirements.md` for observable behavior.
- `specs/formless/design.md` for architecture, contracts, correctness properties, privacy boundaries, and design principles.
- `skills/impeccable/` for frontend shaping, implementation, adaptation, critique, audit, and polish.
- The corrected root `REQUIREMENTS.md` when research documents disagree about SSA rules or form handling.

Tasks marked with `*` are optional test tasks for time-constrained V1 implementation. Tests covering legal boundaries, sensitive-data persistence, SSA-827 exclusions, cross-form consistency, and the three-minute demo are mandatory even when other optional tests are deferred.

## Workstreams

Tasks are organized so one person can execute them in order or multiple contributors can work in parallel after shared contracts are complete:

- **Domain and data:** configuration, canonical types, deterministic rules, field adapters, overflow, Remarks, deadlines, and V2 projection.
- **Product interface:** responsive shell, Check, Interview, Review, Packet, Records, accessibility, and Impeccable quality passes.
- **Integrations:** speech, extraction, Anvil, evidence PDF, Supabase, scheduler, Twilio, avatar, and operations.

The domain layer owns public contracts. Feature and integration work must consume those contracts rather than redefining local variants.

## V1 Voice-Guided Overhaul

- [x] A. Replace the exposed five-stage workflow
  - [x] A.1 Add `SupportedLocale`, `ApplicationPhase`, transcript-locale, deferred-item, and document-readiness contracts to ApplicantCase.
  - [x] A.2 Replace visible Check, Interview, Review, and Packet destinations with Application, Documents, and Records.
  - [x] A.3 Build one `GuidedApplication` orchestrator for introduction, readiness, intake, issue resolution, final approval, and handoff to Documents.
  - _Requirements: 1A, 1B, 1D_

- [x] B. Add deterministic conversation safety
  - [x] B.1 Create the localized Question Registry with required, conditional, optional, unknown, form-impact, and blocker metadata.
  - [x] B.2 Create the shared client/server Completion Engine and block incomplete packet generation.
  - [x] B.3 Parse exact voice commands before extraction and require confirmation for consequential corrections or status changes.
  - [x] B.4 Treat skip, disregard, and unknown as dispositions or commands, never application values.
  - _Requirements: 1B, 1C, 5, 7, 9_

- [x] C. Implement language-first voice
  - [x] C.1 Render English, Español, and 中文（普通话） as the first and only initial decision.
  - [x] C.2 Begin the localized spoken preparation introduction immediately after selection.
  - [x] C.3 Route every recording through the locale-specific Deepgram model and every response through the locale-specific ElevenLabs voice.
  - [x] C.4 Preserve original transcripts, extract English SSA values, and confirm meaning in the selected language.
  - [x] C.5 Support changing language mid-conversation without losing progress or silently returning to English.
  - _Requirements: 1A, 1D, 3, 5, 14_

- [x] D. Extend voice control through outputs
  - [x] D.1 Support spoken generation and download in Documents.
  - [x] D.2 Support spoken status, provider selection, script reading, and confirmed received-state updates in Records.
  - [x] D.3 Preserve equivalent visible, keyboard, and screen-reader controls.
  - _Requirements: 1B, 9, 12, 13_

- [x] E. Validate and ship the overhaul
  - [x] E.1 Add unit tests for locale selection, commands, requirements, completeness, translation boundaries, and document readiness.
  - [x] E.2 Add component and integration tests for the three localized introductions, required-answer behavior, commands, provider failures, and packet blocking.
  - [x] E.3 Add voice-controlled browser paths for all three locales, Documents, and Records.
  - [x] E.4 Run live Deepgram, ElevenLabs, Anvil, accessibility, responsive, build, and Impeccable quality checks.
  - _Requirements: 1A–1D, 13–15_

- [x] F. Make the guided application conversational
  - [x] F.1 Replace mandatory yes/no confirmation turns with staged progressive confirmation and one acknowledgement-plus-question response.
  - [x] F.2 Preview candidate actions through the canonical reducer so one long answer can resolve several later questions without mutating the live case early.
  - [x] F.3 Carry the latest 24 confirmed exchanges into extraction and exclude rejected or failed turns.
  - [x] F.4 Use schema-constrained completion signals and localized follow-up questions for missing detail.
  - [x] F.5 Support two-minute answers, longer natural pauses, contextual correction, and concise collection-exhaustion prompts.
  - [x] F.6 Test progressive confirmation, multi-fact skipping, long-turn detection, corrections, multilingual flow, and full browser regressions.
  - _Requirements: 1B, 1D, 3, 5, 9, 13_

## V1 Tasks — Mandatory Hackathon Build

- [ ] 1. Reconcile source documents and initialize the project
  - [ ] 1.1 Reconcile authoritative product statements
    - Correct the two stale `latest_pathway.md` implementation references that still describe per-provider SSA-827 generation.
    - Correct the stale `SETUP.md` reference to SSA-827 copies.
    - Preserve the corrected rule: one SSA-827 per case and adjudicative level by default; use HIPAA Right of Access for applicant-owned provider requests.
    - Normalize frontend-skill references to `skills/impeccable/`.
    - Preserve `REQUIREMENTS.md` as the authority when research prose disagrees.
    - _Requirements: 9.6, 9.7, 9.9, 14.4_

  - [ ] 1.2 Scaffold the application and quality toolchain
    - Initialize Next.js App Router with strict TypeScript, Tailwind, and the directory boundaries in `design.md`.
    - Install shadcn/Radix primitives only where their semantics are useful.
    - Configure Vitest, fast-check, Testing Library, axe, and Playwright.
    - Add scripts for typecheck, unit tests, property tests, component tests, end-to-end tests, build, and Impeccable detection.
    - _Requirements: 1, 13, 15_

  - [ ] 1.3 Configure secrets and public rule values
    - Validate Anvil, extraction, speech, and optional TTS environment keys without logging values.
    - Parse 2026 SGA, earnings-per-credit, tracker, and SSA-827 validity values into typed configuration.
    - Fail production startup on missing deterministic rule configuration.
    - Permit explicit deterministic demo adapters when external credentials are absent.
    - _Requirements: 2.2, 2.3, 9.10, 14.8, 14.9_

  - [ ]* 1.4 Add configuration smoke tests
    - Assert valid 2026 configuration loads.
    - Assert missing or invalid values fail with redacted errors.
    - Assert secrets never enter the public runtime bundle.
    - **Property 8: Annual rules come only from selected configuration**
    - _Requirements: 2.2, 2.3, 9.10_

- [ ] 2. Encode field maps, synthetic fixtures, and canonical case contracts
  - [ ] 2.1 Implement the canonical ApplicantCase schema
    - Add identity, eligibility, conditions, providers, medications, jobs, marriages, children, education, military, banking, interview turns, record requests, authorization, document state, and revision types.
    - Wrap consequential values in canonical value/provenance structures.
    - Give every repeated entity a stable UUID independent of display order.
    - Encode `missing`, `unconfirmed`, `confirmed`, `conflict`, and `not_applicable`.
    - _Requirements: 5.3–5.6, 7.1–7.8_

  - [ ] 2.2 Implement the reducer and derived selectors
    - Implement the `CaseAction` transitions defined in `design.md`.
    - Prevent candidate extraction patches from replacing confirmed values.
    - Increment case revision on fact changes.
    - Derive review priority, packet readiness, document staleness, and active stage.
    - Keep checklist, validation, Remarks, evidence rows, and record actions derived rather than mutable.
    - _Requirements: 1.8, 5.5, 5.6, 7.3–7.9, 10.8, 11.8_

  - [ ] 2.3 Load and validate the four checked-in field maps
    - Parse the JSON maps into `PdfFieldDefinition[]`.
    - Assert expected usable counts: SSA-16 140, SSA-3368 426, SSA-3369 377, SSA-827 23.
    - Build a field lookup by exact PDF field name and compatible type.
    - Treat labels as development/mapping context, not mutable runtime field IDs.
    - _Requirements: 9.2–9.5_

  - [ ] 2.4 Create the complete Synthetic_Applicant fixture
    - Include a prequalification path with a reviewable or uncertain result.
    - Include multiple conditions, more than one provider, medications, jobs, family facts, and one correctable interview fact.
    - Include one responded record request, one silent at day 22, and one overdue request.
    - Fix the demo clock so dates and status remain deterministic.
    - Use the fixture for screenshots, tests, generated documents, and fallback.
    - _Requirements: 12.9, 14.3, 15.2–15.7_

  - [ ]* 2.5 Write canonical-state property tests
    - **Property 11: Extraction cannot overwrite confirmed facts**
    - **Property 14: Canonical reuse prevents re-entry divergence**
    - **Property 25: Document staleness follows relevant edits**
    - Generate repeated entities, candidate conflicts, confirmations, deletions, and stage changes.
    - _Requirements: 5.5, 7.1–7.8, 10.8_

- [ ] 3. Implement deterministic prequalification rules
  - [ ] 3.1 Implement SGA evaluation
    - Select blind or non-blind configured threshold only after blindness state is known.
    - Ask about IRWE, subsidies/special conditions, self-employment, and passive income.
    - Use self-employment profit, never gross revenue.
    - Return only `looks_clear`, `needs_review`, or `uncertain`.
    - Attach rule IDs, reasons, possible exceptions, and next actions.
    - _Requirements: 2.1–2.7, 2.12–2.14_

  - [ ] 3.2 Implement age-at-onset and Duration of Work
    - Compute age from date of birth and alleged onset.
    - Encode the progressive duration table as configuration.
    - Interpolate only according to the approved schedule and cap at forty credits.
    - Keep this result independent from Recent Work.
    - _Requirements: 2.7, 2.8, 2.10_

  - [ ] 3.3 Implement Recent Work and uncertainty
    - Implement the under-24, age-24-to-30, and age-31-or-older branches.
    - Return uncertainty when the applicable self-reported inputs cannot support a result.
    - Direct uncertain applicants to their `my Social Security` earnings record.
    - Never output a definitive insured-status rejection.
    - _Requirements: 2.9–2.12_

  - [ ] 3.4 Compose `evaluatePrequalification`
    - Return the aggregate status plus independent SGA, Duration of Work, and Recent Work results.
    - Use the most cautious unresolved status required by the component checks.
    - Complete locally without AI or network calls.
    - _Requirements: 2.10–2.15_

  - [ ] 3.5 Write mandatory prequalification tests
    - Verify all 2026 values and every age boundary.
    - Verify a possible exception never produces an unconditional stop.
    - Verify missing credit evidence yields uncertainty.
    - Verify the flow remains independently usable with all services disabled.
    - **Property 1: SGA is not an unconditional rejection**
    - **Property 2: Applicable SGA threshold follows blindness state**
    - **Property 3: Self-employment never compares gross revenue**
    - **Property 4: Duration and recent-work tests remain independent**
    - **Property 5: Duration requirement follows the configured progressive schedule**
    - **Property 6: Recent-work branch follows onset age**
    - **Property 7: Ambiguity produces uncertainty**
    - _Requirements: 2, 15.9_

- [ ] 4. Implement deterministic checklist, consistency, overflow, and deadline rules
  - [ ] 4.1 Implement the supporting-document checklist
    - Encode always-required, military, marriage, long-duration divorce, children, prior-year work, current earnings, self-employment, and non-citizen rules.
    - Return stable item IDs, rule IDs, short labels, and plain-language reasons.
    - Deduplicate items reached by multiple facts.
    - _Requirements: 8.1–8.11_

  - [ ] 4.2 Implement cross-form validation
    - Compare alleged onset date across SSA-16 and SSA-3368.
    - Detect incompatible confirmed identity, marital, child, provider, medication, and work-history values.
    - Return affected output types and blocking/warning severity.
    - Block packet generation on required conflicts.
    - _Requirements: 7.7, 7.9, 10.1–10.3_

  - [ ] 4.3 Implement lossless capacity partitioning
    - Implement generic ordered partitioning for repeatable sections.
    - Configure SSA-3368 for six provider and eleven medication slots.
    - Preserve stable IDs, order, labels, dates, and relationships in continuation entries.
    - _Requirements: 10.4–10.7_

  - [ ] 4.4 Implement record and authorization date rules
    - Compute 30-day access deadline, one configured extension, day-20 reminder, day-30 escalation, and 11-month SSA-827 warning.
    - Normalize date-only arithmetic to UTC.
    - Return one explicit next-action state.
    - _Requirements: 12.1–12.7, 12.11_

  - [ ]* 4.5 Write rule property tests
    - **Property 15: Checklist is exact and deterministic**
    - **Property 16: Onset date must match across forms**
    - **Property 17: Overflow is lossless**
    - **Property 22: Deadline arithmetic is calendar-correct**
    - Generate all checklist combinations, onset conflicts, collection sizes around capacities, leap dates, year boundaries, and extension states.
    - _Requirements: 8, 10, 12_

  - [ ] 4.6 Checkpoint — deterministic core
    - Run typecheck and all mandatory/property rule tests.
    - Review public copy for forbidden denial language.
    - Confirm the rules core imports no React, Next.js, AI, Anvil, speech, database, or Twilio modules.
    - Confirm the Synthetic_Applicant yields the intended check, checklist, consistency, overflow, and tracker outputs.

- [ ] 5. Build the Impeccable responsive shell
  - [ ] 5.1 Establish the visual system
    - Use Impeccable product register, palette generation, and two to four visual probes.
    - Lock restrained light-theme OKLCH tokens, Atkinson Hyperlegible/system fallback, type scale, spacing, radii, elevation, semantic states, and z-index scale.
    - Verify body, muted, placeholder, control, focus, and status contrast.
    - _Requirements: 13.1–13.11_

  - [ ] 5.2 Build shared workspace components
    - Implement AppShell, StageNavigation, TaskHeader, ContextualDrawer, InlineNotice, Disclosure, StatusText, FieldList, EmptyState, ErrorState, and Skeleton primitives.
    - Keep controls semantically familiar and avoid nested cards.
    - Provide default, hover, focus, active, disabled, loading, error, and selected states where applicable.
    - _Requirements: 1.1–1.7, 13.1–13.11_

  - [ ] 5.3 Implement structural responsive behavior
    - Use bottom navigation and one-task layout below 768px.
    - Use collapsible stage navigation at tablet widths.
    - Use stage rail, central task surface, and contextual facts panel at desktop widths.
    - Keep Review as a workflow transition rather than a mobile navigation destination.
    - _Requirements: 1.2–1.6, 13.9_

  - [ ] 5.4 Implement accessibility foundations
    - Add skip links, semantic landmarks, page titles, live regions, focus restoration, minimum targets, and reduced-motion behavior.
    - Provide icon-plus-text navigation and color-independent state.
    - _Requirements: 13.1–13.10_

  - [ ]* 5.5 Add shell component and accessibility tests
    - Assert route/stage structure at mobile and desktop.
    - Run axe against representative shell states.
    - Verify keyboard navigation, focus visibility, reduced motion, and one-primary-action hierarchy.
    - _Requirements: 1, 13_

- [ ] 6. Build the eligibility-check flow
  - [ ] 6.1 Implement question-by-question Check UI
    - Ask earnings first, then blindness and exception questions, then work-credit inputs.
    - Show one question and primary Continue action at a time.
    - Add contextual `Why this matters` disclosures without persistent paragraphs.
    - Preserve answers when moving backward.
    - _Requirements: 2.1, 2.4, 2.7, 13.6–13.7_

  - [ ] 6.2 Implement traceable result presentation
    - Render `Looks clear`, `Needs review`, or `Uncertain`.
    - Show SGA, Duration of Work, and Recent Work independently.
    - Display named rules, short reasons, possible exceptions, and next actions.
    - Never render denied, rejected, or ineligible as a product conclusion.
    - _Requirements: 2.6, 2.10–2.15_

  - [ ] 6.3 Meet standalone and latency behavior
    - Make Check operate without speech, extraction, Anvil, or network access after page load.
    - Keep computation under 2 seconds and the normal question path under 2 minutes.
    - _Requirements: 2.14, 2.15, 15.1, 15.9_

  - [ ]* 6.4 Add Check component and end-to-end tests
    - Test non-blind, blind, IRWE, self-employment, subsidy, passive-income, and uncertain-credit scenarios.
    - Test keyboard and screen-reader result announcements.
    - _Requirements: 2, 13, 15.2_

- [ ] 7. Build voice capture and typed fallback
  - [ ] 7.1 Implement the speech-input contract
    - Add Deepgram and browser SpeechRecognition implementations behind `SpeechInputAdapter`.
    - Request microphone permission only after the applicant starts.
    - Emit partial display transcript, finalized transcript, listening, paused, processing, and error events.
    - Keep provider keys and privileged credentials out of the client.
    - _Requirements: 3.1, 3.2, 3.8–3.11, 14.5_

  - [ ] 7.2 Implement speech output
    - Add browser speechSynthesis as the default `SpeechOutputAdapter`.
    - Add the optional ElevenLabs server adapter without making it required.
    - Implement replay and stop.
    - Preserve visible prompts when audio is unsupported or fails.
    - _Requirements: 3.2, 3.10, 14.6_

  - [ ] 7.3 Build Interview controls and transcript
    - Implement current question, record/pause/resume, replay, typed answer, transcript, and processing states.
    - Show captured facts as a list, not chat bubbles.
    - Move transcript and facts into accessible drawers on mobile.
    - _Requirements: 3.2–3.11, 13_

  - [ ] 7.4 Build the complete Typed_Fallback
    - Collect the same canonical topics through plain-language grouped fields.
    - Allow switching paths without state loss.
    - Focus the typed control when microphone access or speech fails.
    - _Requirements: 6.1–6.6, 14.5_

  - [ ]* 7.5 Add speech and fallback contract tests
    - Test adapter capability detection and event ordering.
    - Test permission denial, partial transcript, pause/resume, TTS failure, and voice-to-typing switch.
    - Verify no state loss and equivalent reducer actions.
    - _Requirements: 3, 6, 14.5–14.6_

- [ ] 8. Implement schema-constrained extraction and provider exhaustion
  - [ ] 8.1 Implement the extraction server boundary
    - Define topic-specific Zod response schemas and allowed canonical paths.
    - Send minimum transcript context plus confirmed context.
    - Accept candidate patches only; reject whole-case replacement, unknown paths, and confirmation-state changes.
    - Redact service errors and disable request-body logging.
    - _Requirements: 5.1–5.5, 14.7, 14.10_

  - [ ] 8.2 Implement extraction prompts and candidate validation
    - Ground field targeting in canonical paths and plain-English field-map labels.
    - Require evidence text and confidence for each candidate.
    - Mark low-confidence, ambiguous, or conflicting candidates unconfirmed.
    - Make retry idempotent by InterviewTurn ID.
    - _Requirements: 5.2–5.8_

  - [ ] 8.3 Implement the Provider_Exhaustion_Loop
    - Create one stable provider candidate for each named source.
    - Ask `Who else have you seen?` after every provider until explicit completion.
    - Ask across all conditions rather than stopping after a provider marked as the only source for one condition.
    - Present possible duplicates for applicant decision.
    - Preserve providers with missing details.
    - _Requirements: 4.1–4.6_

  - [ ] 8.4 Implement deterministic Demo_Fallback extraction
    - Load a fixed transcript and candidate-patch sequence from the Synthetic_Applicant.
    - Identify fallback mode in the interface.
    - Exercise the same reducer and review paths as live extraction.
    - _Requirements: 14.9, 15.3, 15.4, 15.8_

  - [ ]* 8.5 Write extraction and provider properties
    - **Property 9: Provider exhaustion ends only explicitly**
    - **Property 10: Possible duplicates are never auto-merged**
    - **Property 12: Extraction failure preserves prior state**
    - **Property 13: Voice and typed paths are semantically equivalent**
    - Generate conflicting patches, duplicated names, missing provider details, and equivalent answer sets.
    - _Requirements: 4, 5, 6_

- [ ] 9. Build review, correction, provenance, and conflict handling
  - [ ] 9.1 Build prioritized Review_Surface
    - Group facts into Applicant, Conditions, Providers, Medications, Work, and Family.
    - Put blocking conflicts first, then missing/unconfirmed values, then confirmed facts.
    - Use sections and field lists rather than repeated cards.
    - _Requirements: 7.3–7.6_

  - [ ] 9.2 Implement inline correction and confirmation
    - Edit canonical values without returning to the transcript.
    - Show source/provenance on demand.
    - Confirm candidate values explicitly.
    - Confirm deletion of repeated entities and show affected outputs.
    - _Requirements: 5.3–5.7, 7.5–7.8_

  - [ ] 9.3 Integrate consistency and packet readiness
    - Recompute consistency and checklist after each relevant edit.
    - Block packet creation on required conflicts.
    - Show the shared SSA-16/SSA-3368 onset issue as one resolvable decision.
    - Mark prior documents stale after relevant changes.
    - _Requirements: 5.9, 7.7, 7.9, 10.1–10.3, 10.8_

  - [ ]* 9.4 Add Review component tests
    - Verify priority ordering, inline edit, confirmation, deletion impact, conflict resolution, and packet readiness.
    - Verify keyboard focus and screen-reader error summary.
    - _Requirements: 5, 7, 10.1–10.3, 13_

  - [ ] 9.5 Checkpoint — complete applicant data path
    - Run Check, voice, typed, extraction, provider, reducer, and Review tests.
    - Complete both live-adapter and Demo_Fallback paths through packet readiness.
    - Confirm no candidate AI output bypasses applicant review.
    - Confirm no client persistence API is present.

- [ ] 10. Implement SSA form adapters
  - [ ] 10.1 Implement the shared FormFieldAdapter contract
    - Add exact map lookup, field-type validation, semantic-slot mapping, formatting helpers, mapping issues, and continuation sections.
    - Reject runtime fuzzy label mapping.
    - _Requirements: 9.2–9.5, 10.3–10.8_

  - [ ] 10.2 Implement SSA-16 adapter
    - Map all applicable identity, language, birth, citizenship, onset, marital, child, work, and banking facts.
    - Reuse canonical facts without re-entry.
    - Leave signature fields blank.
    - _Requirements: 7.8, 9.1, 9.2, 10.1–10.3_

  - [ ] 10.3 Implement SSA-3368 adapter
    - Map all applicable identity, conditions, providers, medications, education, work, and remarks-related fields.
    - Fill six provider and eleven medication base slots and emit overflow sections.
    - _Requirements: 9.1, 9.3, 10.4–10.7_

  - [ ] 10.4 Implement SSA-3369 adapter
    - Map all applicable work-history fields across its 377 checked-in user-fillable definitions.
    - Preserve job order and generate continuation content when required.
    - _Requirements: 9.1, 9.4, 10.4–10.7_

  - [ ] 10.5 Implement SSA-827 adapter
    - Map applicant name, SSN, DOB, address, city, state, ZIP, and phone where applicable.
    - Default to one form per case and adjudicative level.
    - Implement the explicit protected-field deny-list.
    - Permit only an applicant-requested additional blank original.
    - _Requirements: 9.5–9.9_

  - [ ] 10.6 Write mandatory mapping contract tests
    - **Property 18: Default packet contains one SSA-827**
    - **Property 19: Protected SSA-827 fields stay blank**
    - **Property 20: Packet fields exist in checked-in maps**
    - Test every adapter against map counts and field types.
    - Test onset equality and overflow boundary fixtures.
    - _Requirements: 9, 10_

- [ ] 11. Implement server-side Anvil generation and continuation sheets
  - [ ] 11.1 Implement the Anvil server adapter
    - Resolve template EIDs and API key only on the server.
    - Fill documents from validated adapter payloads.
    - Use bounded timeouts and redacted stable error codes.
    - Return bytes directly and release buffers after response.
    - _Requirements: 9.10–9.13, 14.8, 14.10_

  - [ ] 11.2 Implement `/api/documents/generate`
    - Validate the packet snapshot and rerun consistency checks.
    - Generate all four SSA outputs with per-document state.
    - Reject stale client revisions.
    - Report partial failures without labeling the packet complete.
    - Set no-store response and cache behavior.
    - _Requirements: 7.9, 9.1, 9.11–9.13, 10.8_

  - [ ] 11.3 Render continuation sheets
    - Add applicant/form identification, continued item reference, stable labels, ordered entries, and page numbers.
    - Include every overflow provider, medication, and job exactly once.
    - _Requirements: 10.4–10.7_

  - [ ] 11.4 Build Packet document states
    - Render documents as status rows: Needs information, Ready, Generating, Ready to download, Failed, or Stale.
    - Provide packet-level generation and per-document retry.
    - Provide preview/download without a submission action.
    - _Requirements: 1.6, 9.1, 9.11–9.13, 14.4, 14.8_

  - [ ] 11.5 Write mandatory packet integration tests
    - Verify server-only key use and no sensitive logs.
    - Verify complete and partial mocked Anvil responses.
    - Verify retry, stale revision rejection, continuation inclusion, and protected-field exclusions.
    - Verify generated buffers are not persisted.
    - _Requirements: 9, 10, 14.2, 14.8, 14.10_

- [ ] 12. Generate deterministic Remarks and the Evidence_Index
  - [ ] 12.1 Implement Remarks_Generator
    - Reference continuation sheets.
    - Format record-status sentences from one tracker snapshot.
    - Use deterministic templates only.
    - _Requirements: 11.1–11.3_

  - [ ] 12.2 Build evidence-index rows and semantic HTML
    - Include provider, relevant records/treatment period, request date, deadline, and status.
    - Render `Not requested` for missing request dates.
    - Use text and icons in addition to color.
    - _Requirements: 11.4–11.7_

  - [ ] 12.3 Implement server-side evidence PDF generation
    - Convert the semantic HTML to PDF.
    - Add the Evidence_Index to the packet response.
    - Return bytes without persistent storage.
    - _Requirements: 9.1, 9.11, 11.7_

  - [ ]* 12.4 Write Remarks/evidence consistency tests
    - **Property 21: Remarks and evidence index reflect one tracker snapshot**
    - Generate arbitrary provider states and compare displayed facts across both outputs.
    - Verify state changes mark both outputs stale.
    - _Requirements: 11.1–11.8_

- [ ] 13. Build the seeded Record_Tracker
  - [ ] 13.1 Build the responsive records surface
    - Render a mobile chronological list and desktop table.
    - Show provider, portal state, request date, deadline, response status, and one next action.
    - Avoid a grid of provider cards.
    - _Requirements: 12.1, 12.3–12.10, 13_

  - [ ] 13.2 Implement portal-first, reminder, and escalation details
    - Show portal-first guidance before call guidance.
    - Show the verbatim day-20 Right of Access script.
    - Show day-30 escalation and OCR complaint option.
    - Show 11-month SSA-827 expiry warning and fresh-form action.
    - Address every action to the applicant.
    - _Requirements: 12.3–12.8_

  - [ ] 13.3 Wire deterministic seeded state
    - Load responded, day-22, and overdue requests from the Synthetic_Applicant.
    - Use the fixed demo clock.
    - Update packet staleness when tracker state changes.
    - Do not add persistence, scheduler, provider contact, email, or SMS in V1.
    - _Requirements: 11.8, 12.9–12.11, 14.1–14.3_

  - [ ]* 13.4 Add tracker component and date tests
    - Verify the three seeded states and boundary days.
    - Verify extension and authorization warning behavior.
    - Verify keyboard operation, mobile/desktop structure, and color-independent statuses.
    - _Requirements: 12, 13_

- [ ] 14. Wire the complete V1 workflow and service fallbacks
  - [ ] 14.1 Connect stage transitions
    - Connect Check -> Interview -> Review -> Packet -> Records.
    - Preserve the case when navigating backward.
    - Revalidate downstream outputs after relevant edits.
    - Keep Review mandatory before first packet generation.
    - _Requirements: 1.1–1.8, 7.7–7.9_

  - [ ] 14.2 Integrate failure-preserving adapter states
    - Route speech failure to typing, TTS failure to visible text, extraction failure to retry/manual review, and Anvil failure to preserved packet state.
    - Use stable applicant-facing error messages and concrete next actions.
    - _Requirements: 14.5–14.10_

  - [ ] 14.3 Enforce V1 privacy boundaries
    - Remove or reject localStorage, sessionStorage, IndexedDB, database, server-session, and request-body logging usage.
    - Add no-store behavior and sensitive error redaction.
    - Confirm all demo paths use the Synthetic_Applicant.
    - _Requirements: 14.1–14.3, 14.10_

  - [ ] 14.4 Add legal-boundary copy and action review
    - Include one concise preparation/not-filing statement.
    - Confirm no file, submit-to-SSA, provider-contact, representation, fee, or legal-advice action exists.
    - Confirm SSA-827 and Right of Access remain distinct.
    - _Requirements: 9.9, 14.4, 14.11_

  - [ ] 14.5 Write mandatory V1 integration properties
    - **Property 23: V1 never persists case data**
    - **Property 24: Service failures preserve the case**
    - Exercise each failure at each workflow stage.
    - Inspect client/server log captures and browser storage.
    - _Requirements: 14_

- [ ] 15. Run Impeccable accessibility, browser critique, and responsive audits
  - [ ] 15.1 Run `clarify` across all user-facing copy
    - Reduce persistent helper text.
    - Replace SSA vocabulary with plain-language questions where possible.
    - Preserve exact rule meaning and scripts.
    - _Requirements: 3.3, 13.6, 13.7_

  - [ ] 15.2 Run `adapt` and responsive QA
    - Validate 320px, 390px, 768px, 1024px, and 1280px widths.
    - Validate 200 percent zoom and long values.
    - Confirm drawers, panels, document rows, and tracker table adapt structurally.
    - _Requirements: 1.4, 1.5, 13.9_

  - [ ] 15.3 Run `harden`
    - Complete empty, loading, permission-denied, extraction-error, conflict, generating, partial-packet, stale, and tracker edge states.
    - Confirm every failure has a next action.
    - _Requirements: 1.8, 3.8–3.11, 5.8, 9.13, 14.5–14.10_

  - [ ] 15.4 Run browser critique and deterministic anti-pattern detection
    - Critique Check result, active Interview, conflict Review, generated Packet, and overdue Records at mobile and desktop sizes.
    - Score against Nielsen heuristics.
    - Record P0–P3 findings in the implementation critique artifact.
    - Resolve every P0/P1 and material P2 issue.
    - _Requirements: 13.10, 13.11_

  - [ ] 15.5 Run accessibility and performance audit
    - Run axe and manual keyboard checks on every route.
    - Run one VoiceOver or NVDA pass over the complete happy path and error summary.
    - Verify live announcements, target size, contrast, reduced motion, and focus restoration.
    - Measure route responsiveness, extraction feedback, and packet timing.
    - _Requirements: 2.15, 3.11, 9.13, 13_

- [ ] 16. Rehearse and validate the three-minute demo
  - [ ] 16.1 Implement the deterministic demo launcher
    - Add `Load demo case` at product entry.
    - Load fixed case, transcript sequence, candidate patches, record states, and demo clock.
    - Identify fallback state without dominating the interface.
    - _Requirements: 14.3, 14.9, 15.3–15.8_

  - [ ] 16.2 Rehearse the primary judge path
    - Show Check result and named rule.
    - Show one spoken answer becoming transcript and facts.
    - Show provider exhaustion and one correction.
    - Show onset consistency.
    - Generate or preview all packet outputs.
    - Show mixed tracker states and one script.
    - Keep the run under three minutes.
    - _Requirements: 15.1–15.7_

  - [ ] 16.3 Prepare explicit fallback paths
    - Confirm eligibility-only mode with every service disabled.
    - Confirm deterministic interview fallback with speech and LLM disabled.
    - Record a current packet-generation fallback video.
    - Rehearse one visible recovery without restarting the app.
    - _Requirements: 14.5–14.9, 15.8, 15.9_

  - [ ] 16.4 Run the V1 end-to-end suite
    - Cover happy path, voice failure, extraction ambiguity, onset conflict, overflow, Anvil failure, retry, responsive sizes, and browser storage inspection.
    - _Requirements: 1–15_

- [ ] 17. Final V1 checkpoint
  - [ ] 17.1 Verify all mandatory requirements and tests
    - Confirm Requirements 1–15 each map to implemented behavior and at least one verification.
    - Run typecheck, mandatory unit/property tests, component tests, end-to-end tests, build, and anti-pattern detection.

  - [ ] 17.2 Verify document and legal boundaries
    - Inspect all generated synthetic outputs.
    - Confirm one SSA-827, protected blank fields, lossless overflow, matching onset date, and no filing/provider-contact action.

  - [ ] 17.3 Verify privacy and demo readiness
    - Inspect browser storage, server logs, analytics, errors, and generated-file handling.
    - Complete two consecutive rehearsals under three minutes.
    - Confirm fallback assets are current and accessible.

  - [ ] 17.4 Declare V1 complete
    - V2 work SHALL NOT begin until the V1 checkpoint passes or an explicit exception is recorded with its affected requirement.

## V2 Tasks — Production Extension

- [ ] 18. Add Supabase persistence and magic-link access
  - [ ] 18.1 Create the tracker-projection schema
    - Add case access, encrypted provider reference, record request, authorization tracker, SMS consent, reminder event, and deletion job tables.
    - Exclude full ApplicantCase and every Tier A field.
    - Add foreign keys, status constraints, timestamps, and idempotency uniqueness.
    - _Requirements: 16.3, 16.4, 17.6, 18.3_

  - [ ] 18.2 Configure Supabase magic-link authentication
    - Implement single-use, time-limited email or phone magic links.
    - Use secure same-site sessions.
    - Return neutral responses for invalid, used, or expired links.
    - _Requirements: 16.1, 16.2, 16.7, 16.8_

  - [ ] 18.3 Implement row-level security
    - Bind every tracker row to the authenticated owner.
    - Deny unauthenticated reads and cross-case reads, writes, scheduling, and deletion.
    - _Requirements: 16.5–16.8_

  - [ ] 18.4 Implement projection and return access
    - Project only tracker-required Tier B values from active V1 state after explicit enablement.
    - Restore only tracker state through Magic_Link.
    - Never reconstruct Tier A facts.
    - _Requirements: 16.3–16.7, 17.1_

  - [ ]* 18.5 Add persistence security tests
    - **Property 26: V2 persists only Tier B projection fields**
    - **Property 27: Case access is isolated**
    - Test two-user row isolation, expired links, projection allow-list, and no Tier A columns.
    - _Requirements: 16_

- [ ] 19. Add application-layer encryption, retention, and deletion
  - [ ] 19.1 Implement envelope encryption
    - Encrypt applicant reminder contact and provider display/contact fields before database writes.
    - Store key version separately and keep key material outside Supabase.
    - Support encryption round-trip and planned key rotation.
    - _Requirements: 16.5, 17.7_

  - [ ] 19.2 Implement retention state
    - Schedule deletion 30 days after case closure.
    - Schedule deletion after 18 months of inactivity.
    - Notify before inactivity deletion when a consented channel exists.
    - _Requirements: 17.1–17.4_

  - [ ] 19.3 Implement immediate delete-everything
    - Require a clear confirmation.
    - Remove providers, requests, authorization, consent, reminders, sessions, access, and deletion rows.
    - Make deletion idempotent and keep partially deleting cases inaccessible.
    - _Requirements: 17.5, 17.6_

  - [ ] 19.4 Add storage transparency UI
    - State what is stored, why, retention behavior, and how to delete it before persistence is enabled.
    - _Requirements: 17.1_

  - [ ]* 19.5 Add encryption and deletion tests
    - **Property 28: Retention and deletion remove the complete projection**
    - Test closure, inactivity, immediate deletion, retry, key version, and ciphertext-at-rest assertions.
    - _Requirements: 16.5, 17_

- [ ] 20. Add the daily Reminder_Scheduler
  - [ ] 20.1 Implement deterministic due-event generation
    - Evaluate active requests and authorization dates at least daily.
    - Create day-20, day-30, and 11-month events.
    - Build idempotency key from case, source, reminder type, and due date.
    - _Requirements: 18.1–18.3_

  - [ ] 20.2 Secure the Vercel Cron route
    - Validate scheduler authorization.
    - Process bounded batches with retry-safe cursors.
    - Emit aggregate counts only.
    - _Requirements: 18.1, 21.1, 21.2, 21.5_

  - [ ] 20.3 Wire on-screen persisted reminders
    - Restore due reminders after Magic_Link access.
    - Keep the on-screen path independent from SMS availability or consent.
    - _Requirements: 18.4, 18.9_

  - [ ]* 20.4 Write scheduler property and integration tests
    - **Property 29: Reminder creation is idempotent**
    - Test repeated runs, batch retry, boundary dates, extension, and authorization expiry.
    - _Requirements: 18.1–18.4_

- [ ] 21. Add Twilio SMS consent and STOP handling
  - [ ] 21.1 Implement explicit SMS consent
    - Capture destination, consent timestamp, source, and disclosure.
    - Keep SMS disabled until consent succeeds.
    - _Requirements: 18.5, 18.6_

  - [ ] 21.2 Implement reminder delivery
    - Send provider display name, phone, due state, and concise script or secure link.
    - Minimize Twilio metadata.
    - Record aggregate delivery state without message bodies.
    - _Requirements: 18.7, 18.9, 21.1_

  - [ ] 21.3 Implement STOP and webhook security
    - Validate Twilio signatures.
    - Revoke consent on STOP and suppress all future messages.
    - Preserve on-screen reminders.
    - _Requirements: 18.4, 18.8_

  - [ ] 21.4 Handle delivery failure
    - Preserve reminder event and on-screen action.
    - Prevent unbounded or duplicate retry.
    - Show delivery state only when useful to the applicant.
    - _Requirements: 18.9_

  - [ ]* 21.5 Write consent and delivery tests
    - **Property 30: SMS requires active consent**
    - Test no consent, active consent, STOP, invalid webhook signature, delivery failure, and duplicate scheduler events.
    - _Requirements: 18.5–18.9_

- [ ] 22. Add the optional avatar adapter
  - [ ] 22.1 Implement the provider-neutral AvatarAdapter
    - Consume existing TTS text/events only.
    - Keep interview state and extraction outside the adapter.
    - Disable by default and select provider through environment.
    - _Requirements: 19.1–19.3_

  - [ ] 22.2 Add optional avatar presentation
    - Provide an explicit enable/disable control.
    - Preserve visible transcript, controls, and voice/text paths.
    - Honor reduced motion and never use the face as the only status.
    - _Requirements: 19.1, 19.3, 19.5, 19.6_

  - [ ] 22.3 Implement graceful failure
    - Fall back to voice-only or text-only without losing progress.
    - Avoid repeated initialization loops.
    - _Requirements: 19.4_

  - [ ]* 22.4 Add avatar contract tests
    - **Property 31: Avatar failure does not interrupt the interview**
    - Test disabled, unsupported, initialization failure, mid-speech failure, reduced motion, and keyboard control.
    - _Requirements: 19_

- [ ] 23. Add feature-flagged Assisted_Call
  - [ ] 23.1 Implement provider phone-tree configuration
    - Define supported provider ID, phone number, digit sequence, expected stages, timeouts, and enabled state.
    - Reject calls for unknown or disabled routes.
    - _Requirements: 20.1, 20.2_

  - [ ] 23.2 Implement Twilio menu and hold flow
    - Navigate configured digits.
    - Detect likely conversational speech and bias toward early applicant bridge.
    - Provide explicit cancellation and timeout.
    - _Requirements: 20.3–20.5_

  - [ ] 23.3 Implement applicant bridge and script display
    - Explain the flow before dialing.
    - Display the Right of Access script throughout the connected portion.
    - Use only a neutral connection notice before applicant speech.
    - _Requirements: 20.3, 20.6, 20.7_

  - [ ] 23.4 Implement safe fallback
    - On unknown route, low confidence, provider failure, or Twilio failure, stop automation and show phone number plus manual script.
    - Preserve tracker state.
    - _Requirements: 20.8_

  - [ ] 23.5 Write mandatory calling-boundary tests
    - **Property 32: Assisted calling preserves applicant speech**
    - Verify the system never requests records, answers identity questions, or makes medical statements.
    - Test unknown route, false-positive detection, timeout, cancellation, and bridge failure.
    - _Requirements: 20_

- [ ] 24. Add privacy-safe production monitoring and annual configuration review
  - [ ] 24.1 Implement allow-listed operational events
    - Record aggregate availability, latency, reminder counts, delivery states, and error codes.
    - Use opaque identifiers only where correlation is necessary.
    - Exclude bodies, URLs containing IDs, applicant values, and provider values.
    - _Requirements: 17.7, 21.1, 21.2_

  - [ ] 24.2 Implement sensitive-key rejection
    - Reject attempted logging of Tier A/Tier B field names and nested canonical paths.
    - Add build/test scanning for forbidden telemetry keys.
    - _Requirements: 21.6_

  - [ ] 24.3 Version SSA configuration
    - Store effective dates and selected configuration version for deterministic decisions without retaining decision inputs.
    - Create an operator review task before annual expiry.
    - Prevent silent use of an unreviewed previous-year configuration.
    - _Requirements: 21.3, 21.4_

  - [ ] 24.4 Add applicant-safe dependency health
    - Provide plain next actions without internal diagnostics.
    - Expose aggregate dependency health to operators.
    - _Requirements: 21.5_

  - [ ]* 24.5 Add telemetry and configuration tests
    - **Property 33: Operational telemetry excludes sensitive values**
    - Reuse **Property 8** against multiple annual configurations.
    - Test forbidden keys, raw bodies, URL identifiers, and annual-review failure.
    - _Requirements: 21_

- [ ] 25. Run V2 security, accessibility, and integration validation
  - [ ] 25.1 Validate authentication and row isolation
    - Test magic-link expiry/reuse, neutral errors, session protection, and two-user isolation.
    - _Requirements: 16_

  - [ ] 25.2 Validate encryption, retention, and deletion
    - Inspect database values for ciphertext.
    - Exercise closure, inactivity, immediate deletion, and deletion retry.
    - _Requirements: 17_

  - [ ] 25.3 Validate reminders and SMS
    - Exercise repeated scheduler runs, consent, STOP, provider failure, invalid signatures, and on-screen fallback.
    - _Requirements: 18_

  - [ ] 25.4 Validate avatar and assisted calling
    - Run enabled/disabled/failure avatar paths with accessibility checks.
    - Test only sandbox numbers and configured phone-tree fixtures.
    - Confirm applicant speech boundary manually and automatically.
    - _Requirements: 19, 20_

  - [ ] 25.5 Run Impeccable and production audits
    - Re-run clarify, adapt, harden, critique, audit, and polish on every V2-changed surface.
    - Run security headers, dependency, CSP, accessibility, responsive, and performance checks.
    - Confirm no V2 feature degrades the V1 path.
    - _Requirements: 13, 16–21_

- [ ] 26. Final V2 checkpoint
  - [ ] 26.1 Verify V2 requirement traceability
    - Confirm Requirements 16–21 each map to implemented behavior and verification.
    - Run all mandatory V1 and V2 tests to detect regressions.

  - [ ] 26.2 Verify production privacy posture
    - Confirm Tier A absence from schema, persistence, logs, analytics, traces, URLs, SMS metadata, and operations.
    - Confirm encryption, RLS, deletion, consent, webhook validation, and vendor configuration.

  - [ ] 26.3 Verify graceful degradation
    - Disable persistence, scheduler, SMS, avatar, and calling adapters independently.
    - Confirm the V1 application remains usable and every V2 surface supplies a safe fallback.

  - [ ] 26.4 Declare V2 complete
    - Record the effective SSA configuration, production dependency versions, security review date, and supported assisted-call routes.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3"]
    },
    {
      "id": 1,
      "tasks": ["1.4", "2.1", "2.3", "2.4"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.5", "3.1", "3.2", "3.3", "4.1", "4.2", "4.3", "4.4", "5.1"]
    },
    {
      "id": 3,
      "tasks": ["3.4", "3.5", "4.5", "4.6", "5.2", "5.3", "5.4"]
    },
    {
      "id": 4,
      "tasks": ["5.5", "6.1", "6.2", "7.1", "7.2", "7.4", "8.1", "8.2", "10.1"]
    },
    {
      "id": 5,
      "tasks": ["6.3", "6.4", "7.3", "7.5", "8.3", "8.4", "8.5", "10.2", "10.3", "10.4", "10.5"]
    },
    {
      "id": 6,
      "tasks": ["9.1", "9.2", "10.6"]
    },
    {
      "id": 7,
      "tasks": ["9.3", "9.4", "9.5", "11.1", "11.3", "12.1", "12.2", "13.1", "13.2"]
    },
    {
      "id": 8,
      "tasks": ["11.2", "11.4", "12.3", "13.3"]
    },
    {
      "id": 9,
      "tasks": ["11.5", "12.4", "13.4", "14.1", "14.2", "14.3", "14.4"]
    },
    {
      "id": 10,
      "tasks": ["14.5", "15.1", "15.2", "15.3", "16.1"]
    },
    {
      "id": 11,
      "tasks": ["15.4", "15.5", "16.2", "16.3"]
    },
    {
      "id": 12,
      "tasks": ["16.4", "17.1", "17.2", "17.3", "17.4"]
    },
    {
      "id": 13,
      "tasks": ["18.1", "18.2", "19.1"]
    },
    {
      "id": 14,
      "tasks": ["18.3", "18.4", "18.5", "19.2", "19.3", "19.4"]
    },
    {
      "id": 15,
      "tasks": ["19.5", "20.1", "20.2", "20.3"]
    },
    {
      "id": 16,
      "tasks": ["20.4", "21.1", "24.1", "24.2", "24.3", "24.4"]
    },
    {
      "id": 17,
      "tasks": ["21.2", "21.3", "21.4", "22.1", "23.1", "24.5"]
    },
    {
      "id": 18,
      "tasks": ["21.5", "22.2", "22.3", "23.2", "23.3", "23.4"]
    },
    {
      "id": 19,
      "tasks": ["22.4", "23.5", "25.1", "25.2", "25.3", "25.4"]
    },
    {
      "id": 20,
      "tasks": ["25.5", "26.1", "26.2", "26.3", "26.4"]
    }
  ],
  "constraints": [
    "Canonical types and reducer precede feature integration.",
    "Deterministic rules precede the Check, Review, Packet, and Records surfaces that display them.",
    "Canonical interview data and applicant confirmation precede form adapters.",
    "A tested Anvil adapter and exact field maps precede the complete packet route.",
    "V1 Task 17 must pass before any V2 task begins.",
    "V2 persistence and row isolation precede scheduling or SMS.",
    "The V1 voice contract must remain stable before the optional avatar is added.",
    "SMS consent and delivery must be stable before assisted calling is enabled.",
    "Assisted calling remains disabled by default until Task 23.5 passes."
  ]
}
```

## Notes

- Optional `*` tests may be deferred only when the corresponding behavior is still covered by a mandatory example, integration, security, or demo test.
- Properties are numbered exactly as in `design.md`.
- Every top-level task and subtask references the requirements it implements.
- V2 may add storage and services but may not change the legal boundaries, canonical fact semantics, deterministic rule behavior, form mapping, or V1 fallback paths.
- No screen is complete until its responsive, keyboard, screen-reader, reduced-motion, empty, loading, error, and stale states have been verified where applicable.
