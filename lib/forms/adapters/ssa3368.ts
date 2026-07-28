import type { ApplicantCase } from "@/lib/case/types";
import {
  conditionNames,
  createAdapterResult,
  providerName,
} from "@/lib/forms/adapters/shared";
import type { AnvilFieldValue } from "@/lib/forms/types";
import {
  splitFullName,
  toAnvilAddress,
  yesNo,
} from "@/lib/forms/value";
import { generateRemarks } from "@/lib/documents/remarks";
import { partitionForForm } from "@/lib/rules/consistency";

export function adaptSsa3368(applicantCase: ApplicantCase) {
  const applicant = applicantCase.applicant;
  const data: Record<string, AnvilFieldValue | null> = {
    applicantNameFirstMiddleInitialLastSuffix: splitFullName(
      applicant.legalName.value,
    ),
    socialSecurityNumber: applicant.ssn.value,
    applicantMailingAddress: toAnvilAddress(applicant.address.value),
    emailAddress: applicant.email.value,
    primaryDaytimePhoneNumber: applicant.phone.value,
    preferredLanguageIfNotEnglish:
      applicant.preferredLanguage.value === "English"
        ? null
        : applicant.preferredLanguage.value,
    currentlyWorkingStatus: yesNo(applicantCase.currentlyEarning.value),
    dateStoppedWorking: applicantCase.jobs[0]?.endDate.value ?? null,
    stoppedWorkingReason: applicantCase.jobs[0]?.reasonEnded.value
      ? "Because of my condition"
      : null,
    conditionsBecameSevereDateStoppedForOtherReasons:
      applicantCase.eligibilityInput.allegedOnsetDate,
    hadJobIn5YearsBeforeDisability6A: yesNo(applicantCase.jobs.length > 0),
    currentlyTakingMedicines: yesNo(applicantCase.medications.length > 0),
    "8AHaveYouSeenOrReceivedTreatment": yesNo(
      applicantCase.providers.length > 0,
    ),
    section11Remarks: generateRemarks(applicantCase) || "None",
    daytimePhoneNumber: applicant.phone.value,
  };

  applicantCase.conditions.slice(0, 5).forEach((condition, index) => {
    data[`medicalMentalCondition${index + 1}`] = condition.name.value;
  });

  applicantCase.jobs.slice(0, 5).forEach((job, index) => {
    const number = index + 1;
    data[`job${number}Title`] = job.title.value;
    data[`job${number}TypeOfBusiness`] = job.employer.value;
    data[`job${number}FromDate`] = job.startDate.value;
    data[`job${number}ToDate`] = job.endDate.value;
    data[`job${number}HoursPerDay`] = job.hoursPerDay.value;
    data[`job${number}DaysPerWeek`] = job.daysPerWeek.value;
    data[`job${number}RateOfPayAmount`] = job.pay.value;
    data[`job${number}RateOfPayFrequency`] = job.pay.value
      ? "per hour"
      : null;
  });

  const primaryJob = applicantCase.jobs[0];
  if (primaryJob) {
    data["6B1DescriptionOfTasksInATypicalWorkday"] =
      primaryJob.duties.value?.join("; ") ?? null;
    data["6B2DescriptionOfReportsWrittenOrCompleted"] =
      primaryJob.writingAndReports.value;
    data["6B3DescriptionOfSupervisoryDuties"] =
      primaryJob.supervision.value;
    data["6B4MachinesToolsAndEquipmentUsedRegularly"] =
      primaryJob.toolsAndMachines.value?.join(", ") ?? null;
    data["6B5DidThisJobRequireInteractionWithOthers"] = "Yes";
    data["6B5DescriptionOfInteractionsWithCoworkersPublic"] =
      "Worked with staff and customers.";
    const demands = primaryJob.physicalDemands.value;
    if (demands) {
      data.standingAndWalkingCombinedHoursMinutes = `${
        (demands.standingHours ?? 0) + (demands.walkingHours ?? 0)
      } hours`;
      data.sittingHoursMinutes =
        demands.sittingHours === null ? null : `${demands.sittingHours} hours`;
      data.stoopingHoursMinutes = demands.stooping;
      data.liftingAndCarryingDescription = demands.lifting;
    }
    data.howMedicalConditionsAffectAbilityToDoThisJob =
      applicantCase.conditions
        .flatMap((condition) => condition.workEffects.value ?? [])
        .join("; ") || null;
  }

  partitionForForm(applicantCase.medications, 11).base.forEach(
    (medication, index) => {
      const number = index + 1;
      data[`medicineName${number}`] = [
        medication.name.value,
        medication.dosage.value,
        medication.frequency.value,
      ]
        .filter(Boolean)
        .join(", ");
      data[`doctorNameForMedicine${number}`] = providerName(
        applicantCase,
        medication.prescriberProviderId.value,
      );
      data[`reasonForMedicine${number}`] = medication.reason.value;
    },
  );

  partitionForForm(applicantCase.providers, 6).base.forEach(
    (provider, index) => {
      const prefix = `8A${index + 1}`;
      data[`${prefix}NameOfFacilityOrOffice`] = provider.facility.value;
      data[`${prefix}NameOfHealthcareProviderThatTreatedYou`] = splitFullName(
        provider.name.value,
      );
      data[`${prefix}WhatMedicalConditionsWereTreatedOrEvaluated`] =
        conditionNames(applicantCase, provider.conditionIds);
      data[`${prefix}PhoneNumber`] = provider.phone.value;
      data[`${prefix}DateFirstSeen`] = provider.firstTreatmentDate.value;
      data[`${prefix}DateLastSeen`] = provider.lastTreatmentDate.value;
      data[`${prefix}DateOfNextAppointmentIfKnown`] =
        provider.nextAppointmentDate.value;
      data[
        index < 3 ? `${prefix}Address` : `${prefix}FullAddress`
      ] = toAnvilAddress(provider.address.value);
    },
  );

  return createAdapterResult("ssa3368", "SSA-3368-BK", data);
}
