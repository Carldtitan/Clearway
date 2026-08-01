"use client";

import {
  computerTurnResponseSchema,
  type ComputerEnvironment,
  type ComputerTurnResponse,
} from "@/lib/computer/schema";
import type { SupportedLocale } from "@/lib/case/types";

export async function requestComputerTurn(input: {
  request: string;
  locale: SupportedLocale;
  environment: ComputerEnvironment;
  history: Array<{ role: "assistant" | "user"; content: string }>;
  toolResult: string | null;
}): Promise<ComputerTurnResponse> {
  const response = await fetch("/api/computer/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as unknown;
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String(body.error)
        : "Clearway could not plan the next computer action.";
    throw new Error(message);
  }
  const parsed = computerTurnResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Clearway received an invalid computer plan.");
  }
  return parsed.data;
}

export function serializeToolResult(value: unknown) {
  const serialized = JSON.stringify(value, (key, nested) =>
    key === "previewDataUrl" ? undefined : nested,
  );
  return serialized.length <= 24_000
    ? serialized
    : `${serialized.slice(0, 23_960)}…[truncated]`;
}
