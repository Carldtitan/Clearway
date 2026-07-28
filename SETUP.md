# Setup — what you need before I write code

---

## Your actions — the things only you can do

### 🔴 1. Anvil templates — the one true blocker

Nothing generates a document until this is done.

1. Sign in at **app.useanvil.com**
2. Upload **all four** PDFs from `MD_files/`:
   - `ssa-16-bk.pdf`   — the application itself
   - `ssa-3368-bk.pdf`
   - `ssa-3369-bk.pdf`
   - `ssa-827.pdf`
3. Choose **Standardized Template** (not Dynamic)
4. Let **Document AI** tag the fields on each (automatic, ~1 min per form)
5. **Publish** each one — the fill API uses the published version, not the draft
6. Copy the four **template EIDs** into `.env` — button labelled "PDF Template ID / Cast EID"
7. Copy your **API key** from Organization settings → API keys

**Expected counts — Anvil reports fewer than the raw PDF, and that's correct:**
SSA-3368 **336** · SSA-3369 **320** · SSA-16 **114** · SSA-827 **20**.
Document AI merges checkbox pairs into single `radioGroup` fields and dedupes
repeats. A broken upload looks like 30 fields, not 320.

**~20 minutes.** Everything downstream waits on this.

### 🟠 2. LLM key

**console.anthropic.com** → API keys. Needed for speech → field mapping.

### 🟡 3. Speech — two independent choices

Browser speech is **two separate APIs**, not one:

| API | Direction | Alternative |
|---|---|---|
| `SpeechRecognition` | **STT** — speech → text | Deepgram |
| `speechSynthesis` | **TTS** — text → speech | ElevenLabs |

**Recommended: browser TTS + Deepgram STT.**

- `speechSynthesis` works in **every** browser, free, zero setup. Quality is only cosmetic.
- `SpeechRecognition` is **Chrome/Edge only**, routes audio through Google's servers, and mangles proper nouns — which here means **provider names and medication names landing wrong on a legal form.** That is the error worth paying to avoid.
- Use **`nova-3-medical`**, not the default model — it's one query parameter and it's built for drug and procedure names.
- **Keyterm prompting** takes up to 100 custom terms per request. Preload common medication names.
- ~$0.0077/min streaming. Check the current signup credit rather than assuming a free tier.
- **AssemblyAI is a fair alternative** — both vendors publish benchmarks placing themselves first, and neither is independent. Pick one; don't A/B test it during a hackathon.

Revisit ElevenLabs for V2 — a rendered avatar with a flat OS voice reads badly.

### ⚪ 4. Vercel — only if you're deploying

`npm i -g vercel && vercel login`. Not needed to run locally.

---

## V2 — later, don't do these now

| Need | Where | Note |
|---|---|---|
| Twilio SID, token, phone number | console.twilio.com | Number ~$1.15/mo; trial credit covers it |
| Avatar API key | simli.com / tavus.io / heygen.com | Simli = real-time. HeyGen = easiest |

---

## Already done — nothing needed from you

| | Status |
|---|---|
| **All four SSA forms** | ✅ Current revisions, from ssa.gov, in `MD_files/` |
| **Field maps** | ✅ `fieldmaps/` — all four forms: 140 + 426 + 377 + 23 fields with plain-English labels |
| **Node.js** | ✅ v24.11.1 confirmed |
| **Python + pypdf** | ✅ Confirmed — used for form inspection |
| **Requirements** | ✅ `REQUIREMENTS.md` |
| **2026 config values** | ✅ SGA $1,690/mo · credit $1,890 · 4-credit max $7,560 |

**No open blockers.** B-1 (SSA-3369) and B-2 (credit value) are both resolved.

---

## What I build once you've done step 1

| Order | Piece | Depends on |
|---|---|---|
| 1 | **Prequalifier** — SGA + insured status, FR-1.8 decision table | Nothing. Can start now |
| 2 | **Document checklist** — if-then rules | Nothing |
| 3 | **Anvil fill route** — server-side, hardcoded JSON to prove the pipe | Template EIDs |
| 4 | **Voice conversation** — provider-list interrogation | LLM key + speech choice |
| 5 | **SSA-16 fill + 827 copies + Remarks auto-write** | Template EIDs |
| 6 | **Tracker** — seeded state, day-20 script, day-30 escalation | Nothing |

**Steps 1, 2 and 6 need nothing from you.** I can write those while you set up Anvil.

---

## Three questions that change what I write

1. **Speech — happy with browser TTS + Deepgram STT?** *(Or all-browser to skip one signup, accepting mangled provider names.)*
2. **Do you have an Anthropic API key already?**
3. **Deploy to Vercel, or local-only for the demo?** *(Default: local — one less failure point on stage)*

Answer those and I'll start with the prequalifier.
