import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/speak/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/speak", () => {
  it("uses Deepgram Aura for English speech", async () => {
    vi.stubEnv("DEEPGRAM_API_KEY", "test-key");

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(Uint8Array.from([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      speakRequest({ text: "What is your name?", locale: "en-US" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Language")).toBe("en-US");
    expect(response.headers.get("X-TTS-Provider")).toBe("deepgram");
    expect(response.headers.get("X-Voice-Profile")).toBe("deepgram-aura-2");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0]!;
    const requestUrl = new URL(String(url));
    expect(requestUrl.origin + requestUrl.pathname).toBe(
      "https://api.deepgram.com/v1/speak",
    );
    expect(requestUrl.searchParams.get("model")).toBe("aura-2-thalia-en");
    expect(requestUrl.searchParams.get("speed")).toBe("1.08");
    expect(requestUrl.searchParams.get("mip_opt_out")).toBe("true");
    expect(options?.headers).toMatchObject({
      Authorization: "Token test-key",
      "Content-Type": "application/json",
    });
    expect(options?.body).toBe(JSON.stringify({ text: "What is your name?" }));
  });

  it("uses a Spanish Aura voice without switching the response language", async () => {
    vi.stubEnv("DEEPGRAM_API_KEY", "test-key");
    vi.stubEnv("DEEPGRAM_TTS_MODEL_ES", "aura-2-estrella-es");

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
      speakRequest({ text: "¿Cómo se llama?", locale: "es-US" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Language")).toBe("es-US");
    const [url] = fetchMock.mock.calls[0]!;
    expect(new URL(String(url)).searchParams.get("model")).toBe(
      "aura-2-estrella-es",
    );
  });

  it("routes Mandarin to the browser without calling a server provider", async () => {
    vi.stubEnv("DEEPGRAM_API_KEY", "test-key");
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      speakRequest({ text: "您好", locale: "zh-CN" }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ fallback: "browser" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports unavailable server speech when the Deepgram key is absent", async () => {
    vi.stubEnv("DEEPGRAM_API_KEY", "");
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      speakRequest({ text: "Hello", locale: "en-US" }),
    );

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function speakRequest(body: { text: string; locale: string }) {
  return new Request("http://localhost/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
