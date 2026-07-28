import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GuidedApplication } from "@/components/application/guided-application";
import { CaseProvider } from "@/components/app/case-context";

vi.mock("@/components/visual/orb", () => ({
  default: () => <div data-testid="voice-orb" />,
}));

const voiceMocks = vi.hoisted(() => ({
  activate: vi.fn(),
  listen: vi.fn(),
  speak: vi.fn(),
}));

const extractionMocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("@/components/voice/use-voice-turn", () => ({
  useVoiceTurn: () => ({
    ...voiceMocks,
    ask: vi.fn(),
    error: null,
    finishAnswer: vi.fn(),
    lastTranscript: "",
    level: 0,
    pause: vi.fn(),
    resume: vi.fn(),
    state: "idle",
  }),
}));

vi.mock("@/lib/extraction/client", () => ({
  requestInterviewExtraction: extractionMocks.request,
}));

beforeEach(() => {
  voiceMocks.activate.mockReset().mockResolvedValue(undefined);
  voiceMocks.speak.mockReset().mockResolvedValue(undefined);
  voiceMocks.listen
    .mockReset()
    .mockImplementation(() => new Promise(() => undefined));
  extractionMocks.request
    .mockReset()
    .mockImplementation(
      async ({ transcript }: { transcript: string }) => ({
        summary: transcript,
        confirmationText: `I heard ${transcript}. Is that correct?`,
        followUpQuestion: "",
        providerListStatus: "unknown",
        facts: [
          {
            kind: "scalar",
            entityKey: "",
            field: "applicant.legalName",
            value: transcript,
            confidence: 0.99,
            evidenceText: transcript,
          },
        ],
      }),
    );
});

describe("GuidedApplication", () => {
  it("asks for language before any application question", () => {
    render(
      <CaseProvider>
        <GuidedApplication />
      </CaseProvider>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Which language would you like to use?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Prepare your SSDI application and organize the supporting records through a guided conversation.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual([
      expect.stringContaining("English"),
      expect.stringContaining("Español"),
      expect.stringContaining("中文（普通话）"),
    ]);
    expect(screen.queryByText("Check")).not.toBeInTheDocument();
    expect(screen.queryByText("Review")).not.toBeInTheDocument();
  });

  it("does not render the removed AI-style copy", () => {
    render(
      <CaseProvider>
        <GuidedApplication />
      </CaseProvider>,
    );

    [
      "Voice-first application",
      "Your voice can complete this application",
      "Start voice check",
      "Start voice interview",
      "Use one-question keyboard fallback",
      "Nothing is saved when this tab closes",
    ].forEach((phrase) => {
      expect(screen.queryByText(phrase)).not.toBeInTheDocument();
    });
  });

  it("speaks the preparation introduction in the selected language", async () => {
    const user = userEvent.setup();
    render(
      <CaseProvider>
        <GuidedApplication />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: /EspañolES/i }));

    await waitFor(() =>
      expect(voiceMocks.speak).toHaveBeenCalledWith(
        expect.stringContaining(
          "Le ayudaré a preparar su solicitud por discapacidad",
        ),
      ),
    );
    expect(
      screen.getByRole("combobox", { name: "Conversation language" }),
    ).toHaveValue("es-US");
  });

  it("returns to listening when transcription misses an answer", async () => {
    const user = userEvent.setup();
    voiceMocks.listen
      .mockReset()
      .mockRejectedValueOnce(new Error("No clear transcript"))
      .mockResolvedValueOnce("I'm ready")
      .mockImplementation(() => new Promise(() => undefined));

    render(
      <CaseProvider>
        <GuidedApplication />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: /EnglishEN/i }));

    await waitFor(() =>
      expect(voiceMocks.speak).toHaveBeenCalledWith(
        "I didn’t catch that. I’m still listening.",
      ),
    );
    expect(
      await screen.findByRole("heading", {
        name: "What is your full legal name?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/The microphone is unavailable/i),
    ).not.toBeInTheDocument();
  });

  it("turns a rejected answer into a correction conversation", async () => {
    const user = userEvent.setup();
    voiceMocks.listen
      .mockReset()
      .mockResolvedValueOnce("I'm ready")
      .mockResolvedValueOnce("Alice Rivera")
      .mockResolvedValueOnce("No, don't save that")
      .mockResolvedValueOnce("Jane Rivera")
      .mockResolvedValueOnce("yes")
      .mockImplementation(() => new Promise(() => undefined));

    render(
      <CaseProvider>
        <GuidedApplication />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: /EnglishEN/i }));

    await waitFor(() =>
      expect(voiceMocks.speak).toHaveBeenCalledWith(
        "Thanks for catching that. I won’t save it. What should I put down instead?",
      ),
    );
    await waitFor(() =>
      expect(voiceMocks.speak).toHaveBeenCalledWith(
        expect.stringContaining("I heard Jane Rivera."),
      ),
    );

    const originalQuestionCalls = voiceMocks.speak.mock.calls.filter(
      ([message]) => message === "What is your full legal name?",
    );
    expect(originalQuestionCalls).toHaveLength(1);
    expect(extractionMocks.request).toHaveBeenCalledTimes(2);
    expect(extractionMocks.request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ transcript: "Jane Rivera" }),
    );
  });
});
