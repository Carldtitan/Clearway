import "server-only";

import { PDFDocument } from "pdf-lib";

import { fillAnvilForm, generateAnvilDocument } from "@/lib/anvil/client";
import { collectReviewIssues } from "@/lib/case/review";
import type { ApplicantCase } from "@/lib/case/types";
import { buildContinuationSheet } from "@/lib/documents/continuation";
import { buildEvidenceIndex } from "@/lib/documents/evidence-index";
import { buildFormPayloads } from "@/lib/forms/adapters";
import { validateCrossForm } from "@/lib/rules/consistency";

export interface GeneratedPacket {
  bytes: Uint8Array;
  documentLabels: string[];
  pageCount: number;
}

export async function generateDocumentPacket(
  applicantCase: ApplicantCase,
  today: string,
): Promise<GeneratedPacket> {
  const reviewIssues = collectReviewIssues(applicantCase);
  const blockingIssues = validateCrossForm(applicantCase).filter(
    (issue) => issue.severity === "blocking",
  );
  if (reviewIssues.length > 0 || blockingIssues.length > 0) {
    throw new Error("packet_validation");
  }

  const forms = buildFormPayloads(applicantCase);
  const continuation = buildContinuationSheet(applicantCase);
  const evidenceIndex = buildEvidenceIndex(applicantCase, today);

  const jobs: Array<Promise<{ label: string; bytes: Uint8Array }>> = [
    ...forms.map(async (form) => ({
      label: form.label,
      bytes: await fillAnvilForm(form.kind, form.payload),
    })),
    ...(continuation
      ? [
          generateAnvilDocument(continuation).then((bytes) => ({
            label: "Continuation sheet",
            bytes,
          })),
        ]
      : []),
    generateAnvilDocument(evidenceIndex).then((bytes) => ({
      label: "Medical evidence index",
      bytes,
    })),
  ];

  const documents = await Promise.all(jobs);
  const merged = await PDFDocument.create();
  for (const document of documents) {
    const source = await PDFDocument.load(document.bytes);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  merged.setTitle("Clearway SSDI application packet");
  merged.setAuthor("Clearway");
  merged.setSubject("Applicant-prepared working copy");
  merged.setCreator("Clearway with Anvil");
  const bytes = await merged.save({ useObjectStreams: false });

  return {
    bytes,
    documentLabels: documents.map((document) => document.label),
    pageCount: merged.getPageCount(),
  };
}
