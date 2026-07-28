"use client";

import {
  ClipboardCheck,
  FileStack,
  FolderClock,
  LockKeyhole,
  MessageCircleMore,
  SearchCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

import { BrandMark } from "@/components/app/brand-mark";
import { useApplicantCase } from "@/components/app/case-context";
import { CheckFlow } from "@/components/check/check-flow";
import { InterviewFlow } from "@/components/interview/interview-flow";
import { PacketFlow } from "@/components/packet/packet-flow";
import { ReviewFlow } from "@/components/review/review-flow";
import type { ApplicantCase } from "@/lib/case/types";
import { cn } from "@/lib/utils";

type Stage = ApplicantCase["stage"];

interface StageItem {
  id: Stage;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

const stages: StageItem[] = [
  { id: "check", label: "Check", shortLabel: "Check", icon: SearchCheck },
  {
    id: "interview",
    label: "Interview",
    shortLabel: "Interview",
    icon: MessageCircleMore,
  },
  {
    id: "review",
    label: "Review",
    shortLabel: "Review",
    icon: ClipboardCheck,
  },
  { id: "packet", label: "Packet", shortLabel: "Packet", icon: FileStack },
  {
    id: "records",
    label: "Records",
    shortLabel: "Records",
    icon: FolderClock,
  },
];

const mobileStages = stages.filter((stage) => stage.id !== "review");

export function Workspace() {
  const { applicantCase, dispatch } = useApplicantCase();
  const activeIndex = stages.findIndex(
    (stage) => stage.id === applicantCase.stage,
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [applicantCase.stage]);

  function navigate(stage: Stage) {
    const destinationIndex = stages.findIndex((item) => item.id === stage);
    if (destinationIndex <= activeIndex) {
      dispatch({ type: "SET_STAGE", stage });
    }
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-border bg-surface lg:flex lg:min-h-dvh lg:flex-col lg:p-5">
        <div className="flex items-center gap-3 px-2 py-1">
          <BrandMark />
          <div>
            <p className="font-bold leading-none">SSDI Assistant</p>
            <p className="mt-1 text-xs text-muted">Application workspace</p>
          </div>
        </div>

        <nav aria-label="Application stages" className="mt-12">
          <ol className="grid gap-1.5">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const active = applicantCase.stage === stage.id;
              const reachable = index <= activeIndex;
              const complete = index < activeIndex;
              return (
                <li key={stage.id}>
                  <button
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-left font-bold transition-colors",
                      active && "bg-primary-soft text-primary",
                      !active &&
                        reachable &&
                        "cursor-pointer text-foreground hover:bg-surface-subtle",
                      !reachable && "cursor-not-allowed text-muted/55",
                    )}
                    disabled={!reachable}
                    onClick={() => navigate(stage.id)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-lg",
                        complete && "bg-success-soft text-success",
                        active && "bg-surface text-primary",
                      )}
                    >
                      {complete ? (
                        <ShieldCheck aria-hidden="true" className="size-4" />
                      ) : (
                        <Icon aria-hidden="true" className="size-4" />
                      )}
                    </span>
                    <span>{stage.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-auto rounded-[var(--radius-control)] bg-surface-subtle p-3.5">
          <p className="flex items-center gap-2 text-sm font-bold">
            <LockKeyhole aria-hidden="true" className="size-4 text-primary" />
            Private session
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Nothing is saved when this tab closes.
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <BrandMark />
            <p className="font-bold">SSDI Assistant</p>
          </div>
          <p className="hidden text-sm text-muted lg:block">
            {applicantCase.mode === "synthetic_demo"
              ? "Demo case · Elena Rivera"
              : "Current session"}
          </p>
          <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            Not saved
          </p>
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-8 lg:px-12 lg:pb-12">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={applicantCase.stage}
              transition={{ duration: 0.16 }}
            >
              {applicantCase.stage === "check" ? <CheckFlow /> : null}
              {applicantCase.stage === "interview" ? <InterviewFlow /> : null}
              {applicantCase.stage === "review" ? <ReviewFlow /> : null}
              {applicantCase.stage === "packet" ? <PacketFlow /> : null}
              {applicantCase.stage === "records" ? (
                <StagePlaceholder stage="records" />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav
        aria-label="Application stages"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/97 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden"
      >
        <ol className="grid grid-cols-4">
          {mobileStages.map((stage) => {
            const Icon = stage.icon;
            const stageIndex = stages.findIndex((item) => item.id === stage.id);
            const active =
              applicantCase.stage === stage.id ||
              (applicantCase.stage === "review" && stage.id === "interview");
            const reachable = stageIndex <= activeIndex;
            return (
              <li key={stage.id}>
                <button
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg text-[0.6875rem] font-bold",
                    active ? "text-primary" : "text-muted",
                    !reachable && "opacity-45",
                  )}
                  disabled={!reachable}
                  onClick={() => navigate(stage.id)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {stage.shortLabel}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

function StagePlaceholder({ stage }: { stage: Exclude<Stage, "check"> }) {
  const copy = {
    interview: {
      title: "Tell your story",
      text: "Speak naturally or type. Your answers will become reviewable facts before any document is created.",
    },
    review: {
      title: "Review what was captured",
      text: "Confirm important dates, providers, medications, and work details in one place.",
    },
    packet: {
      title: "Build the packet",
      text: "One confirmed case will supply every form and continuation page.",
    },
    records: {
      title: "Keep records moving",
      text: "See the next useful action for every medical-record request.",
    },
  }[stage];

  return (
    <section className="mx-auto max-w-[46rem] pt-[clamp(2rem,10vh,7rem)]">
      <p className="text-sm font-bold text-primary">Next stage</p>
      <h1 className="mt-2 max-w-[13ch] text-5xl font-bold tracking-[-0.045em]">
        {copy.title}
      </h1>
      <p className="mt-5 max-w-[36rem] text-lg leading-relaxed text-muted">
        {copy.text}
      </p>
    </section>
  );
}
