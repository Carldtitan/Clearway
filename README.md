# Formless

Formless helps a person check common non-medical SSDI issues, tell their story once, review what the system understood, create a coherent application packet, and see the next medical-record follow-up action.

The V1 demo is intentionally narrow and concrete:

1. A deterministic 2026 earnings and work-credit screen.
2. Voice or typed history with Deepgram transcription and schema-constrained Anthropic extraction.
3. Applicant confirmation, correction, provenance, and provider-list exhaustion.
4. Server-only Anvil generation of SSA-16, SSA-3368, SSA-3369, one blank-signature SSA-827, continuation sheets when needed, and an evidence index.
5. A seeded, deterministic records tracker with portal-first guidance, a HIPAA Right of Access script, deadlines, and escalation.

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000` and select **Load Elena's demo** for the complete judge path. See [SETUP.md](SETUP.md) for template preparation, environment variables, and live integration commands.

## Verify

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run design:detect
```

The browser suite runs the complete synthetic case, downloads the live packet, checks desktop and phone layouts, audits WCAG A/AA rules, verifies failure recovery, and confirms the recorded fallback is available.

## Architecture

- `lib/rules/` — pure eligibility, checklist, consistency, overflow, deadline, and tracker rules
- `lib/case/` — the single in-memory applicant case and provenance-aware reducer
- `lib/extraction/` — constrained candidate facts that cannot bypass applicant review
- `lib/forms/` — typed per-form adapters using checked-in field maps and verified Anvil aliases
- `lib/documents/` — packet merge, continuation, Remarks, and evidence-index generation
- `components/` — the restrained responsive Check → Interview → Review → Packet → Records workspace
- `specs/formless/` — Kiro requirements, design, and implementation plan

## Boundaries

- V1 stores case data only in browser memory and retains no completed PDFs.
- Service credentials are server-only and errors are scrubbed.
- The product prepares a working packet; it does not decide eligibility, file with SSA, contact providers, represent the applicant, or provide legal advice.
- The default packet contains exactly one SSA-827. An extra visually blank original is generated only after an explicit applicant request.

The animated voice orb is adapted from the open-source [React Bits Orb](https://github.com/DavidHDev/react-bits). Program rules and document behavior are grounded in the authoritative sources cataloged in [latest_pathway.md](latest_pathway.md) and [REQUIREMENTS.md](REQUIREMENTS.md).
