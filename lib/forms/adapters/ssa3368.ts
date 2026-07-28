import type { ApplicantCase } from "@/lib/case/types";
import {
  conditionNames,
  createAdapterResult,
  providerName,
} from "@/lib/forms/adapters/shared";
import type { AnvilFieldValue } from "@/lib/forms/types";
import {
  digitsOnly,
  splitFullName,
  toAnvilAddress,
} from "@/lib/forms/value";
import { generateRemarks } from "@/lib/documents/remarks";
import { partitionForForm } from "@/lib/rules/consistency";

export function adaptSsa3368(applicantCase: ApplicantCase) {
  const applicant = applicantCase.applicant;
  const data: Record<string, AnvilFieldValue | null> = {
    applicantNameFirstMiddleInitialLastSuffix: splitFullName(
      applicant.legalName.value,
    ),
    socialSecurityNumber: digitsOnly(applicant.ssn.value),
    applicantMailingAddress: toAnvilAddress(applicant.address.value),
    emailAddress: applicant.email.value,
    primaryDaytimePhoneNumber: applicant.phone.value,
    preferredLanguageIfNotEnglish:
      applicant.preferredLanguage.value === "English"
        ? null
        : applicant.preferredLanguage.value,
    canSpeakAndUnderstandEnglish:
      applicant.preferredLanguage.value === "English"
        ? "Can Speak and Understand English - Yes"
        : "Can Speak and Understand English - No",
    canReadEnglish: "Can Read English - Yes",
    canWriteMoreThanNameInEnglish:
      "Can Write More Than Name in English - Yes",
    "5ADateCompletedMmYyyy": applicantCase.education.completionDate.value,
    "5ASchoolAddress": toAnvilAddress(
      applicantCase.education.schoolAddress.value,
    ),
    "5BSpecialEducation":
      applicantCase.education.specialEducation.value === null
        ? null
        : applicantCase.education.specialEducation.value
          ? "Special Education - Yes"
          : "Special Education - No",
    "5BReasonSForSpecialEducation":
      applicantCase.education.specialEducationDetails.value,
    trainingReceived5C:
      applicantCase.education.training.value === null
        ? null
        : applicantCase.education.training.value.length > 0
          ? "Training Received - Yes"
          : "Training Received - No",
    nameOfTrainingFacility: applicantCase.education.trainingFacility.value,
    trainingFacilityPhoneNumber:
      applicantCase.education.trainingFacilityPhone.value,
    trainingFacilityAddress: toAnvilAddress(
      applicantCase.education.trainingFacilityAddress.value,
    ),
    writtenLanguageUsedEveryDay5D:
      applicantCase.education.writtenLanguage.value,
    currentlyWorkingStatus:
      applicantCase.currentlyEarning.value === null
        ? null
        : applicantCase.currentlyEarning.value
          ? "Currently Working - Yes Currently Working"
          : "Currently Working - Stopped Working",
    dateStoppedWorking: applicantCase.jobs[0]?.endDate.value ?? null,
    stoppedWorkingReason: applicantCase.jobs[0]?.reasonEnded.value
      ? "Stopped Working - Because of Condition(s)"
      : null,
    conditionsBecameSevereDateStoppedForOtherReasons:
      applicantCase.eligibilityInput.allegedOnsetDate,
    hadJobIn5YearsBeforeDisability6A:
      applicantCase.jobs.length > 0
        ? "YES - Had Job in 5 Years Before Disability (Complete table below)"
        : "NO - Had Job in 5 Years Before Disability (Go to Section 7)",
    moreThanOneJobVsOnlyOneJob:
      applicantCase.jobs.length > 1
        ? "I had more than one job"
        : "I had only one job",
    currentlyTakingMedicines:
      applicantCase.medications.length > 0
        ? "Currently taking medicines - Yes"
        : "Currently taking medicines - No",
    "8AHaveYouSeenOrReceivedTreatment":
      applicantCase.providers.length > 0
        ? "Yes (Complete the chart below)"
        : "No (Go to Section 9)",
    section11Remarks: generateRemarks(applicantCase) || "None",
    dateReportCompleted: new Date().toISOString().slice(0, 10),
    whoIsCompletingThisReport:
      "Who is completing this report - The person listed in 1.A.",
    daytimePhoneNumber: applicant.phone.value,
  };

  const educationAlias = highestEducationAlias(
    applicantCase.education.highestLevel.value,
  );
  if (educationAlias) data[educationAlias] = true;

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
    data["6B5DidThisJobRequireInteractionWithOthers"] =
      "6.B.5. Did this job require interaction with others - YES";
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

function highestEducationAlias(level: string | null): string | null {
  if (!level) return null;
  const normalized = level.trim().toLocaleLowerCase();
  if (normalized.includes("ged")) return "5AGed";
  const collegeYears = normalized.match(/(?:college|university)\D*(\d+)/)?.[1];
  if (collegeYears) {
    const years = Math.min(4, Number(collegeYears));
    return years >= 4 ? "5ACollege4OrMore" : `5ACollege${years}`;
  }
  const grade = normalized.match(/\b(1[0-2]|[0-9])\b/)?.[1];
  if (grade) return `5AGrade${grade}`;
  if (normalized.includes("kindergarten")) return "5AGradeK";
  return null;
}
