# Requirements Document

## Introduction

SSDI Assistant is a responsive web application that helps a person with a disability prepare a Social Security Disability Insurance application and follow up on the medical evidence the claim depends on. It addresses three concrete failures in the existing process:

1. Applicants can spend months pursuing a claim that has an unresolved non-medical eligibility issue.
2. The initial application requires the same facts to be expressed across several long, overlapping forms.
3. Medical records may not reach the decision-maker even after the application is submitted.

The V1 product is a mandatory hackathon build for the Alix "Agents of Administration" event. It must demonstrate its complete value in three minutes: run a rules-based prequalification check, turn a short spoken history into reviewable structured facts, generate a coherent application packet through Anvil, and show the next action for medical-record follow-up. V1 uses a synthetic applicant, in-memory state, and no account or persistent datastore.

V2 is a clearly separated production extension. It retains V1's case model and user journey while adding passwordless return access, encrypted tracker persistence, scheduled reminders, consented SMS, an optional avatar, carefully limited assisted calling, deletion controls, and privacy-safe operations.

The primary user is an SSDI applicant who may be in pain, fatigued, anxious, unfamiliar with SSA terminology, have limited literacy, use assistive technology, or rely on a phone as their only computer. The secondary user is a family member, caseworker, shelter worker, or other helper completing the process alongside the applicant. Attorneys and appointed representatives are not product users; SSDI Assistant prepares materials but does not represent or file for anyone.

The corrected root `REQUIREMENTS.md` is authoritative for public program rules, legal boundaries, form revisions, field counts, data classification, and V1/V2 scope. `latest_pathway.md` supplies research and rationale, while `RESOURCES.md` supplies source and form inventory.

### Non-negotiable rules

1. **Applicant control.** The product prepares; the applicant reviews, signs, downloads, and files. The product never impersonates the applicant, acts as an appointed representative, or submits a claim.
2. **Deterministic public rules.** SGA, insured-status estimates, document selection, deadlines, and completeness checks use explicit rules and versioned configuration, never generative AI.
3. **No consequential invention.** AI may map natural language to candidate fields, but uncertain values remain unconfirmed until the applicant reviews them.
4. **One canonical case.** All forms and outputs reuse one confirmed case model. The product does not ask for information it already has.
5. **Privacy minimization.** V1 stores nothing persistently. Tier A data is never persisted in V1 or V2. V2 persists only tracker-required Tier B data under explicit retention and deletion rules.
6. **Impeccable product design.** All frontend work follows `skills/impeccable/`. The interface is a responsive task workspace, not a marketing page, slideshow, phone-frame presentation, or generic card dashboard.
7. **No dead ends.** Every service or validation failure preserves captured work and offers a next action.

### V1 voice-guided workflow amendment

This amendment replaces the earlier user-facing Check, Interview, Review, and Packet sequence. Prequalification and review remain deterministic internal phases, but the applicant sees only Application, Documents, and Records. The application is one continuous conversation, beginning with language selection and continuing through document preparation, intake, correction, completeness review, packet generation, download, and record follow-up.

#### Requirement 1A: Language-first entry

**User Story:** As an applicant, I want the product to speak the language I choose from its first sentence, so that I can understand the process without first navigating an English interface.

1. WHEN a new session opens, THE SSDI_Assistant SHALL ask “Which language would you like to use?” before showing any other application question or action.
2. THE SSDI_Assistant SHALL offer English, Español, and 中文（普通话） using their native labels.
3. WHEN the applicant selects a language, THE SSDI_Assistant SHALL set the Conversation_Locale, request microphone access, and begin the spoken introduction without requiring a second start action.
4. THE spoken introduction SHALL identify the product, explain that it prepares an application and tracks records, name the documents and facts to have nearby, explain that missing items can be tracked, and ask the applicant to say when they are ready.
5. IF microphone permission or speech output fails, THEN THE SSDI_Assistant SHALL preserve the selected language, show the introduction in that language, and offer “Type my answer.”
6. THE SSDI_Assistant SHALL NOT silently change the Conversation_Locale to English after a provider failure.

#### Requirement 1B: Continuous application conversation

**User Story:** As an applicant with limited mobility or difficulty using forms, I want one guided conversation that completes the workflow, so that I do not have to operate several separate form screens.

1. THE user-facing workflow SHALL contain only Application, Documents, and Records.
2. THE Application stage SHALL internally progress through `language`, `introduction`, `document_readiness`, `intake`, `issue_resolution`, `completion_review`, and `ready`.
3. THE SSDI_Assistant SHALL keep prequalification questions and results inside the conversation and SHALL NOT expose a prequalification stage, score, pass label, or failure label.
4. THE SSDI_Assistant SHALL confirm every consequential answer in the selected language before marking it confirmed.
5. WHEN a required answer is deferred, THE SSDI_Assistant SHALL keep it incomplete, explain why it is needed, and return to it before packet generation.
6. WHEN the applicant says “skip,” “disregard,” or “I don’t know,” THE SSDI_Assistant SHALL interpret the phrase as a command or explicit unknown and SHALL NOT save the phrase as a form value.
7. THE SSDI_Assistant SHALL support repeat, explain, pause, continue, go back, correct, defer, status, change language, review, generate packet, download packet, open records, and mark received by voice.
8. IF a command changes or removes confirmed information, THEN THE SSDI_Assistant SHALL identify the target and obtain confirmation before applying the command.

#### Requirement 1C: Deterministic completion

**User Story:** As an applicant, I want the assistant to prevent an incomplete packet without inventing answers, so that I can resolve what is actually missing.

1. THE Question_Registry SHALL label each question required, conditional, or optional and SHALL identify its activation rule, unknown policy, affected canonical fields, affected forms, and packet-blocking status.
2. THE Completion_Engine SHALL block packet generation while legal name, Social Security number, birth date, birthplace, citizenship or immigration response, mailing address, phone, current work and earnings response, alleged onset date, disabling condition and work effect, education response, marriage response, children response, provider exhaustion, five-year work-history completion, conflict resolution, or final applicant approval remains unresolved.
3. WHEN the applicant explicitly reports no providers, medications, marriages, children, or applicable jobs, THE Completion_Engine SHALL accept the confirmed negative response rather than requiring a fabricated collection entry.
4. WHEN email, alternate contact, or direct-deposit information is declined or deferred, THE Completion_Engine SHALL record the disposition and SHALL NOT invent a value.
5. THE packet-generation server route SHALL run the same Completion_Engine used by the client and SHALL reject an incomplete Applicant_Case with machine-readable missing-item identifiers.

#### Requirement 1D: Multilingual canonical values

**User Story:** As an applicant speaking Spanish or Mandarin, I want to review the assistant’s understanding in my language while receiving valid English SSA forms.

1. THE SSDI_Assistant SHALL support `en-US`, `es-US`, and `zh-CN` Conversation_Locales.
2. THE Speech_To_Text adapter SHALL use the configured locale for every recording and SHALL use an English medical model only for English.
3. THE Text_To_Speech adapter SHALL use a locale-specific voice and multilingual synthesis model.
4. THE Extraction_Adapter SHALL preserve the Original_Transcript and SHALL produce English canonical values for English SSA forms.
5. THE Extraction_Adapter SHALL preserve legal names, addresses, identifiers, numbers, and dates without translating their semantic content.
6. THE SSDI_Assistant SHALL confirm extracted meaning and ask follow-up questions in the active Conversation_Locale.
7. WHEN the applicant changes language, THE SSDI_Assistant SHALL update speech input, speech output, visible copy, and the current question before accepting the next answer.

## Glossary

- **SSDI_Assistant**: The complete responsive web application, including the deterministic rules core, interview paths, review surface, document pipeline, record tracker, and V2 extensions.
- **Applicant_Case**: The single in-memory V1 object containing applicant facts, eligibility inputs and results, conditions, providers, medications, work history, family information, checklist items, record requests, field provenance, review state, and workflow stage.
- **Synthetic_Applicant**: The fictional persona used for all demonstration data, generated documents, screenshots, tests, and fallback behavior.
- **Prequalification_Engine**: The deterministic component that evaluates possible SGA issues and estimates the two insured-status tests without deciding legal eligibility.
- **Duration_Of_Work_Test**: The lifetime-work component of the insured-status estimate, using the progressive SSA duration table and a maximum of 40 credits.
- **Recent_Work_Test**: The recency component of the insured-status estimate: 6 credits in 3 years before age 24, half the period after age 21 for ages 24–30, or 20 credits in the preceding 10 years at age 31 or older.
- **Decision_Status**: One of `looks_clear`, `needs_review`, or `uncertain`. The product does not present a definitive eligibility denial from self-reported information.
- **Voice_Interview**: The browser conversation path that accepts speech, supplies spoken responses, displays a transcript, and maps applicant language into candidate fields.
- **Typed_Fallback**: The structured text path used by preference or after speech failure. It writes to the same Applicant_Case and reaches the same Review_Surface and Document_Packet.
- **Interview_Turn**: One prompt and applicant response, with transcript text, capture state, and extraction status.
- **Provider_Exhaustion_Loop**: The repeated follow-up that continues after every provider until the applicant explicitly indicates there are no more.
- **Extraction_Adapter**: The schema-constrained LLM boundary that converts transcript segments into candidate Applicant_Case updates with confidence and provenance.
- **Field_Provenance**: Metadata stating whether a value came from voice, typing, or seed data and whether it is confirmed, unconfirmed, or conflicting.
- **Review_Surface**: The required step between interview and packet generation where the applicant confirms, corrects, adds, or resolves captured values.
- **Document_Checklist**: The deterministic, personalized list of supporting documents, with the rule and reason for each selected item.
- **Document_Packet**: The downloadable output consisting of SSA-16, SSA-3368, SSA-3369, one signature-ready SSA-827, any continuation sheets, and the Evidence_Index.
- **Form_Field_Adapter**: A typed per-form mapping from Applicant_Case values to Anvil field IDs derived from the checked-in `fieldmaps/` files.
- **Continuation_Sheet**: An additional generated page used when provider, medication, job, or other repeatable data exceeds the capacity of an SSA form.
- **Cross_Form_Validator**: The deterministic component that finds incompatible or missing values shared across forms, especially the alleged onset date.
- **Remarks_Generator**: The deterministic formatter that creates SSA-3368 Remarks content from overflow references and record-request status.
- **Evidence_Index**: A generated PDF listing each provider, relevant records or periods requested, request date, deadline, and current response status.
- **Right_Of_Access_Request**: Guidance and a script for the applicant to request their own records under HIPAA, distinct from SSA-827.
- **Record_Tracker**: The provider-level status surface showing request date, computed deadline, response state, and the applicant's next action.
- **Demo_Fallback**: The deterministic synthetic interview and captured case used when live speech or extraction is unavailable, plus the recorded demonstration used when document generation cannot be shown live.
- **Impeccable_Skill**: The frontend design skill at `skills/impeccable/` governing product hierarchy, layout, typography, interaction, accessibility, adaptation, critique, audit, and polish.
- **Tier_A_Data**: Social Security number, diagnoses, conditions, medications, raw conversation content, and completed PDFs. Tier A data is never persisted.
- **Tier_B_Data**: Provider identity and contact information, request/response dates, and applicant reminder contact. Tier B data is health-identifying and may be persisted only by V2 under its security rules.
- **Magic_Link**: A passwordless, single-use return-access link sent to a verified email address or phone number in V2.
- **Reminder_Scheduler**: The V2 daily process that identifies due day-20, day-30, and SSA-827-expiry reminder events.
- **SMS_Consent**: The V2 record of explicit applicant opt-in to reminder text messages, including timestamp, source, and revocation state.
- **Avatar_Layer**: The optional V2 rendered-face presentation adapter synchronized to existing speech output.
- **Assisted_Call**: The V2 Twilio flow that navigates a supported provider phone tree, waits on hold, and bridges the applicant to a human; the applicant speaks for themselves.
- **Conversation_Locale**: One of `en-US`, `es-US`, or `zh-CN`, selected before the conversation begins and used by visible copy, speech recognition, speech synthesis, confirmations, and follow-up questions.
- **Application_Phase**: The internal state of the continuous application conversation: `language`, `introduction`, `document_readiness`, `intake`, `issue_resolution`, `completion_review`, or `ready`.
- **Question_Registry**: The deterministic list of required, conditional, and optional interview questions, including activation, unknown, completeness, localization, and field-mapping metadata.
- **Completion_Engine**: The shared client/server rules that identify missing, deferred, unconfirmed, conflicting, or incomplete information and decide whether packet generation is allowed.
- **Voice_Command**: A spoken navigation or correction instruction that is separated from application answers before extraction.
- **Original_Transcript**: The applicant’s answer in the language in which it was spoken or typed, retained with the corresponding canonical English value and provenance.
- **Document_Readiness**: The applicant-reported status of a preparation item: `ready`, `not_available`, `follow_up`, or `obtained`.

## V1 Requirements — Mandatory Hackathon Build

### Requirement 1: Responsive Applicant Workspace

**User Story:** As an applicant, I want one understandable workspace with a visible next step, so that I can make progress without learning the structure of SSA forms.

#### Acceptance Criteria

1. THE SSDI_Assistant SHALL provide the stages Check, Interview, Review, Packet, and Records in that workflow order.
2. THE SSDI_Assistant SHALL expose Check, Interview, Packet, and Records as the persistent mobile navigation destinations.
3. THE SSDI_Assistant SHALL require Review after Interview and before first-time Document_Packet generation.
4. WHEN the workspace is rendered at a viewport below 768 CSS pixels, THE SSDI_Assistant SHALL present one primary task at a time and SHALL place secondary transcript or fact content in a dismissible drawer.
5. WHEN the workspace is rendered at a viewport of at least 1024 CSS pixels, THE SSDI_Assistant SHALL show a compact stage rail, a central task surface, and a contextual facts panel only where that panel supports Interview or Review.
6. THE SSDI_Assistant SHALL provide no more than one visually dominant primary action in the active task region.
7. THE SSDI_Assistant SHALL open directly into the product with actions to start the check or load the Synthetic_Applicant and SHALL NOT require a marketing landing page.
8. IF the user returns to an earlier completed stage during the same session, THEN THE SSDI_Assistant SHALL preserve all later captured state and SHALL mark downstream derived outputs as needing revalidation when applicable.

### Requirement 2: Deterministic Prequalification

**User Story:** As an applicant, I want to understand possible non-medical eligibility issues before completing hundreds of fields, so that I know what requires verification.

#### Acceptance Criteria

1. WHEN a new check begins, THE Prequalification_Engine SHALL ask current average monthly earnings before any other eligibility question.
2. THE Prequalification_Engine SHALL read the effective non-blind SGA limit, statutory-blind SGA limit, earnings per credit, four-credit earnings amount, and effective year from versioned configuration.
3. FOR the 2026 configuration, THE Prequalification_Engine SHALL use `$1,690` per month for non-blind SGA, `$2,830` per month for statutory-blind SGA, `$1,890` per credit, and `$7,560` for four credits.
4. BEFORE comparing earnings to SGA, THE Prequalification_Engine SHALL ask whether statutory blindness, impairment-related work expenses, subsidies or special work conditions, self-employment, or passive income may apply.
5. IF self-employment applies, THEN THE Prequalification_Engine SHALL use reported profit rather than gross revenue and SHALL return `needs_review` because SSA applies additional tests.
6. IF earnings exceed the applicable configured SGA amount and any exception is possible or unknown, THEN THE Prequalification_Engine SHALL return `needs_review`, name each possible exception, and SHALL NOT state that the applicant is ineligible.
7. THE Prequalification_Engine SHALL compute age at alleged onset from date of birth and alleged onset date.
8. THE Duration_Of_Work_Test SHALL apply the progressive lifetime-work schedule: before age 28 requires 1.5 years; age 30 requires 2 years; age 34 requires 3 years; age 38 requires 4 years; age 42 requires 5 years; ages 44 through 60 rise by 0.5 years for each two years of age to 9.5 years at age 60; and the requirement SHALL cap at 10 years or 40 credits.
9. THE Recent_Work_Test SHALL require 6 credits in the 3-year period ending at onset before age 24, work during half the period between age 21 and onset for ages 24–30, or 20 credits in the 10 years before onset at age 31 or older.
10. THE Prequalification_Engine SHALL evaluate Duration_Of_Work_Test and Recent_Work_Test independently and SHALL identify the result of each test.
11. IF self-reported work history cannot establish either credit test reliably, THEN THE Prequalification_Engine SHALL return `uncertain`, direct the applicant to their `my Social Security` earnings record, and describe what information to verify.
12. THE Prequalification_Engine SHALL NOT state a definitive failure of insured status from self-reported data alone.
13. THE Prequalification_Engine SHALL attach a named rule ID and plain-language reason to every result.
14. THE Prequalification_Engine SHALL use no generative AI.
15. WHEN the applicant supplies all required answers, THE SSDI_Assistant SHALL display the complete prequalification result within 2 seconds and the flow SHALL be completable in under 2 minutes.

### Requirement 3: Voice Interview

**User Story:** As an applicant who finds long forms difficult, I want to explain my history by speaking naturally, so that I can provide complete information without translating my experience into form language.

#### Acceptance Criteria

1. WHEN the applicant starts Voice_Interview, THE SSDI_Assistant SHALL request microphone permission only in response to an explicit user action.
2. THE Voice_Interview SHALL accept spoken input, provide spoken output, and display the complete text transcript alongside or within one action of the active question.
3. THE Voice_Interview SHALL ask questions in plain language and SHALL NOT read SSA field names or form-item numbers as the primary question.
4. THE Voice_Interview SHALL collect applicant identity, contact, citizenship, marital and child information, conditions, alleged onset date, work impact, providers, medications, education, and job history required by the four in-scope forms.
5. THE Voice_Interview SHALL collect for each provider: practitioner or facility name, specialty when known, address, phone, first treatment date, last treatment date, next appointment when known, and conditions treated.
6. THE Voice_Interview SHALL collect for each medication: name, dosage when known, frequency when known, prescriber, reason, and side effects when reported.
7. THE Voice_Interview SHALL collect for each job: employer, job title, dates, hours, pay, duties, physical demands, tools or machines, supervision, writing or reports, and reason work ended when applicable.
8. WHILE recording is active, THE Voice_Interview SHALL visibly communicate listening, paused, processing, and error states without relying only on color.
9. WHEN a transcript segment is finalized, THE Voice_Interview SHALL display it before or at the same time as any facts extracted from it.
10. THE Voice_Interview SHALL allow pause, resume, replay of the last spoken prompt, and transition to Typed_Fallback without discarding Interview_Turn history.
11. IF speech-to-text latency exceeds 2 seconds, THEN THE Voice_Interview SHALL show an active processing state and SHALL continue accepting a typed response option.

### Requirement 4: Provider-List Exhaustion

**User Story:** As an applicant, I want the interview to help me remember every place I received care, so that missing providers do not weaken the evidence available to SSA.

#### Acceptance Criteria

1. WHEN the applicant names a provider, THE Provider_Exhaustion_Loop SHALL create a distinct candidate provider and SHALL ask whether the applicant saw anyone else.
2. THE Provider_Exhaustion_Loop SHALL continue until the applicant explicitly answers that there are no additional providers.
3. IF the applicant names a facility and practitioner that may represent the same source, THEN THE SSDI_Assistant SHALL present a possible-duplicate review choice and SHALL NOT merge them automatically.
4. IF the applicant cannot recall a provider detail, THEN THE SSDI_Assistant SHALL retain the provider with that detail marked unconfirmed rather than dropping the provider.
5. WHEN the applicant says a provider is the only source for a condition, THE SSDI_Assistant SHALL record the relationship but SHALL still ask whether any other source treated any condition.
6. THE Provider_Exhaustion_Loop SHALL operate identically in Voice_Interview and Typed_Fallback.

### Requirement 5: Structured Extraction, Provenance, and Correction

**User Story:** As an applicant, I want to see what the product understood and correct it, so that generated legal forms reflect my facts rather than an AI interpretation.

#### Acceptance Criteria

1. WHEN an Interview_Turn is complete, THE Extraction_Adapter SHALL request schema-constrained candidate updates rather than unstructured prose.
2. THE Extraction_Adapter SHALL map candidate values to canonical field keys using the plain-English `/TU` labels in the checked-in field maps.
3. THE Extraction_Adapter SHALL attach source turn, extraction confidence, and Field_Provenance to every candidate value.
4. IF a candidate value is ambiguous, contradictory, or below the configured confidence threshold, THEN THE SSDI_Assistant SHALL mark it `unconfirmed` and SHALL request applicant review.
5. THE Extraction_Adapter SHALL NOT overwrite a confirmed value without creating a visible conflict.
6. WHEN the applicant edits or confirms a value, THE SSDI_Assistant SHALL update the Applicant_Case immediately and SHALL record the value as `confirmed`.
7. WHEN the applicant deletes a repeated entity such as a provider, medication, or job, THE SSDI_Assistant SHALL request confirmation and SHALL show which outputs will be affected.
8. IF extraction fails for one Interview_Turn, THEN THE SSDI_Assistant SHALL preserve its transcript, offer retry or manual entry, and SHALL preserve all previously captured facts.
9. THE SSDI_Assistant SHALL prevent Document_Packet generation while a required consequential field remains conflicting.

### Requirement 6: Typed Fallback and Equivalent Paths

**User Story:** As an applicant who cannot or does not want to use voice, I want a complete typed path, so that I can reach the same result without losing functionality.

#### Acceptance Criteria

1. THE Typed_Fallback SHALL be available before and during Voice_Interview.
2. THE Typed_Fallback SHALL collect the same canonical facts as Voice_Interview and SHALL write to the same Applicant_Case.
3. WHEN the applicant switches between voice and typing, THE SSDI_Assistant SHALL preserve all captured transcript and field state.
4. THE Typed_Fallback SHALL use plain-language grouped fields and SHALL NOT reproduce the visual structure of the SSA PDFs.
5. WHEN Voice_Interview and Typed_Fallback receive semantically equivalent answers, THE SSDI_Assistant SHALL produce equivalent confirmed Applicant_Case values, checklist items, validation results, and document fields.
6. IF microphone permission is denied or speech recognition fails, THEN THE SSDI_Assistant SHALL move focus to Typed_Fallback, explain the change in one sentence, and SHALL retain current progress.

### Requirement 7: Canonical Applicant Case and Review

**User Story:** As an applicant, I want one review of all important facts before documents are generated, so that I do not have to inspect hundreds of PDF fields individually.

#### Acceptance Criteria

1. THE Applicant_Case SHALL be the sole mutable source for applicant facts used by all V1 outputs.
2. THE Applicant_Case SHALL represent repeatable providers, medications, jobs, marriages, and children as stable-ID collections.
3. THE Applicant_Case SHALL distinguish missing, unconfirmed, confirmed, conflicting, and not-applicable values.
4. THE Review_Surface SHALL group information into Applicant, Conditions, Providers, Medications, Work, and Family.
5. THE Review_Surface SHALL prioritize missing, unconfirmed, and conflicting values before confirmed values.
6. THE Review_Surface SHALL allow inline correction without returning to the original interview turn.
7. WHEN a shared value changes, THE Cross_Form_Validator SHALL re-evaluate every dependent form field and derived output.
8. THE SSDI_Assistant SHALL NOT ask the applicant to re-enter a confirmed value solely because another form requests the same fact.
9. WHEN all required conflicts are resolved, THE Review_Surface SHALL make Document_Packet generation available as its single primary action.

### Requirement 8: Personalized Supporting-Document Checklist

**User Story:** As an applicant, I want a list of documents that applies to my circumstances, so that I gather what is needed without sorting through a generic list.

#### Acceptance Criteria

1. THE Document_Checklist SHALL always include birth certificate, Social Security number, photo identification, and bank routing and account information.
2. IF the applicant served in the military, THEN THE Document_Checklist SHALL include DD-214 and SHALL state the triggering military-service rule.
3. IF the applicant is married, THEN THE Document_Checklist SHALL include a marriage certificate and SHALL state why it is relevant.
4. IF the applicant reports a divorce after a marriage lasting at least 10 years, THEN THE Document_Checklist SHALL include the divorce decree and SHALL state why it is relevant.
5. IF the applicant has a child under age 18, THEN THE Document_Checklist SHALL include that child's birth certificate and Social Security number.
6. IF the applicant worked during the previous calendar year, THEN THE Document_Checklist SHALL include W-2 or self-employment tax records as applicable.
7. IF the applicant currently has earnings, THEN THE Document_Checklist SHALL include recent pay stubs or current self-employment profit records as applicable.
8. IF the applicant is not a United States citizen, THEN THE Document_Checklist SHALL include relevant immigration documentation.
9. THE Document_Checklist SHALL attach a rule ID and plain-language reason to every item.
10. THE Document_Checklist SHALL use no generative AI.
11. WHEN an answer affecting the checklist changes, THE Document_Checklist SHALL recompute without duplicating unaffected items.

### Requirement 9: Application Document Packet

**User Story:** As an applicant, I want my confirmed answers reused across all required forms, so that I receive a coherent packet without copying the same facts repeatedly.

#### Acceptance Criteria

1. THE Document_Packet SHALL include SSA-16-BK (09-2025), SSA-3368-BK, SSA-3369-BK (06-2024), one signature-ready SSA-827, all required Continuation_Sheets, and one Evidence_Index.
2. THE Form_Field_Adapter for SSA-16 SHALL use `fieldmaps/ssa-16.json` and SHALL support all 140 mapped usable fields.
3. THE Form_Field_Adapter for SSA-3368 SHALL use `fieldmaps/ssa-3368.json` and SHALL support all 426 mapped usable fields.
4. THE Form_Field_Adapter for SSA-3369 SHALL use `fieldmaps/ssa-3369.json` and SHALL support all 377 user-fillable mapped fields.
5. THE Form_Field_Adapter for SSA-827 SHALL use `fieldmaps/ssa-827.json` and SHALL support the applicable applicant-completed fields among its 23 mapped fields.
6. THE SSDI_Assistant SHALL generate exactly one SSA-827 per case at the current adjudicative level by default.
7. WHEN the applicant explicitly requests an additional blank SSA-827 original, THE SSDI_Assistant SHALL allow it without tying it to a provider.
8. THE SSA-827 output SHALL leave signature, date, parent-signature, witness-signature, witness-address, and `P1_SSAComplete_FLD` fields blank.
9. THE SSDI_Assistant SHALL NOT use SSA-827 as the applicant's Right_Of_Access_Request to an individual provider.
10. ALL Anvil API calls SHALL execute server-side and secret values SHALL NOT be included in client bundles, browser requests, logs, or error messages.
11. WHEN generation succeeds, THE SSDI_Assistant SHALL deliver the documents to the browser without retaining completed PDFs.
12. THE SSDI_Assistant SHALL NOT claim that Anvil signatures are accepted by SSA for SSA-827.
13. WHEN all dependencies respond normally, THE complete Document_Packet SHALL be generated within 10 seconds.

### Requirement 10: Cross-Form Consistency and Overflow

**User Story:** As an applicant, I want repeated facts to remain consistent and extra information to be preserved, so that form limits do not create omissions or contradictions.

#### Acceptance Criteria

1. THE Cross_Form_Validator SHALL compare the alleged onset date used by SSA-16 and SSA-3368 before packet generation.
2. IF the onset dates disagree, THEN THE SSDI_Assistant SHALL identify both values, explain that they must match, and SHALL block generation until the applicant resolves the conflict.
3. THE Cross_Form_Validator SHALL check repeated applicant identity, marital, child, provider, medication, and work-history values for incompatible confirmed values.
4. IF a repeatable collection exceeds the target form's capacity, THEN THE Form_Field_Adapter SHALL fill every available form slot and SHALL place every remaining item on a Continuation_Sheet.
5. IF SSA-3368 contains more than 6 providers or 11 medications, THEN THE SSDI_Assistant SHALL generate a Continuation_Sheet and SHALL reference that sheet in Remarks.
6. THE overflow process SHALL preserve source order, stable IDs, labels, relevant dates, and relationships.
7. THE overflow process SHALL NOT silently truncate, merge, or reorder entries.
8. WHEN a conflicting or overflow-affecting value changes, THE SSDI_Assistant SHALL invalidate the previous generated preview and SHALL require regeneration.

### Requirement 11: Remarks and Evidence Index

**User Story:** As an applicant, I want SSA to see what evidence was requested and what is still missing, so that silence from a provider is documented rather than mistaken for missing treatment.

#### Acceptance Criteria

1. THE Remarks_Generator SHALL include each overflow Continuation_Sheet reference.
2. THE Remarks_Generator SHALL include a concise record-status sentence for each requested provider, using provider display name, request date, response state, and latest status date when available.
3. THE Remarks_Generator SHALL use deterministic templates and SHALL NOT use generative AI.
4. THE Evidence_Index SHALL list each provider, the relevant record type or treatment period, date requested, computed deadline, and status.
5. THE Evidence_Index SHALL distinguish `not_requested`, `sent`, `responded`, and `silent` without relying only on color.
6. WHEN no request has been sent to a provider, THE Evidence_Index SHALL state `Not requested` rather than inventing a date.
7. THE Evidence_Index SHALL be generated from HTML to PDF and SHALL be included in the Document_Packet.
8. WHEN tracker state changes, THE SSDI_Assistant SHALL mark Remarks and Evidence_Index as stale until regenerated.

### Requirement 12: Seeded Record Tracker

**User Story:** As an applicant, I want to know which provider to contact and what to say, so that I can act before or after a records deadline.

#### Acceptance Criteria

1. THE Record_Tracker SHALL record per provider: stable ID, display name, phone, portal availability, request date, computed deadline, response date when present, and response status.
2. THE Record_Tracker SHALL compute the standard deadline as 30 calendar days after request and SHALL support one configured 30-day extension when written notice has been recorded.
3. THE Record_Tracker SHALL prompt the applicant to check the patient portal before calling.
4. WHEN a request reaches day 20 without a response, THE Record_Tracker SHALL present the provider phone number and a verbatim Right_Of_Access_Request follow-up script.
5. THE day-20 script SHALL state that the applicant is requesting their own records, reference the 30-day response period, reject a retrieval fee, and ask for email or portal delivery.
6. WHEN a request reaches day 30 without a response or extension, THE Record_Tracker SHALL present escalation options including an Office for Civil Rights complaint.
7. WHEN an SSA-827 signing date reaches 11 months, THE Record_Tracker SHALL warn that the authorization approaches its 12-month expiry and SHALL offer a fresh signature-ready form.
8. THE Record_Tracker SHALL address every reminder to the applicant and SHALL NOT contact a provider in V1.
9. THE V1 Synthetic_Applicant SHALL include at least one responded provider, one silent provider at day 22, and one silent provider past day 30.
10. THE V1 Record_Tracker SHALL use only seeded in-memory state and SHALL use no scheduler, account, persistent datastore, email, or SMS.
11. THE Record_Tracker SHALL use deterministic date arithmetic and SHALL use no generative AI.

### Requirement 13: Accessible, Restrained Product Interface

**User Story:** As an applicant with variable physical, sensory, or cognitive access needs, I want the complete workflow to remain usable with my preferred input and assistive technology.

#### Acceptance Criteria

1. THE SSDI_Assistant SHALL conform to WCAG 2.2 Level AA for the supported V1 workflow.
2. THE SSDI_Assistant SHALL support complete keyboard operation with visible focus and logical focus restoration.
3. THE SSDI_Assistant SHALL expose semantic names, roles, states, errors, and progress announcements to screen readers.
4. THE SSDI_Assistant SHALL use a minimum target size of 44 by 44 CSS pixels for primary touch controls.
5. THE SSDI_Assistant SHALL NOT communicate status using color alone.
6. THE SSDI_Assistant SHALL use user-facing language targeted at approximately a sixth-grade reading level.
7. THE SSDI_Assistant SHALL limit persistent helper copy to the minimum required for the active decision and SHALL place longer definitions behind contextual disclosure.
8. THE SSDI_Assistant SHALL honor `prefers-reduced-motion` and SHALL provide a non-motion equivalent for every transition.
9. THE SSDI_Assistant SHALL remain operable at 320 CSS pixels wide and at 200 percent browser zoom without loss of content or action.
10. THE SSDI_Assistant SHALL use the Impeccable_Skill for its visual system, interaction design, responsive adaptation, critique, audit, and polish.
11. THE SSDI_Assistant SHALL avoid gradient text, decorative glass effects, colored side-stripe cards, repetitive card grids, decorative hero metrics, and unnecessary page-load choreography.

### Requirement 14: V1 Privacy, Legal Boundaries, and Service Fallbacks

**User Story:** As an applicant, I want my sensitive information minimized and my work preserved when a service fails, so that convenience does not create a new risk or dead end.

#### Acceptance Criteria

1. THE V1 SSDI_Assistant SHALL store the Applicant_Case only in memory for the active browser session.
2. THE V1 SSDI_Assistant SHALL NOT persist Tier_A_Data or Tier_B_Data to local storage, cookies, browser databases, server databases, analytics, logs, or error reporting.
3. THE V1 SSDI_Assistant SHALL use only the Synthetic_Applicant for demonstrations, automated tests, screenshots, and recorded fallback media.
4. THE SSDI_Assistant SHALL NOT file any form, contact SSA, charge a claim-related fee, provide individualized legal advice, or act as an appointed representative.
5. IF speech recognition fails, THEN THE SSDI_Assistant SHALL preserve the Applicant_Case and SHALL offer Typed_Fallback.
6. IF speech synthesis fails, THEN THE SSDI_Assistant SHALL preserve the Applicant_Case and SHALL continue with visible text.
7. IF the Extraction_Adapter fails, THEN THE SSDI_Assistant SHALL preserve transcript and facts and SHALL offer retry or manual review.
8. IF Anvil generation fails, THEN THE SSDI_Assistant SHALL preserve the Applicant_Case, identify document generation as unavailable, and SHALL offer retry without implying that a packet was produced.
9. IF live voice or extraction is unavailable during the demonstration, THEN THE SSDI_Assistant SHALL allow the presenter to load Demo_Fallback data and SHALL identify the fallback state.
10. THE SSDI_Assistant SHALL scrub Tier_A_Data and Tier_B_Data from client and server error messages.
11. THE SSDI_Assistant SHALL display one concise statement explaining that it helps prepare an application but does not determine eligibility or file with SSA.

### Requirement 15: Three-Minute Working Demo

**User Story:** As a hackathon judge, I want to see the complete problem and solution in one reliable flow, so that I can assess impact, technical substance, product quality, originality, and Anvil usage.

#### Acceptance Criteria

1. THE SSDI_Assistant SHALL provide a rehearsed demo path that completes in no more than 3 minutes under normal configured service conditions.
2. THE demo path SHALL show the Synthetic_Applicant completing the Prequalification_Engine with a traceable `needs_review` or `uncertain` result.
3. THE demo path SHALL show at least one live or deterministic spoken answer becoming visible transcript and candidate structured facts.
4. THE demo path SHALL show the Provider_Exhaustion_Loop and at least one applicant correction.
5. THE demo path SHALL show the Cross_Form_Validator identifying or confirming the shared onset date.
6. THE demo path SHALL generate or preview SSA-16, SSA-3368, SSA-3369, one SSA-827, the personalized checklist, and the Evidence_Index.
7. THE demo path SHALL show the three seeded Record_Tracker states and at least one actionable follow-up script.
8. THE demo path SHALL include an explicit Demo_Fallback for speech/extraction and a recorded fallback for document-generation failure.
9. THE prequalification flow SHALL remain independently demonstrable if every external AI, speech, and document service is unavailable.

## V2 Requirements — Production Extension

### Requirement 16: Encrypted Persistence and Magic-Link Access

**User Story:** As an applicant following records over weeks or months, I want to return securely without creating a password, so that I can continue the tracker with minimal friction.

#### Acceptance Criteria

1. THE V2 SSDI_Assistant SHALL use passwordless Magic_Link access and SHALL NOT require a username and password.
2. WHEN a Magic_Link is issued, THE SSDI_Assistant SHALL make it single-use, time-limited, and bound to the intended contact.
3. THE V2 persistent model SHALL store only Tier_B_Data required by Record_Tracker and reminders.
4. THE V2 persistent model SHALL NOT store Social Security number, diagnoses, conditions, medications, raw interview transcript, or completed PDFs.
5. THE V2 SSDI_Assistant SHALL encrypt provider display identity, provider contact, and applicant reminder contact at rest in addition to platform disk encryption.
6. THE V2 SSDI_Assistant SHALL enforce row-level access so an authenticated magic-link session can access only its own opaque case.
7. WHEN a user returns through a valid Magic_Link, THE SSDI_Assistant SHALL restore tracker state without reconstructing or requesting Tier_A_Data.
8. IF a Magic_Link is expired or already used, THEN THE SSDI_Assistant SHALL reject it and SHALL offer issuance of a new link without exposing case existence.

### Requirement 17: Retention, Deletion, and V2 Security

**User Story:** As an applicant, I want control over how long tracker information exists, so that sensitive provider information is not retained indefinitely.

#### Acceptance Criteria

1. THE V2 SSDI_Assistant SHALL display what Tier_B_Data is stored, why it is stored, and the active deletion rule before persistence is enabled.
2. WHEN an applicant marks a case closed, THE SSDI_Assistant SHALL schedule automatic deletion 30 days later.
3. WHEN a case has no authenticated activity for 18 months, THE SSDI_Assistant SHALL schedule automatic deletion.
4. THE SSDI_Assistant SHALL notify the applicant before inactivity deletion when a valid consented reminder channel exists.
5. THE SSDI_Assistant SHALL provide one action to delete the case immediately.
6. WHEN deletion is confirmed, THE SSDI_Assistant SHALL delete encrypted case data, provider references, record requests, reminder events, consent records, and associated access sessions.
7. THE SSDI_Assistant SHALL NOT place Tier_A_Data or Tier_B_Data in logs, analytics properties, traces, URLs, metric labels, or notification-provider metadata beyond the minimum delivery address and message content required.
8. THE production deployment SHALL use vendors and configurations approved for the applicable health-data obligations before real applicant data is accepted.

### Requirement 18: Reminder Scheduler and Consented SMS

**User Story:** As an applicant, I want reminders to arrive when action is due, so that I do not need to remember every provider deadline.

#### Acceptance Criteria

1. THE Reminder_Scheduler SHALL evaluate active record requests at least once per calendar day.
2. THE Reminder_Scheduler SHALL create day-20, day-30, and 11-month authorization-expiry reminder events from deterministic date rules.
3. THE Reminder_Scheduler SHALL make each event idempotent by case, request or authorization, reminder type, and due date.
4. THE SSDI_Assistant SHALL continue to show on-screen reminders whether or not SMS is enabled.
5. BEFORE sending any SMS reminder, THE SSDI_Assistant SHALL capture explicit SMS_Consent with timestamp and source.
6. IF SMS_Consent is absent or revoked, THEN THE SSDI_Assistant SHALL NOT send an SMS.
7. THE SMS reminder SHALL contain the provider display name, provider phone number, due state, and concise applicant script or a secure link to it.
8. WHEN the applicant sends `STOP`, THE SSDI_Assistant SHALL revoke SMS_Consent, suppress future messages, and preserve on-screen reminders.
9. IF Twilio delivery fails, THEN THE SSDI_Assistant SHALL record a non-sensitive delivery failure, SHALL NOT duplicate the event automatically, and SHALL preserve the on-screen reminder.

### Requirement 19: Optional Avatar Layer

**User Story:** As an applicant who benefits from a visible speaking face, I want an optional synchronized avatar, so that spoken guidance is easier to follow.

#### Acceptance Criteria

1. THE Avatar_Layer SHALL be optional and disabled by default.
2. THE Avatar_Layer SHALL consume the same speech output as Voice_Interview and SHALL NOT own interview logic or applicant facts.
3. THE SSDI_Assistant SHALL preserve voice-only and text-only modes whenever the Avatar_Layer is enabled.
4. IF avatar initialization, rendering, or synchronization fails, THEN THE SSDI_Assistant SHALL continue in voice-only or text-only mode without losing progress.
5. THE Avatar_Layer SHALL honor reduced-motion settings and SHALL provide a non-animated alternative.
6. THE Avatar_Layer SHALL NOT be the sole carrier of instructions, status, errors, or confirmation.

### Requirement 20: Feature-Flagged Assisted Calling

**User Story:** As an applicant who struggles with phone menus and hold times, I want the system to navigate the known mechanical portion and connect me to a person, so that I still make the records request myself.

#### Acceptance Criteria

1. THE Assisted_Call SHALL remain behind a disabled-by-default feature flag until provider support and human-detection behavior have been validated.
2. THE Assisted_Call SHALL support only providers with an explicitly configured phone-tree route.
3. WHEN an Assisted_Call starts, THE SSDI_Assistant SHALL disclose what the system will do, that the applicant must speak for themselves, and how to end the call.
4. THE Assisted_Call SHALL use configured digits to navigate known menus and MAY wait on hold.
5. WHEN likely conversational speech is detected, THE Assisted_Call SHALL bridge the applicant and SHALL bias toward joining early rather than leaving a human unanswered.
6. THE SSDI_Assistant SHALL display the Right_Of_Access_Request script while the applicant is connected.
7. THE Assisted_Call SHALL NOT claim to be the applicant, request records as an AI or third party, answer identity questions, make medical decisions, or speak after the applicant is bridged except for a neutral connection notice.
8. IF the menu route is unknown, detection confidence is insufficient, or the call fails, THEN THE SSDI_Assistant SHALL stop automation, preserve tracker state, and SHALL offer the phone number and manual script.

### Requirement 21: Privacy-Safe Production Operations

**User Story:** As an operator, I want to know whether the production system works without observing applicant health information, so that reliability does not compromise privacy.

#### Acceptance Criteria

1. THE V2 SSDI_Assistant SHALL record aggregate counts and timing for page availability, reminder evaluation, message delivery state, and service errors without applicant, provider, or medical values.
2. THE V2 SSDI_Assistant SHALL use opaque random identifiers in operational events and SHALL exclude those identifiers from public URLs.
3. THE V2 SSDI_Assistant SHALL version annual SSA configuration with effective dates and SHALL retain the configuration version used for each deterministic decision without retaining its Tier_A inputs.
4. WHEN a configured SSA value approaches its annual review date, THE SSDI_Assistant SHALL create an operator task and SHALL NOT silently roll forward a previous-year value.
5. IF a production dependency is unavailable, THEN THE SSDI_Assistant SHALL expose aggregate dependency health while presenting the applicant with a plain next action and no internal diagnostic details.
6. THE V2 SSDI_Assistant SHALL perform automated checks that reject attempted logging of known Tier_A and Tier_B field keys.
