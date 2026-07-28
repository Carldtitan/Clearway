import { describe, expect, it } from "vitest";

import { shouldFinishRecording } from "@/components/voice/use-voice-turn";

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
        elapsedMs: 3_000,
        heardSpeech: true,
        silenceMs: 1_400,
      }),
    ).toBe(true);
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

  it("caps a spoken answer after thirty seconds", () => {
    expect(
      shouldFinishRecording({
        elapsedMs: 30_000,
        heardSpeech: true,
        silenceMs: 0,
      }),
    ).toBe(true);
  });
});
