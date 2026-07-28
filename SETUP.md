# SSDI Assistant setup

V1 is implemented as a Next.js application. It runs locally with in-memory case state and calls Anthropic, Deepgram, and Anvil only through server routes.

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000`. The deterministic eligibility check works without any external service. Live interview extraction, transcription, and packet generation require the variables below.

## Required V1 service variables

```text
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
DEEPGRAM_API_KEY
DEEPGRAM_MODEL
ANVIL_API_KEY
ANVIL_EID_SSA16
ANVIL_EID_SSA3368
ANVIL_EID_SSA3369
ANVIL_EID_SSA827
```

Never commit `.env`; it is ignored by Git. Browser requests never contain these keys.

## Prepare the Anvil templates

1. Upload the four source PDFs from `MD_files/` to Anvil as standardized PDF templates.
2. Let Document AI tag the fields, review the aliases, and publish each template.
3. Copy each template EID into the matching `.env` variable.
4. Keep the current applicant-fillable alias counts: SSA-16 114, SSA-3368 336, SSA-3369 320, and SSA-827 20.
5. Generate one SSA-827 for the case. Do not create a copy per provider; the applicant-owned provider follow-up uses the separate HIPAA Right of Access script.

## Validate the build

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run design:detect
```

The end-to-end suite uses the synthetic Elena Rivera case and calls the configured Anvil templates. It verifies the 39-page, five-document packet download, desktop and mobile layouts, browser errors, and automated WCAG A/AA checks.

To inspect Anvil aliases or regenerate and verify the live packet directly:

```bash
npm run inspect:anvil
npm run verify:packet:live
```

Generated packet and screenshot artifacts are written under ignored `output/` directories and are never committed.

## V1 boundaries

- Case data and completed PDFs remain in memory only.
- The app prepares a working packet; it does not file with SSA or contact providers.
- The default packet contains exactly one blank-signature SSA-827.
- V2 persistence, reminders, SMS, avatar, and assisted calling are intentionally not part of this build.
