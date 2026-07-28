# Getting every key — step by step

**You only need to sign up for three services: Anvil, Anthropic, Deepgram.**
Everything else in `.env.example` is either a plain setting, already filled in, or a V2 item you can ignore today.

---

## Step 0 — make your real env file

`.env.example` is a **template**. It gets committed to git. It never holds real keys.

```bash
cp .env.example .env
```

`.env` is the real one. **Never commit it.** A `.gitignore` is already in place to prevent that.

> **Rule for all three services:** an API key is shown **once**, at creation. Copy it straight into `.env` before closing the dialog. If you lose it, you delete the key and make a new one — you can't view it again.

---

## 1 · Anvil — 4 EIDs + 1 API key

This is the longest one, ~20 minutes. Everything else is 2 minutes each.

### 1a. The API key

*(Navigation below is quoted from Anvil's own docs, not guessed.)*

1. Go to **app.useanvil.com** and sign in *(you already have the hackathon trial)*
2. Go to **Organization settings → API keys**
3. There will be a **Development** key and a **Production** key. **Use Development.**
4. Copy it into `.env`:

```
ANVIL_API_KEY=<paste here>
```

### 1b. The four template EIDs

An **EID** is Anvil's ID for one uploaded form — **a 20-character string**. You need four.

| File in `MD_files/` | Goes into |
|---|---|
| `ssa-16-bk.pdf` | `ANVIL_EID_SSA16` |
| `ssa-3368-bk.pdf` | `ANVIL_EID_SSA3368` |
| `ssa-3369-bk.pdf` | `ANVIL_EID_SSA3369` |
| `ssa-827.pdf` | `ANVIL_EID_SSA827` |

For **each** file:

1. Create a new **PDF Template** and upload the file
2. Let **Document AI** run — detects and labels fields automatically, ~1 min per form
3. On the template page (URL looks like `/org/<your-org>/pdf/<template>`), find the button labelled **"PDF Template ID / Cast EID"** and **click copy**
4. Paste into the matching line in `.env`

**Publish each template when you're done editing it.** The fill API uses the *published* version — leave one as "Draft in progress" and your calls will fail.

### Expected field counts — don't panic at the shrinkage

Anvil reports **fewer** fields than the raw PDF contains. That is correct behaviour, not a failed upload.

| Form | Raw PDF widgets | **Anvil reports** |
|---|---:|---:|
| SSA-3368 | 426 | **336** |
| SSA-3369 | 377 | **320** |
| SSA-16 | 140 | **114** |
| SSA-827 | 23 | **20** |

*(These are the actual observed numbers, verified against a live account.)*

**Why the gap:** Document AI deduplicates and groups. A pair like

```
Reaching at or below the shoulder:   ☐ One Arm   ☐ Both Arms
```

is **two checkbox widgets** in the PDF but **one answer**, so Anvil collapses it into a single `radioGroup`. Repeated fields — the SSN appearing on several pages — are merged too.

**A genuinely broken upload looks like 30 fields, not 320.** If a form comes back an order of magnitude low, that's the problem case.

> **You do not need to hand-label anything.** Every field in these PDFs carries a plain-English description, so Document AI reads them automatically — and it assigns **semantic types**, not just names: `fullName`, `date`, `usAddress`, `phone`, `dollar`, `signature`. Anvil handles name splitting and date formatting for you.
>
> The aliases it generated are exported to `anvil_fields/` — that's what the fill code binds to.

---

## 2 · Anthropic — 1 key

Used for turning spoken sentences into form fields.

1. Go to **console.anthropic.com** and sign up
2. **You will need to add a payment method and buy credit** — there's no free tier for API access. The minimum purchase is small; a hackathon's usage is well under a dollar
3. Find **API keys** in the left sidebar → **Create key**
4. Copy it immediately:

```
ANTHROPIC_API_KEY=sk-ant-<...>
```

`ANTHROPIC_MODEL` is already set to `claude-sonnet-5`. Leave it.

---

## 3 · Deepgram — 1 key

Used for speech recognition in all three languages and speech output in
English and Spanish. Mandarin speech output uses the matching browser voice.

1. Go to **console.deepgram.com** and sign up
2. Check what signup credit you're offered — **don't assume it's free.** Streaming runs ~$0.0077/min, so even paid, a hackathon costs cents
3. Find **API Keys** → **Create a New API Key**
4. Give it any name, copy the key:

```
DEEPGRAM_API_KEY=<paste here>
```

`DEEPGRAM_MODEL` is already set to `nova-3-medical`. Leave it — that's the
English medical transcription model. Spanish and Mandarin automatically use
the general multilingual model.

`DEEPGRAM_KEYTERMS_FILE` points at `config/keyterms.txt`, which already exists with ~100 common medication and condition terms preloaded.

English speech uses `aura-2-thalia-en`, Spanish uses
`aura-2-estrella-es`, and both default to `1.08` speed. The corresponding
`DEEPGRAM_TTS_*` values are optional overrides rather than additional keys.

---

## 4 · Everything else — no signup needed

| Key | What to do |
|---|---|
| `STT_PROVIDER` | Already `deepgram`. Leave it |
| `DEEPGRAM_TTS_*` | Optional Aura voice and speed overrides; the defaults are ready |
| `SGA_*`, `EARNINGS_*`, `HIPAA_*`, `SSA827_*`, `TRACKER_*` | Already filled with verified 2026 values. Don't touch |
| `TWILIO_*` | **Leave blank.** V2 |
| `AVATAR_*` | **Leave blank.** V2 |
| `NEXT_PUBLIC_APP_URL` | Already `http://localhost:3000` |
| `NODE_ENV` | Already `development` |

---

## Done checklist

Six values to fill. Everything else is already set:

```
[ ] ANVIL_API_KEY
[ ] ANVIL_EID_SSA16
[ ] ANVIL_EID_SSA3368
[ ] ANVIL_EID_SSA3369
[ ] ANVIL_EID_SSA827
[ ] ANTHROPIC_API_KEY
[ ] DEEPGRAM_API_KEY
```

*(seven lines, six of them one-liners — the four EIDs come from the same Anvil session)*

---

## Things that trip people up the first time

**"I closed the dialog and lost the key."** Normal. Delete that key, create a new one. Keys can't be re-viewed by design.

**"Do I need a credit card?"** Anthropic: yes. Deepgram: check at signup. Anvil: no, you have the event trial.

**"Which Anvil key — Development or Production?"** Development. Production is for real traffic.

**"Where exactly is the EID?"** On the template page, as a copy button labelled **"PDF Template ID / Cast EID"**. Twenty characters. Not in the editor view — publish and go back to the template page.

**"Which template type?"** **Standardized Template** — "upload a fixed document and instantly convert it into a fillable template." *Dynamic Template* is for authoring your own contracts and would mean recreating a 15-page federal form by hand.

**"Anvil found fewer fields than expected."** Expected — see the table above. Dedup and grouping. Only worry if it's an order of magnitude low.

**"My SSN comes out scrambled."** Known: SSN is a **comb field**, one box per character, hyphens pre-printed. **Pass digits only** — `912448630`, not `912-44-8630`. Formatted input renders as `912--4-4-86`. Watch for the same on phone numbers and dates.

**"There's a DEMO watermark on my PDF."** That's the **Development** key. Switch to Production if your plan allows, or leave it — visible proof of Anvil use isn't the worst thing when Anvil is judging their own prize.

**"The app can't see my keys."** Three usual causes: the file is named `.env.local` instead of `.env`, it's not in the project root, or you didn't restart the dev server. Env vars load at boot.

**"Should I put keys in the frontend?"** No. All three of these are server-side only. The Anvil key especially — it can generate documents against your account.

---

## When you're done

Tell me and I'll verify all four Anvil templates respond before we build anything on top of them. Better to find a bad EID now than at 2pm.
