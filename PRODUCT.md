# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Clearway serves people with disabilities preparing an SSDI application, including people who may be fatigued, in pain, have limited mobility or literacy, use assistive technology, or need a family member or caseworker beside them.

## Product Purpose

Clearway conducts a guided voice conversation, turns confirmed answers into a consistent SSDI packet, identifies supporting evidence, and can use an approved portion of the applicant's Windows computer to find real local documents. Success means the applicant can move from a spoken request to an inspectable real result without operating complex forms or folders manually.

## Positioning

Clearway joins one confirmed SSDI case model to a voice-guided Windows document agent: it can prepare the application and then find the applicant's own supporting material without relying on rehearsed filenames or simulated output.

## Operating Context

The responsive Next.js application is hosted on Vercel. Clearway Desktop is an Electron shell that loads that application and supplies tightly scoped local Windows capabilities. Deepgram provides speech recognition and speech output, Anthropic performs structured extraction and computer-action planning, and Anvil fills the four SSA PDF templates.

## Capabilities and Constraints

- The current packet contains SSA-16, SSA-3368, SSA-3369, SSA-827, continuation sheets, and an evidence index.
- Local computer use is limited to read-only search, inspection, preview, and opening of files inside folders the user approves for the current session.
- Computer requests are arbitrary natural language within the available tools; document names and successful results are never predetermined.
- Browser automation, general Windows UI Automation, uploads, deletion, moving files, and SSA submission are later work.
- Applicant and file data are kept in memory; complete local files are not uploaded by the computer-use MVOP.

## Brand Commitments

The product name is Clearway. The interface uses direct, calm, sixth-grade language and always states what it is doing. Existing restrained colors, Atkinson Hyperlegible typography, and accessibility-first interaction remain the visual authority.

## Evidence on Hand

- Four published Anvil SSA templates and checked-in field maps.
- Existing Deepgram STT/TTS and Anthropic structured-extraction routes.
- The hack brief requires real fresh input, a hands-off run, and no simulated actions or outputs.

## Product Principles

1. Real input and real tool results only.
2. Tell the applicant what is happening as it happens.
3. Ask once, reuse confirmed information everywhere.
4. Prefer narrow, inspectable tools over unrestricted machine access.
5. Preserve progress and state uncertainty honestly.

## Accessibility & Inclusion

Clearway must remain keyboard and screen-reader operable, support voice and typed input, expose visible equivalents for every spoken status, honor reduced motion, and preserve English, Spanish, and Mandarin conversation modes.
