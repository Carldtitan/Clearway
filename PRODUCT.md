# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Clearway serves people with disabilities preparing an SSDI application, including people who may be fatigued, in pain, have limited mobility or literacy, use assistive technology, or need a family member or caseworker beside them.

## Product Purpose

Clearway conducts a guided voice conversation, turns confirmed answers into a consistent SSDI packet, identifies supporting evidence, and visibly operates Windows applications to find and verify real local documents. Success means the applicant ends with one case folder containing five generated documents, found supporting evidence, and an honest list of anything still missing.

## Positioning

Clearway joins one confirmed SSDI case model to a voice-guided Windows document agent: it can prepare the application and then find the applicant's own supporting material without relying on rehearsed filenames or simulated output.

## Operating Context

The responsive Next.js application is hosted on Vercel. Clearway Desktop is an Electron shell that loads that application and supplies tightly scoped local Windows capabilities. Deepgram provides speech recognition and speech output, Anthropic performs structured extraction and computer-action planning, and Anvil fills the four SSA PDF templates.

## Capabilities and Constraints

- The current packet contains SSA-16, SSA-3368, SSA-3369, SSA-827, continuation sheets, and an evidence index.
- An explicitly labeled Elena Rivera sample case may prefill the SSDI answers for a fast stage walkthrough; it never supplies computer-search requests or results.
- Local computer use combines screenshots and Windows UI Automation so the person sees Explorer and desktop-app actions happen on screen.
- Clearway may open supported desktop apps, focus windows, invoke accessible controls, click, type, scroll, and register a real File Explorer selection; destructive, credential, submission, and system-security actions remain blocked.
- Clearway Desktop can create a new case folder containing the five core generated documents, linked supporting files, and a missing-document checklist.
- Computer requests are arbitrary natural language within the available tools; document names and successful results are never predetermined.
- Browser automation, uploads, deletion, moving existing files, credential entry, and SSA submission are later work.
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
