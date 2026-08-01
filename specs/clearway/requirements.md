# Requirements Document: Clearway Computer Use MVOP

## Introduction

Clearway extends the existing voice-guided SSDI application product with real, read-only Windows document discovery. The hosted Vercel application remains the primary interface. A Clearway Desktop shell grants the web interface narrow local capabilities after the user approves folders.

The computer-use feature must satisfy the current hack rule: a fresh, messy file request must produce an actual result without forced outputs, prerecorded actions, or document-specific branching. An explicitly labeled Elena Rivera sample case may prefill the existing SSDI application for a fast stage walkthrough, but it must never supply or alter computer-use requests, actions, candidates, or results. The agent may understand SSDI context, but its computer tools must accept arbitrary natural-language file requests such as “find my driver's license” or “find the lease Jordan signed.”

## Non-negotiable Rules

1. Every claimed computer action and result must come from an actual native tool event.
2. No document type, filename, path, result, or success state may be predetermined for the judged flow.
3. Only folders approved by the user in the current desktop session may be inspected.
4. V1 computer use is read-only. It may search, inspect, preview, and open; it may not move, delete, upload, sign, or submit.
5. Spoken activity must always have an equivalent visible status.
6. Existing SSDI completion, validation, Anvil generation, and accessibility behavior must continue working.

## Glossary

- **Clearway**: The complete voice-guided SSDI preparation product.
- **Clearway_Desktop**: The Electron Windows shell that loads the deployed Clearway web application and exposes a constrained preload bridge.
- **Computer_Agent**: The hosted planning loop that converts arbitrary user requests and real tool results into the next typed action.
- **Computer_Environment**: A sanitized description of Windows, available capabilities, and user-approved roots.
- **Approved_Root**: A folder selected by the user and authorized only for the current desktop session.
- **Computer_Tool**: A typed, read-only native capability available to the Computer_Agent.
- **Candidate_File**: A real file discovered beneath an Approved_Root and represented to the web application by an opaque identifier.
- **Activity_Event**: A truthful started, progress, completed, or failed event emitted by native execution.
- **Fresh_Input_Run**: A run against content not encoded into Clearway and not selected because of a known output.

## Requirements

### Requirement C1: Clearway Identity

**User Story:** As an applicant, I want one consistent product identity so that I know which assistant is helping me.

#### Acceptance Criteria

1. THE product SHALL identify itself as Clearway in visible copy, spoken introductions, metadata, generated packet metadata, documentation, tests, and download names.
2. THE tracked repository SHALL contain no product or package reference to the former name.
3. THE authoritative specification SHALL be `specs/clearway/requirements.md`, `design.md`, and `tasks.md`.

### Requirement C2: Desktop Connection and Consent

**User Story:** As an applicant, I want to choose where Clearway may look so that it cannot silently scan my computer.

#### Acceptance Criteria

1. WHEN the Vercel app runs inside Clearway_Desktop, THE interface SHALL show that local computer access is connected.
2. WHEN local access has not been granted, THE user SHALL be able to choose one or more folders through the native Windows folder picker.
3. THE native executor SHALL reject any path outside the current Approved_Root set.
4. THE authorization SHALL expire when Clearway_Desktop exits.
5. WHEN the app runs in a normal browser, THE interface SHALL explain that Clearway_Desktop is required for local search without pretending that search occurred.

### Requirement C3: Arbitrary Natural-Language Requests

**User Story:** As an applicant, I want to ask for any local document in ordinary language so that I do not need to know filenames or folder structures.

#### Acceptance Criteria

1. THE Computer_Agent SHALL accept free-form voice or typed requests.
2. THE planning contract SHALL NOT use a closed enumeration of SSDI document types.
3. THE same production path SHALL handle SSDI-related and unrelated document requests.
4. THE Computer_Agent SHALL receive Computer_Environment context before choosing its first action.
5. THE Computer_Agent SHALL base every later action on the actual preceding Computer_Tool result.

### Requirement C4: Generic Local File Discovery

**User Story:** As an applicant, I want Clearway to inspect real filenames and contents so that it can find poorly named documents.

#### Acceptance Criteria

1. THE search tool SHALL recursively inspect real files beneath Approved_Root values subject to explicit file-count, size, depth, and time limits.
2. THE search tool SHALL rank filename, path, extension, modified time, and extracted-content evidence against arbitrary search intent supplied at runtime.
3. THE executor SHALL support text files, text PDFs, and common image formats in the MVOP.
4. WHEN an image has an unhelpful filename, THE executor SHALL be able to run local English OCR and use the extracted text as evidence.
5. THE executor SHALL return Candidate_File records with actual names, display paths, timestamps, match evidence, and opaque IDs.
6. WHEN nothing is sufficiently relevant, THE result SHALL say no confident match was found and SHALL NOT manufacture one.

### Requirement C5: Local-First Analysis and Data Minimization

**User Story:** As an applicant, I want sensitive files to stay on my computer as much as possible.

#### Acceptance Criteria

1. THE desktop executor SHALL perform traversal, parsing, OCR, and preview generation locally.
2. THE web agent MAY receive metadata and bounded text excerpts from likely candidates.
3. THE web agent SHALL NOT receive complete local files or raw candidate images in this MVOP.
4. THE server SHALL reject excerpts above the configured length and SHALL use `Cache-Control: no-store`.
5. THE application SHALL NOT persist Approved_Root values, Candidate_File data, excerpts, or computer-agent history after the session.

### Requirement C6: Truthful Visible and Spoken Activity

**User Story:** As an applicant who cannot comfortably monitor the screen, I want Clearway to tell me exactly what it is doing.

#### Acceptance Criteria

1. EACH native action SHALL emit Activity_Event values for start and final outcome, plus bounded progress updates when useful.
2. THE interface SHALL show events in chronological order using plain language.
3. THE interface SHALL speak important events through the existing TTS path.
4. Spoken folder names, file counts, candidate counts, and success statements SHALL be derived from Activity_Event or Computer_Tool result values.
5. THE speech queue SHALL prevent overlapping narration.
6. IF TTS fails, THEN visible status and computer execution SHALL continue.

### Requirement C7: Results and SSDI Case Integration

**User Story:** As an applicant, I want to inspect what Clearway found and relate it to my application.

#### Acceptance Criteria

1. WHEN a search completes, THE interface SHALL show ranked Candidate_File results and the evidence supporting each match.
2. THE user SHALL be able to preview a supported candidate or open it in the normal Windows application.
3. THE user SHALL be able to associate a candidate with a current case document need in memory without uploading or moving the file.
4. A later correction or search SHALL NOT erase confirmed application answers or generated-form state.

### Requirement C8: Secure Desktop Boundary

**User Story:** As an applicant, I want the desktop bridge to expose only the capabilities Clearway needs.

#### Acceptance Criteria

1. Clearway_Desktop SHALL load only the configured HTTPS Clearway origin, except an explicit localhost development URL.
2. THE Electron renderer SHALL run with Node integration disabled, context isolation enabled, sandboxing enabled, and web security enabled.
3. EVERY IPC request SHALL validate its sender origin and input contract.
4. THE preload bridge SHALL expose named Clearway methods and SHALL NOT expose `ipcRenderer`, Node APIs, PowerShell, or arbitrary shell execution.
5. Native tools SHALL accept opaque root and candidate identifiers rather than renderer-supplied absolute paths.

### Requirement C9: Bounded Agent Execution and Recovery

**User Story:** As an applicant, I want Clearway to stop safely and explain problems instead of looping or claiming success.

#### Acceptance Criteria

1. THE Computer_Agent SHALL execute at most eight actions and sixty seconds for one request.
2. THE planner SHALL return exactly one of `act`, `finish`, `clarify`, or `error` per turn.
3. THE client SHALL reject malformed actions before invoking the desktop bridge.
4. IF Anthropic, OCR, parsing, folder access, or native execution fails, THEN Clearway SHALL preserve application state and explain the failed step and next option.
5. THE agent SHALL never convert an error into a successful Candidate_File result.

### Requirement C10: Fresh-Input Acceptance

**User Story:** As a judge, I want to choose an unseen input so that I can verify the agent is real.

#### Acceptance Criteria

1. THE production interface MAY expose the labeled Elena Rivera sample application loader, but SHALL contain no demo query parameter, prerecorded fallback, synthetic computer-use result, or forced computer-use result path.
2. A file added or renamed after Clearway starts SHALL be discoverable on the next search without rebuilding or changing configuration.
3. Two unrelated natural-language searches SHALL produce plans and results grounded in their respective real inputs.
4. THE live path SHALL run from voice request through STT, planning, native execution, result display, and TTS narration.

### Requirement C11: Existing SSDI and Voice Regression Safety

**User Story:** As an applicant, I want computer use added without losing the application workflow that already works.

#### Acceptance Criteria

1. Clearway SHALL preserve the Application, Documents, and Records stages.
2. Clearway SHALL preserve Deepgram transcription, Deepgram Aura 2 English and Spanish speech, and the Mandarin system-voice fallback.
3. Clearway SHALL preserve canonical case confirmation, completeness checks, form adapters, Anvil packet generation, and no-store responses.
4. Clearway SHALL remain keyboard operable, screen-reader understandable, responsive at 320 CSS pixels, and usable at 200 percent zoom.
