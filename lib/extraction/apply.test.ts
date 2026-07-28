import { describe, expect, it } from "vitest";

import { createEmptyApplicantCase } from "@/lib/case/empty";
import { caseReducer } from "@/lib/case/reducer";
import type { CaseAction } from "@/lib/case/types";
import { applyInterviewExtraction } from "@/lib/extraction/apply";
import {
  interviewExtractionSchema,
  type InterviewExtraction,
} from "@/lib/extraction/schema";

const extraction: InterviewExtraction = {
  summary: "Captured one condition and one provider.",
  followUpQuestion: "Was there anyone else?",
  providerListStatus: "more_possible",
  facts: [
    {
      kind: "scalar",
      entityKey: "",
      field: "applicant.legalName",
      value: "Jordan Lee",
      confidence: 0.99,
      evidenceText: "My name is Jordan Lee",
    },
    {
      kind: "condition",
      entityKey: "migraine",
      field: "condition.name",
      value: "chronic migraine",
      confidence: 0.94,
      evidenceText: "chronic migraines",
    },
    {
      kind: "condition",
      entityKey: "migraine",
      field: "condition.symptom",
      value: "light sensitivity",
      confidence: 0.92,
      evidenceText: "light hurts my eyes",
    },
    {
      kind: "provider",
      entityKey: "rivera",
      field: "provider.name",
      value: "Dr. Rivera",
      confidence: 0.9,
      evidenceText: "Dr. Rivera",
    },
  ],
};

describe("interview extraction boundary", () => {
  it("accepts schema-conforming candidate facts", () => {
    expect(interviewExtractionSchema.parse(extraction)).toEqual(extraction);
  });

  it("writes extracted values as unconfirmed candidates", () => {
    let applicantCase = createEmptyApplicantCase();
    const dispatch = (action: CaseAction) => {
      applicantCase = caseReducer(applicantCase, action);
    };

    applyInterviewExtraction(
      dispatch,
      extraction,
      "turn-1",
      { createId: (prefix) => `${prefix}-1` },
    );

    expect(applicantCase.applicant.legalName.value).toBe("Jordan Lee");
    expect(applicantCase.applicant.legalName.provenance.state).toBe(
      "unconfirmed",
    );
    expect(applicantCase.conditions).toHaveLength(1);
    expect(applicantCase.conditions[0].name.provenance.turnId).toBe("turn-1");
    expect(applicantCase.conditions[0].symptoms.value).toEqual([
      "light sensitivity",
    ]);
    expect(applicantCase.providers).toHaveLength(1);
    expect(applicantCase.providerCollectionComplete).toBe(false);
  });

  it("can confirm a canonical value inside a repeated collection", () => {
    let applicantCase = createEmptyApplicantCase();
    const dispatch = (action: CaseAction) => {
      applicantCase = caseReducer(applicantCase, action);
    };
    applyInterviewExtraction(
      dispatch,
      extraction,
      "turn-2",
      { createId: (prefix) => `${prefix}-2` },
    );

    applicantCase = caseReducer(applicantCase, {
      type: "CONFIRM_VALUE",
      path: "conditions.0.name",
    });

    expect(applicantCase.conditions[0].name.provenance.state).toBe("confirmed");
  });

  it("preserves typed provenance through scalar and repeated facts", () => {
    let applicantCase = createEmptyApplicantCase();
    const dispatch = (action: CaseAction) => {
      applicantCase = caseReducer(applicantCase, action);
    };

    applyInterviewExtraction(dispatch, extraction, "typed-turn", {
      createId: (prefix) => `${prefix}-typed`,
      source: "typed",
    });

    expect(applicantCase.applicant.legalName.provenance.source).toBe("typed");
    expect(applicantCase.conditions[0].name.provenance.source).toBe("typed");
    expect(applicantCase.providers[0].name.provenance.source).toBe("typed");
  });
});
