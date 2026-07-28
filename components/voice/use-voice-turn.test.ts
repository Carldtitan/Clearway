import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  selectBrowserVoice,
  shouldFinishRecording,
  useVoiceTurn,
} from "@/components/voice/use-voice-turn";

describe("speech interruption", () => {
  it("resolves pending TTS immediately when the applicant skips it", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => reject(new DOMException("Aborted", "AbortError")),
              { once: true },
            );
          }),
      );
    const { result } = renderHook(() => useVoiceTurn("en-US"));
    let speechPromise: Promise<void> | undefined;

    act(() => {
      speechPromise = result.current.speak("A question that is still loading.");
    });

    await waitFor(() => expect(result.current.state).toBe("speaking"));

    await act(async () => {
      result.current.skipSpeech();
      await speechPromise;
    });

    expect(result.current.state).toBe("idle");
    fetchMock.mockRestore();
  });
});

describe("continuous microphone turn detection", () => {
  it("waits indefinitely until the applicant starts speaking", () => {
    expect(
      shouldFinishRecording({
        elapsedMs: 10 * 60_000,
        heardSpeech: false,
        silenceMs: 10 * 60_000,
      }),
    ).toBe(false);
  });

  it("ends a turn after speech followed by silence", () => {
    expect(
      shouldFinishRecording({
        elapsedMs: 1_300,
        heardSpeech: true,
        silenceMs: 1_000,
      }),
    ).toBe(true);
  });

  it("keeps the microphone open through the minimum answer window", () => {
    expect(
      shouldFinishRecording({
        elapsedMs: 1_100,
        heardSpeech: true,
        silenceMs: 1_000,
      }),
    ).toBe(false);
  });

  it("does not cut off an answer while speech is continuing", () => {
    expect(
      shouldFinishRecording({
        elapsedMs: 12_000,
        heardSpeech: true,
        silenceMs: 200,
      }),
    ).toBe(false);
  });

  it("allows a natural pause inside a longer answer", () => {
    expect(
      shouldFinishRecording({
        elapsedMs: 12_000,
        heardSpeech: true,
        silenceMs: 1_800,
      }),
    ).toBe(false);
  });

  it("caps a spoken answer after two minutes", () => {
    expect(
      shouldFinishRecording({
        elapsedMs: 120_000,
        heardSpeech: true,
        silenceMs: 0,
      }),
    ).toBe(true);
  });
});

describe("browser voice selection", () => {
  it("selects an exact Mandarin voice instead of an English default", () => {
    const english = voice({ default: true, lang: "en-US", name: "Microsoft Aria" });
    const mandarin = voice({
      lang: "zh-CN",
      localService: true,
      name: "Microsoft Xiaoxiao Natural",
    });

    expect(selectBrowserVoice([english, mandarin], "zh-CN")).toBe(mandarin);
  });

  it("uses a same-language voice when an exact regional voice is unavailable", () => {
    const traditionalChinese = voice({
      lang: "zh-TW",
      name: "Microsoft HsiaoChen",
    });

    expect(selectBrowserVoice([traditionalChinese], "zh-CN")).toBe(
      traditionalChinese,
    );
  });

  it("never substitutes an unrelated language", () => {
    expect(
      selectBrowserVoice(
        [voice({ lang: "en-US", name: "Microsoft Aria" })],
        "zh-CN",
      ),
    ).toBeUndefined();
  });
});

function voice(
  overrides: Partial<SpeechSynthesisVoice>,
): SpeechSynthesisVoice {
  return {
    default: false,
    lang: "en-US",
    localService: true,
    name: "Test voice",
    voiceURI: "test-voice",
    ...overrides,
  };
}
