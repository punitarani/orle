import type { LucideIcon } from "lucide-react";

export type ToolOptionType = "toggle" | "select" | "number" | "text";

export type ToolOption = {
  id: string;
  label: string;
  type: ToolOptionType;
  default: unknown;
  options?: { value: string; label: string }[]; // For select type
  min?: number; // For number type
  max?: number;
  step?: number;
};

export type ToolInputType = "text" | "file" | "dual" | "none";
export type ToolOutputType =
  | "text"
  | "image"
  | "download"
  | "preview"
  | "table";

export type ToolExample = {
  name?: string;
  input: string;
  output?: string;
};

export type ToolTransformResult =
  | string
  | { type: "image"; data: string }
  | { type: "error"; message: string };

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  section: string;
  aliases: string[];
  inputType: ToolInputType;
  outputType: ToolOutputType;
  options?: ToolOption[];
  transform: (
    input: string | File,
    options: Record<string, unknown>,
  ) => ToolTransformResult | Promise<ToolTransformResult>;
  examples?: ToolExample[];
  useWorker?: "hash" | "diff" | "image";
  allowSwap?: boolean;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
};

export type ToolSection = {
  id: string;
  name: string;
  icon: LucideIcon;
  description?: string;
};

export type ToolState = {
  input: string;
  output: string;
  options: Record<string, unknown>;
  isProcessing: boolean;
  error: string | null;
};
