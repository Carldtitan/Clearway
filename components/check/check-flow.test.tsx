import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CaseProvider } from "@/components/app/case-context";
import { CheckFlow } from "@/components/check/check-flow";

describe("CheckFlow", () => {
  it("loads the synthetic case and continues without persisting it", async () => {
    const user = userEvent.setup();
    render(
      <CaseProvider>
        <CheckFlow />
      </CaseProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Load Elena’s demo" }));

    expect(
      await screen.findByRole("heading", {
        name: "One detail needs a closer look",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Possible work-income issue")).toBeInTheDocument();
    expect(
      screen.getByText("The recent-work estimate may be short"),
    ).toBeInTheDocument();
  });

  it("does not advance until each earnings question is answered", async () => {
    const user = userEvent.setup();
    render(
      <CaseProvider>
        <CheckFlow />
      </CaseProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Check where I stand" }),
    );
    await user.type(
      await screen.findByRole("spinbutton", {
        name: "Average monthly work earnings",
      }),
      "900",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByText("Answer each question on this step to continue."),
    ).toBeInTheDocument();
  });
});
