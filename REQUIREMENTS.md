# Requirements
**Formless · Track 3 · Alix Hackathon**
Companion to [`latest_pathway.md`](latest_pathway.md) (context, evidence, sources) and [`RESOURCES.md`](RESOURCES.md) (data sources, form inventory).

---

## 1. Purpose

Help a person with a disability complete an SSDI application correctly the first time, and ensure their medical evidence actually reaches the decision-maker.

**The three jobs:**
1. Tell them *before* they apply whether they will be rejected for a non-medical reason
2. Let them complete a 460-field form by talking instead of typing
3. Make sure their doctors actually send the records the claim depends on

**Grounding:** SOAR (SAMHSA) proves a trained human preparing the application lifts approval from 31% to 65%, but reaches ~5,700 people/year against 2,246,542 claims/year.

---

## 2. Users

| User | Situation | Needs |
|---|---|---|
| **Primary — the applicant** | Cannot work due to disability. Low income. May have motor, visual, cognitive, or pain-related limits. Possibly low literacy. Often phone-only | Not to be defeated by a form. Not to waste six months on a predetermined denial |
| **Secondary — a helper** | Family member, caseworker, shelter staff | To complete the application alongside the applicant |

**Not a user:** attorneys or appointed representatives. This product does not represent anyone.

---

## 3. V1 functional requirements

### FR-1 · Prequalification screen

| ID | Requirement |
|---|---|
| FR-1.1 | Ask current monthly earnings before any other question |
| FR-1.2 | Compare against the applicable SGA limit — **$1,690/month non-blind, $2,830/month statutorily blind (2026)**. Both stored as configuration, never hardcoded inline. Ask whether the applicant is statutorily blind |
| FR-1.3 | ⚠️ **Earnings above SGA are a soft flag, not a hard rejection.** Output *"possible SGA issue — needs review"* and explain the exceptions below. Only issue a definitive stop if every exception has been ruled out |

#### FR-1.3.1 · Why SGA cannot be an unconditional reject

| Exception | Effect |
|---|---|
| **Statutory blindness** | Threshold rises to **$2,830/month** |
| **Impairment-Related Work Expenses (IRWE)** | Disability-related costs are deducted before the comparison |
| **Subsidies and special conditions** | Employer support reduces countable earnings |
| **Self-employment** | SSA evaluates **profit**, not gross, and applies its own separate tests |
| **Passive income** | Generally does not count toward SGA at all |

| ID | Requirement |
|---|---|
| FR-1.3.1a | Ask about blindness, IRWE, and self-employment before producing any SGA verdict |
| FR-1.3.1b | Where an exception may apply, return **NEEDS REVIEW** and name the exception |
| FR-1.3.1c | For self-employment, never compare gross revenue to SGA. Ask for profit and flag that SSA applies additional tests |
| FR-1.3.1d | Never tell an applicant they are ineligible. State what the figures suggest and what would change the answer |
| FR-1.4 | Estimate insured status using the decision table in FR-1.8. Requires: date of birth, disability onset date, years worked, and whether work occurred in the relevant recent window |
| FR-1.5 | Show a clear **pass / fail / uncertain** result with the reason stated |
| FR-1.6 | **No AI.** Arithmetic and comparison only. Every result must be traceable to a stated rule |
| FR-1.7 | Complete in under 2 minutes |

#### FR-1.8 · Insured status — **two separate tests**

> ⚠️ **Corrected.** An earlier draft said "40 credits at age 31+." **That conflated the two tests.** The Duration of Work requirement rises *progressively* with age; 40 credits (10 years) is the ceiling, not the age-31 threshold. The 20/40 rule belongs to the **Recent Work** test, not the duration test.

**Both tests must pass.** Credits accrue at a maximum of 4 per year (2026: $1,890 each, $7,560 for all four).

##### Test 1 — Duration of Work (lifetime total)

Sliding scale by age at onset:

| Age at onset | Years of work |
|---|---|
| Before 28 | 1.5 |
| 30 | 2 |
| **34** | **3** |
| 38 | 4 |
| **42** | **5** |
| 44 | 5.5 |
| 46 | 6 |
| 48 | 6.5 |
| 50 | 7 |
| 52 | 7.5 |
| 54 | 8 |
| 56 | 8.5 |
| 58 | 9 |
| 60 | 9.5 |

Credits = years × 4. Interpolate between listed ages; cap at 40 credits.

##### Test 2 — Recent Work (worked recently enough)

| Age at onset | Requirement |
|---|---|
| Before 24 | **6 credits** in the 3-year period ending at onset |
| 24 to 30 | Worked **half the time** between age 21 and onset |
| **31 and over** | **20 credits in the 10 years** before onset — the "20/40 rule" |

```
insured(age_at_onset, credits_total, credits_last_10y):
    duration_ok = credits_total >= min(40, duration_table(age) * 4)
    if age < 24:        recent_ok = credits_in_last_3y >= 6
    elif age <= 30:     recent_ok = worked >= (age - 21) / 2 years
    else:               recent_ok = credits_last_10y >= 20
    return duration_ok and recent_ok
```

| ID | Requirement |
|---|---|
| FR-1.8.1 | Compute `age_at_onset` from date of birth and alleged onset date |
| FR-1.8.2 | Evaluate **both** tests independently and report which one fails |
| FR-1.8.3 | Both the duration table and the per-credit dollar value are **configuration**, revised annually by SSA — never hardcode inline |
| FR-1.8.4 | **Uncertainty handling is mandatory.** Most applicants do not know their credit count. Where self-reported work history is ambiguous, return **UNCERTAIN**, never a false negative |
| FR-1.8.5 | On UNCERTAIN, direct the user to their *my Social Security* account, which shows their actual earnings record, and explain what to look for |
| FR-1.8.6 | **Never state a definitive "you are not insured" from self-reported data alone.** No screen in FR-1 produces an unconditional rejection — SGA is a soft flag (FR-1.3) and insured status is an estimate |

### FR-2 · Voice conversation

| ID | Requirement |
|---|---|
| FR-2.1 | Accept spoken input and respond with speech. **No rendered avatar in V1** |
| FR-2.2 | Ask questions in plain language, never in form vocabulary ("who have you seen about your back?" not "list all treating sources") |
| FR-2.3 | **Exhaust the provider list.** After each provider named, ask again until the user indicates there are no more |
| FR-2.4 | Capture per provider: name, facility, address, phone, treatment dates, conditions treated |
| FR-2.5 | Capture per medication: name, prescriber, reason |
| FR-2.6 | Capture conditions, onset date, and work history |
| FR-2.7 | Provide a visible text transcript alongside the audio |
| FR-2.8 | Allow the user to correct any captured value before documents are produced |
| FR-2.9 | Map free speech to form fields using the plain-English `/TU` labels in `fieldmaps/` |

### FR-3 · Document checklist

| ID | Requirement |
|---|---|
| FR-3.1 | Produce a personalised list of supporting documents from answers already given |
| FR-3.2 | Rules: served in military → DD-214 · married → marriage certificate · divorced ≥10 yrs → decree · children under 18 → their birth certificates and SSNs · worked last year → W-2s · currently earning → pay stubs · non-citizen → immigration documents · always → birth certificate, SSN, photo ID, bank routing + account |
| FR-3.3 | **No AI.** Decision table only |
| FR-3.4 | State for each item why it is needed |

### FR-4 · Document generation (Anvil)

| ID | Requirement |
|---|---|
| FR-4.0 | ✅ Fill **SSA-16-BK (09-2025)** — Application for Disability Insurance Benefits. Field map: `fieldmaps/ssa-16.json` (140 usable fields). See FR-4.0.1 |
| FR-4.1 | Fill **SSA-3368-BK** — **all applicable fields, not a subset.** Field map: `fieldmaps/ssa-3368.json` (426 usable fields) |
| FR-4.2 | ✅ Fill **SSA-3369-BK (06-2024)** (Work History Report). 14 pages. **407 form nodes → 392 widgets → 377 user-fillable mapped fields** (180 text / 197 checkbox), all carrying `/TU` labels. Map: `fieldmaps/ssa-3369.json` |
| FR-4.3 | Produce a signature-ready **SSA-827**. See FR-4.3.1 for the copy strategy |
| FR-4.4 | Handle SSA-3368 capacity limits: **6 provider slots, 11 medication slots**. On overflow, generate a continuation sheet and note it in Remarks |
| FR-4.5 | **Auto-write the Remarks section** with record-request status (e.g. *"Records requested from Dr. Chen 08/03, no response as of 09/02"*) |
| FR-4.6 | Generate an evidence index (HTML → PDF) listing each provider, what was requested, and status |
| FR-4.7 | All Anvil calls run **server-side**. The API key is never exposed to the client |
| FR-4.8 | Do **not** claim SSA accepts an Anvil e-signature on SSA-827. Output must be signature-ready for wet ink or SSA's own click-and-sign |

#### FR-4.0.1 · SSA-16 — the application itself

Brought in scope. This is the form that legally constitutes applying; without it there is no claim.

| ID | Requirement |
|---|---|
| FR-4.0.1a | Most of SSA-16 is already captured by the conversation — name, SSN, date of birth, citizenship, marital history, children, work history. Reuse it; do not re-ask |
| FR-4.0.1b | **Item 8 — "when do you believe your condition(s) became severe enough to keep you from working" — is the alleged onset date.** It sets the entitlement date and therefore the backpay. Treat it as high-stakes |
| FR-4.0.1c | The onset date on SSA-16 must be **consistent with the onset date used on SSA-3368**. Flag any mismatch before generating documents — inconsistency across forms damages credibility |
| FR-4.0.1d | Capture marital history (item 11) and children, since these determine whether a spouse or children can draw auxiliary benefits on the record |
| FR-4.0.1e | Leave signature fields blank — same wet-ink / SSA-click-and-sign position as FR-4.8 |
| FR-4.0.1f | SSA-16 is commonly completed inside SSA's own online flow. The generated PDF therefore serves as **both a filable form and a worksheet** — this is the workflow SSA and SOAR recommend |

#### FR-4.3.1 · SSA-827 copy strategy — **RESOLVED**

**SSA-827 is a blanket authorisation, not a per-provider one.** Settled by the form's own text:

> **FROM WHOM** — *"**All** medical sources (hospitals, clinics, labs, physicians, psychologists, etc.) including mental health, correctional, addiction treatment, and VA health care facilities · **All** educational sources · Social workers/rehabilitation counselors · Consulting examiners used by SSA · Employers, insurance companies, workers' compensation programs · Others who may know about my condition"*

There is no applicant-facing field naming a specific provider. The field `P1_SSAComplete_FLD` is labelled *"**THIS BOX TO BE COMPLETED BY SSA/DDS** (as needed)… the specific source"* — it belongs to SSA, not the applicant.

> ⚠️ **Corrected again.** An earlier draft required "N signed copies, one per provider." **That is not SSA's procedure.** Per POMS, SSA obtains **one signed SSA-827 per case at each adjudicative level**, and the adjudicating component distributes copies to medical sources itself. Additional originals are occasionally requested, but N providers = N originals must not be the default.

| ID | Requirement |
|---|---|
| FR-4.3.1a | **Generate ONE signed SSA-827 per case**, per adjudicative level. SSA/DDS distributes copies to sources |
| FR-4.3.1a-i | Support generating **additional blank originals on request** — occasionally asked for — but never as the default |
| FR-4.3.1a-ii | For the applicant chasing their **own** records, do not issue extra 827s. Use the **HIPAA Right of Access** route instead (§4 of `latest_pathway.md`): a request in the patient's own name, carrying the 30-day deadline and fee caps that an 827 does not |
| FR-4.3.1b | Leave `P1_SSAComplete_FLD` **blank** — it is SSA/DDS's field |
| FR-4.3.1c | Leave blank for pen: `P1_Signature1_FLD`, `P1_Date1_FLD`, `P1_ParentSig_FLD`, `P1_WitnessSig1_FLD`, `P1_WitnessAdd1_FLD`, `P1_WitnessSig2_FLD`, `P1_WitnessAdd2_FLD` |
| FR-4.3.1d | Fill: `P1_Name1_FLD`, `P1_SSN1_FLD`, `P1_DOB_FLD`, `P1_Address_FLD`, `P1_City_FLD`, `P1_State_FLD`, `P1_Zip_FLD`, `P1_PhoneNum_FLD` |

#### FR-4.9 · SSA-827 expiry — 12 months

The form states: *"This authorization is good for **12 months from the date signed**"* and covers *"information created within 12 months after the date this authorization is signed."*

| ID | Requirement |
|---|---|
| FR-4.9.1 | Record the signing date and compute an expiry date 12 months later |
| FR-4.9.2 | Warn the applicant at **11 months**: authorisations are about to expire and fresh ones must be signed |
| FR-4.9.3 | This matters because claims routinely run **~2 years** through reconsideration and hearing — the authorisation dies partway through and record requests silently stop working |
| FR-4.9.4 | Regenerate blank signature-ready copies on request |

### FR-5 · Record tracker

| ID | Requirement |
|---|---|
| FR-5.1 | Record per provider: date requested, computed 30-day deadline, status (`sent` / `responded` / `silent`) |
| FR-5.2 | Prompt the applicant to check their **patient portal first** — free and often immediate |
| FR-5.3 | At day 20, surface a reminder **on screen** with the provider's phone number and a verbatim script |
| FR-5.4 | Script must state: requesting own records under HIPAA Right of Access · 30-day deadline · no retrieval fee · ask for email or portal delivery |
| FR-5.5 | At day 30, surface escalation options including an OCR complaint |
| FR-5.6 | **No AI.** Date arithmetic only |
| FR-5.7 | Reminders address the **applicant**, never the provider |
| FR-5.8 | Surface the SSA-827 expiry warning at 11 months (FR-4.9.2) |

#### FR-5.9 · Persistence — **RESOLVED**

The tracker spans 30+ days and cannot live in a browser session. Two explicitly different targets:

| | **V1 / demo** | **Production** |
|---|---|---|
| Storage | Seeded React state, in memory | Persistent datastore |
| Scheduler | None — dates are pre-set | Cron or queue evaluating deadlines daily |
| Return access | None | **Passwordless magic link** by email or SMS |
| Auth | None | None — magic link only |

| ID | Requirement |
|---|---|
| FR-5.9a | **V1 ships with seeded state** — one provider responded, one at day 22, one past deadline — so the feature demonstrates without three weeks elapsing |
| FR-5.9b | Production must not require account creation. **Passwordless magic link** only: creating a username and password is a barrier for exactly the users this serves |
| FR-5.9c | Production requires a scheduler evaluating deadlines at least daily |
| FR-5.9d | Data written by the tracker is governed by §6 — which classifies provider identity as **health-identifying**, not low sensitivity |

### FR-6 · Text fallback path

| ID | Requirement |
|---|---|
| FR-6.1 | Offer an Anvil Workflow webform for users who prefer typing |
| FR-6.2 | Must reach the same generated documents as the voice path |

---

## 4. V2 requirements — later additions

### FR-7 · Avatar (rendered face)

| ID | Requirement |
|---|---|
| FR-7.1 | Render a speaking face synchronised to the voice output |
| FR-7.2 | Must be optional — voice-only and text paths remain available |
| FR-7.3 | Justification is accessibility: lip reading for deaf/hard-of-hearing users, low literacy, users unfamiliar with software |
| FR-7.4 | Must degrade gracefully to voice-only on render failure |

### FR-8 · Twilio SMS

| ID | Requirement |
|---|---|
| FR-8.1 | Send the day-20 and day-30 reminders by SMS as well as on screen |
| FR-8.2 | Require explicit opt-in captured in the flow (**TCPA**) |
| FR-8.3 | Provide STOP handling |
| FR-8.4 | Message must contain the provider name, phone number, and the script |

### FR-9 · Twilio assisted calling ("Way B")

| ID | Requirement |
|---|---|
| FR-9.1 | Dial the provider, navigate known phone menus via `sendDigits`, hold |
| FR-9.2 | On detecting a live human, call the applicant and bridge the two |
| FR-9.3 | The **applicant speaks** — the system never requests records on their behalf, which would forfeit the 30-day deadline and fee caps |
| FR-9.4 | Display the script on screen while connected |
| FR-9.5 | **Open problem:** reliable human detection. Recorded messages and "please hold" in a human voice cause false positives. Bias toward joining early and allow the applicant to hang up |

---

## 5. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Accessibility** — WCAG 2.2 AA. Full keyboard navigation. Screen-reader compatible. No colour-only signalling |
| NFR-2 | **Latency** — voice round-trip under 2s; document generation under 10s |
| NFR-3 | **Graceful degradation** — if speech recognition fails, fall back to typed input without losing captured state |
| NFR-4 | **Plain language** — target 6th-grade reading level in all user-facing copy |
| NFR-5 | **Mobile first** — many users are phone-only |
| NFR-6 | **No dead ends** — every failure state offers a next action |
| NFR-7 | **Auditability** — every prequalification and checklist result traceable to a named rule |

---

## 6. Data requirements

> **Corrected classification.** An earlier draft called provider names "low sensitivity." **That was wrong.** A provider's identity is health-identifying on its own — an oncology practice, a psychiatric hospital, a methadone clinic, or an HIV clinic each disclose a diagnosis by name alone. SSA-827 itself enumerates the categories at stake: mental health, drug and alcohol treatment, sickle cell anaemia, HIV/AIDS, and genetic testing.
>
> **There is no low-sensitivity data in this system.** The goal is minimisation of volume and duration, not a two-tier classification.

### Tier A — never persisted

- Social Security number
- Diagnoses and conditions
- Medications
- The completed PDFs

### Tier B — persisted only when the tracker requires it, and treated as health data

| Field | Why it is sensitive |
|---|---|
| Provider name and specialty | Reveals condition category |
| Provider address / phone / portal | Same, indirectly |
| Request and response dates | Reveals care timeline |
| Applicant contact | Links the above to a person |

| ID | Requirement |
|---|---|
| DR-1 | The tracker must function **without any Tier A field** |
| DR-2 | Generated PDFs are delivered to the user and never retained |
| DR-3 | Conversation state is held in session and discarded on completion |
| DR-4 | Demos use a **synthetic persona** only |
| DR-5 | V1 has **no authentication and no persistence** — Tier B exists only in seeded demo state |
| DR-6 | Any Tier B persistence must be **encrypted at rest**, access-controlled, and carry an explicit retention period with automatic deletion |
| DR-7 | Prefer storing an **opaque provider reference** with the display name held client-side, so the server never holds a name-to-person mapping in clear text |
| DR-8 | Log no Tier A or Tier B values. Scrub them from error reporting and analytics |
| DR-9 | Give the user a one-action **delete everything** control |
| DR-10 | State plainly in the UI what is stored, for how long, and why |

---

## 7. External dependencies

| Service | Use | Failure mode |
|---|---|---|
| **Anvil** | PDF fill, generation, templates | No documents produced — hard dependency |
| **Deepgram** or Web Speech API | Speech → text | Fall back to typed input |
| **ElevenLabs** | Text → speech | Fall back to on-screen text |
| **LLM provider** | Speech → field mapping; evidence relevance | Fall back to typed form |
| **Vercel** | Hosting, serverless functions | — |
| Twilio *(V2)* | SMS, assisted calling | Feature unavailable; on-screen reminders continue |
| Simli / Tavus / HeyGen *(V2)* | Avatar rendering | Degrade to voice-only |

**Anvil template EIDs required in `.env`:** SSA-3368, SSA-3369, SSA-827.

### ✅ Blockers — all resolved

| # | Blocker | Resolution |
|---|---|---|
| ~~B-1~~ | ~~SSA-3369-BK PDF missing~~ | ✅ **RESOLVED with the official ssa.gov copy** — `Form SSA-3369-BK (06-2024) UF`, 14 pages, 392 fillable fields. At `MD_files/ssa-3369-bk.pdf`, map at `fieldmaps/ssa-3369.*` |
| ~~B-2~~ | ~~Per-credit dollar value for 2026~~ | ✅ **RESOLVED.** 2026: **$1,890 per credit**, **$7,560** for the annual maximum of 4. In `.env.example` as `EARNINGS_PER_CREDIT_USD` / `EARNINGS_FOR_FOUR_CREDITS_USD` |

**No open blockers.** Setup checklist: [`SETUP.md`](SETUP.md) · Environment template: [`.env.example`](.env.example)

---

## 8. Legal and compliance constraints

| ID | Constraint |
|---|---|
| LC-1 | The product **never acts as an appointed representative**. No SSA-1696, no acting on the applicant's behalf before SSA |
| LC-2 | **Charge no fee** for services connected to a claim. 42 U.S.C. § 406(a)(5) makes an unauthorised fee a misdemeanor for *any person* |
| LC-3 | Provide **no individualised legal advice**. State public thresholds as information |
| LC-4 | Never answer or place a call **as** the claimant — misrepresentation risk |
| LC-5 | Never assert that SSA accepts a third-party e-signature on SSA-827. SSA accepts only: its own click-and-sign, employee attestation, witnessed signature, or wet ink |
| LC-6 | SMS requires prior express consent (TCPA) |
| LC-7 | The product prepares; **the applicant files.** Submission happens at ssa.gov, by mail, or in person |

---

## 9. Out of scope

- Filing anything with SSA on the user's behalf
- Representing the applicant at reconsideration or hearing
- Storing or hosting medical records
- Appeal-stage forms (SSA-561, SSA-3441, HA-501)
- SSI (SSA-8000) — SSDI only for now
- ~~SSA-16~~ — **moved IN SCOPE.** See FR-4.0. The original exclusion rested partly on a claim that its field names were unmappable, which proved false: it carries `/TU` labels like every other form and is mapped at `fieldmaps/ssa-16.json` (140 fields). The conversation already collects most of its content, and it is the actual application
- Any fee-charging mechanism

---

## 10. Acceptance criteria

**V1 is done when:**

1. A user over the applicable SGA limit receives **"possible SGA issue — needs review"** in under 2 minutes, naming any exception that may apply (blindness, IRWE, self-employment) — never an unconditional rejection
2. Insured status evaluates **both** the Duration of Work and Recent Work tests separately, reports which fails, and returns **UNCERTAIN** rather than a false negative
3. A user can name providers by speaking, is prompted until the list is exhausted, and can correct any captured value
4. A filled **SSA-3368** PDF is produced containing every provider, medication, and condition captured
4b. A filled **SSA-3369** (Work History Report) is produced from the same conversation data
4c. A filled **SSA-16** is produced, with its onset date reconciled against SSA-3368 (FR-4.0.1c)
5. **One** signature-ready SSA-827 is produced for the case, with all signature fields blank and `P1_SSAComplete_FLD` left for SSA
6. A personalised document checklist is produced with reasons
7. The Remarks section is auto-populated with record-request status
7b. An **evidence index** PDF is generated listing each provider, what was requested, and current status (FR-4.6)
8. The tracker shows per-provider status with a day-20 script, a day-30 escalation, and an 11-month authorisation-expiry warning
9. The typed fallback path reaches the same documents
10. No Tier A field is written to persistent storage; Tier B exists only as seeded demo state
11. Every prequalification and checklist result names the rule that produced it

**Demo readiness:**

- Tracker seeded with mixed state (responded / day 22 / past deadline) to show the feature without waiting three weeks
- Recorded fallback video of the voice exchange
- Prequalifier runs standalone if everything else fails
