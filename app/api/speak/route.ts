import { NextResponse } from "next/server";
import { z } from "zod";

import type { SupportedLocale } from "@/lib/case/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const speakRequestSchema = z.object({
  text: z.string().trim().min(1).max(1_500),
  locale: z.enum(["en-US", "es-US", "zh-CN"]).default("en-US"),
});

type DeepgramSpeechLocale = Exclude<SupportedLocale, "zh-CN">;

const DEFAULT_DEEPGRAM_TTS_MODELS: Record<DeepgramSpeechLocale, string> = {
  "en-US": "aura-2-thalia-en",
  "es-US": "aura-2-estrella-es",
};

export async function POST(request: Request) {
  const parsed = speakRequestSchema.safeParse(await safeJson(request));
  if (!parsed.success) {
    return noStore(
      NextResponse.json(
        { error: "Add text for the assistant to speak." },
        { status: 400 },
      ),
    );
  }

  const { locale, text } = parsed.data;
  if (locale === "zh-CN") {
    return noStore(
      NextResponse.json(
        {
          error:
            "Mandarin speech uses the matching voice installed in the browser.",
          fallback: "browser",
        },
        { status: 422 },
      ),
    );
  }

  if (!process.env.DEEPGRAM_API_KEY) {
    return noStore(
      NextResponse.json(
        { error: "Server speech is not configured." },
        { status: 503 },
      ),
    );
  }

  try {
    const response = await requestSpeech(locale, text);
    if (!response.ok) {
      console.error("Deepgram speech failed", { status: response.status });
      return noStore(
        NextResponse.json(
          { error: "Server speech is temporarily unavailable." },
          { status: 502 },
        ),
      );
    }

    const audio = await response.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Language": locale,
        "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "X-TTS-Provider": "deepgram",
        "X-Voice-Profile": "deepgram-aura-2",
      },
    });
  } catch (error) {
    console.error("Deepgram speech failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return noStore(
      NextResponse.json(
        { error: "Server speech is temporarily unavailable." },
        { status: 502 },
      ),
    );
  }
}

function requestSpeech(locale: DeepgramSpeechLocale, text: string) {
  const model =
    locale === "en-US"
      ? process.env.DEEPGRAM_TTS_MODEL_EN ||
        DEFAULT_DEEPGRAM_TTS_MODELS["en-US"]
      : process.env.DEEPGRAM_TTS_MODEL_ES ||
        DEFAULT_DEEPGRAM_TTS_MODELS["es-US"];
  const url = new URL("https://api.deepgram.com/v1/speak");
  url.searchParams.set("model", model);
  url.searchParams.set("encoding", "mp3");
  url.searchParams.set("speed", deepgramSpeechSpeed());
  url.searchParams.set("mip_opt_out", "true");

  return fetch(url, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
}

function deepgramSpeechSpeed() {
  const configured = Number(process.env.DEEPGRAM_TTS_SPEED);
  if (Number.isFinite(configured) && configured >= 0.7 && configured <= 1.5) {
    return String(configured);
  }
  return "1.08";
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
