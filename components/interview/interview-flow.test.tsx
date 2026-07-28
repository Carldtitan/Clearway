import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CaseProvider, useApplicantCase } from "@/components/app/case-context";
import { InterviewFlow } from "@/components/interview/interview-flow";

const voiceMocks = vi.hoisted(() => ({
  activate: vi.fn(),
  ask: vi.fn(),
  finishAnswer: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  speak: vi.fn(),
}));

vi.mock("@/components/visual/orb", () => ({
  default: () => <div data-testid="voice-orb" />,
}));

vi.mock("@/components/voice/use-voice-turn", () => ({
  useVoiceTurn: () => ({
    ...voiceMocks,
    error: null,
    lastTranscript: "",
    level: 0,
    listen: vi.fn(),
    state: "idle",
  }),
}));

beforeEach(() => {
  voiceMocks.activate.mockReset().mockResolvedValue(undefined);
  voiceMocks.ask.mockReset();
  voiceMocks.finishAnswer.mockReset();
  voiceMocks.pause.mockReset();
  voiceMocks.resume.mockReset();
  voiceMocks.speak.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("InterviewFlow", () => {
  it("turns the demo transcript into visible facts before review", async () => {
    const user = userEvent.setup();
    render(
      <CaseProvider>
        <InterviewFlow />
        <CaseProbe />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Demo answer" }));

    const reviewButton = await screen.findByRole("button", {
      name: "Review captured facts",
    });
    expect(screen.getAllByText("Spinal stenosis")).toHaveLength(2);
    expect(screen.getAllByText("Provider list marked complete")).toHaveLength(
      2,
    );
    expect(screen.getByTestId("case-stage")).toHaveTextContent("check");

    await user.click(reviewButton);
    expect(screen.getByTestId("case-stage")).toHaveTextContent("review");
  });

  it("asks, listens, reads back, and advances without typing", async () => {
    const user = userEvent.setup();
    voiceMocks.ask
      .mockResolvedValueOnce(
        "My legal name is Jordan Lee and my Social Security number is 000-22-3333.",
      )
      .mockResolvedValueOnce("yes")
      .mockImplementationOnce(() => new Promise(() => undefined));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        extractionResponse("Captured Jordan Lee.", "unknown", [
          {
            kind: "scalar",
            entityKey: "",
            field: "applicant.legalName",
            value: "Jordan Lee",
            confidence: 0.99,
            evidenceText: "Jordan Lee",
          },
        ]),
      ),
    );
    render(
      <CaseProvider>
        <InterviewFlow />
        <CaseProbe />
      </CaseProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Start voice interview" }),
    );

    await waitFor(() => expect(voiceMocks.ask).toHaveBeenCalledTimes(3));
    expect(voiceMocks.ask.mock.calls[0][0]).toMatch(/full legal name/i);
    expect(voiceMocks.ask.mock.calls[1][0]).toBe(
      "I heard this: Captured Jordan Lee. Is that accurate? Say yes to save it, or no to answer again.",
    );
    expect(voiceMocks.ask.mock.calls[2][0]).toMatch(/mailing address/i);
    expect(screen.getByTestId("legal-name")).toHaveTextContent("Jordan Lee");
  });

  it("does not write extracted facts until the applicant confirms", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        extractionResponse("Captured spinal stenosis.", "unknown", [
          {
            kind: "condition",
            entityKey: "spinal",
            field: "condition.name",
            value: "Spinal stenosis",
            confidence: 0.97,
            evidenceText: "spinal stenosis",
          },
        ]),
      ),
    );
    render(
      <CaseProvider>
        <InterviewFlow />
        <CaseProbe />
      </CaseProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Use one-question keyboard fallback",
      }),
    );
    await user.type(
      await screen.findByRole("textbox", {
        name: "Answer the current question",
      }),
      "I have spinal stenosis.",
    );
    await user.click(
      screen.getByRole("button", { name: "Review what I said" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "I heard: Captured spinal stenosis.",
      }),
    ).toBeVisible();
    expect(screen.getByTestId("condition-count")).toHaveTextContent("0");

    await user.click(
      screen.getByRole("button", { name: "Yes, save these facts" }),
    );
    expect(screen.getByTestId("condition-count")).toHaveTextContent("1");
    expect(
      screen.getByRole("heading", { name: /full mailing address/i }),
    ).toBeVisible();
  });

  it("keeps asking until the provider list is explicitly complete", async () => {
    const user = userEvent.setup();
    const request = vi
      .fn()
      .mockResolvedValueOnce(extractionResponse("Identity captured.", "unknown"))
      .mockResolvedValueOnce(extractionResponse("Contact captured.", "unknown"))
      .mockResolvedValueOnce(extractionResponse("Conditions captured.", "unknown"))
      .mockResolvedValueOnce(
        extractionResponse(
          "Dr. Lee captured.",
          "more_possible",
          [],
          "Did any other doctor, clinic, or hospital treat you?",
        ),
      )
      .mockResolvedValueOnce(
        extractionResponse("No other providers.", "complete"),
      );
    vi.stubGlobal("fetch", request);
    render(
      <CaseProvider>
        <InterviewFlow />
        <CaseProbe />
      </CaseProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Use one-question keyboard fallback",
      }),
    );
    await answerAndConfirm(user, "identity answer");
    await answerAndConfirm(user, "contact answer");
    await answerAndConfirm(user, "condition answer");
    await answerAndConfirm(user, "Dr. Lee treated me.");

    expect(
      screen.getByRole("heading", {
        name: "Did any other doctor, clinic, or hospital treat you?",
      }),
    ).toBeVisible();
    expect(screen.getByTestId("providers-complete")).toHaveTextContent("no");

    await answerAndConfirm(user, "No one else.");

    expect(
      screen.getByRole("heading", { name: /every medicine you take/i }),
    ).toBeVisible();
    expect(screen.getByTestId("providers-complete")).toHaveTextContent("yes");
    expect(request).toHaveBeenCalledTimes(5);
  });
});

async function answerAndConfirm(
  user: ReturnType<typeof userEvent.setup>,
  answer: string,
) {
  const textbox = await screen.findByRole("textbox", {
    name: "Answer the current question",
  });
  await user.clear(textbox);
  await user.type(textbox, answer);
  await user.click(
    screen.getByRole("button", { name: "Review what I said" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Yes, save these facts" }),
  );
}

function CaseProbe() {
  const { applicantCase } = useApplicantCase();
  return (
    <>
      <output data-testid="case-stage">{applicantCase.stage}</output>
      <output data-testid="condition-count">
        {applicantCase.conditions.length}
      </output>
      <output data-testid="providers-complete">
        {applicantCase.providerCollectionComplete ? "yes" : "no"}
      </output>
      <output data-testid="legal-name">
        {applicantCase.applicant.legalName.value}
      </output>
    </>
  );
}

function extractionResponse(
  summary: string,
  providerListStatus: "complete" | "more_possible" | "unknown",
  facts: Array<Record<string, unknown>> = [],
  followUpQuestion = "",
) {
  return {
    ok: true,
    json: async () => ({
      extraction: {
        summary,
        followUpQuestion,
        providerListStatus,
        facts,
      },
    }),
  };
}
