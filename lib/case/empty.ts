import { syntheticApplicant } from "@/lib/case/seed";
import type { ApplicantCase, PostalAddress } from "@/lib/case/types";
import { canonicalValue as cv } from "@/lib/case/value";

export function createEmptyApplicantCase(): ApplicantCase {
  return {
    ...structuredClone(syntheticApplicant),
    caseId: "current-session",
    mode: "session",
    stage: "check",
    applicant: {
      legalName: cv<string>(null, "missing", "typed"),
      otherNames: cv<string[]>([], "confirmed", "typed"),
      ssn: cv<string>(null, "missing", "typed"),
      dateOfBirth: cv<string>(null, "missing", "typed"),
      placeOfBirth: cv<string>(null, "missing", "typed"),
      citizenship: cv<string>(null, "missing", "typed"),
      preferredLanguage: cv("English", "confirmed", "typed"),
      address: cv<PostalAddress>(null, "missing", "typed"),
      phone: cv<string>(null, "missing", "typed"),
      email: cv<string>(null, "missing", "typed"),
    },
    eligibilityInput: {
      monthlyEarningsUsd: null,
      statutorilyBlind: null,
      impairmentRelatedWorkExpensesUsd: null,
      employerSubsidyPossible: null,
      selfEmployed: null,
      selfEmploymentProfitUsd: null,
      passiveIncomeIncluded: null,
      conditionExpectedToLast12Months: null,
      conditionExpectedToResultInDeath: null,
      dateOfBirth: null,
      allegedOnsetDate: null,
      estimatedLifetimeCredits: null,
      creditsLast3Years: null,
      creditsLast10Years: null,
      workedYearsAfter21BeforeOnset: null,
    },
    conditions: [],
    providers: [],
    medications: [],
    jobs: [],
    marriages: [],
    children: [],
    servedInMilitary: cv<boolean>(null, "missing", "typed"),
    nonCitizen: cv<boolean>(null, "missing", "typed"),
    workedLastYear: cv<boolean>(null, "missing", "typed"),
    currentlyEarning: cv<boolean>(null, "missing", "typed"),
    bankDetailsReady: cv<boolean>(null, "missing", "typed"),
    interviewTurns: [],
    providerCollectionComplete: false,
    recordRequests: [],
    authorization: {
      signedAt: null,
      additionalBlankOriginalRequested: false,
    },
    documentState: {
      generatedRevision: null,
      status: "not_started",
    },
    revision: 0,
  };
}
