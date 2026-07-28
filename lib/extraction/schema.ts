import { z } from "zod";

export const factFieldSchema = z.enum([
  "applicant.legalName",
  "applicant.otherNames",
  "applicant.dateOfBirth",
  "applicant.placeOfBirth",
  "applicant.citizenship",
  "applicant.preferredLanguage",
  "applicant.phone",
  "applicant.email",
  "servedInMilitary",
  "nonCitizen",
  "workedLastYear",
  "currentlyEarning",
  "bankDetailsReady",
  "condition.name",
  "condition.allegedOnsetDate",
  "condition.symptom",
  "condition.workEffect",
  "provider.name",
  "provider.facility",
  "provider.specialty",
  "provider.addressLine1",
  "provider.addressLine2",
  "provider.city",
  "provider.state",
  "provider.zip",
  "provider.phone",
  "provider.firstTreatmentDate",
  "provider.lastTreatmentDate",
  "provider.nextAppointmentDate",
  "provider.conditionTreated",
  "medication.name",
  "medication.dosage",
  "medication.frequency",
  "medication.prescriber",
  "medication.reason",
  "medication.sideEffect",
  "job.employer",
  "job.title",
  "job.startDate",
  "job.endDate",
  "job.hoursPerDay",
  "job.daysPerWeek",
  "job.pay",
  "job.duty",
  "job.reasonEnded",
]);

export const extractedFactSchema = z.object({
  kind: z.enum(["scalar", "condition", "provider", "medication", "job"]),
  entityKey: z.string(),
  field: factFieldSchema,
  value: z.string(),
  confidence: z.number().min(0).max(1),
  evidenceText: z.string(),
});

export const interviewExtractionSchema = z.object({
  summary: z.string(),
  followUpQuestion: z.string(),
  providerListStatus: z.enum(["complete", "more_possible", "unknown"]),
  facts: z.array(extractedFactSchema),
});

export const extractionRequestSchema = z.object({
  turnId: z.string().min(1).max(100),
  transcript: z.string().trim().min(1).max(8_000),
});

export type ExtractedFact = z.infer<typeof extractedFactSchema>;
export type InterviewExtraction = z.infer<typeof interviewExtractionSchema>;
export type ExtractionRequest = z.infer<typeof extractionRequestSchema>;
