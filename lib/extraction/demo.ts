import type { InterviewExtraction } from "@/lib/extraction/schema";

export const DEMO_TRANSCRIPT =
  "The spinal stenosis causes burning pain down my right leg and I can only stand for about fifteen minutes. Migraines make me miss two or three days a month. Dr. Maya Chen at Sacramento Spine and Rehab treats my back, and Dr. Simon Owens at River City Neurology treats the migraines. I went to Mercy General when my back suddenly got worse. Those are all the places. I take gabapentin, 300 milligrams three times a day, and it makes me drowsy. I stopped working as a bakery shift lead because I could not stay on my feet or lift the flour bags.";

export const DEMO_EXTRACTION: InterviewExtraction = {
  summary:
    "Captured two conditions, three sources of care, one medication, and the last job.",
  followUpQuestion:
    "What dates did you work at the bakery, and about how many hours did you work each day?",
  providerListStatus: "complete",
  facts: [
    fact("condition", "spinal stenosis", "condition.name", "Spinal stenosis"),
    fact(
      "condition",
      "spinal stenosis",
      "condition.symptom",
      "burning pain down right leg",
    ),
    fact(
      "condition",
      "spinal stenosis",
      "condition.workEffect",
      "can stand about 15 minutes",
    ),
    fact("condition", "migraine", "condition.name", "Migraine"),
    fact(
      "condition",
      "migraine",
      "condition.workEffect",
      "misses work two or three days a month",
    ),
    fact("provider", "maya chen", "provider.name", "Dr. Maya Chen"),
    fact(
      "provider",
      "maya chen",
      "provider.facility",
      "Sacramento Spine and Rehab",
    ),
    fact("provider", "simon owens", "provider.name", "Dr. Simon Owens"),
    fact(
      "provider",
      "simon owens",
      "provider.facility",
      "River City Neurology",
    ),
    fact(
      "provider",
      "mercy general",
      "provider.name",
      "Mercy General Hospital",
    ),
    fact("medication", "gabapentin", "medication.name", "Gabapentin"),
    fact("medication", "gabapentin", "medication.dosage", "300 mg"),
    fact(
      "medication",
      "gabapentin",
      "medication.frequency",
      "three times daily",
    ),
    fact("medication", "gabapentin", "medication.sideEffect", "drowsiness"),
    fact("job", "bakery", "job.title", "Bakery shift lead"),
    fact(
      "job",
      "bakery",
      "job.reasonEnded",
      "could not stay on feet or lift flour bags",
    ),
  ],
};

function fact(
  kind: "condition" | "provider" | "medication" | "job",
  entityKey: string,
  field: InterviewExtraction["facts"][number]["field"],
  value: string,
): InterviewExtraction["facts"][number] {
  return {
    kind,
    entityKey,
    field,
    value,
    confidence: 0.96,
    evidenceText: value,
  };
}
