import type {
  ActivityEvent,
  ApprovedRoot,
  ComputerEnvironment,
  ComputerToolRequest,
  ComputerToolResult,
} from "@/lib/computer/schema";

declare global {
  interface Window {
    clearwayDesktop?: {
      getEnvironment(): Promise<ComputerEnvironment>;
      chooseRoots(): Promise<ApprovedRoot[]>;
      executeTool(request: ComputerToolRequest): Promise<ComputerToolResult>;
      onActivity(listener: (event: ActivityEvent) => void): () => void;
    };
  }
}

export {};
