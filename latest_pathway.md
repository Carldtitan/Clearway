# Latest Pathway — Working Document
**Alix "Agents of Administration" Hackathon · Day 2**
**Track 3 primary, Track 2 secondary (voice input, no telephony).**
Everything established and agreed. Current state only. *Updated each session.*

---

## 1. Event constraints

| | |
|---|---|
| **Track** | **3 — Paperwork, Killed** (mentor: **Ian**), with a Track 2 flavour via voice input |
| **Demo** | 3 min + Q&A, from **3:30 PM Day 2** |
| **Judging** | Impact **30%** · Technical **25%** · Product **20%** · Originality **15%** · Demo **10%** |
| **Prizes** | Best Overall $2,500 · **Best Use of Anvil $1,000** · Audience Favorite $1,000 (crowd vote) · Best Demo $500 |

- Rubric is **identical across all three tracks** — the track is a framing label, not a separate contest.
- **Nothing requires an Alix problem.** Slide 9 names IRS, DMV, county, insurance, bank onboarding.
- Anvil access is for **"all builders"**; the prize is for **"the best use of it"** — no track restriction.
- Judges unpublished. Anvil founded by **Mang-Git Ng** (CEO) and **Ben Ogle** (CTO).
- Voice as *input* to a form pipeline is still Track 3. The deck blesses the pairing.

---

## 2. The problem: SSDI applications

### Scale

| Metric | Figure |
|---|---|
| Initial claims decided | **2,246,542** (FY2025) |
| Denied at initial | **64%** — rising: 61% → 62% → 64% |
| Awarded at initial (SSA's own report) | **18–21%** |
| Denied at reconsideration | **85–90%** |
| Hearing wait | ~8 months avg; **12–24 months** many offices |
| Hearing backlog | ~330,000 (Jan 2026) |
| Average time to any decision | **~2 years** |

### Where claims die

```
FIELD OFFICE →  TECHNICAL DENIALS  (~half of all SSDI denials)
                SSA never looks at the medical evidence
                · over SGA — $1,690/mo non-blind, $2,830/mo blind (2026)
                  (a soft flag — IRWE, subsidies, self-employment all shift it)
                · insufficient work credits
                · unable to contact · missed deadlines
                · incomplete forms · missed consultative exams
                     ↓
DDS          →  MEDICAL EVIDENCE DENIALS
                · record incomplete — DDS asked the wrong providers
                · OR disorganised — "every record from the past 20 years
                  buries the relevant evidence"
                     ↓
Back to SSA  →  final processing and notice
```

### Proof it's solvable

**SOAR** (SAMHSA-funded since 2009), non-lawyer caseworkers preparing applications:

| | Approval |
|---|---|
| SOAR-assisted initial applications | **65%** |
| Unassisted national | **31%** |
| North Carolina SOAR, first application | **75%** vs ~15% |

**Reach: ~5,700 people/year against 2.2M claims/year — 0.25%.**
**NBER 2022:** representation raises initial approval odds by **23 percentage points**.

### Why nobody has scaled it

- Rep fee = **25% of backpay or $9,200, whichever is lower** (2026), contingency, **$0 if you lose**.
- Reps **always** want you to win. The distortion is **selection** — they screen hard at intake and decline weak or low-benefit cases.
- **42 U.S.C. § 406(a)(5):** *"any person"* charging an unauthorised fee for claim services commits a misdemeanor.
- Result: **everyone at the application stage is free to the user** — SOAR (grant), Atticus (referral), SSDI Benefits Group (lead gen), SSA itself.

---

## 3. Legal boundaries

**A representative is never required.** Millions apply and are approved without one.

| ✅ Allowed | ❌ Not allowed |
|---|---|
| Help someone prepare and understand | Represent them before SSA without SSA-1696 |
| State public thresholds (SGA $1,690/mo non-blind, $2,830 blind) | **Charge a fee** for claim services without SSA authorisation |
| Produce documents they sign and submit | Answer SSA's calls **as** the claimant |
| Gather, organise, index evidence | Give individualised legal advice |
| Track deadlines | |

**The line: acting *for* someone vs. helping someone act for themselves.** SOAR is the proof.

### Idea status

| # | Idea | Status |
|---|---|---|
| 1 | Help disabled people apply | ✅ Framing |
| 2 | **Prequalify — credit-card soft check** | ✅ **Core build** |
| 3 | Agent answers SSA's calls | ❌ Cut — misrepresentation risk |
| 4 | Reminders app | ❌ Cut — commodity |
| 5 | Alternative fee structure | ➡️ **The explanation, not the product** |
| 6 | **Submit only what's necessary** | ✅ **Core build** |

---

## 4. Supporting documents — how they actually reach SSA

> **The key finding: the applicant does not gather and submit medical records.**

```
1. List providers accurately on SSA-3368
2. Sign SSA-827  (the permission slip)
3. SSA / DDS requests records DIRECTLY from those providers
```

### Three failure points, not one

| # | Failure | Caused by |
|---|---|---|
| 1 | Provider list incomplete → DDS never asks the right doctor | The applicant |
| 2 | **Provider does not respond to DDS** | **The provider** |
| 3 | Records arrive but bury the relevant evidence | Both |

**#2 is large and measurable.** [GAO-09-149](https://www.gao.gov/assets/a284427.html): in FY2007, **14 of 51 DDS offices reported that 20% or more of record requests produced no records.** *(Primary source, but FY2007 — treat the exact figure as dated.)*

DDS must make **one follow-up request within 10–20 days**. If that also fails:

```
No records  →  DDS orders a CONSULTATIVE EXAMINATION
            →  an SSA-contracted doctor who has never met the claimant
               examines them once, briefly
            →  the claim is decided largely on that exam
            →  (missing the CE without good cause = denial)
```

A condition documented over ten years by a treating specialist can end up judged on one appointment with a stranger, because a records clerk never replied.

### ⇒ The solution: gather records rather than wait — this is SOAR's documented practice

> *"SOAR providers can help collect medical records **more quickly than waiting for DDS to request them**."*
> *"SOAR facilitates the gathering of medical records **prior to submission** of the application packet to SSA."*

Gathering records yourself is standard best practice for SOAR (65% approval) and for disability attorneys. Both mechanisms run in parallel — DDS requests records **and** the claimant is expected to submit them.

### SSA-827 vs. the patient's own Right of Access

**Important:** SSA-827 **is itself HIPAA-compliant.** Per SSA: *"The SSA-827 form contains everything that HIPAA requires for valid authorization forms."* It is not a weak instrument.

The differences are narrower than they look:

| | SSA-827 (third party receives) | Patient's own Right of Access |
|---|---|---|
| Deadline | None attached | **30 calendar days** (one 30-day extension, written notice required first) |
| **Fees** | **Providers may charge above standard rates** | **Capped — cost-based only, no retrieval fee, no per-page fee for electronic copies** |
| If ignored | DDS gives up → **consultative exam** | OCR complaint; OCR enforcement focuses on timeliness |

**The bigger advantage is cost, not the deadline.**

### ⚠️ Records cost real money

> *"Medical records are usually the **biggest line item** in disability cases... a claimant with a long treatment history easily running up **a few hundred dollars**."*
> Lawyers spend **$100–200** copying and mailing records per case.

For someone who cannot work, that is a serious barrier. The patient-request route is cheaper because fee caps apply — but it is not free. **Check the patient portal first: portals are free and many records are already downloadable.**

### The tracker — reminders to the *applicant*, not requests to the provider

A reminder from your system to a provider carries no weight — you have no standing. A reminder to the **applicant**, with a script, is what actually moves a records clerk. SOAR's own follow-up practice is to chase people: *"If more than 60 days have passed... follow up with the examiner."*

```
Day 20  →  "Call Dr. Chen's records office: (555) 0123.
            Say: 'I'm requesting my own records under HIPAA Right of Access.'
            They have 30 days and can't charge a retrieval fee.
            Ask for it by email or portal — that's free."

Day 30  →  "Deadline passed. Escalate, or file an OCR complaint."
```

**The HIPAA framing is the script, not the architecture.** You send nothing. You tell the person who to call, when, and what words to use.

The reality underneath: one stalled request *"had been accidentally filed away and forgotten — that one five-minute phone call broke a logjam that could have easily held up his claim for months."* Nobody monitors this for the applicant.

### Steal this from SOAR: the Remarks section

> *"Write in the **Remarks Section** on SSA forms about your efforts to obtain medical information so that DDS will know what they need to do to medically develop the claim."*

Remarks is a **communication channel to DDS** that almost nobody uses deliberately. Your system already knows which providers were contacted and when, so it can auto-write:

> *"Records requested from Dr. Chen 08/03, no response as of 09/02. Records from Mercy General received and enclosed."*

An Anvil fill into a field that is otherwise left blank, telling the examiner exactly where to push.

### The channels that exist

| Channel | Who uses it | Limits |
|---|---|---|
| **SSA-827 → DDS requests records** | Automatic, once signed | The primary mechanism |
| **Electronic Records Express (ERE)** | **Providers, schools, attorneys** submit directly to SSA/DDS. Auto-associates with the claim folder | Not a claimant channel |
| **Upload Documents** (in *my Social Security*) | Claimant — but **SSA-initiated**: a rep "sends you a link via email or text" | 50 files/submission, 25MB/file |
| **Mail / field office** | Identity documents | — |

**Your product is the preparation channel, not the submission channel.** The person takes your output and files it at ssa.gov, by mail, or in person. That matches the officially recommended worksheet workflow.

### Knowing exactly what each person needs — a decision table

Requirements branch off facts you already collect in the conversation:

| If… | They need |
|---|---|
| Served in the military (esp. pre-1968) | DD-214 |
| Married | Marriage certificate |
| Divorced, marriage ≥10 yrs | Divorce decree |
| Has children under 18 / disabled | Their birth certificates and SSNs |
| Worked in the last year | W-2s or self-employment returns |
| Currently earning anything | Pay stubs — SGA verification |
| Not a US citizen | Immigration documents |
| Always | Birth certificate (certified), SSN, photo ID, bank routing + account |

Deterministic, no AI, and it produces a personalised checklist. This is Track 1 method inside a Track 3 build.

### ⚠️ SSA-827 signature constraint — affects the Etch plan

SSA accepts exactly **four** signature routes on SSA-827:

1. **Click-and-sign** — SSA's *own* online process, for people filing online
2. **Employee attestation** — an SSA employee attests
3. **Witnessed signature** — on paper
4. **Wet ink** on paper

> *"Claimants who do not sign the electronic SSA-827 must submit a wet-signed, paper SSA-827."*

**A third-party e-signature (Anvil Etch) is not on that list.** Treat an Etch-signed 827 as **not established as acceptable to SSA**.

**Practical path:** Anvil **fills and produces** a signature-ready SSA-827 → the person wet-signs it, or uses SSA's own click-and-sign in the online flow. Etch still has legitimate uses — your product's own consent, or a witnessed-signature flow — just don't claim SSA accepts it.

---

## 5. The forms — all verified

| Form | Pages | Fields | Usable | Role |
|---|---:|---:|---:|---|
| **SSA-16-BK** (09-2025) | 7 | 156 | 140 | ✅ **IN SCOPE.** The application itself. **Item 8 = alleged onset date**, drives backpay |
| **SSA-3368-BK** | 15 | 460 | 426 | Disability Report. **Where claims are won or lost** |
| **SSA-3369-BK** (06-2024) | 14 | 407 nodes / 392 widgets | 377 | Work History Report — required alongside 3368 and 827 |
| **SSA-827** | 2 | 29 | 23 | Medical release |

**Verified:**
- All XFA forms. All **fill successfully** (written and read back).
- All carry **`/TU` Section 508 labels** — every field self-documenting in plain English. Maps in **`fieldmaps/`** (JSON + CSV).
- **SSA-3368 is loop-structured:** providers 1–6, medications 1–11, conditions 1–6.
- Hard limits: **6 provider slots, 11 medication slots** — overflow needs a continuation sheet.

> **Verified against a live Anvil account (2026-07-28).** Anvil's Document AI reports fewer
> fields than the raw PDF because it merges checkbox pairs into `radioGroup`s and dedupes
> repeats: **SSA-3368 336 · SSA-3369 320 · SSA-16 114 · SSA-827 20**. It also assigns
> **semantic types** — `fullName`, `date`, `usAddress`, `phone`, `dollar`, `signature` —
> so name splitting and date formatting are handled for us. Aliases exported to `anvil_fields/`.
>
> ⚠️ **Comb fields:** SSN must be passed **digits only** (`912448630`). Formatted input
> renders as `912--4-4-86`. Check phone and date fields for the same behaviour.

**Scope decision: fill ALL fields.** The forms are self-documenting and loop-structured; there is no reason to subset them.

**Filing mechanics:** SSA and SOAR both recommend completing the PDF **as a worksheet before applying online**. Paper and online are processed identically. SSA-3381 is a worksheet and is *not* submittable.

---

## 6. Anvil

| Product | Does |
|---|---|
| **PDF Templates (Cast)** | Upload once → reusable template. `createCast` GraphQL mutation |
| **Document AI** | CV field detection · labeling · webform generation · **dedup** · signer detection · **translation**. Works on flat PDFs |
| **PDF Filling API** | `POST /api/v1/fill/{eid}.pdf` — JSON in, PDF bytes out |
| **PDF Generation API** | `POST /api/v1/generate-pdf` — HTML/CSS or Markdown → PDF |
| **Etch E-Signatures** | Packets, embedded iframe, white-label, React components |
| **Workflows + Webforms** | Webform collects data → filled + signed PDFs. GraphQL or URL endpoints |
| **Webhooks** | Submission and signature events |

SDKs: **Node.js, Python, C#/.NET**. Schema: `https://app.useanvil.com/graphql/sdl`.
Pricing: ~$0.10/fill · ~$1.50/signature packet · ~$1/workflow submission.

### Division of labour

**Anvil owns:** field detection, labeling, dedup, filling, document generation, translation.
**We build:** the prequalification gate · the voice layer · evidence selection · cross-form logic (onset-date reconciliation across SSA-16/3368, continuation sheets, 12-month 827 expiry tracking).

### Integration — no repeated manual entry

```
ONE-TIME (~20 min)   upload SSA-16 + SSA-3368 + SSA-3369 + SSA-827 → Document AI tags → save EIDs

RUNTIME (automated)  voice transcript
                          ↓ fieldmaps/*.json
                     POST /api/v1/fill/{eid}.pdf
                          ↓
                     PDF bytes → user files at ssa.gov
```

**Use the PDF API, not the Workflow API, for the main path.** Anvil's own guidance: pick the PDF API when controlling UI/UX is critical. The voice layer *is* the UX.

**Workflow API = the text fallback path.** Anvil's auto-generated webform serves everyone who can type, at near-zero build cost. This is the scaling answer: voice for people who genuinely cannot use a form, webform for everyone else.

---

## 7. The build — two phases

> **Full requirements live in [`REQUIREMENTS.md`](REQUIREMENTS.md).**

### ✅ V1 — build this now. No avatar, no Twilio.

```
1. PREQUALIFY      SGA ($1,690/mo) + work credits.  Deterministic. NO AI. ~30 min.
                   Saves 6 months on a predetermined denial.
                        ↓
2. CONVERSATION    VOICE ONLY — no rendered face. Speech in, speech out.
                   Collects the full picture in plain language.
                   Key job: exhaust the provider list — "who else have you seen?"
                        ↓
3. DOC CHECKLIST   Decision table → personalised list of supporting documents
                        ↓
4. ANVIL           · Fill SSA-16 + SSA-3368 + SSA-3369 (all applicable fields)
                   · ONE signature-ready SSA-827 per case (not per provider —
                     SSA distributes copies to sources itself, per POMS)
                   · Per-provider HIPAA Right of Access request scripts
                   · Auto-write the Remarks section
                   · Generate evidence index (HTML → PDF)
                        ↓
5. RECORD TRACKER  Which providers asked / responded / silent.
                   ON-SCREEN reminders with the call script.
                        ↓
6. FALLBACK        Anvil Workflow webform for anyone who prefers to type
```

**V1 is a complete, coherent product.** Voice is what distinguishes it from Anvil's own webform, so voice stays. Everything in V1 is demonstrable without a face or a phone line.

### 🕐 V2 — later additions

| Addition | What it adds | Why deferred |
|---|---|---|
| **Avatar (rendered face)** | Accessibility — lip reading for deaf/HoH users, low literacy, elderly users unfamiliar with software | Presentation layer on top of V1's voice. Adds cost per user and a rendering failure point |
| **Twilio SMS** | Day-20 reminder texts with the call script, instead of on-screen only | Needs TCPA opt-in and a persistent scheduler |
| **Twilio Way B — assisted calling** | Twilio waits through the phone menu and hold, then joins the applicant when a human answers | **Human-detection is unsolved** — see below |

**Neither is required for the product to work.** V1 delivers all three core jobs: screen early, talk instead of type, chase the evidence.

### Twilio — the last feature, and only in one direction

| Use | Verdict |
|---|---|
| **SMS reminders to the applicant** — "Day 20: call Dr. Chen, (555) 0123, here's the script" | ✅ **Do this.** Clean, consented, and it's the mechanism that actually works |
| **Way B — Twilio does the waiting, applicant does the talking** | 🕐 **LATER FEATURE.** Parked for now — see below |
| **Status check call** — "has the request been processed?" | ⚠️ Informational only, lower stakes |
| **AI calls the provider to request records on the applicant's behalf** | ❌ **Self-defeating** — see below |

### 🕐 Way B — parked for a later build

**The idea:** Twilio calls the provider, sits through the automated menu ("press 3 for medical records"), waits on hold, and **when a real person answers it rings the applicant's phone and joins them together.** The applicant speaks, so they remain the patient requesting their own records — keeping the 30-day deadline and the fee caps. They just skip twenty minutes of menus and hold music.

**Open problem — detecting that a human actually answered.** This is the hard part and the reason it's deferred:

- Twilio's **Answering Machine Detection** (`machineDetection`) distinguishes human vs. voicemail on pickup, but not "we cleared the phone tree."
- **Known menus can be scripted** with `sendDigits` (press 3), which handles the deterministic part.
- **Twilio Media Streams** exposes raw call audio over WebSocket, so custom detection is possible — run speech-to-text and look for genuine conversational speech.
- **Why it's genuinely hard:** recorded messages sound like people, some systems say "please hold" in a human voice, and hold music is inconsistent. A false positive means the applicant picks up to hold music, which is worse than not calling.
- **Likely mitigation:** bias toward false positives, join the applicant early, and let them hang up if it's still a machine. Or only support providers whose menus have been mapped.

**Why outbound AI record requests backfire:** Right of Access is a *patient* right. The moment a third party asks instead, it becomes an authorisation request — **you lose the 30-day deadline and the fee caps**, which is the entire advantage. You would be trading away the leverage to save the applicant a phone call. Records departments also commonly refuse release to a caller without written authorisation already on file.

**The real barrier isn't the call — it's the phone tree, the hold, and not knowing what to say.** Twilio solves the first two; the script solves the third; the patient still speaks, so the legal position holds.

**Consent note:** SMS requires the applicant's opt-in (TCPA). Capture it in the flow.
**Demo note:** live outbound calls are the highest-risk thing on stage. Correct instinct to put this last.

### Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js** (App Router) |
| Hosting | **Vercel** — serverless functions keep the Anvil key server-side |
| Speech → text | **Deepgram** (or browser Web Speech API for zero setup) |
| Text → speech | **ElevenLabs** |
| Avatar | **Simli** / **Tavus** real-time, or **HeyGen** pre-rendered |
| PDF | **Anvil** via `node-anvil` |
| State | In-memory / React state — **no database** |

**Skip Vapi, Retell, LiveKit, Twilio.** Those are telephony orchestration; this is browser voice, no phone calls.

### Accounts and data

**The product needs persistent state** — the tracker watches a 30-day deadline, which cannot live in a browser session.

> ⚠️ **Corrected:** an earlier version of this file called provider names "low sensitivity." **That was wrong.** A provider's identity is health-identifying by itself — an oncology practice, a psychiatric hospital, a methadone clinic each disclose a diagnosis by name alone. SSA-827 enumerates exactly these categories: mental health, drug and alcohol treatment, sickle cell, HIV/AIDS, genetic testing. **There is no low-sensitivity data in this system.**

| **Tier A — never persisted** | **Tier B — persisted only if the tracker needs it, treated as health data** |
|---|---|
| SSN | Provider name, specialty, contact |
| Diagnoses, conditions | Request / response dates |
| Medications | Applicant contact for reminders |
| The completed PDFs | |

The tracker must work **without any Tier A field**. Tier B, where persisted, is encrypted at rest, access-controlled, retention-limited, and never logged. Prefer an **opaque provider reference** with the display name held client-side.

| | **V1 / demo** | **Production** |
|---|---|---|
| Storage | Seeded React state | Encrypted datastore |
| Scheduler | None | Daily deadline evaluation |
| Return access | None | **Passwordless magic link** — never a username and password |

**For today's demo:** no auth, no persistence. **Seed the tracker** (one responded, one at day 22, one past deadline) so it demos without three weeks elapsing. Use a **synthetic persona**. Full detail in `REQUIREMENTS.md` §6 and FR-5.9.

### Anvil integration — no repeated manual work

**One time (~20 min):** upload **all four** forms — SSA-16, SSA-3368, SSA-3369, SSA-827 → Document AI tags fields → copy the four template EIDs into `.env`.

**Then never touch the Anvil UI again:**

```js
// app/api/fill/route.js — server-side on Vercel
import Anvil from '@anvilco/anvil'
const anvil = new Anvil({ apiKey: process.env.ANVIL_API_KEY })

export async function POST(req) {
  const { fields } = await req.json()
  const { data } = await anvil.fillPDF(process.env.ANVIL_EID_3368, { data: fields })
  return new Response(data, { headers: { 'Content-Type': 'application/pdf' } })
}
```

One call per document. The per-provider 827s are the same call in a loop.

### Build order

1. **Prequalifier** — standalone, ~30 min, survives everything else breaking
2. **Document checklist** — if-then rules, no AI
3. **Anvil upload + one hardcoded fill call** — prove the pipe before wiring voice
4. **Voice conversation** — the provider-list interrogation
5. **Per-provider 827s + response tracker**
6. **Record the fallback video**

### Where AI is and isn't

| Step | AI? |
|---|---|
| SGA / work credits | **No** — arithmetic |
| Document checklist | **No** — decision table |
| Speech → structured fields | **Yes** — unbounded input |
| Which records matter | **Yes** — can't enumerate |
| Filling the PDF | **No** — Anvil |
| Completeness validation | **No** — rules |

### Justifications

- **Voice:** the person doesn't know the words the form uses. A form can't ask a follow-up; a conversation can.
- **Avatar:** accessibility — lip reading, low literacy, motor and cognitive impairment. Anvil's webform is the text path for everyone else, which makes this a targeting decision rather than a claim.
- **AI:** exactly two places, both unbounded natural language.

### Scaling

§ 406 means free to the user. Voice + avatar is the expensive per-user piece and scales linearly — so it's reserved for people who cannot use a form; the Anvil webform serves the rest. Who pays: SOAR's answer is a federal grant; long-term disability insurers are another plausible buyer, since SSDI approval offsets their payments.

---

## 8. Data sources and change tracking

### Authoritative rules

| Source | Why |
|---|---|
| **[POMS](https://secure.ssa.gov/apps10/poms.NSF/)** | SSA's internal operating manual, fully public. `DI 11005.023` = "Completing the SSA-3368-BK". **The instructions SSA staff follow** |
| **[eCFR 20 CFR 404 Subpart P](https://www.ecfr.gov/current/title-20/chapter-III/part-404/subpart-P?toc=1)** | The disability regulation. Has an API |
| **[Listing of Impairments (Blue Book)](https://www.ecfr.gov/current/title-20/chapter-III/part-404/subpart-P/appendix-Appendix%201%20to%20Subpart%20P%20of%20Part%20404)** | Medical criteria, 14 body systems — the standard claims are judged against |

### Datasets

| Dataset | Contents |
|---|---|
| **[BEPUF 2020](https://www.ssa.gov/policy/docs/data/index.html)** | **Fully synthetic** microdata, 10% sample, benefits + earnings history. Safe to demo |
| **[State Agency Monthly Workload Data](https://www.ssa.gov/disability/data/ssa-sa-mowl.htm)** | Claims processing, monthly since Oct 2000, by state |
| **[OASDI / SSI Public-Use Microdata](https://www.ssa.gov/policy/docs/data/index.html)** | 1% and 5% samples |
| **[DI Annual Statistical Report](https://www.ssa.gov/policy/docs/statcomps/di_asr/2024/sect04.html)** | Outcomes by adjudicative level |

### Change tracking — **Federal Register API, verified working**

Free, JSON, **no API key**:

```bash
curl "https://www.federalregister.gov/api/v1/documents.json\
?per_page=20&order=newest\
&conditions[agencies][]=social-security-administration\
&fields[]=title&fields[]=publication_date&fields[]=type&fields[]=html_url"
```

Returns **2,727 SSA documents**. The newest when tested:

> **"Revised Medical Criteria for Evaluating Cardiovascular Disorders"** — Rule, 2026-07-02

That is a live Blue Book change, which is exactly why this matters.

Other free routes: [SSA agency RSS](https://www.federalregister.gov/agencies/social-security-administration) · [GovDelivery email](https://public.govdelivery.com/accounts/USSSA/subscriber/new) · eCFR API amendment dates · [regulations.gov API](https://open.gsa.gov/api/regulationsgov/) · reginfo.gov OMB control numbers (SSA-16 = **0960-0618**).

**Cheapest change detector:** every form carries its revision in the header — *"Form SSA-16 (09-2025)"*. Fetch, parse, compare to stored. Ten lines, and it answers the "how do you know a form changed" question nobody in the industry has solved.

---

## 9. Next steps

1. **Upload all four forms to Anvil** — SSA-16, SSA-3368, SSA-3369, SSA-827 → let Document AI tag them → save EIDs. Do this before more code.
2. **Build the prequalification gate.** 30 min, standalone, survives everything else breaking.
3. **Build the document checklist decision table.** Deterministic, and it directly addresses the supporting-docs risk.
4. **Record a fallback video** of the voice exchange. Live voice fails on stage.

### Demo sequence

1. *"Two questions before you spend six months on this."* — screen runs, passes
2. Conversation — person describes their doctors in plain language
3. SSA-3368 fills on screen
4. A signature-ready SSA-827 appears for the case, plus per-provider HIPAA request scripts
5. Personalised document checklist
6. *"SOAR gets 65% approval versus 31%. They reach 5,700 people a year. There are 2.2 million applications a year."*

---

## Sources

**Primary** — [42 USC § 406](https://www.law.cornell.edu/uscode/text/42/406) · [SSA Representation](https://www.ssa.gov/representation/) · [DI Annual Statistical Report 2024](https://www.ssa.gov/policy/docs/statcomps/di_asr/2024/sect04.html) · [Adult Disability Starter Kit](https://www.ssa.gov/pubs/EN-64-110.pdf) · [Electronic Records Express](https://www.ssa.gov/ere/) · [Upload Documents FAQ](https://www.ssa.gov/faqs/en/questions/KA-10087.html) · [Alternative Signature Processes for SSA-827](https://www.ssa.gov/disability/professionals/eAuthorization.htm) · [POMS DI 11005.056 — SSA-827 signature requirements](https://secure.ssa.gov/poms.nsf/lnx/0411005056)

**SOAR** — [Outcomes](https://soarworks.samhsa.gov/about-the-model/oat-and-outcomes) · [SSA-3368 guidance](https://soarworks.samhsa.gov/article/ssa-3368-adult-disability-report) · [Collecting medical evidence / SSA-827](https://soarworks.samhsa.gov/article/collecting-medical-evidence-completing-form-ssa-827)

**Anvil** — [Docs](https://www.useanvil.com/docs/) · [GraphQL](https://www.useanvil.com/docs/api/graphql/) · [Document AI](https://www.useanvil.com/products/document-ai/) · [node-anvil](https://github.com/anvilco/node-anvil) · [PDF API vs Workflow API](https://dev.to/anvilfoundry/pdf-api-vs-workflow-api-1b9i)

**Data** — [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1) · [SSA Open Data](https://www.ssa.gov/data/) · [Urban Institute on backlog](https://www.urban.org/urban-wire/ssa-says-its-reduced-disability-claims-backlog-fewer-new-claims-and-higher-denial-rate)
