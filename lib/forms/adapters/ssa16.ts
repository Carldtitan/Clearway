import type { ApplicantCase } from "@/lib/case/types";
import { createAdapterResult } from "@/lib/forms/adapters/shared";
import type { AnvilFieldValue } from "@/lib/forms/types";
import {
  digitsOnly,
  splitFullName,
  toAnvilAddress,
} from "@/lib/forms/value";

export function adaptSsa16(applicantCase: ApplicantCase) {
  const applicant = applicantCase.applicant;
  const firstMarriage = applicantCase.marriages[0];
  const firstJob = applicantCase.jobs[0];
  const mailingAddress = toAnvilAddress(applicant.address.value);
  const data: Record<string, AnvilFieldValue | null> = {
    fullNameFirstMiddleInitialLast: splitFullName(applicant.legalName.value),
    socialSecurityNumber: digitsOnly(applicant.ssn.value),
    // The published 09-2025 template inserted two preferred-language boxes
    // before date of birth, but retained aliases generated from the prior
    // order. These four assignments intentionally follow the live field
    // coordinates verified through the Cast schema and rendered PDF.
    dateOfBirth: applicant.preferredLanguage.value,
    cityStateCountryOfBirth: applicant.preferredLanguage.value,
    usCitizenYesNo: applicant.dateOfBirth.value,
    alienLawfullyPresentInUsYesNo: applicant.placeOfBirth.value,
    usCitizen:
      applicant.citizenship.value === null
        ? null
        : applicant.citizenship.value === "United States"
          ? "US Citizen - Yes"
          : "US Citizen - No",
    usedOtherNames:
      (applicant.otherNames.value?.length ?? 0) > 0
        ? "Used Other Names - Yes"
        : "Used Other Names - No",
    otherNameSUsed: applicant.otherNames.value?.join(", ") || null,
    usedOtherSocialSecurityNumbers: "Used Other SSN - No",
    dateConditionBecameSevereEnoughToPreventWork:
      applicantCase.eligibilityInput.allegedOnsetDate,
    railroadIndustryWork: "Railroad Industry Work - No",
    socialSecurityCreditsUnderAnotherCountry:
      "Social Security Credits Under Another Country - No",
    haveYouEverBeenMarried:
      applicantCase.marriages.length > 0
        ? "Have You Ever Been Married - Yes"
        : "Have You Ever Been Married - No",
    currentMarriageWriteNone: firstMarriage ? null : "None",
    currentSpouseNameIncludingMaidenName: firstMarriage
      ? splitFullName(firstMarriage.spouseName.value)
      : null,
    currentMarriageDateMonthDayYear: firstMarriage?.startDate.value ?? null,
    childrenFullNamesList:
      applicantCase.children
        .map((child) => child.name.value)
        .filter(Boolean)
        .join(", ") || null,
    employerNameAndAddressMostRecent: firstJob
      ? {
          street1: firstJob.employer.value ?? "Employer not confirmed",
          city: "",
          state: "",
          zip: "",
        }
      : null,
    employer1WorkBeganDate: firstJob?.startDate.value ?? null,
    employer1WorkEndedDate: firstJob?.endDate.value ?? null,
    item15ASelfEmployed:
      applicantCase.eligibilityInput.selfEmployed === null
        ? null
        : applicantCase.eligibilityInput.selfEmployed
          ? "Item 15a Self-Employed Yes"
          : "Item 15a Self-Employed No",
    earningsThisYearSoFarAmount:
      applicantCase.eligibilityInput.monthlyEarningsUsd,
    item17AStillUnableToWork: "Item 17a Still Unable to Work Yes",
    item19BlindOrLowVision:
      applicantCase.eligibilityInput.statutorilyBlind === null
        ? null
        : applicantCase.eligibilityInput.statutorilyBlind
          ? "Item 19 Blind or Low Vision Yes"
          : "Item 19 Blind or Low Vision No",
    remarks:
      "Prepared from applicant-reviewed answers. Applicant must review, sign, and file.",
    telephoneNumberIncludeAreaCode: applicant.phone.value,
    applicantMailingAddress: mailingAddress,
  };

  return createAdapterResult("ssa16", "SSA-16-BK", data);
}
