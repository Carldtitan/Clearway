"use client";

import {
  Check,
  ChevronDown,
  ExternalLink,
  FileSearch,
  FolderOpen,
  Image as ImageIcon,
  LoaderCircle,
  Mic,
  MonitorCheck,
  Search,
  Unplug,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useVoiceTurn } from "@/components/voice/use-voice-turn";
import type { SupportedLocale } from "@/lib/case/types";
import {
  requestComputerTurn,
  serializeToolResult,
} from "@/lib/computer/client";
import type {
  ActivityEvent,
  CandidateFile,
  ComputerEnvironment,
  ComputerToolResult,
} from "@/lib/computer/schema";
import { cn } from "@/lib/utils";

const MAX_ACTIONS = 8;
const MAX_RUN_MS = 60_000;

export function ComputerAssistant({ locale }: { locale: SupportedLocale }) {
  const voice = useVoiceTurn(locale);
  const [open, setOpen] = useState(false);
  const [environment, setEnvironment] = useState<ComputerEnvironment | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [candidates, setCandidates] = useState<CandidateFile[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [request, setRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speechQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);

  const connected = Boolean(environment);
  const roots = environment?.roots ?? [];

  useEffect(() => {
    mountedRef.current = true;
    if (!window.clearwayDesktop) return;
    void window.clearwayDesktop
      .getEnvironment()
      .then((value) => mountedRef.current && setEnvironment(value))
      .catch(() => mountedRef.current && setEnvironment(null));
    const unsubscribe = window.clearwayDesktop.onActivity((event) => {
      if (!mountedRef.current) return;
      setActivities((current) => [...current.slice(-19), event]);
      if (event.speak) queueSpeech(event.message);
    });
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
    // Native subscription is established once for this mounted control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function queueSpeech(text: string) {
    speechQueueRef.current = speechQueueRef.current
      .catch(() => undefined)
      .then(() => voice.speak(text))
      .catch(() => undefined);
  }

  function addAssistantActivity(
    phase: ActivityEvent["phase"],
    message: string,
    speak = true,
  ) {
    const activity: ActivityEvent = {
      id: crypto.randomUUID(),
      phase,
      message,
      speak,
      createdAt: new Date().toISOString(),
    };
    setActivities((current) => [...current.slice(-19), activity]);
    if (speak) queueSpeech(message);
  }

  async function chooseFolders() {
    if (!window.clearwayDesktop) return;
    setError(null);
    try {
      await window.clearwayDesktop.chooseRoots();
      setEnvironment(await window.clearwayDesktop.getEnvironment());
    } catch (selectionError) {
      setError(errorMessage(selectionError, "Clearway could not approve those folders."));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await runRequest(request);
  }

  async function captureVoiceRequest() {
    setError(null);
    try {
      await voice.activate();
      const transcript = await voice.ask(voiceRequestPrompt(locale));
      setRequest(transcript);
      await runRequest(transcript);
    } catch (captureError) {
      setError(errorMessage(captureError, "I could not hear the request. Type it instead."));
    }
  }

  async function runRequest(rawRequest: string) {
    const desktop = window.clearwayDesktop;
    const userRequest = rawRequest.trim();
    if (!desktop || !environment) {
      setError("Open this page in Clearway Desktop to search local files.");
      return;
    }
    if (!roots.length) {
      setError("Choose the folders Clearway may search first.");
      return;
    }
    if (!userRequest || busy) return;

    setBusy(true);
    setError(null);
    setCandidates([]);
    setPreviews({});
    addAssistantActivity("started", `You asked: “${userRequest}”`, false);
    const startedAt = Date.now();
    const history: Array<{ role: "assistant" | "user"; content: string }> = [
      { role: "user", content: userRequest },
    ];
    let toolResult: string | null = null;
    const discovered = new Map<string, CandidateFile>();

    try {
      for (let step = 0; step < MAX_ACTIONS; step += 1) {
        if (Date.now() - startedAt >= MAX_RUN_MS) {
          throw new Error("The search reached its one-minute safety limit.");
        }
        const plan = await requestComputerTurn({
          request: userRequest,
          locale,
          environment,
          history: history.slice(-12),
          toolResult,
        });
        history.push({
          role: "assistant",
          content: `${plan.narration}\nState: ${plan.state}${plan.action ? `\nAction: ${JSON.stringify(plan.action)}` : ""}`,
        });

        if (plan.state !== "act" || !plan.action) {
          const selected = plan.candidateIds.length
            ? plan.candidateIds
                .map((id) => discovered.get(id))
                .filter((candidate): candidate is CandidateFile => Boolean(candidate))
            : [...discovered.values()];
          setCandidates(selected);
          addAssistantActivity(
            plan.state === "error" ? "failed" : "completed",
            plan.narration,
            true,
          );
          return;
        }

        const result = await desktop.executeTool(plan.action);
        collectCandidates(result, discovered);
        toolResult = serializeToolResult(result);
        history.push({ role: "user", content: `Native result: ${toolResult}` });
      }
      throw new Error("Clearway stopped after eight computer actions.");
    } catch (runError) {
      const message = errorMessage(runError, "Clearway could not complete that computer request.");
      setError(message);
      addAssistantActivity("failed", message, true);
      setCandidates([...discovered.values()]);
    } finally {
      setBusy(false);
    }
  }

  async function preview(candidate: CandidateFile) {
    if (!window.clearwayDesktop) return;
    setError(null);
    try {
      const result = await window.clearwayDesktop.executeTool({
        tool: "preview_candidate",
        args: { candidateId: candidate.id },
      });
      if (typeof result.previewDataUrl === "string") {
        setPreviews((current) => ({
          ...current,
          [candidate.id]: result.previewDataUrl as string,
        }));
      } else if (result.message) {
        setError(result.message);
      }
    } catch (previewError) {
      setError(errorMessage(previewError, "Clearway could not preview that file."));
    }
  }

  async function openCandidate(candidate: CandidateFile) {
    if (!window.clearwayDesktop) return;
    setError(null);
    try {
      await window.clearwayDesktop.executeTool({
        tool: "open_candidate",
        args: { candidateId: candidate.id },
      });
    } catch (openError) {
      setError(errorMessage(openError, "Windows could not open that file."));
    }
  }

  function toggleLinked(candidateId: string) {
    setLinked((current) => {
      const next = new Set(current);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  }

  return (
    <div className="fixed bottom-[5.25rem] right-3 z-50 lg:bottom-6 lg:right-6">
      {open ? (
        <section
          aria-label="Clearway computer assistant"
          className="flex max-h-[min(46rem,calc(100dvh-7rem))] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[var(--radius-surface)] bg-surface shadow-[0_18px_60px_oklch(0_0_0/0.2)] sm:w-[27rem] lg:max-h-[calc(100dvh-3rem)]"
        >
          <header className="flex items-start justify-between gap-4 bg-accent px-5 py-4 text-white">
            <div>
              <p className="flex items-center gap-2 font-bold">
                {connected ? (
                  <MonitorCheck aria-hidden="true" className="size-5" />
                ) : (
                  <Unplug aria-hidden="true" className="size-5" />
                )}
                Computer assistant
              </p>
              <p className="mt-1 text-sm text-white/80">
                {connected
                  ? roots.length
                    ? `${roots.length} approved ${roots.length === 1 ? "folder" : "folders"}`
                    : "Connected · choose folders to begin"
                  : "Available in Clearway Desktop"}
              </p>
            </div>
            <button
              aria-label="Close computer assistant"
              className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>

          <div className="overflow-y-auto p-4 sm:p-5">
            {!connected ? (
              <p className="rounded-[var(--radius-control)] bg-accent-soft p-4 text-sm leading-relaxed text-accent">
                The normal web app cannot inspect your computer. Open the same
                Clearway site inside Clearway Desktop for local, permission-based
                search.
              </p>
            ) : (
              <>
                <Button
                  className="w-full justify-start"
                  onClick={() => void chooseFolders()}
                  variant="secondary"
                >
                  <FolderOpen aria-hidden="true" className="size-4" />
                  {roots.length ? "Change approved folders" : "Choose folders to search"}
                </Button>
                {roots.length ? (
                  <p className="mt-2 truncate text-xs text-muted" title={roots.map((root) => root.displayPath).join(" · ")}>
                    {roots.map((root) => root.name).join(" · ")}
                  </p>
                ) : null}

                <form className="mt-5" onSubmit={submit}>
                  <label className="text-sm font-bold" htmlFor="computer-request">
                    What should Clearway find?
                  </label>
                  <div className="mt-2 flex items-stretch gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-border bg-background px-3.5 text-base text-foreground placeholder:text-muted/75 focus:border-focus"
                      disabled={busy || !roots.length}
                      id="computer-request"
                      onChange={(event) => setRequest(event.currentTarget.value)}
                      placeholder="Find my driver's license"
                      value={request}
                    />
                    <Button
                      aria-label="Speak computer request"
                      disabled={busy || !roots.length}
                      onClick={() => void captureVoiceRequest()}
                      size="icon"
                      type="button"
                      variant="secondary"
                    >
                      <Mic aria-hidden="true" className="size-5" />
                    </Button>
                    <Button
                      aria-label="Run computer request"
                      disabled={busy || !request.trim() || !roots.length}
                      size="icon"
                      type="submit"
                    >
                      {busy ? (
                        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                      ) : (
                        <Search aria-hidden="true" className="size-5" />
                      )}
                    </Button>
                  </div>
                </form>

                {activities.length ? (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-sm font-bold">What Clearway is doing</p>
                    <ol aria-live="polite" className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                      {activities.slice(-6).map((activity) => (
                        <li className="flex gap-2.5 text-sm leading-relaxed" key={activity.id}>
                          <ActivityMark phase={activity.phase} />
                          <span className={activity.phase === "failed" ? "text-danger" : "text-muted"}>
                            {activity.message}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {candidates.length ? (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="font-bold">Files found</p>
                    <ul className="mt-3 divide-y divide-border">
                      {candidates.map((candidate) => (
                        <li className="py-4 first:pt-0" key={candidate.id}>
                          <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-primary-soft text-primary">
                              {candidate.extension.match(/png|jpe?g|webp|bmp/) ? (
                                <ImageIcon aria-hidden="true" className="size-5" />
                              ) : (
                                <FileSearch aria-hidden="true" className="size-5" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold" title={candidate.name}>{candidate.name}</p>
                              <p className="mt-0.5 truncate text-xs text-muted" title={candidate.displayPath}>
                                {candidate.displayPath}
                              </p>
                              <p className="mt-2 text-sm leading-relaxed text-muted">
                                {candidate.evidence[0]}
                              </p>
                            </div>
                          </div>
                          {previews[candidate.id] ? (
                            // A local data URL returned by the approved Electron bridge.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={`Preview of ${candidate.name}`}
                              className="mt-3 max-h-48 w-full rounded-[var(--radius-control)] bg-surface-subtle object-contain"
                              src={previews[candidate.id]}
                            />
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button onClick={() => void preview(candidate)} size="small" variant="secondary">
                              Preview
                            </Button>
                            <Button onClick={() => void openCandidate(candidate)} size="small" variant="quiet">
                              <ExternalLink aria-hidden="true" className="size-4" />
                              Open
                            </Button>
                            <Button onClick={() => toggleLinked(candidate.id)} size="small" variant="quiet">
                              {linked.has(candidate.id) ? <Check aria-hidden="true" className="size-4" /> : null}
                              {linked.has(candidate.id) ? "Added to case" : "Use for this case"}
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {error ? (
                  <p aria-live="assertive" className="mt-4 rounded-[var(--radius-control)] bg-danger-soft p-3 text-sm font-bold text-danger">
                    {error}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </section>
      ) : (
        <button
          className="flex min-h-12 items-center gap-2 rounded-full bg-accent px-4 font-bold text-white shadow-[0_8px_28px_oklch(0.24_0.09_245/0.28)] transition-transform hover:-translate-y-0.5"
          onClick={() => setOpen(true)}
          type="button"
        >
          <FileSearch aria-hidden="true" className="size-5" />
          Find a file
          <ChevronDown aria-hidden="true" className="size-4 rotate-180 opacity-70" />
        </button>
      )}
    </div>
  );
}

function ActivityMark({ phase }: { phase: ActivityEvent["phase"] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-1.5 size-2 shrink-0 rounded-full",
        phase === "failed" && "bg-danger",
        phase === "completed" && "bg-success",
        phase === "progress" && "bg-warning",
        phase === "started" && "bg-accent",
      )}
    />
  );
}

function collectCandidates(
  result: ComputerToolResult,
  target: Map<string, CandidateFile>,
) {
  for (const candidate of result.candidates ?? []) target.set(candidate.id, candidate);
  if (result.candidate) target.set(result.candidate.id, result.candidate);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function voiceRequestPrompt(locale: SupportedLocale) {
  if (locale === "es-US") return "¿Qué archivo quiere que encuentre?";
  if (locale === "zh-CN") return "您希望我查找什么文件？";
  return "What file would you like me to find?";
}
