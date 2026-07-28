import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CaseProvider, useApplicantCase } from "@/components/app/case-context";
import { InterviewFlow } from "@/components/interview/interview-flow";

vi.mock("@/components/visual/orb", () => ({
  default: () => <div data-testid="voice-orb" />,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("InterviewFlow", () => {
  it("turns the demo transcript into visible facts before review", async () => {
    const user = userEvent.setup();
    render(
      <CaseProvider>
        <InterviewFlow />
        <StageProbe />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Demo answer" }));

    const reviewButton = await screen.findByRole(
      "button",
      { name: "Review captured facts" },
      { timeout: 3_000 },
    );
    expect(screen.getAllByText("Spinal stenosis")).toHaveLength(2);
    expect(screen.getAllByText("Provider list marked complete")).toHaveLength(
      2,
    );
    expect(screen.getByTestId("case-stage")).toHaveTextContent("check");

    await user.click(reviewButton);
    expect(screen.getByTestId("case-stage")).toHaveTextContent("review");
  });

  it("pauses and resumes an active recording without losing the answer", async () => {
    const user = userEvent.setup();
    installMediaRecorder();
    render(
      <CaseProvider>
        <InterviewFlow />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Record answer" }));
    expect(await screen.findByText("Listening")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByText("Paused — your answer is still here")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Finish answer" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(screen.getByText("Listening")).toBeVisible();
  });

  it("moves focus to typing when microphone permission fails", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Denied")),
      },
    });
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    render(
      <CaseProvider>
        <InterviewFlow />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Record answer" }));

    expect(
      await screen.findByText(
        "Microphone access did not work. Type your answer instead.",
      ),
    ).toBeVisible();
    expect(screen.getByLabelText("Your answer")).toHaveFocus();
  });

  it("requires explicit provider-list completion before review", async () => {
    const user = userEvent.setup();
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        extractionResponse(
          "Did any other doctor, clinic, or hospital treat you?",
          "more_possible",
        ),
      )
      .mockResolvedValueOnce(
        extractionResponse(
          "Your provider list is complete.",
          "complete",
        ),
      );
    vi.stubGlobal("fetch", request);
    render(
      <CaseProvider>
        <InterviewFlow />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Type" }));
    await user.type(screen.getByLabelText("Your answer"), "Dr. Lee treated me.");
    await user.click(
      screen.getByRole("button", { name: "Find reviewable facts" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Did any other doctor, clinic, or hospital treat you?",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Review captured facts" }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Your answer"), "No one else.");
    await user.click(
      screen.getByRole("button", { name: "Find reviewable facts" }),
    );

    expect(
      await screen.findByRole("button", { name: "Review captured facts" }),
    ).toBeVisible();
    expect(request).toHaveBeenCalledTimes(2);
  });
});

function StageProbe() {
  const { applicantCase } = useApplicantCase();
  return <output data-testid="case-stage">{applicantCase.stage}</output>;
}

function installMediaRecorder() {
  Object.defineProperty(window.navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
  });
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
}

class FakeMediaRecorder {
  static isTypeSupported() {
    return true;
  }

  mimeType = "audio/webm";
  state: RecordingState = "inactive";

  addEventListener() {}

  pause() {
    this.state = "paused";
  }

  resume() {
    this.state = "recording";
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
  }
}

function extractionResponse(
  followUpQuestion: string,
  providerListStatus: "complete" | "more_possible",
) {
  return {
    ok: true,
    json: async () => ({
      extraction: {
        summary: "Provider follow-up",
        followUpQuestion,
        providerListStatus,
        facts: [],
      },
    }),
  };
}
