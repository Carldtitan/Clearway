import { z } from "zod";

export const approvedRootSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(260),
  displayPath: z.string().min(1).max(1_000),
});

export const computerEnvironmentSchema = z.object({
  platform: z.literal("win32"),
  release: z.string().max(100),
  arch: z.string().max(40),
  roots: z.array(approvedRootSchema).max(8),
  capabilities: z
    .array(
      z.enum([
        "search_files",
        "extract_text",
        "preview_candidate",
        "open_candidate",
      ]),
    )
    .max(4),
  limits: z.object({
    maxFiles: z.number().int().positive().max(20_000),
    maxDepth: z.number().int().positive().max(32),
    maxFileBytes: z.number().int().positive().max(100_000_000),
    maxExcerptCharacters: z.number().int().positive().max(10_000),
  }),
});

export const searchFilesActionSchema = z.object({
  tool: z.literal("search_files"),
  args: z.object({
    query: z.string().trim().min(1).max(500),
    terms: z.array(z.string().trim().min(1).max(80)).max(24),
    extensions: z.array(z.string().trim().min(1).max(16)).max(16),
    maxResults: z.number().int().min(1).max(12),
  }),
});

const candidateAction = (tool: "extract_text" | "preview_candidate" | "open_candidate") =>
  z.object({
    tool: z.literal(tool),
    args: z.object({ candidateId: z.string().min(1).max(100) }),
  });

export const computerToolRequestSchema = z.discriminatedUnion("tool", [
  searchFilesActionSchema,
  candidateAction("extract_text"),
  candidateAction("preview_candidate"),
  candidateAction("open_candidate"),
]);

export const computerTurnResponseSchema = z.object({
  state: z.enum(["act", "finish", "clarify", "error"]),
  narration: z.string().trim().min(1).max(700),
  action: computerToolRequestSchema.nullable(),
  candidateIds: z.array(z.string().min(1).max(100)).max(12),
});

export const computerTurnRequestSchema = z.object({
  request: z.string().trim().min(1).max(1_500),
  locale: z.enum(["en-US", "es-US", "zh-CN"]).default("en-US"),
  environment: computerEnvironmentSchema,
  history: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        content: z.string().trim().min(1).max(2_000),
      }),
    )
    .max(12)
    .default([]),
  toolResult: z.string().max(24_000).nullable().default(null),
});

export type ApprovedRoot = z.infer<typeof approvedRootSchema>;
export type ComputerEnvironment = z.infer<typeof computerEnvironmentSchema>;
export type ComputerToolRequest = z.infer<typeof computerToolRequestSchema>;
export type ComputerTurnResponse = z.infer<typeof computerTurnResponseSchema>;

export interface CandidateFile {
  id: string;
  name: string;
  displayPath: string;
  extension: string;
  size: number;
  modifiedAt: string;
  score: number;
  evidence: string[];
  excerpt?: string;
}

export interface ActivityEvent {
  id: string;
  phase: "started" | "progress" | "completed" | "failed";
  message: string;
  speak: boolean;
  createdAt: string;
}

export interface ComputerToolResult {
  ok: boolean;
  tool: ComputerToolRequest["tool"];
  candidates?: CandidateFile[];
  candidate?: CandidateFile;
  previewDataUrl?: string | null;
  message?: string;
  [key: string]: unknown;
}
