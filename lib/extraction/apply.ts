import type { Dispatch } from "react";

import type {
  CanonicalValue,
  CaptureSource,
  CaseAction,
  Condition,
  Job,
  Medication,
  PhysicalDemands,
  PostalAddress,
  Provider,
  Provenance,
} from "@/lib/case/types";
import type {
  ExtractedFact,
  InterviewExtraction,
} from "@/lib/extraction/schema";

type IdFactory = (prefix: string) => string;
type EntityKind = Exclude<ExtractedFact["kind"], "scalar">;

interface ApplyExtractionOptions {
  createId?: IdFactory;
  source?: CaptureSource;
}

export function applyInterviewExtraction(
  dispatch: Dispatch<CaseAction>,
  extraction: InterviewExtraction,
  turnId: string,
  options: ApplyExtractionOptions = {},
) {
  const createId =
    options.createId ?? ((prefix) => `${prefix}-${crypto.randomUUID()}`);
  const source = options.source ?? "voice";
  extraction.facts
    .filter((fact) => compatibleFact(fact) && fact.kind === "scalar")
    .forEach((fact) => {
      dispatch({
        type: "APPLY_CANDIDATE_PATCH",
        patch: {
          path: fact.field,
          value: scalarValue(fact),
          confidence: fact.confidence,
          evidenceText: fact.evidenceText,
          turnId,
          source,
        },
      });
    });

  const grouped = groupEntities(
    extraction.facts.filter(
      (fact) => compatibleFact(fact) && fact.kind !== "scalar",
    ),
  );
  grouped.forEach((facts) => {
    const kind = facts[0].kind as EntityKind;
    switch (kind) {
      case "condition":
        dispatch({
          type: "ADD_ENTITY",
          collection: "conditions",
          entity: conditionFrom(facts, turnId, source, createId),
        });
        break;
      case "provider":
        dispatch({
          type: "ADD_ENTITY",
          collection: "providers",
          entity: providerFrom(facts, turnId, source, createId),
        });
        break;
      case "medication":
        dispatch({
          type: "ADD_ENTITY",
          collection: "medications",
          entity: medicationFrom(facts, turnId, source, createId),
        });
        break;
      case "job":
        dispatch({
          type: "ADD_ENTITY",
          collection: "jobs",
          entity: jobFrom(facts, turnId, source, createId),
        });
        break;
    }
  });

  dispatch({
    type: "SET_PROVIDER_COLLECTION_COMPLETE",
    complete: extraction.providerListStatus === "complete",
  });
}

const scalarFields = new Set<ExtractedFact["field"]>([
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
]);

function compatibleFact(fact: ExtractedFact): boolean {
  if (fact.kind === "scalar") return scalarFields.has(fact.field);
  return fact.field.startsWith(`${fact.kind}.`);
}

function groupEntities(facts: ExtractedFact[]): ExtractedFact[][] {
  const groups = new Map<string, ExtractedFact[]>();
  facts.forEach((fact) => {
    const key = `${fact.kind}:${fact.entityKey.trim().toLocaleLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), fact]);
  });
  return [...groups.values()];
}

function conditionFrom(
  facts: ExtractedFact[],
  turnId: string,
  source: CaptureSource,
  createId: IdFactory,
): Condition {
  const confidence = lowestConfidence(facts);
  return {
    id: createId("condition"),
    name: candidate(one(facts, "condition.name"), confidence, turnId, source),
    allegedOnsetDate: candidate(
      one(facts, "condition.allegedOnsetDate"),
      confidence,
      turnId,
      source,
    ),
    symptoms: candidate(
      many(facts, "condition.symptom"),
      confidence,
      turnId,
      source,
    ),
    workEffects: candidate(
      many(facts, "condition.workEffect"),
      confidence,
      turnId,
      source,
    ),
  };
}

function providerFrom(
  facts: ExtractedFact[],
  turnId: string,
  source: CaptureSource,
  createId: IdFactory,
): Provider {
  const confidence = lowestConfidence(facts);
  const address = providerAddress(facts);
  return {
    id: createId("provider"),
    name: candidate(one(facts, "provider.name"), confidence, turnId, source),
    facility: candidate(
      one(facts, "provider.facility"),
      confidence,
      turnId,
      source,
    ),
    specialty: candidate(
      one(facts, "provider.specialty"),
      confidence,
      turnId,
      source,
    ),
    address: candidate(address, confidence, turnId, source),
    phone: candidate(one(facts, "provider.phone"), confidence, turnId, source),
    firstTreatmentDate: candidate(
      one(facts, "provider.firstTreatmentDate"),
      confidence,
      turnId,
      source,
    ),
    lastTreatmentDate: candidate(
      one(facts, "provider.lastTreatmentDate"),
      confidence,
      turnId,
      source,
    ),
    nextAppointmentDate: candidate(
      one(facts, "provider.nextAppointmentDate"),
      confidence,
      turnId,
      source,
    ),
    conditionIds: [],
  };
}

function medicationFrom(
  facts: ExtractedFact[],
  turnId: string,
  source: CaptureSource,
  createId: IdFactory,
): Medication {
  const confidence = lowestConfidence(facts);
  return {
    id: createId("medication"),
    name: candidate(one(facts, "medication.name"), confidence, turnId, source),
    dosage: candidate(
      one(facts, "medication.dosage"),
      confidence,
      turnId,
      source,
    ),
    frequency: candidate(
      one(facts, "medication.frequency"),
      confidence,
      turnId,
      source,
    ),
    prescriberProviderId: candidate<string>(
      null,
      confidence,
      turnId,
      source,
    ),
    reason: candidate(
      one(facts, "medication.reason"),
      confidence,
      turnId,
      source,
    ),
    sideEffects: candidate(
      many(facts, "medication.sideEffect"),
      confidence,
      turnId,
      source,
    ),
  };
}

function jobFrom(
  facts: ExtractedFact[],
  turnId: string,
  source: CaptureSource,
  createId: IdFactory,
): Job {
  const confidence = lowestConfidence(facts);
  return {
    id: createId("job"),
    employer: candidate(one(facts, "job.employer"), confidence, turnId, source),
    title: candidate(one(facts, "job.title"), confidence, turnId, source),
    startDate: candidate(
      one(facts, "job.startDate"),
      confidence,
      turnId,
      source,
    ),
    endDate: candidate(one(facts, "job.endDate"), confidence, turnId, source),
    hoursPerDay: candidate(
      numberValue(facts, "job.hoursPerDay"),
      confidence,
      turnId,
      source,
    ),
    daysPerWeek: candidate(
      numberValue(facts, "job.daysPerWeek"),
      confidence,
      turnId,
      source,
    ),
    pay: candidate(numberValue(facts, "job.pay"), confidence, turnId, source),
    duties: candidate(many(facts, "job.duty"), confidence, turnId, source),
    physicalDemands: candidate<PhysicalDemands>(
      null,
      confidence,
      turnId,
      source,
    ),
    toolsAndMachines: candidate([], confidence, turnId, source),
    supervision: candidate<string>(null, confidence, turnId, source),
    writingAndReports: candidate<string>(null, confidence, turnId, source),
    reasonEnded: candidate(
      one(facts, "job.reasonEnded"),
      confidence,
      turnId,
      source,
    ),
  };
}

function providerAddress(facts: ExtractedFact[]): PostalAddress | null {
  const line1 = one(facts, "provider.addressLine1");
  const city = one(facts, "provider.city");
  const state = one(facts, "provider.state");
  const zip = one(facts, "provider.zip");
  if (!line1 || !city || !state || !zip) return null;
  return {
    line1,
    line2: one(facts, "provider.addressLine2") ?? undefined,
    city,
    state,
    zip,
  };
}

function scalarValue(fact: ExtractedFact): string | string[] | boolean {
  if (fact.field === "applicant.otherNames") {
    return fact.value
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (
    [
      "servedInMilitary",
      "nonCitizen",
      "workedLastYear",
      "currentlyEarning",
      "bankDetailsReady",
    ].includes(fact.field)
  ) {
    return ["yes", "true"].includes(fact.value.trim().toLocaleLowerCase());
  }
  return fact.value;
}

function one(facts: ExtractedFact[], field: ExtractedFact["field"]) {
  return facts.find((fact) => fact.field === field)?.value || null;
}

function many(facts: ExtractedFact[], field: ExtractedFact["field"]) {
  return facts.filter((fact) => fact.field === field).map((fact) => fact.value);
}

function numberValue(
  facts: ExtractedFact[],
  field: ExtractedFact["field"],
): number | null {
  const value = one(facts, field);
  if (value === null) return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function lowestConfidence(facts: ExtractedFact[]) {
  return Math.min(...facts.map((fact) => fact.confidence));
}

function candidate<T>(
  value: T | null,
  confidence: number,
  turnId: string,
  source: CaptureSource,
): CanonicalValue<T> {
  const provenance: Provenance = {
    source,
    state: value === null ? "missing" : "unconfirmed",
    confidence,
    turnId,
    capturedAt: new Date().toISOString(),
  };
  return { value, provenance };
}
