# Gap Analysis — Estate Settlement Paperwork
### Where Alix already wins, and where the real hole is
**Prepared for:** Alix "Agents of Administration" Hackathon, Track 3 (*Paperwork, Killed*)
**Date:** 27 July 2026 (Day 1 evening)
**Purpose:** Find a problem worth building that Alix does *not* already solve well.

---

## 0. The thesis in one paragraph

Alix has genuinely solved estate settlement — **for estates large enough to pay for a human specialist.** Their pricing is 1% of gross estate value with a **$9,000 minimum**, which means the service only makes economic sense above roughly **$900,000**. The median American probate estate is worth around **$200,000**. Alix's own hackathon dataset contains an estate worth **$74,718** — which would owe Alix **12% of its entire value** in fees.

**Alix solved the wealthy death. Nobody has solved the median one.** And the reason is structural: their model depends on paid humans, and humans don't scale down to a $75,000 estate. The only way to serve that estate is to make the paperwork *fully* automatic — which is precisely what Track 3 is asking for.

> **The gap is not a missing feature. It is a missing price point, and the thing blocking that price point is paperwork.**

---

## 1. Scale of the problem

| Metric | Figure | Source |
|---|---|---|
| US deaths per year | **3,072,039** (2024) | [CDC / NCHS](https://www.ncbi.nlm.nih.gov/books/NBK619358/) |
| Americans dying without a will | **~67%** | [Ledbetter Cowan Law Group](https://www.ledbetterlawfl.com/blog/the-hidden-crisis-why-67-of-americans-leave-their-families-in-legal-limbo) |
| Executor hours per estate | **500–700 hrs** (avg ~570, over ~16 months) | [Probate Court Bond, 2026](https://www.probatecourtbond.com/estate-planning-in-america-2026-snapshot-key-statistics-costs-and-trends/) |
| Typical uncontested probate duration | **6–12 months**; 12–24 with real property | [48HourProbate, 2026](https://48hourprobate.com/blog/how-long-does-probate-take) |
| Institutions a family must contact | **40+** | [Solace Care, 2026](https://www.solace.care/resources/close-bank-accounts-after-death) |
| Certified death certificates needed | **8–15**, each kept by the recipient | [Trustworthy](https://www.trustworthy.com/blog/when-someone-dies/death-certificate-copies) |
| Probate cost as % of estate | **3–7%** | [Inheritance Advanced](https://inheritanceadvanced.com/blog/inheritance-statistics/) |

**Rough arithmetic:** ~3M deaths × ~570 executor hours is on the order of a billion hours of unpaid administrative labour per year, performed by grieving people with no training. Even a conservative fraction of that is an enormous number to put on a slide.

---

## 2. What Alix already does — the "don't build this" list

Taken directly from [Alix's own "How we help" page](https://www.meetalix.com/how-we-help). **If your idea is on this list, do not build it.** You will be demoing their own product back to them.

| Area | Alix already does |
|---|---|
| **Discovery** | Reviews wills/trusts, finds life insurance policies, **finds and claims unclaimed property**, identifies creditors, opens estate bank accounts, mail forwarding |
| **Digital** | Closes/memorializes social media and email accounts, handles cryptocurrency |
| **Assets** | Transfers/sells real estate and vehicles, handles bank/retirement/brokerage accounts, processes life insurance claims, appraises and sells personal property |
| **Probate** | Files initial petitions, purchases bonds, publishes creditor notices, notifies beneficiaries, prepares for hearings, **creates asset inventories**, completes closure |
| **Debt** | Negotiates and settles debts, closes cards, cancels utilities and subscriptions |
| **Tax** | Requests IRS transcripts, assists with final income taxes, prepares annual estate tax filings |
| **Long tail** | Tracks down old employer retirement plans, inventories collectibles, resolves title issues, redeems credit card points |

### Ideas this kills outright

- ❌ **Unclaimed property finder** — explicitly listed. Solved.
- ❌ **Life insurance / lost policy locator** — explicitly listed. Also already a free public utility ([NAIC Policy Locator](https://content.naic.org/article/learn-how-use-naic-life-insurance-policy-locator), $13B matched since 2016).
- ❌ **Digital asset / RUFADAA account closure** — explicitly listed, and RUFADAA is law in 47 states + DC.
- ❌ **Asset discovery from documents** — their single most-marketed AI capability.
- ❌ **Subscription/utility cancellation bot** — explicitly listed.
- ❌ **Generic "estate task checklist"** — Atticus, EstateExec, Empathy ($162M raised) and Alix all have one.

---

## 3. Where Alix stops — the gap frontier

Four boundaries, each independently verifiable.

### 3.1 The price floor — the big one

Alix charges **1% of gross estate value, $9,000 minimum** ([Elayne pricing guide, June 2026](https://www.elayne.com/resources/alix-pricing-guide)). The breakeven is $900,000; below that you pay the minimum regardless.

**Run that against Alix's own hackathon dataset:**

| Sample estate | Gross assets | Alix fee | % of estate consumed |
|---|---:|---:|---:|
| `estate-01` NJ ancillary probate | $74,718 | $9,000 | **12.0%** |
| `estate-05` IN formal probate | $186,111 | $9,000 | **4.8%** |
| `estate-02` CA intestate | $536,334 | $9,000 | **1.7%** |
| `estate-04` CA trust + estate | $1,046,265 | $10,463 | 1.0% |
| `estate-03` OH trust admin | $1,976,530 | $19,765 | 1.0% |

**Three of the five estates Alix handed you fall below their own breakeven.** The smallest would surrender an eighth of its total value. These are real cases from their production system — meaning Alix sees these families and cannot economically serve them.

Now compare to the market: the median probate estate is roughly **$200,000**, and Census data puts median estate values far lower still ($69K men / $41K women). **The median American death sits ~4.5× below Alix's breakeven.**

> This is the single strongest fact available to you, it is provable live on stage using their own file, and it is almost certainly not something they expect a team to compute.

### 3.2 Delegation-only, no self-serve tier

Alix is *"a hands-off concierge approach where you submit documents through the app and wait for the care team to act"* ([Elayne review](https://www.elayne.com/resources/alix-review-pros-cons-alternatives)). The same review rates Alix **"Limited"** on *direct automation of administrative steps*.

There is no product for the executor who wants to — or must — do it themselves. That is the majority of the 3M/year.

### 3.3 No county-level form intelligence (industry-wide)

Probate is administered **county by county**, and each county layers its own local forms on top of the state set — local cover sheets, hearing-date assignments, formatting rules. A clerk will **reject a filing that uses an outdated revision** ([Catalina, 2026](https://www.catalinastructuredfunding.com/blog/california-probate-forms); [Riverside County Superior Court](https://www.riverside.courts.ca.gov/self-help/self-help-legal-services/probate-self-help-packets)).

Nobody has solved this. The market leader in executor software, EstateExec, is explicitly noted as **"not personalized to county level"** ([SwiftProbate comparison, 2026](https://www.swiftprobate.com/blog/best-ai-tools-estate-executors)).

The consequences are severe and well documented:
- Filing in the **wrong county venue** *"often delays hearings by months"* and risks dismissal ([Bryan Fagan Law Office](https://txprobatelawyer.net/common-probate-paperwork-issues/)).
- Small estates that once cleared probate in 8 weeks now **linger 6 months** as clerks *"repeatedly bounce forms back for tiny technical corrections"* ([inkl, 2026](https://www.inkl.com/news/probate-ai-shift-why-small-estates-face-6-month-delays-in-some-states)).
- Repeatedly rejected inventory/accounting filings can lead to **removal of the executor or contempt** ([Hopler Wilms & Hanna](https://hoplerwilms.com/blog/2019/07/30/probate-issues-with-filing-estate-records/); [Pierce Law Group, NC](https://piercelaw.com/news/probate-question-and-answer/what-happens-if-the-executor-misses-the-courts-deadlines-for-filing-estate-inventories-and-affidavits-north-carolina-guidance/)).

Note the irony worth quoting on stage: the article above reports clerks *"spend hours correcting AI-generated mistakes because the systems misread handwritten forms."* **Naive AI form-filling is actively making this problem worse.** A system that knows when to *stop* is the counter-positioning.

### 3.4 Not contested matters

Alix *"does not handle contested matters or formal court proceedings"* and refers out to attorneys. Correct call, and out of scope for a 2-day build — but worth knowing the boundary.

---

## 4. Candidate problems, scored

Scored against the actual rubric: **Real-World Impact 30% · Technical Execution 25% · Product Quality 20% · Originality 15% · Demo 10%.**

| # | Problem | Alix gap? | Buildable in 7 hrs? | Anvil fit | Verdict |
|---|---|---|---|---|---|
| **A** | **Which forms does this estate actually need?** Jurisdiction + authority-basis eligibility engine → generates only the valid ones | ✅ Wide open | ✅ Dataset is designed for it | ✅ Perfect | **BUILD** |
| **B** | **Sub-threshold routing** — does this estate even need probate, or does a small-estate affidavit clear it? | ✅ Economically excluded from Alix | ✅ Threshold table is public | ✅ Strong | **BUILD (fold into A)** |
| **C** | **Dirty-data guard** — flag `"151 N"`, malformed IDs, cross-state mismatches for human review before filing | ✅ "Limited automation" | ✅ Dataset ships the defects | ✅ Native | **BUILD (fold into A)** |
| **D** | **Executor liability shield** — Form 56 → 4810 → 5495 discharge sequence | ✅ Not mentioned by Alix | ✅ Pure IRS forms | ✅ Perfect | **Strong bonus** |
| **E** | 40+ institution notification pack | ⚠️ Alix does it manually | ⚠️ No institution APIs to demo | ✅ Good | Risky demo |
| **F** | Estate inventory / final accounting filing | ⚠️ Alix creates inventories | ⚠️ Needs county format research | ✅ Good | Medium |
| **G** | Medicaid estate recovery notice + hardship waiver | ✅ Unmentioned | ✅ Narrow | ✅ Good | Too narrow alone |
| **H** | Death certificate allocation optimizer | ✅ Unsolved | ✅ Trivial | ⚠️ Thin | Feature, not product |
| **I** | Unclaimed property / life insurance finder | ❌ **Alix does this** | — | — | **Do not build** |
| **J** | Digital asset / RUFADAA closure | ❌ **Alix does this** | — | — | **Do not build** |
| **K** | Generic executor checklist | ❌ Four companies do this | — | — | **Do not build** |

---

## 5. Recommended build

### **"The estate that can't afford a human."**
### A jurisdiction-aware filing engine that decides *which* forms an estate needs, fills them, and refuses to file the ones that don't apply.

**The pitch:**
> Alix does this brilliantly for estates over $900,000. Below that, the family is alone — and that's most families. We built the paperwork engine for the estate Alix can't afford to touch.

**The pipeline:**

```
Estate record (JSON)
        ↓
┌──────────────────────────────────────────────┐
│ 1. ELIGIBILITY  — which forms apply?         │  ← the differentiator
│    • jurisdiction gate (DL 142 = CA only)    │
│    • authority basis → Form 56 box selection │
│    • EIN present? → SS-4 needed or not       │
│    • below small-estate threshold? → skip    │
│      probate entirely, use the affidavit     │
├──────────────────────────────────────────────┤
│ 2. MAPPING      — fact → correct blank       │
├──────────────────────────────────────────────┤
│ 3. VERIFICATION — confidence + review queue  │  ← the trust layer
│    catches "151 N", the 9-char CA licence,   │
│    the FL licence held by a TX resident      │
└──────────────────────────────────────────────┘
        ↓
      ANVIL  →  filled PDFs + "3 items need your eyes"
```

**Why each rubric line scores:**

- **Impact (30%)** — you can state a defensible number: *N of 570 hours removed*, and *3 of 5 sample estates priced out of the incumbent*. Measurable, sourced, not hand-waved.
- **Technical (25%)** — the eligibility layer is real logic, not a prompt. Decision tables over verified facts. (This also quietly imports Track 1's thesis — *don't let the LLM hallucinate the rules*.)
- **Product (20%)** — the human-review queue is exactly Alix's own stated model: *AI prepares, humans verify.* You're building to their architecture.
- **Originality (15%)** — **every other Track 3 team will build a form filler. You are building a form *refuser*.** No competitor does county/jurisdiction gating.
- **Demo (10%)** — the money shot: *"our system correctly declined to file 3 of these 5 forms, and here's why."* Nobody expects a form-filler to say no.
- **Best Use of Anvil ($1,000)** — Anvil does the fill; your engine does the judgment. That's the *right* use of their product, not a shallow one.

### The 90-second demo script

1. *"Margaret Ashford's estate is worth $74,718. Alix would charge her family $9,000 — 12% of everything she left. That's not a criticism of Alix; it's the honest limit of a human-powered model. This is the estate we built for."*
2. Load `estate-01`. Engine runs.
3. *"It generated SS-4, Form 56, and 8821 — correctly filled."* Show a real PDF.
4. *"And it **refused** to generate DL 142, because Margaret held a passport, not a California licence. A naive filler would have produced a form the DMV throws away."*
5. Run `estate-03` and `estate-05`. *"Refused again — Ohio licence. Refused again — Indiana licence. Three of five."*
6. *"Then it flagged this: an attorney's address that reads `151 N`. Truncated in Alix's own database. We don't guess — we escalate."*
7. *"570 hours per estate. 3 million deaths a year. We took the first N out, for the families who can't buy their way out."*

### Bonus if you have time — the liability shield (Problem D)

An executor is **personally liable** for the decedent's unpaid taxes. Three IRS forms in sequence discharge that liability — **Form 56** (already in your dataset), **Form 4810** (request for prompt assessment), **Form 5495** (discharge from personal liability). Most executors have never heard of the last two, and Alix's public materials don't mention them.

Adding this is cheap — same data, two more forms — and it converts your demo from *"we filled forms faster"* into ***"we protected the executor from a liability they didn't know they had."*** That's a judge-memorable line, and it's real: failing to file Form 56 can leave an executor *"time-barred from court access to dispute the claim"* ([Florida Tax Solvers](https://floridataxsolvers.com/blog/irs-form-56-and-fiduciary-liability-what-you-need-to-know/); [IRS Pub 559](https://www.irs.gov/publications/p559)).

---

## 6. Q&A defence — what judges will probe

| Likely question | Your answer |
|---|---|
| *"Isn't this just a form filler?"* | The filler is Anvil, 200 lines. The product is the eligibility and verification layer — the part that decides what *not* to file. |
| *"Doesn't Alix already do this?"* | For estates over $900K, yes, with humans. Their own sample data contains three estates below that line. We're serving the ones the unit economics exclude. |
| *"How do you know your form logic is right?"* | We encoded it as an auditable decision table, not a prompt, and every output cites which rule fired. Wrong answers are inspectable and fixable — hallucinations aren't. |
| *"What about liability if you fill something wrong?"* | We never auto-file. Every output carries a confidence score and a review queue. Same posture Alix states publicly: AI prepares, humans verify. |
| *"Why should we trust the LLM?"* | We don't use it for rules — only for messy-value normalisation, and anything below threshold escalates to a human instead of being guessed. |
| *"How does this scale past 4 forms?"* | The engine is form-agnostic; adding a form is a template upload plus a rule row. County-local forms are the same shape. |

---

## 7. Source quality — read this before quoting anything

Being straight about evidence, since it may come up in Q&A:

**Solid, cite freely:**
- CDC/NCHS mortality data — federal statistics, primary source.
- IRS Publication 559, Form 56 instructions — primary source.
- State court self-help pages (Riverside, Orange County, Ohio Supreme Court) — primary.
- NAIC Policy Locator, Medicaid.gov estate recovery — primary.
- RUFADAA adoption (47 states + DC) — Uniform Law Commission.
- **Your own dataset arithmetic** — the strongest number you have, because it's computed, not cited.

**Use with attribution, treat as directional:**
- **The $9,000 / 1% Alix pricing** comes from **Elayne, a direct competitor.** It's consistent across multiple sources and Alix doesn't publish pricing publicly — but attribute it, and say "publicly reported" rather than asserting it flat. If Alix staff are in the room, this is the number they'll react to; don't overstate it.
- **570 executor hours** — widely repeated industry figure, no peer-reviewed origin found. Say "commonly cited."
- **Median probate estate ~$200K** — SEO content sources of mixed quality. Directionally sound (Census medians are *lower*, which strengthens your argument), but don't present it as precise.
- **"40+ institutions"** — vendor research (Solace Care), not independent.

**A lot of the estate-tech web is competitor content marketing** — Elayne, SwiftProbate, and Alix all publish "best alternatives to X" pages about each other. Everything above was cross-checked where possible, but treat single-source vendor claims with the appropriate discount.

---

## 8. What to do first thing tomorrow

1. **Ask Ian** for `estate-form-data.schema.json` — referenced by all five records, missing from the drive. Also ask whether Anvil templates for the four forms already exist.
2. **Build the eligibility table before the filler.** It's the differentiator and it's the smaller piece. The filler is Anvil's job.
3. **Hardcode the small-estate thresholds** for the states in your dataset only — CA ($239,700 for deaths on/after 1 Apr 2026), NJ, OH, IN. Don't attempt all 50.
4. **Compute your impact number early** and put it on slide one. Don't leave it to the last hour.
5. **Rehearse the refusal moment.** It's the whole demo.

---

## Appendix — Full source list

**Primary / authoritative**
- [CDC NCHS — Mortality in the United States, Provisional Data 2024](https://www.ncbi.nlm.nih.gov/books/NBK619358/)
- [IRS Publication 559 — Survivors, Executors, and Administrators](https://www.irs.gov/publications/p559)
- [Medicaid.gov — Estate Recovery](https://www.medicaid.gov/medicaid/eligibility-policy/estate-recovery)
- [NAIC — Life Insurance Policy Locator](https://content.naic.org/article/learn-how-use-naic-life-insurance-policy-locator)
- [Riverside County Superior Court — Probate Self-Help Packets](https://www.riverside.courts.ca.gov/self-help/self-help-legal-services/probate-self-help-packets)
- [Orange County Superior Court — Formal Probate Self-Help Packet (PDF)](https://www.occourts.org/system/files/selfhelp/shc-pb-14.pdf)
- [Santa Clara County Superior Court — Probate Forms](https://santaclara.courts.ca.gov/self-help/self-help-probate/probate-forms/)
- [Sacramento County Public Law Library — Affidavits of Death](https://saclaw.org/resource_library/affidavits-of-death-transferring-property-without-probate-after-an-owner-dies/)
- [Texas Law Help — Transferring Property Without Court](https://texaslawhelp.org/article/transferring-the-deceaseds-property-without-going-to-court)

**Alix — company sources**
- [Alix — How we help](https://www.meetalix.com/how-we-help)
- [Alix — Estate settlement services](https://go.meetalix.com/estate-settlement-alix)
- [Alix — How long does probate take (2026)](https://www.meetalix.com/resources/how-long-does-probate-take)

**Competitor / market analysis — attribute, discount**
- [Elayne — Alix pricing guide (June 2026)](https://www.elayne.com/resources/alix-pricing-guide)
- [Elayne — Alix review: pros, cons, alternatives](https://www.elayne.com/resources/alix-review-pros-cons-alternatives)
- [Elayne — Executor estate paperwork guide (June 2026)](https://www.elayne.com/resources/executor-of-estate-paperwork)
- [SwiftProbate — 10 best probate & estate settlement apps (2026)](https://www.swiftprobate.com/blog/best-ai-tools-estate-executors)
- [SwiftProbate — Executor settlement deadlines by state (2026)](https://www.swiftprobate.com/blog/how-long-executor-settle-estate)
- [Solace Care — Closing bank accounts after death (2026)](https://www.solace.care/resources/close-bank-accounts-after-death)
- [Probate Court Bond — Estate Planning in America: 2026 Snapshot](https://www.probatecourtbond.com/estate-planning-in-america-2026-snapshot-key-statistics-costs-and-trends/)
- [48HourProbate — How long does probate take, state by state (2026)](https://48hourprobate.com/blog/how-long-does-probate-take)
- [Startup Heist — The 570-hour estate job nobody's productized yet](https://www.startupheist.com/the-570-hour-estate-job-nobodys-productized-yet/)

**Forms, thresholds & failure modes**
- [Catalina — California probate forms, every Judicial Council form (2026)](https://www.catalinastructuredfunding.com/blog/california-probate-forms)
- [Goodman Estate Law — CA 2026 small estate threshold](https://goodmanestatelaw.com/california-probate-trust-administration-understanding-the-2026-small-estate-threshold/)
- [Catalina — Small estate affidavit thresholds by state](https://www.catalinastructuredfunding.com/blog/small-estate-affidavit)
- [Bryan Fagan Law Office — Common probate paperwork issues](https://txprobatelawyer.net/common-probate-paperwork-issues/)
- [Hopler, Wilms & Hanna — Probate issues filing inventory and accounts](https://hoplerwilms.com/blog/2019/07/30/probate-issues-with-filing-estate-records/)
- [Pierce Law Group — Missed inventory deadlines (NC)](https://piercelaw.com/news/probate-question-and-answer/what-happens-if-the-executor-misses-the-courts-deadlines-for-filing-estate-inventories-and-affidavits-north-carolina-guidance/)
- [LegalClarity — Estate inventory filing requirements and deadlines](https://legalclarity.org/estate-inventory-filing-requirements-and-deadlines/)
- [inkl — Why small estates face 6-month delays](https://www.inkl.com/news/probate-ai-shift-why-small-estates-face-6-month-delays-in-some-states)
- [Florida Tax Solvers — IRS Form 56 and fiduciary liability](https://floridataxsolvers.com/blog/irs-form-56-and-fiduciary-liability-what-you-need-to-know/)
- [Patel Law Offices — Limiting executor personal liability for taxes](https://patellawoffices.com/blog/general-estate-planning-and-probate/how-to-limit-an-executors-personal-liability-for-a-decedents-unpaid-taxes/)
- [Trustworthy — How many death certificate copies](https://www.trustworthy.com/blog/when-someone-dies/death-certificate-copies)
- [Trust & Will — What is RUFADAA](https://trustandwill.com/learn/what-is-rufadaa)
- [KingSpry — PA Act 50/65, unclaimed property for estate heirs](https://kingspry.com/act-65-simplifies-unclaimed-property-for-estate-heirs/)
- [Brevy Care — Minnesota Medicaid estate recovery (2026)](https://brevy.com/medicaid/minnesota/estate-recovery)
