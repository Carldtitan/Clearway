import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CaseProvider } from "@/components/app/case-context";
import { RecordsTracker } from "@/components/records/records-tracker";
import { syntheticApplicant } from "@/lib/case/seed";
import { buildTrackerItems } from "@/lib/rules/tracker";

describe("records tracker", () => {
  it("sorts the demo into overdue, day-22 follow-up, and received states", () => {
    const items = buildTrackerItems(syntheticApplicant, "2026-07-28");
    expect(items.map((item) => item.action.state)).toEqual([
      "day_30",
      "day_20",
      "responded",
    ]);
    expect(items[1].action.daysSinceRequest).toBe(22);
  });

  it("shows the portal-first action, exact script, and escalation path", async () => {
    const user = userEvent.setup();
    const applicantCase = structuredClone(syntheticApplicant);
    applicantCase.stage = "records";
    render(
      <CaseProvider initialCase={applicantCase}>
        <RecordsTracker />
      </CaseProvider>,
    );

    expect(screen.getByText("Deadline passed")).toBeInTheDocument();
    expect(
      screen.getByText(/check the patient portal first/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/office for civil rights complaint/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/almost 12 months old/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /mercy general hospital/i }),
    );
    expect(screen.getByText("Jul 18, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mark received/i }),
    ).toBeEnabled();
  });
});

