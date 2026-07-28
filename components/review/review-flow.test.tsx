import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CaseProvider, useApplicantCase } from "@/components/app/case-context";
import { ReviewFlow } from "@/components/review/review-flow";
import { syntheticApplicant } from "@/lib/case/seed";

describe("ReviewFlow", () => {
  it("requires confirmation before packet generation", async () => {
    const user = userEvent.setup();
    const reviewCase = structuredClone(syntheticApplicant);
    reviewCase.stage = "review";

    render(
      <CaseProvider initialCase={reviewCase}>
        <ReviewFlow />
        <StageProbe />
      </CaseProvider>,
    );

    const buildButton = screen.getByRole("button", {
      name: "Build my packet",
    });
    expect(buildButton).toBeDisabled();
    expect(screen.getByText("1 detail needs you")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(buildButton).toBeEnabled();
    expect(screen.getByText("Ready to build")).toBeInTheDocument();

    await user.click(buildButton);
    expect(screen.getByTestId("case-stage")).toHaveTextContent("packet");
  });

  it("surfaces possible duplicate providers without merging them", async () => {
    const user = userEvent.setup();
    const reviewCase = structuredClone(syntheticApplicant);
    reviewCase.stage = "review";
    reviewCase.providers.push({
      ...structuredClone(reviewCase.providers[0]),
      id: "possible-duplicate-provider",
    });

    render(
      <CaseProvider initialCase={reviewCase}>
        <ReviewFlow />
      </CaseProvider>,
    );
    await user.click(screen.getByRole("button", { name: /Providers/ }));

    expect(screen.getAllByText(/Possible duplicate/)).toHaveLength(2);
    expect(
      screen.getAllByRole("button", {
        name: `Remove ${reviewCase.providers[0].name.value}`,
      }),
    ).toHaveLength(2);
  });
});

function StageProbe() {
  const { applicantCase } = useApplicantCase();
  return <output data-testid="case-stage">{applicantCase.stage}</output>;
}
