"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Keyboard,
  Mic,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useApplicantCase } from "@/components/app/case-context";
import { Button } from "@/components/ui/button";
import Orb from "@/components/visual/orb";
import { applyInterviewExtraction } from "@/lib/extraction/apply";
import { DEMO_EXTRACTION, DEMO_TRANSCRIPT } from "@/lib/extraction/demo";
import type { InterviewExtraction } from "@/lib/extraction/schema";
import type { InterviewTurn } from "@/lib/case/types";
import { cn } from "@/lib/utils";

type InputMode = "voice" | "typed";
type InterviewStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "transcribing"
  | "extracting"
  | "ready"
  | "error";

const PROMPT =
  "How do your health problems affect your work—and who has treated you?";

const factLabels: Record<string, string> = {
  "condition.name": "Condition",
  "condition.symptom": "Symptom",
  "condition.workEffect": "Work effect",
  "provider.name": "Provider",
  "provider.facility": "Facility",
  "provider.specialty": "Specialty",
  "medication.name": "Medication",
  "medication.dosage": "Dose",
  "medication.frequency": "Frequency",
  "medication.sideEffect": "Side effect",
  "job.employer": "Employer",
  "job.title": "Last job",
  "job.reasonEnded": "Why work ended",
};

export function InterviewFlow() {
  const { applicantCase, dispatch } = useApplicantCase();
  const [mode, setMode] = useState<InputMode>("voice");
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [transcript, setTranscript] = useState("");
  const [extraction, setExtraction] = useState<InterviewExtraction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorder = useAudioRecorder();

  const statusCopy = {
    idle: "Ready when you are",
    requesting: "Waiting for microphone",
    recording: "Listening",
    transcribing: "Turning speech into text",
    extracting: "Finding facts for your review",
    ready: "Captured for review",
    error: "Needs your attention",
  }[status];

  useEffect(() => {
    if (mode === "typed") textareaRef.current?.focus();
  }, [mode]);

  async function beginVoice() {
    setError(null);
    setStatus("requesting");
    try {
      await recorder.start();
      setStatus("recording");
    } catch {
      setError("Microphone access did not work. Type your answer instead.");
      setMode("typed");
      setStatus("error");
    }
  }

  async function finishVoice() {
    setStatus("transcribing");
    try {
      const nextTranscript = await recorder.stopAndTranscribe();
      await submitTranscript(nextTranscript, "voice");
    } catch (voiceError) {
      setError(
        voiceError instanceof Error
          ? voiceError.message
          : "Voice transcription failed. Type your answer instead.",
      );
      setMode("typed");
      setStatus("error");
    }
  }

  async function submitTranscript(
    nextTranscript: string,
    source: InterviewTurn["source"],
  ) {
    const cleanTranscript = nextTranscript.trim();
    if (!cleanTranscript) {
      setError("Add an answer before continuing.");
      setStatus("error");
      return;
    }

    const turnId =
      source === "demo" ? "demo-interview-turn" : `turn-${crypto.randomUUID()}`;
    setTranscript(cleanTranscript);
    setStatus("extracting");
    setError(null);
    dispatch({
      type: "ADD_INTERVIEW_TURN",
      turn: {
        id: turnId,
        prompt: PROMPT,
        transcript: cleanTranscript,
        source,
        status: "extracting",
        createdAt: new Date().toISOString(),
      },
    });

    try {
      const nextExtraction =
        source === "demo"
          ? await demoExtraction()
          : await requestExtraction(turnId, cleanTranscript);
      setExtraction(nextExtraction);
      if (applicantCase.mode !== "synthetic_demo") {
        applyInterviewExtraction(dispatch, nextExtraction, turnId);
      }
      dispatch({
        type: "UPDATE_INTERVIEW_TURN",
        turnId,
        patch: { status: "extracted" },
      });
      setStatus("ready");
    } catch (extractionError) {
      dispatch({
        type: "UPDATE_INTERVIEW_TURN",
        turnId,
        patch: { status: "failed" },
      });
      setError(
        extractionError instanceof Error
          ? extractionError.message
          : "We kept your transcript. Retry or review it manually.",
      );
      setStatus("error");
    }
  }

  function speakPrompt() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(PROMPT);
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  const hasResult = status === "ready" && extraction;

  return (
    <div className="mx-auto grid w-full max-w-[76rem] gap-8 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-12">
      <section className="min-w-0 pb-20">
        <header className="pt-3 sm:pt-7">
          <p className="text-sm font-bold text-primary">
            Interview · Your story
          </p>
          <h1 className="mt-3 max-w-[18ch] text-4xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
            {PROMPT}
          </h1>
          <Button
            className="-ml-3 mt-3"
            onClick={speakPrompt}
            size="small"
            variant="quiet"
          >
            <Volume2 aria-hidden="true" className="size-4" />
            Hear the question
          </Button>
        </header>

        <div className="mt-4 grid gap-5 rounded-[var(--radius-surface)] border border-border bg-surface p-4 shadow-[0_20px_70px_oklch(0_0_0/0.055)] sm:p-6">
          <div
            aria-label="Choose how to answer"
            className="grid grid-cols-2 rounded-[var(--radius-control)] bg-surface-subtle p-1"
            role="group"
          >
            <ModeButton
              active={mode === "voice"}
              icon={Mic}
              label="Speak"
              onClick={() => setMode("voice")}
            />
            <ModeButton
              active={mode === "typed"}
              icon={Keyboard}
              label="Type"
              onClick={() => setMode("typed")}
            />
          </div>

          {mode === "voice" ? (
            <div className="grid place-items-center py-2 text-center">
              <div className="relative size-48 sm:size-64">
                <div
                  className={cn(
                    "absolute inset-[12%] rounded-full bg-primary/15 transition-transform duration-500",
                    status === "recording" && "scale-110",
                  )}
                />
                <Orb
                  backgroundColor="#000000"
                  forceHoverState={
                    status === "recording" ||
                    status === "transcribing" ||
                    status === "extracting"
                  }
                  hoverIntensity={status === "recording" ? 0.55 : 0.2}
                  hue={
                    status === "ready"
                      ? 110
                      : status === "transcribing" || status === "extracting"
                        ? 205
                        : 330
                  }
                  rotateOnHover
                />
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  {status === "recording" ? (
                    <span className="grid size-14 place-items-center rounded-full bg-surface text-primary shadow-lg">
                      <Pause aria-hidden="true" className="size-5" />
                    </span>
                  ) : null}
                </span>
              </div>

              <p
                aria-live="polite"
                className="mt-1 flex items-center gap-2 font-bold"
              >
                <span
                  className={cn(
                    "size-2 rounded-full bg-muted",
                    status === "recording" && "animate-pulse bg-primary",
                    status === "ready" && "bg-success",
                  )}
                />
                {statusCopy}
              </p>

              {status !== "ready" ||
              extraction?.providerListStatus !== "complete" ? (
                <div className="mt-5 grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
                  {status === "recording" ? (
                    <Button className="px-3" onClick={finishVoice}>
                      <Pause aria-hidden="true" className="size-4" />
                      Stop recording
                    </Button>
                  ) : (
                    <Button
                      className="px-3"
                      disabled={[
                        "requesting",
                        "transcribing",
                        "extracting",
                      ].includes(status)}
                      onClick={beginVoice}
                    >
                      <Mic aria-hidden="true" className="size-4" />
                      Record answer
                    </Button>
                  )}
                  <Button
                    className="px-3"
                    disabled={status === "extracting"}
                    onClick={() => submitTranscript(DEMO_TRANSCRIPT, "demo")}
                    variant="secondary"
                  >
                    <Sparkles
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                    Demo answer
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <label className="sr-only" htmlFor="typed-interview-answer">
                Your answer
              </label>
              <textarea
                className="min-h-52 w-full resize-y rounded-[var(--radius-control)] border border-border bg-background p-4 text-lg leading-relaxed placeholder:text-muted/65 focus:border-focus"
                id="typed-interview-answer"
                onChange={(event) => setTypedAnswer(event.currentTarget.value)}
                placeholder="Tell us what happens on a difficult workday, then name every doctor, clinic, or hospital that has treated you."
                ref={textareaRef}
                value={typedAnswer}
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  disabled={status === "extracting"}
                  onClick={() => submitTranscript(DEMO_TRANSCRIPT, "demo")}
                  variant="secondary"
                >
                  <Sparkles
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                  Use demo answer
                </Button>
                <Button
                  disabled={status === "extracting"}
                  onClick={() => submitTranscript(typedAnswer, "typed")}
                >
                  Find reviewable facts
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {error ? (
            <div
              aria-live="assertive"
              className="flex flex-col gap-3 rounded-[var(--radius-control)] bg-danger-soft p-4 text-danger sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-bold">{error}</p>
              {transcript ? (
                <Button
                  onClick={() => submitTranscript(transcript, "typed")}
                  size="small"
                  variant="secondary"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {transcript ? (
          <details
            className="group mt-5 rounded-[var(--radius-control)] border border-border bg-surface"
            open={status === "error"}
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-bold">
              Transcript
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="border-t border-border px-4 py-4 leading-relaxed text-muted">
              {transcript}
            </p>
          </details>
        ) : null}

        {hasResult ? (
          <div className="mt-6 flex flex-col gap-3 rounded-[var(--radius-control)] bg-success-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-bold text-success">
              <Check aria-hidden="true" className="size-5" />
              Your transcript is safe to review.
            </p>
            <Button
              onClick={() => dispatch({ type: "SET_STAGE", stage: "review" })}
            >
              Review captured facts
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ) : null}
      </section>

      <FactsPanel extraction={extraction} status={status} />
    </div>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Mic;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg font-bold transition-colors",
        active
          ? "bg-surface text-primary shadow-[0_1px_3px_oklch(0_0_0/0.09)]"
          : "text-muted hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}

function FactsPanel({
  extraction,
  status,
}: {
  extraction: InterviewExtraction | null;
  status: InterviewStatus;
}) {
  const visibleFacts = useMemo(
    () =>
      extraction?.facts.filter((fact) => factLabels[fact.field]).slice(0, 12) ??
      [],
    [extraction],
  );

  return (
    <>
      <aside
        aria-label="Facts captured from this answer"
        className="hidden min-w-0 xl:sticky xl:top-20 xl:block xl:h-[calc(100dvh-6rem)] xl:border-l xl:border-border xl:pl-7 xl:pt-3"
      >
        <FactsContent
          extraction={extraction}
          status={status}
          visibleFacts={visibleFacts}
        />
      </aside>

      <details className="group mb-28 rounded-[var(--radius-control)] border border-border bg-surface xl:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-bold">
          <span>
            Captured facts
            <span className="ml-2 text-xs text-muted">
              {visibleFacts.length || "—"}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="border-t border-border p-4">
          <FactsContent
            extraction={extraction}
            hideHeading
            status={status}
            visibleFacts={visibleFacts}
          />
        </div>
      </details>
    </>
  );
}

function FactsContent({
  extraction,
  hideHeading = false,
  status,
  visibleFacts,
}: {
  extraction: InterviewExtraction | null;
  hideHeading?: boolean;
  status: InterviewStatus;
  visibleFacts: InterviewExtraction["facts"];
}) {
  return (
    <>
      {!hideHeading ? (
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Captured facts</h2>
          <span className="text-xs font-bold text-muted">
            {visibleFacts.length || "—"}
          </span>
        </div>
      ) : null}

      {status === "extracting" ? (
        <div className="mt-5 grid gap-2" aria-label="Extracting facts">
          {[0, 1, 2, 3].map((item) => (
            <motion.div
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              className="h-14 rounded-[var(--radius-control)] bg-surface-subtle"
              key={item}
              transition={{
                duration: 1.2,
                delay: item * 0.08,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      ) : null}

      {status !== "extracting" && visibleFacts.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Facts appear here after your answer. Nothing reaches a form until you
          review it.
        </p>
      ) : null}

      <AnimatePresence>
        {visibleFacts.length ? (
          <motion.ul
            animate={{ opacity: 1 }}
            className="mt-4 grid gap-2"
            initial={{ opacity: 0 }}
          >
            {visibleFacts.map((fact, index) => (
              <motion.li
                animate={{ opacity: 1, x: 0 }}
                className="rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-3"
                initial={{ opacity: 0, x: 12 }}
                key={`${fact.entityKey}-${fact.field}-${index}`}
                transition={{ delay: Math.min(index * 0.055, 0.5) }}
              >
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-primary">
                  {factLabels[fact.field]}
                </p>
                <p className="mt-1 font-bold leading-snug">{fact.value}</p>
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      {extraction?.providerListStatus === "complete" ? (
        <p className="mt-4 flex items-center gap-2 text-sm font-bold text-success">
          <Check aria-hidden="true" className="size-4" />
          Provider list marked complete
        </p>
      ) : null}
    </>
  );
}

function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      throw new Error("Voice recording is not supported in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
      (candidate) => MediaRecorder.isTypeSupported(candidate),
    );
    const mediaRecorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    chunksRef.current = [];
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    });
    recorderRef.current = mediaRecorder;
    mediaRecorder.start(250);
  }

  async function stopAndTranscribe(): Promise<string> {
    const mediaRecorder = recorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      throw new Error("No active recording was found.");
    }
    const blob = await new Promise<Blob>((resolve) => {
      mediaRecorder.addEventListener(
        "stop",
        () =>
          resolve(
            new Blob(chunksRef.current, {
              type: mediaRecorder.mimeType || "audio/webm",
            }),
          ),
        { once: true },
      );
      mediaRecorder.stop();
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;

    const form = new FormData();
    form.append("audio", blob, "answer.webm");
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: form,
    });
    const body = (await response.json()) as {
      transcript?: string;
      error?: string;
    };
    if (!response.ok || !body.transcript) {
      throw new Error(
        body.error || "Voice transcription failed. Type your answer instead.",
      );
    }
    return body.transcript;
  }

  return { start, stopAndTranscribe };
}

async function requestExtraction(
  turnId: string,
  transcript: string,
): Promise<InterviewExtraction> {
  const response = await fetch("/api/interview/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turnId, transcript }),
  });
  const body = (await response.json()) as {
    extraction?: InterviewExtraction;
    error?: string;
  };
  if (!response.ok || !body.extraction) {
    throw new Error(
      body.error ||
        "We kept your transcript. Retry extraction or review it manually.",
    );
  }
  return body.extraction;
}

function demoExtraction(): Promise<InterviewExtraction> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(DEMO_EXTRACTION), 900);
  });
}
