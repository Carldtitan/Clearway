# Implementation Plan: Clearway Computer Use MVOP

## Overview

This plan implements the Clearway requirements and design in dependency order. No task is complete until its verification passes. The two-hour path prioritizes one real fresh-input loop over packaging breadth.

## Tasks

- [x] 1. Establish the Clearway specification and identity — 15 minutes
  - [x] 1.1 Create the interconnected requirements, design, and tasks documents.
    - _Requirements: C1.3_
    - **Verification:** all three files exist under `specs/clearway/`, and design/tasks reference requirement IDs.
  - [x] 1.2 Rename product, package, translations, packet metadata, downloads, documentation, and tests to Clearway.
    - _Requirements: C1.1-C1.2_
    - **Verification:** retired-brand scans across tracked text and filenames return no matches.
  - [x] 1.3 Remove the runtime synthetic loader, query-parameter demo path, prerecorded fallback, and visible Demo action.
    - _Requirements: C10.1_
    - **Verification:** production code has no synthetic loader, demo query parameter, or prerecorded packet fallback path.

- [x] 2. Build the secure Clearway Desktop shell — 20 minutes
  - [x] 2.1 Add Electron main/preload entrypoints and desktop scripts.
    - _Requirements: C2.1, C8.1-C8.5_
    - **Verification:** `npm run desktop:dev` loads the local Clearway page with `window.clearwayDesktop` available.
  - [x] 2.2 Add native multi-folder approval and in-memory Approved_Root storage.
    - _Requirements: C2.2-C2.4_
    - **Verification:** selected roots appear in `getEnvironment`; an unselected path is rejected.
  - [x] 2.3 Emit native activity events and validate sender origin for every IPC handler.
    - _Requirements: C6.1, C8.3-C8.4_
    - **Verification:** invalid-origin and malformed calls fail without filesystem access.

- [x] 3. Implement generic local tools — 40 minutes
  - [x] 3.1 Implement bounded recursive metadata discovery and arbitrary runtime scoring.
    - _Requirements: C3.2-C3.3, C4.1-C4.2, C8.5_
    - **Verification:** two unrelated queries rank different real files without code changes.
  - [x] 3.2 Add local text/PDF extraction and local image OCR.
    - _Requirements: C4.3-C4.4, C5.1-C5.3_
    - **Verification:** a poorly named image is found from its OCR text and no full file reaches the server.
  - [x] 3.3 Add opaque Candidate_File results, bounded preview, and safe open behavior.
    - _Requirements: C4.5-C4.6, C7.1-C7.2_
    - **Verification:** candidate operations work by ID; unknown IDs and traversal attempts fail.

- [x] 4. Implement the hosted Computer_Agent loop — 30 minutes
  - [x] 4.1 Add shared schemas and `POST /api/computer/turn` using Anthropic structured output.
    - _Requirements: C3.1-C3.5, C9.2-C9.3_
    - **Verification:** valid requests return one valid state; malformed requests return 400 with no-store headers.
  - [x] 4.2 Add environment-first orchestration, real tool-result feedback, and action/time limits.
    - _Requirements: C3.4-C3.5, C9.1, C9.4-C9.5_
    - **Verification:** the loop cannot finish with a candidate that was absent from native results and terminates at its bounds.

- [x] 5. Integrate computer use into the Clearway workspace — 25 minutes
  - [x] 5.1 Add a persistent connected/disconnected control with voice and typed requests.
    - _Requirements: C2.1, C2.5, C3.1, C11.1-C11.2_
    - **Verification:** the control remains reachable across Application, Documents, and Records and works without a mouse.
  - [x] 5.2 Add chronological activity, serialized Deepgram narration, and visible fallback.
    - _Requirements: C6.1-C6.6_
    - **Verification:** actual search counts appear in the visible and spoken sequence; forced TTS failure does not stop search.
  - [x] 5.3 Add candidate result, preview/open, and in-memory case-association UI.
    - _Requirements: C7.1-C7.4_
    - **Verification:** a candidate can be inspected and linked without changing confirmed Applicant_Case facts.

- [ ] 6. Verify the real fresh-input path — 10 minutes
  - [x] 6.1 Run focused unit, component, typecheck, build, and regression tests.
    - _Requirements: C8, C9, C11_
    - **Verification:** tests, `npm run typecheck`, and `npm run build` pass.
  - [ ] 6.2 Run one voice-driven fresh-input search in Clearway Desktop.
    - _Requirements: C10.2-C10.4_
    - **Verification:** add or rename an unseen file after launch, ask for it naturally, and observe real planning, native activity, matching result, and TTS without a code change.
  - [ ] 6.3 Deploy the Clearway-branded web application and load it through Clearway Desktop.
    - _Requirements: C1, C2.1, C10.4_
    - **Verification:** the configured deployed origin completes the same fresh-input path.

## Dependency Graph

```text
1 Specification and identity
  -> 2 Desktop shell
  -> 3 Local tools
  -> 4 Agent loop
  -> 5 Workspace integration
  -> 6 Fresh-input verification
```

## Notes

- `npm run desktop` is the MVOP Windows delivery; installer packaging follows only after the live path passes.
- Browser and general Windows UI Automation use the same future tool contract but are not allowed to displace the fresh local-file path in this build.
