import type { ApplicantCase } from "@/lib/case/types";
import { createAdapterResult } from "@/lib/forms/adapters/shared";
import type { AnvilFieldValue } from "@/lib/forms/types";
import {
  splitFullName,
  toAnvilAddress,
  yesNo,
} from "@/lib/forms/value";

export function adaptSsa16(applicantCase: ApplicantCase) {
  const applicant = applicantCase.applicant;
  const firstMarriage = applicantCase.marriages[0];
  const firstJob = applicantCase.jobs[0];
  const mailingAddress = toAnvilAddress(applicant.address.value);
  const data: Record<string, AnvilFieldValue | null> = {
    fullNameFirstMiddleInitialLast: splitFullName(applicant.legalName.value),
    socialSecurityNumber: applicant.ssn.value,
    dateOfBirth: applicant.dateOfBirth.value,
    cityStateCountryOfBirth: applicant.placeOfBirth.value,
    usCitizenYesNo:
      applicant.citizenship.value === null
        ? null
        : applicant.citizenship.value === "United States"
          ? "Yes"
          : "No",
    usCitizen:
      applicant.citizenship.value === null
        ? null
        : applicant.citizenship.value === "United States"
          ? "Yes"
          : "No",
    usedOtherNames: yesNo((applicant.otherNames.value?.length ?? 0) > 0),
    otherNameSUsed: applicant.otherNames.value?.join(", ") || null,
    usedOtherSocialSecurityNumbers: "No",
    dateConditionBecameSevereEnoughToPreventWork:
      applicantCase.eligibilityInput.allegedOnsetDate,
    railroadIndustryWork: "No",
    socialSecurityCreditsUnderAnotherCountry: "No",
    haveYouEverBeenMarried: yesNo(applicantCase.marriages.length > 0),
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
    item15ASelfEmployed: yesNo(
      applicantCase.eligibilityInput.selfEmployed,
    ),
    earningsThisYearSoFarAmount:
      applicantCase.eligibilityInput.monthlyEarningsUsd,
    item17AStillUnableToWork: "Yes",
    item19BlindOrLowVision: yesNo(
      applicantCase.eligibilityInput.statutorilyBlind,
    ),
    remarks:
      "Prepared from applicant-reviewed answers. Applicant must review, sign, and file.",
    applicantSignatureDate: { value: "", readOnly: false },
    applicantSignatureFirstNameMiddleInitialLastName: {
      value: "",
      readOnly: false,
    },
    telephoneNumberIncludeAreaCode: applicant.phone.value,
    directDepositOption: applicantCase.bankDetailsReady.value ? "Yes" : null,
    applicantMailingAddress: mailingAddress,
  };

  return createAdapterResult("ssa16", "SSA-16-BK", data, {
    interactive: true,
    defaultReadOnly: true,
  });
}

