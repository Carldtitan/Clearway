import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CaseProvider } from "@/components/app/case-context";
import { PacketFlow } from "@/components/packet/packet-flow";
import { syntheticApplicant } from "@/lib/case/seed";

describe("PacketFlow", () => {
  it("shows the exact packet and personalized checklist before generation", () => {
    const applicantCase = structuredClone(syntheticApplicant);
    applicantCase.stage = "packet";
    applicantCase.conditions[1].allegedOnsetDate.provenance.state =
      "confirmed";
    render(
      <CaseProvider initialCase={applicantCase}>
        <PacketFlow />
      </CaseProvider>,
    );

    expect(
      screen.getByRole("heading", {
        name: /turn one review into a filing packet/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("SSA-16").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SSA-827").length).toBeGreaterThan(0);
    expect(screen.getByText("Evidence index")).toBeInTheDocument();
    expect(screen.getByText("Recent pay stubs or business-profit records"))
      .toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /generate packet/i }),
    ).toBeEnabled();
  });
});

