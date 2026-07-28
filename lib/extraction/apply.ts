import type { Dispatch } from "react";

import type {
  CanonicalValue,
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

export function applyInterviewExtraction(
  dispatch: Dispatch<CaseAction>,
  extraction: InterviewExtraction,
  turnId: string,
  createId: IdFactory = (prefix) => `${prefix}-${crypto.randomUUID()}`,
) {
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
          entity: conditionFrom(facts, turnId, createId),
        });
        break;
      case "provider":
        dispatch({
          type: "ADD_ENTITY",
          collection: "providers",
          entity: providerFrom(facts, turnId, createId),
        });
        break;
      case "medication":
        dispatch({
          type: "ADD_ENTITY",
          collection: "medications",
          entity: medicationFrom(facts, turnId, createId),
        });
        break;
      case "job":
        dispatch({
          type: "ADD_ENTITY",
          collection: "jobs",
          entity: jobFrom(facts, turnId, createId),
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
  createId: IdFactory,
): Condition {
  const confidence = lowestConfidence(facts);
  return {
    id: createId("condition"),
    name: candidate(one(facts, "condition.name"), confidence, turnId),
    allegedOnsetDate: candidate(
      one(facts, "condition.allegedOnsetDate"),
      confidence,
      turnId,
    ),
    symptoms: candidate(many(facts, "condition.symptom"), confidence, turnId),
    workEffects: candidate(
      many(facts, "condition.workEffect"),
      confidence,
      turnId,
    ),
  };
}

function providerFrom(
  facts: ExtractedFact[],
  turnId: string,
  createId: IdFactory,
): Provider {
  const confidence = lowestConfidence(facts);
  const address = providerAddress(facts);
  return {
    id: createId("provider"),
    name: candidate(one(facts, "provider.name"), confidence, turnId),
    facility: candidate(one(facts, "provider.facility"), confidence, turnId),
    specialty: candidate(one(facts, "provider.specialty"), confidence, turnId),
    address: candidate(address, confidence, turnId),
    phone: candidate(one(facts, "provider.phone"), confidence, turnId),
    firstTreatmentDate: candidate(
      one(facts, "provider.firstTreatmentDate"),
      confidence,
      turnId,
    ),
    lastTreatmentDate: candidate(
      one(facts, "provider.lastTreatmentDate"),
      confidence,
      turnId,
    ),
    nextAppointmentDate: candidate(
      one(facts, "provider.nextAppointmentDate"),
      confidence,
      turnId,
    ),
    conditionIds: [],
  };
}

function medicationFrom(
  facts: ExtractedFact[],
  turnId: string,
  createId: IdFactory,
): Medication {
  const confidence = lowestConfidence(facts);
  return {
    id: createId("medication"),
    name: candidate(one(facts, "medication.name"), confidence, turnId),
    dosage: candidate(one(facts, "medication.dosage"), confidence, turnId),
    frequency: candidate(
      one(facts, "medication.frequency"),
      confidence,
      turnId,
    ),
    prescriberProviderId: candidate<string>(null, confidence, turnId),
    reason: candidate(one(facts, "medication.reason"), confidence, turnId),
    sideEffects: candidate(
      many(facts, "medication.sideEffect"),
      confidence,
      turnId,
    ),
  };
}

function jobFrom(
  facts: ExtractedFact[],
  turnId: string,
  createId: IdFactory,
): Job {
  const confidence = lowestConfidence(facts);
  return {
    id: createId("job"),
    employer: candidate(one(facts, "job.employer"), confidence, turnId),
    title: candidate(one(facts, "job.title"), confidence, turnId),
    startDate: candidate(one(facts, "job.startDate"), confidence, turnId),
    endDate: candidate(one(facts, "job.endDate"), confidence, turnId),
    hoursPerDay: candidate(
      numberValue(facts, "job.hoursPerDay"),
      confidence,
      turnId,
    ),
    daysPerWeek: candidate(
      numberValue(facts, "job.daysPerWeek"),
      confidence,
      turnId,
    ),
    pay: candidate(numberValue(facts, "job.pay"), confidence, turnId),
    duties: candidate(many(facts, "job.duty"), confidence, turnId),
    physicalDemands: candidate<PhysicalDemands>(null, confidence, turnId),
    toolsAndMachines: candidate([], confidence, turnId),
    supervision: candidate<string>(null, confidence, turnId),
    writingAndReports: candidate<string>(null, confidence, turnId),
    reasonEnded: candidate(one(facts, "job.reasonEnded"), confidence, turnId),
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
): CanonicalValue<T> {
  const provenance: Provenance = {
    source: "voice",
    state: value === null ? "missing" : "unconfirmed",
    confidence,
    turnId,
    capturedAt: new Date().toISOString(),
  };
  return { value, provenance };
}
