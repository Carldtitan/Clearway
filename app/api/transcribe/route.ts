import { DeepgramClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

import type { SupportedLocale } from "@/lib/case/types";
import { localeDefinition } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.DEEPGRAM_API_KEY) {
    return noStore(
      NextResponse.json(
        { error: "Voice transcription is not configured. Type your answer." },
        { status: 503 },
      ),
    );
  }

  const form = await request.formData();
  const audio = form.get("audio");
  const locale = parseLocale(form.get("locale"));
  if (!locale) {
    return noStore(
      NextResponse.json(
        { error: "Choose a supported conversation language." },
        { status: 400 },
      ),
    );
  }
  if (!(audio instanceof Blob) || audio.size === 0) {
    return noStore(
      NextResponse.json(
        { error: "No recording was received. Try again or type your answer." },
        { status: 400 },
      ),
    );
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return noStore(
      NextResponse.json(
        { error: "That recording is too long. Try a shorter answer." },
        { status: 413 },
      ),
    );
  }

  try {
    const deepgram = new DeepgramClient({
      apiKey: process.env.DEEPGRAM_API_KEY,
    });
    const speech = localeDefinition(locale);
    const response = await deepgram.listen.v1.media.transcribeFile(audio, {
      model:
        locale === "en-US"
          ? process.env.DEEPGRAM_MODEL || speech.deepgramModel
          : speech.deepgramModel,
      language: speech.deepgramLanguage,
      punctuate: true,
      smart_format: true,
      paragraphs: true,
    });
    if (!("results" in response)) {
      throw new Error("Deepgram returned an asynchronous response");
    }
    const transcript =
      response.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ??
      "";

    if (!transcript) {
      return noStore(
        NextResponse.json(
          {
            error:
              "We could not hear a clear answer. Try again or type instead.",
          },
          { status: 422 },
        ),
      );
    }

    return noStore(NextResponse.json({ transcript }));
  } catch (error) {
    console.error("Deepgram transcription failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return noStore(
      NextResponse.json(
        {
          error:
            "Voice transcription is unavailable. Your earlier answers are safe; type this answer instead.",
        },
        { status: 502 },
      ),
    );
  }
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function parseLocale(value: FormDataEntryValue | null): SupportedLocale | null {
  return value === "en-US" || value === "es-US" || value === "zh-CN"
    ? value
    : null;
}
