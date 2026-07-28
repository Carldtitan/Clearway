import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuidedApplication } from "@/components/application/guided-application";
import { CaseProvider } from "@/components/app/case-context";

vi.mock("@/components/visual/orb", () => ({
  default: () => <div data-testid="voice-orb" />,
}));

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
});
