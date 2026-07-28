import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { syntheticApplicant } from "@/lib/case/seed";
import { buildDocumentChecklist } from "@/lib/rules/checklist";
import {
  addCalendarDays,
  authorizationWarningDue,
  evaluateRecordRequest,
} from "@/lib/rules/deadlines";
import { TRACKER_CONFIG } from "@/lib/rules/config";
import {
  partitionForForm,
  validateCrossForm,
} from "@/lib/rules/consistency";

describe("deterministic core", () => {
  it("Feature: ssdi-assistant, Property 15: checklist is exact and deterministic", () => {
    const first = buildDocumentChecklist(syntheticApplicant);
    const second = buildDocumentChecklist(structuredClone(syntheticApplicant));
    expect(first).toEqual(second);
    expect(new Set(first.map((item) => item.id)).size).toBe(first.length);
    expect(first.every((item) => item.ruleId && item.reason)).toBe(true);
  });

  it("Feature: ssdi-assistant, Property 17: overflow is lossless", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { maxLength: 40 }),
        fc.integer({ min: 0, max: 20 }),
        (items, capacity) => {
          const result = partitionForForm(items, capacity);
          expect([...result.base, ...result.overflow]).toEqual(items);
        },
      ),
    );
  });

  it("Feature: ssdi-assistant, Property 22: deadline arithmetic is calendar-correct", () => {
    expect(addCalendarDays("2026-01-31", 30)).toBe("2026-03-02");
    expect(addCalendarDays("2024-02-01", 30)).toBe("2024-03-02");
    const action = evaluateRecordRequest(
      syntheticApplicant.recordRequests[1],
      "2026-07-28",
      TRACKER_CONFIG,
    );
    expect(action.state).toBe("day_20");
    expect(action.deadline).toBe("2026-08-05");
  });

  it("warns about the seeded SSA-827 at eleven months", () => {
    expect(
      authorizationWarningDue(
        syntheticApplicant.authorization.signedAt,
        "2026-07-28",
        TRACKER_CONFIG,
      ),
    ).toBe(true);
  });

  it("keeps the synthetic case packet-ready with no blocking issue", () => {
    const blocking = validateCrossForm(syntheticApplicant).filter(
      (issue) => issue.severity === "blocking",
    );
    expect(blocking).toEqual([]);
  });
});
