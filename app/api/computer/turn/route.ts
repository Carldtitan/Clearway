import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";

import {
  computerTurnRequestSchema,
  computerTurnResponseSchema,
  type ComputerObservation,
} from "@/lib/computer/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are Clearway's real Windows computer-use planner.

You choose exactly one typed action. Clearway executes it on the user's visible Windows desktop, captures the new screen and accessibility tree, and returns that real observation on the next turn.

Rules:
- Handle arbitrary read-only Windows tasks. Never restrict requests to SSDI document types.
- Use the screenshot and UI Automation elements together. Prefer invoke_element with a current element ID; use coordinate clicks only when no accessible element represents the visible target.
- For local-file requests, visibly open File Explorer, use its search or navigation controls, inspect likely results, and verify the requested document. Do not finish from loose word overlap.
- The Windows desktop must visibly show the work. A candidate is relevant only when its filename, extracted content, or visible contents specifically establishes the requested document.
- When the correct File Explorer item is selected, use register_selected_file. Finish with only candidate IDs returned by real native results.
- After every UI-changing action, reason from the new observation. Never assume an action worked.
- Never invent a window, control, filename, path, candidate ID, content, action, or success.
- Do not open terminals, command prompts, developer consoles, Registry Editor, Task Manager, credential tools, or UAC prompts.
- Do not enter passwords, reveal secrets, delete, move, rename, purchase, upload, sign, send, submit, or change system or security settings.
- If a task requires a sensitive or destructive action, stop and explain what remains for the user.
- state act requires one non-null action and no candidateIds.
- state finish, clarify, and error require a null action.
- candidateIds in finish must be exact IDs from availableCandidateIds. Use an empty list when no verified file was found.
- Narration must be short, plain, and in the requested locale. Do not narrate an action as complete before its result exists.
- Return only schema-conforming data.`;

export async function POST(request: Request) {
  const parsed = computerTurnRequestSchema.safeParse(await safeJson(request));
  if (!parsed.success) {
    return noStore(
      NextResponse.json(
        { error: "Add a valid request and connected Windows environment." },
        { status: 400 },
      ),
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return noStore(
      NextResponse.json(
        { error: "Computer planning is not configured." },
        { status: 503 },
      ),
    );
  }

  try {
    const input = parsed.data;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 30_000,
      maxRetries: 1,
    });
    const response = await anthropic.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 1_400,
      system: SYSTEM_PROMPT,
      messages: [
        ...input.history,
        {
          role: "user",
          content: currentTurnContent({
            locale: input.locale,
            request: input.request,
            environment: input.environment,
            toolResult: input.toolResult,
            observation: input.observation,
            availableCandidateIds: input.availableCandidateIds,
          }),
        },
      ],
      output_config: {
        format: zodOutputFormat(computerTurnResponseSchema),
      },
    });
    const plan = response.parsed_output;
    if (!plan) throw new Error("Structured computer plan was empty");
    enforceStateShape(plan);
    enforceCandidateProvenance(plan, input.availableCandidateIds);
    return noStore(NextResponse.json(plan));
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    console.error("Clearway computer planning failed", {
      status,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return noStore(
      NextResponse.json(
        { error: "Clearway could not plan the next Windows action. Try again." },
        { status: 502 },
      ),
    );
  }
}

function currentTurnContent(input: {
  locale: string;
  request: string;
  environment: unknown;
  toolResult: string | null;
  observation: ComputerObservation | null;
  availableCandidateIds: string[];
}) {
  const text = `Conversation locale: ${input.locale}
Original request: ${input.request}
Windows environment: ${JSON.stringify(input.environment)}
Latest native tool result: ${input.toolResult ?? "(No tool has run yet.)"}
Available verified candidate IDs: ${JSON.stringify(input.availableCandidateIds)}
Latest active window and UI Automation elements: ${
    input.observation
      ? JSON.stringify({
          activeWindow: input.observation.activeWindow,
          elements: input.observation.elements,
        })
      : "(No Windows observation yet.)"
  }

Choose the next state.`;
  if (!input.observation) return text;
  const data = input.observation.screenshot.dataUrl.split(",", 2)[1];
  return [
    {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: "image/png" as const,
        data,
      },
    },
    { type: "text" as const, text },
  ];
}

function enforceStateShape(plan: {
  state: "act" | "finish" | "clarify" | "error";
  action: unknown | null;
  candidateIds: string[];
}) {
  if (plan.state === "act" && !plan.action) {
    throw new Error("Action state omitted its action");
  }
  if (plan.state !== "act" && plan.action) {
    throw new Error("Terminal state included an action");
  }
  if (plan.state === "act" && plan.candidateIds.length) {
    throw new Error("Action state included final candidates");
  }
}

function enforceCandidateProvenance(
  plan: { state: string; candidateIds: string[] },
  availableCandidateIds: string[],
) {
  if (plan.state !== "finish" || !plan.candidateIds.length) return;
  const available = new Set(availableCandidateIds);
  if (plan.candidateIds.some((id) => !available.has(id))) {
    throw new Error("Plan referenced an undiscovered candidate");
  }
}

async function safeJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
