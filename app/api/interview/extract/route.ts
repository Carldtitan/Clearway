import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";

import {
  extractionRequestSchema,
  interviewExtractionSchema,
} from "@/lib/extraction/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXTRACTION_SYSTEM_PROMPT = `You extract only explicitly stated facts for an SSDI application-preparation tool.

Rules:
- Never infer or invent a consequential fact.
- Emit no fact when the speaker did not provide a value. Never use an empty value.
- Preserve uncertainty. Approximate dates may be captured only when the speaker says they are approximate.
- The alleged onset date is when a condition began limiting work, not necessarily diagnosis date.
- A provider is a practitioner or facility that treated any reported condition.
- providerListStatus is complete only when the speaker explicitly says there are no other providers or places of care.
- For applicant, school, and training addresses, emit separate address component facts. Never combine an address into one field.
- For each marriage, child, condition, provider, medication, and job, use one stable entityKey for every fact about that item.
- For jobs, capture the described physical demands, tools, supervision, reports, and reason work ended. Do not turn an unsupported generalization into a number.
- Treat Social Security numbers as strings and preserve leading zeroes and spoken uncertainty.
- For yes/no scalar fields, value must be "yes" or "no" only when the speaker clearly answered.
- Use one fact per atomic value. Repeated symptoms, duties, or side effects become separate facts with the same entityKey and field.
- entityKey links facts about the same repeated item; use a short stable lowercase name. It is empty only for scalar facts.
- Dates use YYYY-MM-DD only when the speaker gives enough information. Otherwise preserve the spoken date phrase as the value.
- Evidence text must be a short exact excerpt from the transcript.
- Confidence reflects whether the transcript directly supports the value, not whether the value sounds plausible.
- Do not offer legal advice or decide eligibility.
- Return only schema-conforming data.`;

export async function POST(request: Request) {
  const input = extractionRequestSchema.safeParse(await safeJson(request));
  if (!input.success) {
    return noStore(
      NextResponse.json(
        { error: "Add a transcript before extracting facts." },
        { status: 400 },
      ),
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return noStore(
      NextResponse.json(
        { error: "Fact extraction is not configured. Use manual review." },
        { status: 503 },
      ),
    );
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 20_000,
      maxRetries: 1,
    });
    const response = await anthropic.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 2_500,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Interview topic: ${input.data.topic ?? "general"}
Question asked: ${input.data.prompt ?? "not provided"}

Extract SSDI application facts from this answer:

${input.data.transcript}`,
        },
      ],
      output_config: {
        format: zodOutputFormat(interviewExtractionSchema),
      },
    });

    if (!response.parsed_output) {
      throw new Error("Structured response was empty");
    }

    return noStore(
      NextResponse.json({
        turnId: input.data.turnId,
        extraction: response.parsed_output,
      }),
    );
  } catch (error) {
    const status =
      error instanceof Anthropic.APIError ? error.status : undefined;
    console.error("Anthropic extraction failed", {
      status,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return noStore(
      NextResponse.json(
        {
          error:
            "We kept your transcript, but could not extract facts. Retry or review it manually.",
        },
        { status: 502 },
      ),
    );
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
