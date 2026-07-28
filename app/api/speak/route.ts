import { NextResponse } from "next/server";
import { z } from "zod";

import type { SupportedLocale } from "@/lib/case/types";
import { localeDefinition } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const speakRequestSchema = z.object({
  text: z.string().trim().min(1).max(1_500),
  locale: z.enum(["en-US", "es-US", "zh-CN"]).default("en-US"),
});

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

  const voiceId = voiceIdFor(parsed.data.locale);
  if (
    process.env.TTS_PROVIDER !== "elevenlabs" ||
    !process.env.ELEVENLABS_API_KEY ||
    !voiceId
  ) {
    return noStore(
      NextResponse.json(
        { error: "Server speech is not configured." },
        { status: 503 },
      ),
    );
  }

  try {
    let response = await requestSpeech(voiceId, parsed.data.text);
    let voiceProfile = "localized";

    const fallbackVoiceId =
      process.env.ELEVENLABS_VOICE_ID_EN ??
      process.env.ELEVENLABS_VOICE_ID;
    if (
      !response.ok &&
      parsed.data.locale !== "en-US" &&
      fallbackVoiceId &&
      fallbackVoiceId !== voiceId &&
      isUnavailableVoice(response.status)
    ) {
      console.warn("ElevenLabs localized voice unavailable; using the multilingual fallback", {
        locale: parsed.data.locale,
        status: response.status,
      });
      response = await requestSpeech(fallbackVoiceId, parsed.data.text);
      voiceProfile = "multilingual-fallback";
    }

    if (!response.ok) {
      console.error("ElevenLabs speech failed", { status: response.status });
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
        "Content-Language": parsed.data.locale,
        "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "X-Voice-Profile": voiceProfile,
      },
    });
  } catch (error) {
    console.error("ElevenLabs speech failed", {
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

function voiceIdFor(locale: SupportedLocale): string | undefined {
  const definition = localeDefinition(locale);
  const configured = process.env[definition.voiceEnvironmentKey];
  if (configured) return configured;
  if (locale === "en-US") return process.env.ELEVENLABS_VOICE_ID;
  if (locale === "es-US") return "KHCvMklQZZo0O30ERnVn";
  return "bhJUNIXWQQ94l8eI2VUf";
}

function requestSpeech(voiceId: string, text: string) {
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId,
    )}?output_format=mp3_44100_128&enable_logging=false`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.1,
          use_speaker_boost: true,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  );
}

function isUnavailableVoice(status: number) {
  return status === 402 || status === 403 || status === 404 || status === 422;
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
