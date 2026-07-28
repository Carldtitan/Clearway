import type { ApplicantCase } from "@/lib/case/types";
import { createAdapterResult } from "@/lib/forms/adapters/shared";
import {
  splitFullName,
  toAnvilAddress,
} from "@/lib/forms/value";

export function adaptSsa827(applicantCase: ApplicantCase) {
  const applicant = applicantCase.applicant;
  return createAdapterResult(
    "ssa827",
    "SSA-827",
    {
      nameFirstMiddleLastSuffix: splitFullName(applicant.legalName.value),
      ssn: applicant.ssn.value,
      birthday: applicant.dateOfBirth.value,
      additionalInformationToIdentifySubjectOtherNamesSpecificSourceMaterialToBeDisclosed:
        applicant.otherNames.value?.length
          ? `Other names used: ${applicant.otherNames.value.join(", ")}`
          : "No other names reported.",
      authorityToSignRadio: "Individual",
      individualAuthorizingDisclosureSignature: {
        value: "",
        readOnly: false,
      },
      parentGuardianPersonalRepresentativeSignIfTwoSignaturesRequiredByStateLaw:
        { value: "", readOnly: false },
      dateSigned: { value: "", readOnly: false },
      signerStreetAddress: toAnvilAddress(applicant.address.value),
      phoneNumberWithAreaCode: applicant.phone.value,
      witnessSignature: { value: "", readOnly: false },
      secondWitnessSignature: { value: "", readOnly: false },
      witnessPhoneNumberOrAddress: { value: "", readOnly: false },
      secondWitnessPhoneNumberOrAddress: {
        value: "",
        readOnly: false,
      },
    },
    { interactive: true, defaultReadOnly: true },
  );
}

