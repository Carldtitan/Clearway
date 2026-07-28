# SSDI Resources — Documents, Data, Anvil Integration
**Companion to `latest_pathway.md`**

---

# 1. Every document an SSDI applicant needs

## A. SSA forms — initial application stage

| Form | Purpose | Who completes it |
|---|---|---|
| **SSA-16-BK** | Application for Disability Insurance Benefits — the legal act of applying | Claimant |
| **SSA-3368-BK** | Disability Report – Adult. Conditions, providers, medications, tests | Claimant |
| **SSA-3369-BK (06-2024)** | Work History Report — jobs held in the 15 years before onset | Claimant |

> ⚠️ **Source forms only from ssa.gov. Never from a mirror.**
>
> The reginfo.gov OMB copy of SSA-3369 turned out to be a **substantially older revision** than the live form — 10 pages vs 14, 345 fillable fields vs 392, and **zero field names in common** (`topmostSubform[0].Page3[0]…` vs `form1[0].Page13[0].P13-…-FLD[0]`). Building against the mirror would have failed on every single field.
>
> ssa.gov returns 403 to scripted fetches, so **download forms in a browser.** Confirm the revision string in the header — the live one reads `Form SSA-3369-BK (06-2024) UF`.
| **SSA-827** | Authorization to Disclose Information — the medical records release | Claimant (signature) |
| **SSA-3373-BK** | Function Report – Adult. How symptoms limit daily activity | Claimant |
| **SSA-3380-BK** | Function Report – Adult **Third Party**. Same, from someone who knows them | Friend/family |

**The three SSA explicitly names as required together:** SSA-3368 (medical), SSA-3369 (work history), SSA-827 (release).

## B. SSA forms — appeal stage

| Form | Purpose |
|---|---|
| **SSA-561** | Request for Reconsideration (first appeal) |
| **SSA-3441-BK** | Disability Report – Appeal (what changed since you filed) |
| **HA-501** | Request for Hearing by an Administrative Law Judge |
| **SSA-1696** | Appointment of Representative |
| **SSA-795** | Statement of Claimant — free-form written statements |

## C. Related forms

| Form | When |
|---|---|
| **SSA-8000-BK** | Application for SSI (many people file SSDI and SSI together) |
| **SSA-455** | Disability Update Report — continuing disability review |
| **SSA-3381** | Starter Kit worksheet. **Preparation only — not submittable** |

## D. Supporting documents — not forms

**Identity and eligibility**
- Birth certificate — original or certified copy
- Social Security number / card
- Proof of citizenship or lawful presence
- Driver's licence or state ID
- Marriage and divorce records (drives auxiliary benefits)
- Children's birth certificates and SSNs

**Work and earnings**
- W-2s or self-employment tax returns for the prior year
- Pay stubs — needed to verify against the SGA limit
- Workers' compensation or short-term disability award letters

**Military**
- DD-214 or equivalent (required if served before 1968)

**Medical — the heaviest and most decisive**
- Name, address, phone, and treatment dates for **every** provider
- Medical records, clinic notes, hospital and surgery records
- Diagnostic results — MRI, X-ray, bloodwork
- Complete medication list with prescriber and reason
- Physician statements on functional limitations

**Banking**
- Account and routing number for direct deposit

> ✅ **RESOLVED — SSA-827 is a blanket authorisation.** Settled by reading the form's own text:
>
> **FROM WHOM** — *"**All** medical sources (hospitals, clinics, labs, physicians, psychologists, etc.)… **All** educational sources… Social workers/rehabilitation counselors… Consulting examiners used by SSA… Employers, insurance companies, workers' compensation programs…"*
>
> There is no applicant-facing field naming a specific provider. The field `P1_SSAComplete_FLD` is explicitly *"**THIS BOX TO BE COMPLETED BY SSA/DDS**"* — it is not yours to fill.
>
> **So: generate ONE signed 827 per case, per adjudicative level** — this is SSA's actual procedure per POMS; the adjudicating component distributes copies to sources itself. Extra originals are occasionally requested but are not the default. For the applicant chasing their **own** records, use the HIPAA Right of Access route instead. See `REQUIREMENTS.md` FR-4.3.1.
>
> **Also:** the form states it is *"good for 12 months from the date signed."* Claims routinely run ~2 years, so authorisations expire mid-claim. See FR-4.9.

---

# 2. Track confirmation

**You are Track 3, and you don't need telephony.**

- Track 3 is *"Messy scans in, valid filled forms out"* — the deliverable is a **correctly filled form**. That's what you produce.
- Track 2 is the voice track, and its tooling is telephony-first: Vapi, Retell, LiveKit, **Twilio**. Outbound calling is a Track 2 concern.
- **A voice model as the input method to a form pipeline is still Track 3.** The deck explicitly blesses the combination: Track 2's inputs are described as *"real forms to complete through conversation (these pair well with Track 3 sources)."*
- The rubric is identical across tracks anyway, so there is no scoring penalty either way.

---

# 3. Data sources

## A. The authoritative rules — free, public, machine-readable

| Source | What it is | Why it matters |
|---|---|---|
| **[eCFR — 20 CFR Part 404 Subpart P](https://www.ecfr.gov/current/title-20/chapter-III/part-404/subpart-P?toc=1)** | The regulation governing disability determination | Continuously updated, **has an API** |
| **[eCFR Appendix 1 — Listing of Impairments](https://www.ecfr.gov/current/title-20/chapter-III/part-404/subpart-P/appendix-Appendix%201%20to%20Subpart%20P%20of%20Part%20404)** | The "Blue Book" — medical criteria across 14 body systems | The actual standard a claim is judged against |
| **[SSA Blue Book](https://www.ssa.gov/disability/professionals/bluebook/)** | Same content, SSA's presentation | Human-readable version |
| **[POMS](https://secure.ssa.gov/apps10/poms.NSF/)** | Program Operations Manual System — SSA's own internal operating manual, fully public. `DI` = disability | **The instructions SSA staff actually follow.** e.g. `DI 11005.023` is literally "Completing the SSA-3368-BK" |
| **Social Security Rulings (SSRs)** | Precedential decisions | Binding interpretation |

**POMS is the highest-value one here.** It's the internal manual, published in full. If you want to know exactly how SSA evaluates something, POMS says so.

## B. Datasets

| Dataset | Contents |
|---|---|
| **[BEPUF 2020](https://www.ssa.gov/policy/docs/data/index.html)** | **Fully synthetic** microdata, 10% sample of adult OASDI beneficiaries, with benefit variables and taxable earnings history |
| **[SSA State Agency Monthly Workload Data](https://www.ssa.gov/disability/data/ssa-sa-mowl.htm)** | Disability claims processing, monthly since Oct 2000, by state — filings, workloads, outcomes |
| **[OASDI Public-Use Microdata](https://www-origin.ssa.gov/policy/docs/microdata/mbr/index.html)** | 1% random sample, ~460,000 records |
| **[SSI Public-Use Microdata](https://www.ssa.gov/policy/docs/microdata/ssr/index.html)** | 5% random sample |
| **[SSA Open Data](https://www.ssa.gov/data/)** / [data.gov](https://catalog.data.gov/organization/ssa-gov) | Agency data inventory and public endpoints |
| **[Annual Statistical Report on the DI Program](https://www.ssa.gov/policy/docs/statcomps/di_asr/2024/sect04.html)** | Outcomes by adjudicative level |

**BEPUF is the one to look at first** — fully synthetic means you can demo with it and never touch real personal data. Same reasoning as the 900-block SSNs in the estate dataset.

**State Agency Monthly Workload Data** is the backlog evidence, straight from SSA rather than a vendor blog.

## C. Staying current with government changes — free

| Method | How |
|---|---|
| **[Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1)** | Free, JSON, **no API key**. Filter by agency = Social Security Administration. Best single option |
| **[Federal Register — SSA agency page](https://www.federalregister.gov/agencies/social-security-administration)** | RSS feed + email subscription per agency |
| **[GovDelivery — SSA](https://public.govdelivery.com/accounts/USSSA/subscriber/new)** | SSA's own email subscription service |
| **eCFR API** | Exposes amendment dates — diff the regulation over time |
| **[regulations.gov API](https://open.gsa.gov/api/regulationsgov/)** | Proposed rules and public comments, before they take effect |
| **reginfo.gov** | Every SSA form has an OMB control number (SSA-16 = **0960-0618**). Form revisions clear OMB, so watching the control number tells you a form changed |
| **The PDF itself** | Every form carries its revision in the header: *"Form SSA-16 (09-2025)"*. Cheapest possible change detection — fetch, parse the header, compare |

**For a hackathon, the last one is a 10-line function and it demos well.** Fetch the form, read the revision string, compare to your stored version, flag if it moved. That directly addresses the "how do you know when a form changes" question that nobody in the industry has solved.

---

# 4. Anvil without manual work

## The layers

| Layer | Endpoint / method | Manual? |
|---|---|---|
| **Create a template** | `createCast` GraphQL mutation — accepts an uploaded PDF, returns a Cast | Programmatic |
| **Auto-tag fields** | Document AI runs on upload | Automatic |
| **Edit a template in your app** | Embedded builder — generate an embed URL (enterprise feature) | Programmatic |
| **Fill a PDF** | `POST /api/v1/fill/{eid}.pdf` — JSON in, PDF bytes out | Programmatic |
| **Generate a PDF** | `POST /api/v1/generate-pdf` — HTML/CSS or Markdown in, PDF out | Programmatic |
| **E-signature** | Etch packets, embeddable iframe signer, React components | Programmatic |
| **Workflows** | GraphQL or URL endpoints; create submissions with pre-populated data | Programmatic |
| **Events** | Webhooks on submission and signature completion | Automatic |

**SDKs:** official open-source for **Node.js, Python, and C#/.NET**.
**Schema:** download the full GraphQL SDL from `https://app.useanvil.com/graphql/sdl` (authenticated).

## The architecture that avoids repetitive manual entry

```
ONE-TIME SETUP  (~15 min, manual, do it once)
   Upload SSA-3368, SSA-827 → Document AI auto-tags fields
   Save the template EIDs

RUNTIME  (fully automated, forever after)
   voice transcript
        ↓
   your mapping layer  (fieldmaps/*.json)
        ↓
   POST /api/v1/fill/{eid}.pdf   ← one HTTP call
        ↓
   PDF bytes
        ↓
   Etch packet for signature     ← one more call
        ↓
   webhook fires when signed
```

**Nobody touches the Anvil UI after setup.** That's the answer to your concern.

## PDF API vs Workflow API — pick the PDF API

Anvil's own guidance:

| Choose **PDF API** if | Choose **Workflow API** if |
|---|---|
| Adding PDFs to an existing app | Building workflows from scratch |
| **Controlling business logic and UI/UX is critical** | Speed to deployment matters most |
| You have developer expertise | Limited developer resources |
| You need full UX customisation | Non-technical people build the workflows |

**Your voice layer *is* your UI/UX, and it's the whole differentiator.** The Workflow API would hand you Anvil's webform, which competes with the thing you're building. Use the PDF API: Anvil produces documents, you own the experience.

Keep the Workflow API in mind for one thing though — **it's your text fallback path.** Anvil's auto-generated webform serves everyone who can type, at near-zero build cost, which is exactly the scaling answer in `latest_pathway.md`.

## Practical setup order

1. Upload SSA-3368 and SSA-827 → let Document AI tag them
2. Grab the template EIDs
3. **Alias all applicable fields, driven from `fieldmaps/ssa-3368.json`** — *(supersedes an earlier note here that said "only ~25–30 fields." `REQUIREMENTS.md` FR-4.1 requires all applicable fields, and the newer requirement controls. This is affordable because the form is loop-structured — providers 1–6, medications 1–11 — and every field carries a plain-English `/TU` label, so the alias list is generated, not clicked through by hand.)*
4. Test one `fill` call with hardcoded JSON before wiring the voice layer
5. Produce the SSA-827 copies — **signature fields left blank**, not Etch-signed (FR-4.3.1)
6. Wire the webhook last — it's nice-to-have, not demo-critical

---

## Source list

**SSA primary**
- [Adult Disability Interview Checklist](https://www.ssa.gov/disability/Documents/Checklist%20-%20Adult.pdf) · [Starter Kit](https://www.ssa.gov/pubs/EN-64-110.pdf) · [Online application checklist](https://www.ssa.gov/hlp/radr/10/ovw001-checklist.pdf)
- [POMS DI 11005.023 — completing SSA-3368](https://secure.ssa.gov/poms.nsf/lnx/0411005023)
- [Blue Book](https://www.ssa.gov/disability/professionals/bluebook/) · [Public-Use Data Files](https://www.ssa.gov/policy/docs/data/index.html) · [Open Data](https://www.ssa.gov/data/)

**Regulations and change tracking**
- [eCFR 20 CFR 404 Subpart P](https://www.ecfr.gov/current/title-20/chapter-III/part-404/subpart-P?toc=1) · [Listing of Impairments](https://www.ecfr.gov/current/title-20/chapter-III/part-404/subpart-P/appendix-Appendix%201%20to%20Subpart%20P%20of%20Part%20404)
- [Federal Register — SSA](https://www.federalregister.gov/agencies/social-security-administration) · [GovDelivery](https://public.govdelivery.com/accounts/USSSA/subscriber/new)

**Anvil**
- [Docs](https://www.useanvil.com/docs/) · [GraphQL API](https://www.useanvil.com/docs/api/graphql/) · [GraphQL reference](https://www.useanvil.com/docs/api/graphql/reference/) · [Embedded builders](https://www.useanvil.com/docs/api/embedded-builders/) · [PDF Filling](https://www.useanvil.com/products/pdf-filling-api/) · [PDF Generation](https://www.useanvil.com/docs/api/generate-pdf/) · [node-anvil SDK](https://github.com/anvilco/node-anvil) · [PDF API vs Workflow API](https://dev.to/anvilfoundry/pdf-api-vs-workflow-api-1b9i)
