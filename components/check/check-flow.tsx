"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Info,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, useMemo, useState } from "react";

import { useApplicantCase } from "@/components/app/case-context";
import { Button } from "@/components/ui/button";
import {
  Field,
  inputClassName,
  NumberField,
  YesNoField,
} from "@/components/ui/form-controls";
import type { EligibilityInput } from "@/lib/case/types";
import { SSA_RULES_2026 } from "@/lib/rules/config";
import {
  evaluatePrequalification,
  type PrequalificationResult,
} from "@/lib/rules/prequalification";
import type { DecisionStatus, RuleResult } from "@/lib/rules/types";
import { cn } from "@/lib/utils";

type CheckStep = "start" | "earnings" | "history" | "result";

const resultLanguage: Record<
  DecisionStatus,
  { eyebrow: string; heading: string; detail: string }
> = {
  looks_clear: {
    eyebrow: "Ready to continue",
    heading: "No obvious non-medical issue",
    detail:
      "Your answers look consistent with the two checks we can estimate here.",
  },
  needs_review: {
    eyebrow: "Worth checking first",
    heading: "One detail needs a closer look",
    detail:
      "You can keep preparing. Confirm the highlighted work detail before relying on this estimate.",
  },
  uncertain: {
    eyebrow: "One useful next step",
    heading: "Your earnings record can answer this",
    detail:
      "Self-reported work credits are only an estimate. Your Social Security record is the source to verify.",
  },
};

export function CheckFlow() {
  const { applicantCase, dispatch, loadDemo } = useApplicantCase();
  const [step, setStep] = useState<CheckStep>(
    applicantCase.eligibilityInput.monthlyEarningsUsd !== null
      ? "result"
      : "start",
  );
  const [draft, setDraft] = useState<EligibilityInput>(
    applicantCase.eligibilityInput,
  );
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(
    () =>
      evaluatePrequalification(applicantCase.eligibilityInput, SSA_RULES_2026),
    [applicantCase.eligibilityInput],
  );

  function update<Key extends keyof EligibilityInput>(
    key: Key,
    value: EligibilityInput[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function submitEarnings(event: FormEvent) {
    event.preventDefault();
    const required = [
      draft.monthlyEarningsUsd,
      draft.statutorilyBlind,
      draft.employerSubsidyPossible,
      draft.selfEmployed,
      draft.passiveIncomeIncluded,
    ];
    if (required.some((value) => value === null)) {
      setError("Answer each question on this step to continue.");
      return;
    }
    if (draft.selfEmployed && draft.selfEmploymentProfitUsd === null) {
      setError("Add average monthly business profit to continue.");
      return;
    }
    dispatch({ type: "SET_ELIGIBILITY_INPUT", patch: draft });
    setStep("history");
  }

  function submitHistory(event: FormEvent) {
    event.preventDefault();
    if (!draft.dateOfBirth || !draft.allegedOnsetDate) {
      setError("Add both dates to calculate the work-credit estimate.");
      return;
    }
    dispatch({ type: "SET_ELIGIBILITY_INPUT", patch: draft });
    setStep("result");
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-[46rem]"
        exit={{ opacity: 0, y: -8 }}
        initial={{ opacity: 0, y: 8 }}
        key={step}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {step === "start" ? (
          <StartCheck
            onDemo={() => {
              loadDemo();
              setStep("result");
            }}
            onStart={() => setStep("earnings")}
          />
        ) : null}
        {step === "earnings" ? (
          <EarningsStep
            draft={draft}
            error={error}
            onBack={() => setStep("start")}
            onSubmit={submitEarnings}
            update={update}
          />
        ) : null}
        {step === "history" ? (
          <HistoryStep
            draft={draft}
            error={error}
            onBack={() => setStep("earnings")}
            onSubmit={submitHistory}
            update={update}
          />
        ) : null}
        {step === "result" ? (
          <ResultStep
            onContinue={() =>
              dispatch({ type: "SET_STAGE", stage: "interview" })
            }
            onEdit={() => {
              setDraft(applicantCase.eligibilityInput);
              setStep("earnings");
            }}
            result={result}
          />
        ) : null}
      </motion.section>
    </AnimatePresence>
  );
}

function StartCheck({
  onDemo,
  onStart,
}: {
  onDemo: () => void;
  onStart: () => void;
}) {
  return (
    <div className="pt-[clamp(1rem,6vh,5rem)]">
      <p className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
        <span className="size-2 rounded-full bg-primary" />
        Start here
      </p>
      <h1 className="max-w-[13ch] text-[clamp(2.65rem,7vw,5.3rem)] font-bold leading-[0.96] tracking-[-0.055em] text-foreground">
        Check first. Then tell your story once.
      </h1>
      <p className="mt-6 max-w-[37rem] text-lg leading-relaxed text-muted sm:text-xl">
        A two-minute estimate can surface work or earnings details worth
        verifying before the application.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Button className="sm:min-w-52" onClick={onStart}>
          Check where I stand
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
        <Button onClick={onDemo} variant="secondary">
          <Sparkles aria-hidden="true" className="size-4 text-primary" />
          Load Elena’s demo
        </Button>
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-muted">
        <LockKeyhole aria-hidden="true" className="size-4" />
        This session stays in this browser tab.
      </p>
    </div>
  );
}

interface StepProps {
  draft: EligibilityInput;
  error: string | null;
  onBack: () => void;
  onSubmit: (event: FormEvent) => void;
  update: <Key extends keyof EligibilityInput>(
    key: Key,
    value: EligibilityInput[Key],
  ) => void;
}

function EarningsStep({ draft, error, onBack, onSubmit, update }: StepProps) {
  return (
    <form className="pb-24" onSubmit={onSubmit}>
      <StepHeading
        heading="Start with current work"
        onBack={onBack}
        step="1 of 2"
        text="Use an average month. This is a screening estimate, not a decision."
      />

      <div className="mt-9 grid gap-7 rounded-[var(--radius-surface)] border border-border bg-surface p-5 shadow-[0_18px_60px_oklch(0_0_0/0.05)] sm:p-7">
        <Field
          hint={`The ${SSA_RULES_2026.effectiveYear} comparison is $${SSA_RULES_2026.sgaMonthlyNonblindUsd.toLocaleString()} a month for most applicants.`}
          htmlFor="monthly-earnings"
          label="Average monthly work earnings"
        >
          <NumberField
            id="monthly-earnings"
            min="0"
            onChange={(event) =>
              update(
                "monthlyEarningsUsd",
                numberOrNull(event.currentTarget.value),
              )
            }
            prefix="$"
            required
            value={draft.monthlyEarningsUsd ?? ""}
          />
        </Field>

        <YesNoField
          label="Are you statutorily blind?"
          name="statutorily-blind"
          onChange={(value) => update("statutorilyBlind", value)}
          value={draft.statutorilyBlind}
        />

        <Field
          hint="Examples include disability-related transportation, equipment, or attendant care paid by you."
          htmlFor="work-expenses"
          label="Monthly disability-related work expenses"
          optional
        >
          <NumberField
            id="work-expenses"
            min="0"
            onChange={(event) =>
              update(
                "impairmentRelatedWorkExpensesUsd",
                numberOrNull(event.currentTarget.value),
              )
            }
            prefix="$"
            value={draft.impairmentRelatedWorkExpensesUsd ?? ""}
          />
        </Field>

        <YesNoField
          label="Does an employer give you extra help or special conditions?"
          name="employer-support"
          onChange={(value) => update("employerSubsidyPossible", value)}
          value={draft.employerSubsidyPossible}
        />

        <YesNoField
          label="Are you self-employed?"
          name="self-employed"
          onChange={(value) => update("selfEmployed", value)}
          value={draft.selfEmployed}
        />

        {draft.selfEmployed ? (
          <Field
            hint="Use profit after ordinary business expenses, not gross revenue."
            htmlFor="business-profit"
            label="Average monthly business profit"
          >
            <NumberField
              id="business-profit"
              min="0"
              onChange={(event) =>
                update(
                  "selfEmploymentProfitUsd",
                  numberOrNull(event.currentTarget.value),
                )
              }
              prefix="$"
              value={draft.selfEmploymentProfitUsd ?? ""}
            />
          </Field>
        ) : null}

        <YesNoField
          hint="For example, interest or gifts accidentally included in the amount above."
          label="Does that amount include income that is not from your work?"
          name="passive-income"
          onChange={(value) => update("passiveIncomeIncluded", value)}
          value={draft.passiveIncomeIncluded}
        />
      </div>

      <StepFooter error={error} />
    </form>
  );
}

function HistoryStep({ draft, error, onBack, onSubmit, update }: StepProps) {
  return (
    <form className="pb-24" onSubmit={onSubmit}>
      <StepHeading
        heading="Estimate your work credits"
        onBack={onBack}
        step="2 of 2"
        text="If you do not know a credit total, leave it blank. We will tell you exactly what to verify."
      />

      <div className="mt-9 grid gap-7 rounded-[var(--radius-surface)] border border-border bg-surface p-5 shadow-[0_18px_60px_oklch(0_0_0/0.05)] sm:grid-cols-2 sm:p-7">
        <Field htmlFor="date-of-birth" label="Date of birth">
          <input
            className={inputClassName}
            id="date-of-birth"
            onChange={(event) =>
              update("dateOfBirth", event.currentTarget.value)
            }
            required
            type="date"
            value={draft.dateOfBirth ?? ""}
          />
        </Field>
        <Field
          hint="Your best estimate is okay for this check."
          htmlFor="onset-date"
          label="When did your condition start limiting work?"
        >
          <input
            className={inputClassName}
            id="onset-date"
            onChange={(event) =>
              update("allegedOnsetDate", event.currentTarget.value)
            }
            required
            type="date"
            value={draft.allegedOnsetDate ?? ""}
          />
        </Field>
        <Field
          htmlFor="lifetime-credits"
          label="Estimated lifetime credits"
          optional
        >
          <NumberField
            id="lifetime-credits"
            max="40"
            min="0"
            onChange={(event) =>
              update(
                "estimatedLifetimeCredits",
                numberOrNull(event.currentTarget.value),
              )
            }
            value={draft.estimatedLifetimeCredits ?? ""}
          />
        </Field>
        <Field
          htmlFor="recent-credits"
          label="Credits in the last 10 years"
          optional
        >
          <NumberField
            id="recent-credits"
            max="40"
            min="0"
            onChange={(event) =>
              update(
                "creditsLast10Years",
                numberOrNull(event.currentTarget.value),
              )
            }
            value={draft.creditsLast10Years ?? ""}
          />
        </Field>
        <Field
          htmlFor="young-credits"
          label="Credits in the last 3 years"
          optional
        >
          <NumberField
            id="young-credits"
            max="12"
            min="0"
            onChange={(event) =>
              update(
                "creditsLast3Years",
                numberOrNull(event.currentTarget.value),
              )
            }
            value={draft.creditsLast3Years ?? ""}
          />
        </Field>
        <Field
          htmlFor="years-after-21"
          label="Years worked after age 21"
          optional
        >
          <NumberField
            id="years-after-21"
            max="45"
            min="0"
            onChange={(event) =>
              update(
                "workedYearsAfter21BeforeOnset",
                numberOrNull(event.currentTarget.value),
              )
            }
            step="0.5"
            value={draft.workedYearsAfter21BeforeOnset ?? ""}
          />
        </Field>
      </div>

      <StepFooter error={error} />
    </form>
  );
}

function StepHeading({
  heading,
  onBack,
  step,
  text,
}: {
  heading: string;
  onBack: () => void;
  step: string;
  text: string;
}) {
  return (
    <header className="pt-4 sm:pt-8">
      <Button
        aria-label="Go back"
        className="-ml-3 mb-6"
        onClick={onBack}
        size="small"
        variant="quiet"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back
      </Button>
      <p className="text-sm font-bold text-primary">Check · {step}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
        {heading}
      </h1>
      <p className="mt-3 max-w-[38rem] text-lg leading-relaxed text-muted">
        {text}
      </p>
    </header>
  );
}

function StepFooter({ error }: { error: string | null }) {
  return (
    <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div aria-live="polite">
        {error ? (
          <p className="flex items-center gap-2 text-sm font-bold text-danger">
            <CircleAlert aria-hidden="true" className="size-4" />
            {error}
          </p>
        ) : null}
      </div>
      <Button className="w-full sm:w-auto" type="submit">
        Continue
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

function ResultStep({
  onContinue,
  onEdit,
  result,
}: {
  onContinue: () => void;
  onEdit: () => void;
  result: PrequalificationResult;
}) {
  const language = resultLanguage[result.status];

  return (
    <div className="pb-24 pt-4 sm:pt-8">
      <p className="text-sm font-bold text-primary">{language.eyebrow}</p>
      <h1 className="mt-2 max-w-[13ch] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
        {language.heading}
      </h1>
      <p className="mt-4 max-w-[39rem] text-lg leading-relaxed text-muted">
        {language.detail}
      </p>

      <div className="mt-8 overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface shadow-[0_18px_60px_oklch(0_0_0/0.05)]">
        <RuleRow result={result.sga} />
        <RuleRow result={result.durationOfWork} />
        <RuleRow result={result.recentWork} />
      </div>

      <div className="mt-5 flex gap-3 rounded-[var(--radius-control)] bg-accent-soft p-4 text-sm leading-relaxed text-accent">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p>
          This is a planning estimate, not an eligibility decision. SSA verifies
          earnings and insured status from its records.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onContinue}>
          Continue to my story
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
        <Button onClick={onEdit} variant="secondary">
          Edit answers
        </Button>
      </div>
    </div>
  );
}

function RuleRow({ result }: { result: RuleResult }) {
  const Icon = {
    looks_clear: Check,
    needs_review: CircleAlert,
    uncertain: Info,
  }[result.status];

  return (
    <div className="grid grid-cols-[auto_1fr] gap-3 border-b border-border p-5 last:border-b-0 sm:p-6">
      <span
        className={cn(
          "mt-0.5 grid size-8 place-items-center rounded-full",
          result.status === "looks_clear" && "bg-success-soft text-success",
          result.status === "needs_review" && "bg-warning-soft text-warning",
          result.status === "uncertain" && "bg-accent-soft text-accent",
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div>
        <h2 className="font-bold">{result.title}</h2>
        <p className="mt-1 leading-relaxed text-muted">{result.reason}</p>
      </div>
    </div>
  );
}

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
