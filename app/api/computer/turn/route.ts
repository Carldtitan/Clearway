import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";

import {
  computerTurnRequestSchema,
  computerTurnResponseSchema,
} from "@/lib/computer/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are Clearway's computer-action planner for a Windows accessibility assistant.

You do not control Windows directly. You choose exactly one typed read-only tool action, then receive the real result on the next turn.

Rules:
- Handle arbitrary local file requests. Never restrict requests to SSDI document types.
- Use only capabilities and approved roots listed in the environment.
- Never invent a filename, path, candidate ID, file count, excerpt, action, or success.
- On a new find/search request, use search_files. Create helpful runtime terms and extension hints from the user's meaning; these are search hints, not predetermined answers.
- search_files already considers filename, path, metadata, PDF/text contents, and bounded local OCR. Prefer finishing from its evidence when the results answer the request.
- Use candidate actions only with an exact candidate ID from the latest real tool result.
- If no result is strong, you may retry search_files once with meaningfully different terms. Otherwise finish honestly with no candidates or ask one short clarification.
- state act requires one non-null action and no candidateIds.
- state finish, clarify, and error require a null action.
- candidateIds in finish must be exact IDs from the latest tool result. Use an empty list when no match was found.
- Narration must be short, plain, and in the requested locale. Do not narrate an action as complete before its result exists.
- Do not offer to move, delete, upload, sign, submit, browse the web, run commands, or control another application.
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
      timeout: 20_000,
      maxRetries: 1,
    });
    const response = await anthropic.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 1_200,
      system: SYSTEM_PROMPT,
      messages: [
        ...input.history,
        {
          role: "user",
          content: `Conversation locale: ${input.locale}
Original request: ${input.request}
Windows environment: ${JSON.stringify(input.environment)}
Latest native tool result: ${input.toolResult ?? "(No tool has run yet.)"}

Choose the next state.`,
        },
      ],
      output_config: {
        format: zodOutputFormat(computerTurnResponseSchema),
      },
    });
    const plan = response.parsed_output;
    if (!plan) throw new Error("Structured computer plan was empty");
    enforceStateShape(plan);
    enforceCandidateProvenance(plan, input.toolResult);
    return noStore(NextResponse.json(plan));
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    console.error("Clearway computer planning failed", {
      status,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return noStore(
      NextResponse.json(
        { error: "Clearway could not plan the next computer action. Try again." },
        { status: 502 },
      ),
    );
  }
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
  toolResult: string | null,
) {
  if (plan.state !== "finish" || !plan.candidateIds.length) return;
  if (!toolResult) throw new Error("Finished before a native tool result");
  let result: unknown;
  try {
    result = JSON.parse(toolResult);
  } catch {
    throw new Error("Native tool result was not valid JSON");
  }
  const available = collectCandidateIds(result);
  if (plan.candidateIds.some((id) => !available.has(id))) {
    throw new Error("Plan referenced an undiscovered candidate");
  }
}

function collectCandidateIds(value: unknown) {
  const ids = new Set<string>();
  if (!value || typeof value !== "object") return ids;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.candidates)) {
    for (const candidate of record.candidates) {
      if (
        candidate &&
        typeof candidate === "object" &&
        typeof (candidate as Record<string, unknown>).id === "string"
      ) {
        ids.add((candidate as Record<string, string>).id);
      }
    }
  }
  if (
    record.candidate &&
    typeof record.candidate === "object" &&
    typeof (record.candidate as Record<string, unknown>).id === "string"
  ) {
    ids.add((record.candidate as Record<string, string>).id);
  }
  return ids;
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
