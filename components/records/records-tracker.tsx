"use client";

import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Copy,
  FileSignature,
  FolderCheck,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { useApplicantCase } from "@/components/app/case-context";
import { Button } from "@/components/ui/button";
import { TRACKER_CONFIG } from "@/lib/rules/config";
import { authorizationWarningDue } from "@/lib/rules/deadlines";
import {
  buildTrackerItems,
  trackerToday,
  type TrackerItem,
} from "@/lib/rules/tracker";
import { cn } from "@/lib/utils";

export function RecordsTracker() {
  const { applicantCase, dispatch } = useApplicantCase();
  const today = trackerToday(applicantCase);
  const items = useMemo(
    () => buildTrackerItems(applicantCase, today),
    [applicantCase, today],
  );
  const authorizationDue = authorizationWarningDue(
    applicantCase.authorization.signedAt,
    today,
    TRACKER_CONFIG,
  );
  const nextAction = items.find(
    (item) =>
      item.action.state === "day_30" || item.action.state === "day_20",
  );
  const received = items.filter(
    (item) => item.action.state === "responded",
  ).length;

  function markReceived(item: TrackerItem) {
    dispatch({
      type: "SET_RECORD_REQUEST",
      request: {
        ...item.request,
        respondedAt: today,
        status: "responded",
      },
    });
  }

  return (
    <div className="mx-auto w-full max-w-[72rem] pb-24 pt-3 sm:pt-7">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-primary">Records · Next actions</p>
          <h1 className="mt-2 max-w-[15ch] text-4xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
            Keep the evidence moving.
          </h1>
        </div>
        <p className="text-sm font-bold text-muted">
          {received} of {items.length} received
        </p>
      </header>

      {authorizationDue ? (
        <section className="mt-7 flex flex-col gap-4 rounded-[var(--radius-surface)] border border-warning/25 bg-warning-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <FileSignature
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-warning"
            />
            <div>
              <h2 className="font-bold">Your SSA-827 is almost 12 months old</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Generate a fresh blank-signature authorization before relying
                on it.
              </p>
            </div>
          </div>
          <Button
            className="shrink-0"
            onClick={() => dispatch({ type: "SET_STAGE", stage: "packet" })}
            size="small"
            variant="secondary"
          >
            Get a fresh SSA-827
          </Button>
        </section>
      ) : null}

      {nextAction ? <NextAction item={nextAction} /> : null}

      <section className="mt-6 overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface shadow-[0_18px_60px_oklch(0_0_0/0.045)]">
        <header className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="font-bold">All medical sources</h2>
        </header>
        <div className="divide-y divide-border">
          {items.map((item) => (
            <RecordRow
              item={item}
              key={item.request.id}
              onMarkReceived={() => markReceived(item)}
            />
          ))}
        </div>
      </section>

      <footer className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[42rem] text-sm leading-relaxed text-muted">
          V1 never calls a provider. These steps and scripts are for the
          applicant to use.
        </p>
        <Button
          onClick={() => dispatch({ type: "SET_STAGE", stage: "packet" })}
          variant="quiet"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to packet
        </Button>
      </footer>
    </div>
  );
}

function NextAction({ item }: { item: TrackerItem }) {
  const urgent = item.action.state === "day_30";
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="mt-7 grid overflow-hidden rounded-[var(--radius-surface)] border border-border bg-surface shadow-[0_22px_70px_oklch(0_0_0/0.055)] lg:grid-cols-[minmax(0,1fr)_17rem]"
      initial={{ opacity: 0, y: 6 }}
    >
      <div className="p-5 sm:p-7">
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-bold",
            urgent ? "text-danger" : "text-warning",
          )}
        >
          {urgent ? (
            <ShieldAlert aria-hidden="true" className="size-4" />
          ) : (
            <Clock3 aria-hidden="true" className="size-4" />
          )}
          {urgent ? "Deadline passed" : "Follow up now"}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em]">
          {item.request.providerDisplayName}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {item.request.portalAvailable
            ? "Check the patient portal first. If the records are not there, call."
            : "No patient portal is listed. Call the records office with the script ready."}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-5 py-2.5 font-bold text-white shadow-[0_8px_24px_oklch(0.46_0.145_356.8/0.16)] transition-colors hover:bg-primary-hover"
            href={`tel:${item.request.providerPhone.replace(/\D/g, "")}`}
          >
            <Phone aria-hidden="true" className="size-4" />
            {item.request.providerPhone}
          </a>
          <CopyScript script={item.action.script ?? ""} />
        </div>
      </div>
      <div className="border-t border-border bg-surface-subtle/75 p-5 lg:border-l lg:border-t-0 lg:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
          Request clock
        </p>
        <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">
          Day {item.action.daysSinceRequest}
        </p>
        <p className="mt-1 text-sm text-muted">
          Due {formatDate(item.action.deadline)}
        </p>
        {urgent && item.action.escalationOptions ? (
          <ul className="mt-5 grid gap-2 text-xs leading-relaxed text-muted">
            {item.action.escalationOptions.map((option) => (
              <li className="flex gap-2" key={option}>
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0"
                />
                {option}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </motion.section>
  );
}

function RecordRow({
  item,
  onMarkReceived,
}: {
  item: TrackerItem;
  onMarkReceived: () => void;
}) {
  const [open, setOpen] = useState(false);
  const received = item.action.state === "responded";
  const urgent = item.action.state === "day_30";
  const followUp = item.action.state === "day_20";

  return (
    <article>
      <button
        aria-expanded={open}
        className="grid min-h-[5.4rem] w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left hover:bg-surface-subtle/55 sm:grid-cols-[auto_minmax(0,1fr)_9rem_8rem_auto] sm:px-6"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span
          className={cn(
            "grid size-9 place-items-center rounded-full bg-surface-subtle text-muted",
            received && "bg-success-soft text-success",
            followUp && "bg-warning-soft text-warning",
            urgent && "bg-danger-soft text-danger",
          )}
        >
          {received ? (
            <FolderCheck aria-hidden="true" className="size-4" />
          ) : (
            <Building2 aria-hidden="true" className="size-4" />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-bold">
            {item.request.providerDisplayName}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted">
            {item.request.portalAvailable
              ? "Patient portal available"
              : "No portal listed"}
          </p>
        </div>
        <p className="hidden text-sm text-muted sm:block">
          {item.request.requestedAt
            ? `Sent ${formatDate(item.request.requestedAt)}`
            : "Not sent"}
        </p>
        <StatusLabel state={item.action.state} />
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="border-t border-border bg-surface-subtle/45 px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <SmallFact label="Requested" value={item.request.requestedAt} />
            <SmallFact label="Deadline" value={item.action.deadline} />
            <SmallFact
              label="Received"
              value={item.request.respondedAt ?? "Not yet"}
            />
          </div>
          {!received ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Update this session when the records arrive.
              </p>
              <Button onClick={onMarkReceived} size="small" variant="secondary">
                <Check aria-hidden="true" className="size-4" />
                Mark received
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function CopyScript({ script }: { script: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button onClick={copy} variant="secondary">
      {copied ? (
        <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
      {copied ? "Copied" : "Copy my script"}
    </Button>
  );
}

function StatusLabel({ state }: { state: TrackerItem["action"]["state"] }) {
  const copy = {
    responded: "Received",
    day_30: "Overdue",
    day_20: "Follow up",
    wait: "Waiting",
    portal_first: "Not requested",
  }[state];
  return (
    <span
      className={cn(
        "hidden text-sm font-bold sm:block",
        state === "responded" && "text-success",
        state === "day_20" && "text-warning",
        state === "day_30" && "text-danger",
        (state === "wait" || state === "portal_first") && "text-muted",
      )}
    >
      {copy}
    </span>
  );
}

function SmallFact({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">{formatDate(value)}</p>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value || value === "Not yet") return value ?? "Not set";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
