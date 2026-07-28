import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CaseProvider, useApplicantCase } from "@/components/app/case-context";
import { InterviewFlow } from "@/components/interview/interview-flow";

vi.mock("@/components/visual/orb", () => ({
  default: () => <div data-testid="voice-orb" />,
}));

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
});

function StageProbe() {
  const { applicantCase } = useApplicantCase();
  return <output data-testid="case-stage">{applicantCase.stage}</output>;
}
