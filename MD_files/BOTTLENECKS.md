# Alix Operational Bottlenecks — Deep Research
### Answering the 15 diagnostic questions from `Research.md §11`
**Date:** 27 July 2026 · **Method:** public web sources, primary documents, and inference from the hackathon dataset
**Companion to:** `GAP_ANALYSIS.md`

---

## Read this first — what is and isn't knowable

Of your fifteen questions, **four are answerable from public primary sources, five are answerable by strong inference, and six are internal metrics that no private company publishes.** I have marked every answer with which category it falls into. Anyone who gives you confident numbers for the unknowable six is making them up — which is exactly the failure `Research.md` correctly identified in the earlier analysis.

| | Status | Questions |
|---|---|---|
| 🟢 | **Hard public data** | Q4, Q5, Q6, Q12 |
| 🟡 | **Defensible inference** | Q3, Q7, Q8, Q9, Q13 |
| 🔴 | **Internal-only — must ask** | Q1, Q2, Q10, Q11, Q14, Q15 |

**The six red ones are your mentor-interview script.** Ian and the Alix staff are in the building tomorrow. §17 turns them into questions you can actually ask in 90 seconds.

---

## The headline finding

I found something better than an Alix-internal metric: **Los Angeles Superior Court publishes its actual probate e-filing rejection rates, by filing provider, monthly.**

> **Probate courtwide rejection rate: 12.5%** average (Dec 2022 – Nov 2023), trending **up** from 10.6% to 13.6% across the year.
> **The spread between filing providers on the same court, filing the same forms, is 8.5% to 27.6% — a 3.2× gap.**
>
> — [LA Superior Court, EFSP Rejection Rates Report](https://lascpubstorage.blob.core.windows.net/cpw/LIBOPSCivil-113-EFSPRejectionRatesReport.pdf) (primary source, PDF)

**That 3.2× spread is the most important number in this document.** Same court, same judges, same forms, same rules. The only variable is *who prepared the filing and how*. That proves rejection is a **process defect, not a court constant** — which means it is addressable by software, and it gives you a defensible ceiling for your impact claim.

And the self-represented number is worse. In Family Law, filings through the courts' own DIY document-assembly tool (**Odyssey Guide & File**) were rejected at **25.4%–38.7%** — versus ~9–14% for professional filers on the same court.

> **The court's own consumer form-filling tool gets roughly one in three filings bounced.** That is the status quo you are competing against, and it is a devastating slide.

---

# Part I — The four questions with hard public data

## 🟢 Q4. What percentage of submissions are accepted on the first attempt?

**Not published for Alix.** But the industry proxy is solid and directly relevant.

**Los Angeles Superior Court, by division** (Dec 2022 – Nov 2023):

| Division | Rejection rate | First-pass acceptance |
|---|---:|---:|
| **Probate** | **12.5%** | **87.5%** |
| Civil | 9.0% | 91.0% |
| Family Law — self-represented (Guide & File) | **25.4–38.7%** | **~61–75%** |

**Probate is rejected ~39% more often than civil.** It is the harder division.

**By filing provider, probate only** — the spread that matters:

| Provider | Avg rejection rate |
|---|---:|
| Serve Manager | **27.6%** ← worst |
| Legal eFile (GreenFiling Partner) | 20.8% |
| RapidLegal | 15.9% |
| Legal Connect | 14.0% |
| DDSLegal | 13.6% |
| OneLegal | 12.8% |
| Ace Attorney Service | 12.0% |
| OFS EFSP | 11.7% |
| Janney and Janney | 11.2% |
| Odyssey File & Serve | 9.0% |
| GreenFiling | 9.0% |
| Signal Attorney Service | **8.5%** ← best |

**State-level averages** ([InfoTrack 2021 report](https://f.hubspotusercontent30.net/hubfs/470182/InfoTrack%20Content%20Syndication%202021/Top_eFiling_rejection_reasons_report_2021%20(1).pdf), multi-state, 12 months):

| State | Avg rejection rate |
|---|---:|
| California | **13.6%** |
| Indiana | 7.8% |
| Illinois | **1.2%** |

California is **11× worse than Illinois.** InfoTrack's stated explanation: *"California County Superior courts tend to vary significantly in how they handle specific processes… it can be challenging to determine reliably which court has which requirements."* That is county fragmentation showing up directly in the numbers — and it independently confirms the thesis in `GAP_ANALYSIS.md §3.3`.

---

## 🟢 Q5. What are the five most common rejection reasons?

Two independent primary sources, and they agree.

### A. LA Superior Court — **Probate division**, top 10 verbatim

1. Original petition and/or moving papers rejected
2. Document defective
3. Unable to process incomplete document
4. Resubmit proposed order after the hearing
5. Incorrect fee amount
6. Incorrect filing code selected
7. Case number does not match case information
8. Case coversheet needed as a separate document
9. Subsequent document submitted as a new case filing
10. Duplicate document submitted for filing

### B. InfoTrack — multi-state, categorised **with percentages**

| Rejection category | Share |
|---|---:|
| **Missing / incorrect information** | **36%** |
| Document order | 17% |
| Document defective, illegible, or ineligible | 10% |
| Other | 8% |
| **No descriptive rejection reason given at all** | 8% |
| Incorrect or missing fee | 6% |
| Duplicate filing | 5% |
| Incorrect/missing filing code or type | 4% |
| Incorrect formatting | 4% |
| Missing signature | 2% |

*11% of rejected filings cited more than one reason.*

### What this tells you — and it's the strategic core

**Over half of all rejections (36% + 17% = 53%) are data-completeness and packet-assembly failures.** Not legal errors. Not judgment calls. **Missing fields and documents in the wrong order.**

That is *precisely* the failure class a validation-and-assembly engine eliminates — and precisely what the hackathon dataset's planted defects (`"151 N"`, the malformed licence, the missing EIN) simulate.

Two more things worth noticing:

- **8% of rejections come with no stated reason.** The filer is told "rejected" and must guess. This is the single most enraging part of the process and nobody has productised the diagnosis step.
- LA's own FAQ ([Probate e-filing FAQ, Q28](https://www.lacourt.org/division/efiling/pdf/efiling_faq.pdf)) lists *"Multiple filing documents are submitted as a single filing code (for example, the cover sheet should be a separate pdf)"* as the **first** typical return reason. That is a packet-structure bug, not a content bug. **A correctly filled form still gets rejected if it's bundled wrong.**

---

## 🟢 Q6. Which delays are internal, and which are external?

**Answerable, and the split is lopsided toward external.**

### External — outside anyone's control

| Source | Documented delay |
|---|---|
| Bank of America estate servicing | 3–10 business days to review documents |
| USAA death claim | 2–4 weeks after complete documents |
| Chase | "a few weeks," varies by account type and state |
| Brokerage transfer w/ named beneficiary | 3–6 weeks |
| Probate court, clean final accounting | *"weeks or, in some counties, several months"* in the clerk queue |
| Mandatory creditor-claim periods | Statutory — cannot be compressed at all |
| Full estate settlement | **9–18 months** (Alix's own figure) |

### Internal — the addressable slice

Every rejection cycle is self-inflicted latency: prepare → submit → wait → rejected → diagnose → fix → resubmit → wait again. At a **12.5% probate rejection rate** with clerk queues measured in weeks, one rejection can cost more elapsed time than the entire preparation effort.

### The honest framing for your demo

> A form takes ~15 minutes to prepare and then waits three weeks for institutional review. **Automating the 15 minutes doesn't touch the three weeks. Preventing a rejection does — because a rejection costs another full three-week cycle.**

Do not claim you compress settlement time. Claim you **eliminate avoidable round-trips.** That is defensible, and it's the claim the rejection data actually supports.

---

## 🟢 Q12. Which estate types are excluded from the standard workflow?

**Publicly stated.** Alix *"does not handle contested matters or formal court proceedings"* and refers to network attorneys instead.

Alix's [Terms of Service](https://www.meetalix.com/terms-of-service) further establish that Alix is **not a law firm** and does not provide legal, tax, financial, or real-estate advice. Anything requiring those judgments routes to a licensed professional.

**Reasonable exclusion list** (partly inferred from `Research.md §8.7`, which is sound): contested wills, litigation, missing/absent executor, suspected financial abuse, insolvent estates, operating businesses, multistate property, foreign beneficiaries, tax controversy, ambiguous trust terms, minor or incapacitated beneficiaries.

**Build implication:** exception *triage* — detecting that a case has left the automatable path — is unclaimed territory and is genuinely valuable. But it's hard to demo in 7 hours.

---

# Part II — The five questions answerable by inference

## 🟡 Q3. Which forms account for the most volume?

**Not published.** But you have an unusually strong signal: **Alix chose four forms for this hackathon.**

| Form | Why it's near-universal |
|---|---|
| **SS-4** | Nearly every estate/trust needs an EIN to open an account |
| **Form 56** | Required to notify the IRS of any fiduciary relationship |
| **Form 8821** | Needed to pull the decedent's tax transcripts — a discovery prerequisite |
| **DL 142** | The state-level cancellation archetype (50 variants of this shape) |

These are the **federal core that applies regardless of state**, plus one state form to represent the fragmented tail. That is very likely a deliberate curation of "highest volume, lowest variance."

**Probable high-volume forms they did *not* include:** Form 1041 (fiduciary income tax), Form 706 (estate tax + portability), Forms 4810/5495 (executor liability discharge), and the per-county probate petition / letters / inventory / final accounting set.

---

## 🟡 Q7. Does Alix maintain one canonical record per person, asset, debt, and authority document?

### **Yes — and you're holding the proof.**

This is the question the dataset answers outright. Every sample file declares:

```json
"meta": { "sourceSystem": "alix-estate-manager", "schemaVersion": "1.0.0" }
```

And the record is unmistakably canonical in shape:

- `decedent` · `fiduciary` · `relatedParties[]` — **people**, with roles as an enum array (`EXECUTOR`, `BENEFICIARY`, `HEIR`, `LAWYER`, `FAMILY_MEMBER`)
- `assets[]` — categorised, counted, valued, with institutions
- `authority` — **authority as a first-class object**: basis, appointment date, administration path, proceeding, bond, letters-issued date
- `estateEntity` — the estate/trust as its own entity with its own TIN
- Per-form projections: `form56`, `form8821`, `formSS4`, `formDL142`

**`sourceSystem: "alix-estate-manager"` is a named internal system with a versioned schema.** That is a canonical data layer, and `authority` being modelled separately from `fiduciary` is a sophisticated choice — it means they track *the legal right to act* as its own state, exactly as `Research.md §1` predicted.

**Debts are the exception.** There is no `debts[]` array. Debt appears only as a count buried in `provenance.notes` (*"debt count (9)"*, *"debt count (7)"*, *"debt count (1)"*). Either debts live in a system that wasn't exported, or the model is thinner there. **Worth asking.**

---

## 🟡 Q8. Who determines which legal procedure and form apply?

**Inference: a human, specifically the Settlement Specialist, escalating to network counsel.**

Evidence:
- Alix employs a **Head of Estate Settlement — Delaney Haley, who holds a CTFA** (Certified Trust and Fiduciary Advisor). That is a fiduciary-judgment credential, not an ops one.
- The terms disclaim legal advice, so route determination cannot be presented as a software output.
- The dataset's `authority.administrationPath` field carries values like `ANCILLARY_PROBATE`, `INDEPENDENT_ADMINISTRATION`, `TRUST_ADMINISTRATION`, `FORMAL_PROBATE` — **a decided enum, not a derived one.** Something upstream decides it and writes it down.

**This is the single most important architectural fact for your build.** Route selection is currently a **human decision recorded as a field**. Your engine should consume `administrationPath` as an input, not try to infer it — and then be rigorous about everything downstream. That's the honest, defensible boundary, and it's the one Alix themselves draw.

---

## 🟡 Q9. What may AI execute, draft, or require professional approval?

**No published policy.** The boundary is inferable from the legal disclaimers and the CEO's framing:

| Tier | Likely contents |
|---|---|
| **AI may execute** | Document classification, extraction, form population, drafting family updates, deadline tracking, checklist generation |
| **AI may only draft** | Institution correspondence, court filings, anything with a signature block |
| **Requires licensed human** | Legal route determination, tax positions, fiduciary decisions, distribution authorisation, anything the ToS disclaims |

The CEO describes the model as *"agentic AI and humans"* and Alix is currently hiring an **Agent Systems Engineer (Python)** — so agent execution is an active build area, not a settled one.

---

## 🟡 Q13. How is evidence preserved for every extracted fact?

**Partial evidence, and it's encouraging.** The dataset's `provenance` block carries `sourceEstateScanBoxId` (e.g. `000001d8`, `000001ee`, `00000203`) — **a stable pointer from the structured record back to the originating scanned document box.**

That means Alix does maintain a link from extracted fact to source artefact, at least at the case level.

**What's absent:** there is no per-field provenance. Nothing says *"`decedent.dateOfDeath` came from page 1 of the death certificate, confidence 0.97."* Provenance appears to be **record-scoped, not field-scoped**.

> **This is a real, specific, defensible gap — and it's the one most worth building into your demo.** Field-level provenance with confidence scores is exactly what turns a form-filler into something a fiduciary can actually sign. When a clerk rejects a filing (12.5% of the time), field-level provenance is what lets you find the bad fact in seconds instead of re-reading the whole file.

---

# Part III — The six you must ask a human

These are internal operating metrics. **No public source exists. Do not guess them — ask.**

## 🔴 Q1. Which ten tasks consume the most specialist time?
Alix says it manages **"100+ estate settlement responsibilities"** and the [How we help](https://www.meetalix.com/how-we-help) page enumerates ~35 of them, but with no time weighting. The CEO's remark that the hard parts include *"forwarding mail, cancelling subscriptions and closing or memorialising social media accounts"* hints that the **long tail of small tasks**, not the big legal steps, is what eats the hours. Unconfirmed.

## 🔴 Q2. How many documents are generated, edited, and submitted per estate?
**No credible public figure exists.** `Research.md` was right to flag the earlier "80 forms per estate" as fabricated. Do not repeat it, even as an estimate.

## 🔴 Q10. How are calls, mail, faxes, portal submissions, and in-person tasks recorded?
Nothing public. This matters more than it sounds: **LA Superior Court prohibits e-filing of testamentary instruments (wills and codicils), letters, original trust documents, and bonds** ([FAQ Q2](https://www.lacourt.org/division/efiling/pdf/efiling_faq.pdf)). The most legally significant documents in probate **must still move on paper.** Any "fully automated" claim collides with this. Ask how paper events enter the case record.

## 🔴 Q11. How does Alix learn that a court or bank changed a form?
Nothing public. Almost certainly manual — this is an industry-wide unsolved problem. Note that LA's probate rejection rate *rose* from 10.6% to 13.6% over twelve months, which is consistent with requirements drifting faster than filers adapt.

## 🔴 Q14. Which internal metric matters most?
Nothing published. The Series A language — *"onboard new executors faster"* and *"build new integrations connecting estate settlement to the broader financial value chain"* — hints at **onboarding time and integration count**, not minutes-saved. If true, that reframes what a winning demo should optimise for.

## 🔴 Q15. Where does work repeatedly return to the specialist after attempted automation?
**This is the highest-value question in the entire list and there is no public answer.** It is a direct request for their automation failure log. Ask it plainly; the worst case is they decline.

---

# Part IV — Context you should have

## Alix's own published numbers

| Metric | Figure | Source |
|---|---|---|
| Executor hours per estate | **900** (elsewhere "600–900") | [About Alix](https://www.meetalix.com/about-us) |
| Time to settle | **9–18 months** | About Alix |
| Responsibilities managed | **100+** | About Alix |
| Average estate spend on attorneys/accounting/executor comp | **$30,000+** | [Initialized founder spotlight](https://blog.initialized.com/2023/12/founder-spotlight-alix/) |
| Self-description | *"TurboTax for estate settlement"* | Founder profile |

**Note:** Alix's own 900-hour figure is *higher* than the 570 hours in `GAP_ANALYSIS.md`. **Use 900 and cite Alix** — it's their number, it's larger, and quoting a company's own figure back to them is unarguable.

## Company shape

- **Series A: $20M** (July 2025), total funding **$30.65M**. Led by **Acrew Capital**, with **Charles Schwab** and **Edward Jones Ventures**; also American Family Insurance, Initialized, Scribble, Magnify, Ziegler Link•age, Cameron Ventures.
- **~25+ employees**, SF office opened explicitly to *"leverage the Bay Area's AI expertise."*
- Leadership: Alexandra Mysoor (CEO), Hugh Tamassia (President, ex-JPMorgan/AIG/Acorns), Tim Myers (CTO), Bill Hawley (COO), **Delaney Haley (Head of Estate Settlement, CTFA)**.
- Hiring **Agent Systems Engineer — Python**.
- Distribution: **1,500+ funeral homes** via the Elevia partnership.
- Reputation: **17 Trustpilot reviews, largely positive**, praising weekly proactive communication. Too small a sample to mine for bottlenecks.

## ⚠️ A correction to yesterday's report

`GAP_ANALYSIS.md` leaned on a **$9,000 minimum / 1%** figure sourced from **Elayne, a competitor**. Alix's own materials market support for estates **from roughly $20,000 to $20 million**, with fees "as little as 1%."

**These conflict.** Most likely both are partly true — a competitor quoting a floor Alix doesn't advertise, and Alix advertising a range it will quote case by case.

**Revised guidance for your pitch:** the *economic* argument still holds — a 1% fee on a $75,000 estate is $750, which cannot fund 900 hours of specialist labour under any model. **Make the argument from unit economics, not from a competitor-sourced price.** It's stronger and it can't be contradicted from the stage.

---

# Part V — What this means for what you build

The research converges on one thing, and it isn't form-filling.

### The three facts that define the opportunity

1. **12.5% of probate filings are rejected**, and the rate is rising.
2. **53% of rejections are missing information or wrong document order** — mechanical, preventable, non-legal failures.
3. **The same court, same forms, produces 8.5% to 27.6% depending purely on who prepared the filing.** A 3.2× spread that software can move.

### The claim you can defend

> **"We don't make forms faster. We make them get accepted the first time."**

Everything supports this: the LA data, the InfoTrack categories, the dataset's planted defects, the clerk-queue delays that make each rejection cost weeks.

### What to add to the build in `GAP_ANALYSIS.md`

Your eligibility + verification engine is still correct. Three additions, in priority order:

1. **A pre-flight rejection check** modelled on the actual top-10 list — completeness, packet order, separate cover sheet, case-number consistency, correct fee, signature present. Score each filing before it goes out. *This is now evidence-backed rather than invented.*
2. **Field-level provenance and confidence** — the specific gap in §Q13. Every filled field traces to its source fact and carries a confidence score. This is what makes it signable by a fiduciary.
3. **A rejection-reason interpreter** — paste in the clerk's note (or handle the 8% with no note at all), and it identifies which field or packet-structure rule failed. Closes the loop `Research.md §8.2` calls for.

### The demo line

> *"Los Angeles rejects one in eight probate filings. Depending on who prepares it, that's anywhere from 8% to 28% — same court, same forms. Over half of those rejections are missing fields and misordered packets. Our system checks for exactly those before anything is filed — and on Alix's own sample data, it caught three forms that should never have been generated and one address that was truncated in their database."*

---

# Part VI — Your mentor-interview script

You have limited access to Alix staff. **These are the six questions no amount of searching will answer.** Ranked by how much the answer would change your build. Ask Ian first, then anyone from the estate-settlement team — Delaney Haley's team owns these answers.

| # | Ask this, verbatim | Why it changes your build |
|---|---|---|
| **1** | *"Where does work come back to a specialist after you've tried to automate it?"* | Their automation failure log. Points straight at the unsolved problem. |
| **2** | *"What's your first-pass acceptance rate, and do you track it?"* | If they don't track it, that's your product. If they do, you get the benchmark. |
| **3** | *"Is provenance field-level or record-level? The samples only show `sourceEstateScanBoxId`."* | Shows you read the data properly. Confirms or kills build item #2. |
| **4** | *"Who decides `administrationPath`, and is it ever wrong?"* | Tells you whether route determination is safe to automate. |
| **5** | *"How do you find out a court changed a form?"* | If the answer is "a specialist notices," that's a whole product. |
| **6** | *"What's the metric on the wall — minutes saved, first-pass acceptance, or cases per specialist?"* | Tells you exactly which number to put on your title slide. |

**Two more worth slipping in:**
- *"There's no `debts[]` array in the samples — where do debts live?"* (probes the canonical model)
- *"Wills, letters and bonds can't be e-filed in LA. How do paper events get into the case record?"* (probes the channel-logging gap, Q10)

**Why this works:** these questions demonstrate you read their schema, found the industry rejection data, and understood the difference between internal and external latency. That is a recruiting-fast-track conversation regardless of how the demo goes.

---

## Sources

**Primary — court and government**
- [LA Superior Court — EFSP Rejection Rates, Dec 2022–Nov 2023 (PDF)](https://lascpubstorage.blob.core.windows.net/cpw/LIBOPSCivil-113-EFSPRejectionRatesReport.pdf) ⭐ probate rejection rates by provider
- [LA Superior Court — Probate e-Filing FAQ (PDF)](https://www.lacourt.org/division/efiling/pdf/efiling_faq.pdf) ⭐ typical return reasons; e-filing exemptions
- [LA Superior Court — EFSP rejection reports notice (PDF)](https://www.lacourt.org/newsmedia/uploads/14202413133737NTA24-01-03-2024-NEWEFSPREJECTIONREPORTS.pdf)
- [California Courts — Statewide Action Plan for Serving Self-Represented Litigants (PDF)](https://courts.ca.gov/system/files?file=file/selfreplitsrept.pdf)
- [IRS Publication 559](https://www.irs.gov/publications/p559)

**Primary — industry data**
- [InfoTrack — Top eFiling Rejection Reasons 2020–2021 (PDF)](https://f.hubspotusercontent30.net/hubfs/470182/InfoTrack%20Content%20Syndication%202021/Top_eFiling_rejection_reasons_report_2021%20(1).pdf) ⭐ categorised rejection reasons, state rates

**Alix — company sources**
- [About Alix](https://www.meetalix.com/about-us) · [How we help](https://www.meetalix.com/how-we-help) · [Terms of Service](https://www.meetalix.com/terms-of-service) · [Privacy Policy](https://www.meetalix.com/privacy-policy)
- [Business Wire — Alix Secures $20M Series A](https://www.businesswire.com/news/home/20250721578329/en/Alix-Secures-$20M-Series-A-to-Transform-Estate-Settlement)
- [InvestmentNews — Alix raises $20M](https://www.investmentnews.com/fintech/wealth-tech-alix-raises-20m-to-expand-ai-powered-estate-settlement-platform/261389)
- [Initialized — Founder Spotlight: Alexandra Mysoor](https://blog.initialized.com/2023/12/founder-spotlight-alix/) ⭐ 600–900 hours, $30K figure
- [The Org — Alix org chart](https://theorg.com/org/alix/org-chart/alexandra-mysoor)
- [Trustpilot — meetalix.com](https://www.trustpilot.com/review/meetalix.com) (17 reviews)
- [Jobs at Alix — Scribble Ventures](https://jobs.scribble.vc/jobs/alix)

**Institution processing times**
- [SwiftProbate — Bank of America notification guide](https://www.swiftprobate.com/institutions/bank-of-america) · [TD Bank](https://www.swiftprobate.com/institutions/td-bank)
- [SimplyTrust — Chase death claim](https://simplytrust.com/financial-institutions/chase/death-claim/) · [USAA](https://simplytrust.com/financial-institutions/usaa-bank/death-claim/)
- [Keystone Law — Claiming deceased bank accounts](https://keystone-law.com/how-to-claim-deceased-bank-accounts)

**Filing-rejection commentary**
- [Legal Document Server — Reducing court filing rejections (2026)](https://legaldocumentserver.com/2026/04/18/reduce-court-filing-rejections/)
- [Michigan Legal Help — E-filing rejection reasons](https://michiganlegalhelp.org/resources/mifile/e-filing-rejection-reasons-and-how-fix-them)
- [File & ServeXpress — Why was my filing rejected](https://www.fileandserve.com/why-was-my-filing-rejected/)

**Source-quality note:** everything in Parts I and IV-stats is primary (courts, IRS, company statements, funding press). SwiftProbate and SimplyTrust institution pages are vendor content — directionally useful for processing times, not authoritative. The competitor-sourced Alix pricing figure is flagged and corrected in Part IV.
