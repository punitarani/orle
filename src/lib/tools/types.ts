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
  | "table"
  | "image-result"
  | "color"
  | "diff";

export type ToolExample = {
  name?: string;
  input: string;
  output?: string;
};

// Structured result types for specialized outputs
export type ImageResultData = {
  type: "image-result";
  originalUrl?: string;
  resultUrl: string;
  originalSize?: number;
  resultSize: number;
  originalDimensions?: { width: number; height: number };
  resultDimensions?: { width: number; height: number };
  savings?: number; // percentage
  filename?: string;
};

export type ColorResultData = {
  type: "color";
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  textOutput: string; // Keep text for copy
  preview?: {
    type: "swatch" | "gradient" | "contrast" | "shadow";
    colors?: string[];
    css?: string;
  };
};

export type DiffResultData = {
  type: "diff";
  changes: Array<{
    type: "added" | "removed" | "unchanged";
    value: string;
  }>;
  textOutput: string; // Keep text for copy
  stats?: {
    additions: number;
    deletions: number;
  };
};

export type ToolTransformResult =
  | string
  | { type: "image"; data: string }
  | { type: "error"; message: string }
  | ImageResultData
  | ColorResultData
  | DiffResultData;

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
  input2?: string; // For dual input (diff tools)
  output: string;
  outputData?: ImageResultData | ColorResultData | DiffResultData; // Structured output
  options: Record<string, unknown>;
  isProcessing: boolean;
  error: string | null;
  file?: File | null; // Track uploaded file
};
