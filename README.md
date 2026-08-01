# Clearway

**Live application:** [alix-jo.vercel.app](https://alix-jo.vercel.app/)

Clearway helps a person prepare an SSDI application, organize supporting records, and find real documents on an approved Windows computer through a guided conversation.

## The problem

Applying for Social Security Disability Insurance is not simply a matter of completing one form. An applicant may need to reconstruct:

- Every relevant doctor, therapist, hospital, clinic, and treatment date
- Diagnoses, medications, tests, and medical records
- Recent earnings and other benefit information
- Five years of work history and detailed job duties
- Education and training history
- Specific ways each condition limits work

That information must remain consistent across several long documents. The administrative burden is especially difficult for someone who is already managing pain, fatigue, cognitive limitations, paralysis, or limited access to trained benefits assistance.

Clearway brings the practical structure of a benefits-navigation interview into an accessible voice-guided product. It helps the applicant tell their story once, confirms what it understood, reuses reviewed facts across every document, and can search approved local folders for real supporting evidence. It does not act as the applicant's representative or promise approval.

## Try Clearway

Open the [live Vercel deployment](https://alix-jo.vercel.app/) in a current browser:

1. Choose English, Spanish, or Mandarin.
2. Allow microphone access and begin the guided conversation.
3. Answer naturally; Clearway reads back each interpretation before saving it.
4. Continue to **Documents** and generate the live application packet through Anvil.
5. In Clearway Desktop, approve local folders and ask for any document in ordinary language.
6. Open **Records** to see medical-record requests, deadlines, and follow-up actions.

## What the product does

- Conducts a continuous voice or typed interview instead of exposing government forms
- Uses deterministic questions, requiredness rules, and voice commands
- Transcribes speech with Deepgram and extracts schema-constrained facts with Anthropic
- Preserves the original transcript, field provenance, confidence, and applicant confirmation state
- Detects incomplete answers, contradictions, and unfinished provider or work-history lists
- Generates SSA-16, SSA-3368, SSA-3369, and one blank-signature SSA-827
- Carries excess providers, medications, and jobs onto continuation sheets
- Produces a medical evidence index and a deterministic records tracker
- Supports keyboard navigation, screen readers, touch, reduced motion, and responsive layouts

## How it works

```text
Guided conversation
        |
        v
Deepgram transcription
        |
        v
Schema-constrained extraction
        |
        v
Applicant confirmation
        |
        v
One provenance-aware ApplicantCase
        |
        v
Completeness and consistency validation
        |
        v
Typed Anvil form adapters
        |
        v
Filled SSA forms + generated companion documents
        |
        v
One downloadable application packet
```

The application uses a single in-memory `ApplicantCase` as its source of truth. Confirmed facts feed every form, checklist item, continuation sheet, Remarks entry, and tracker item. A later correction changes the case revision and makes an older packet stale.

## How Anvil is used

Four official SSA PDFs are configured as published Anvil templates. Server-only adapters translate the canonical case into verified Anvil field aliases.

Clearway uses:

- Anvil `fillPDF` for SSA-16, SSA-3368, SSA-3369, and SSA-827
- Anvil `generatePDF` for the medical evidence index and overflow continuation sheets
- `pdf-lib` to merge the Anvil outputs into one packet

Unknown aliases are rejected before generation. Missing or contradictory required facts are rejected on both the client and server. Signature, witness, and SSA-only fields on SSA-827 remain blank for the applicant to complete as instructed by the form.

## Technology

- Next.js App Router and strict TypeScript
- React, Tailwind CSS, Motion, Radix UI, and OGL
- Deepgram speech-to-text and Aura 2 text-to-speech
- Anthropic structured extraction with Zod validation
- Anvil PDF filling and generation
- `pdf-lib` packet assembly
- Vitest, Testing Library, axe, and Playwright
- Vercel hosting and server functions

## Privacy and product boundaries

- V1 keeps the applicant case in browser memory and does not include a database.
- Service keys remain in server-only environment variables.
- API responses containing case data or PDFs use `Cache-Control: no-store`.
- Clearway prepares an applicant working copy; it does not file with SSA.
- Clearway does not decide eligibility, contact providers, provide legal advice, or guarantee approval.
- A live integration failure preserves the current case and reports the failed action without fabricating output.

## Development and verification

Local development, Anvil template preparation, environment variables, and live-integration commands are documented in [SETUP.md](SETUP.md).

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

The browser suite exercises application and packet behavior, checks desktop and phone layouts, audits WCAG A/AA behavior, and verifies failure recovery. Computer-use acceptance checks run against fresh local files.

Detailed product requirements and architecture live in [`specs/clearway/`](specs/clearway/). Program rules and document behavior are grounded in the sources cataloged in [latest_pathway.md](latest_pathway.md) and [REQUIREMENTS.md](REQUIREMENTS.md).

The animated voice orb is adapted from the open-source [React Bits Orb](https://github.com/DavidHDev/react-bits).
