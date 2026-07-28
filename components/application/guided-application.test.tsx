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

beforeEach(() => {
  voiceMocks.activate.mockReset().mockResolvedValue(undefined);
  voiceMocks.speak.mockReset().mockResolvedValue(undefined);
  voiceMocks.listen
    .mockReset()
    .mockImplementation(() => new Promise(() => undefined));
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
});
