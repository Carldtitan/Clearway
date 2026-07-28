import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/speak/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/speak", () => {
  it("keeps the selected language when a paid localized voice is unavailable", async () => {
    vi.stubEnv("TTS_PROVIDER", "elevenlabs");
    vi.stubEnv("ELEVENLABS_API_KEY", "test-key");
    vi.stubEnv("ELEVENLABS_VOICE_ID_EN", "english-account-voice");
    vi.stubEnv("ELEVENLABS_VOICE_ID_ES", "spanish-library-voice");
    vi.stubEnv("ELEVENLABS_MODEL", "eleven_multilingual_v2");

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            detail: { code: "paid_plan_required" },
          }),
          {
            status: 402,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(Uint8Array.from([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "¿Cómo se llama?", locale: "es-US" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Language")).toBe("es-US");
    expect(response.headers.get("X-Voice-Profile")).toBe(
      "multilingual-fallback",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "spanish-library-voice",
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "english-account-voice",
    );
  });

  it("uses the configured English voice without retrying", async () => {
    vi.stubEnv("TTS_PROVIDER", "elevenlabs");
    vi.stubEnv("ELEVENLABS_API_KEY", "test-key");
    vi.stubEnv("ELEVENLABS_VOICE_ID_EN", "english-account-voice");

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(Uint8Array.from([1]), {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "What is your name?", locale: "en-US" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Voice-Profile")).toBe("localized");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
