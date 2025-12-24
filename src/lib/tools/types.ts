import type { LucideIcon } from "lucide-react";
import { z } from "zod";

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

// =============================================================================
// Zod Schemas for AI-generated tool validation
// =============================================================================

export const toolOptionTypeSchema = z.enum([
  "toggle",
  "select",
  "number",
  "text",
]);

export const toolOptionSchema = z.object({
  id: z
    .string()
    .describe(
      "Unique identifier for this option, used as key in options object",
    ),
  label: z.string().describe("Human-readable label shown in UI"),
  type: toolOptionTypeSchema.describe("The type of UI control to render"),
  default: z
    .union([z.string(), z.number(), z.boolean()])
    .describe("Default value for this option"),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    )
    .optional()
    .describe("For select type: array of {value, label} choices"),
  min: z.number().optional().describe("For number type: minimum value"),
  max: z.number().optional().describe("For number type: maximum value"),
  step: z.number().optional().describe("For number type: step increment"),
});

export const toolInputTypeSchema = z.enum(["text", "file", "dual", "none"]);
export const toolOutputTypeSchema = z.enum([
  "text",
  "image",
  "download",
  "preview",
  "table",
  "image-result",
  "color",
  "diff",
]);

export const toolExampleSchema = z.object({
  name: z
    .string()
    .optional()
    .describe("Optional name/description for this example"),
  input: z.string().describe("Example input value"),
  output: z.string().optional().describe("Expected output for this input"),
});

/**
 * Schema for AI-generated tool definitions.
 * The transform is a string (code) that will be safely executed.
 */
export const customToolDefinitionSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .describe("URL-friendly unique identifier, e.g., 'csv-to-json'"),
  name: z
    .string()
    .min(3)
    .max(50)
    .describe("Human-readable tool name, e.g., 'CSV to JSON Converter'"),
  description: z
    .string()
    .min(10)
    .max(200)
    .describe("Brief description of what the tool does"),
  section: z
    .literal("custom")
    .describe("Section identifier - always 'custom' for generated tools"),
  aliases: z
    .array(z.string())
    .max(10)
    .describe("Alternative search terms for finding this tool"),
  inputType: toolInputTypeSchema.describe("Type of input the tool accepts"),
  outputType: toolOutputTypeSchema.describe("Type of output the tool produces"),
  options: z
    .array(toolOptionSchema)
    .max(10)
    .optional()
    .describe("Configurable options for the tool"),
  transformCode: z
    .string()
    .describe(
      "JavaScript function body as string: receives (input, opts) and returns string or {type:'error', message:string}",
    ),
  examples: z
    .array(toolExampleSchema)
    .max(5)
    .optional()
    .describe("Example inputs/outputs to demonstrate the tool"),
  allowSwap: z
    .boolean()
    .optional()
    .describe(
      "Whether to allow swapping input/output (for encode/decode tools)",
    ),
  inputPlaceholder: z
    .string()
    .optional()
    .describe("Placeholder text for the input field"),
  outputPlaceholder: z
    .string()
    .optional()
    .describe("Placeholder text for the output field"),
});

export type CustomToolDefinitionGenerated = z.infer<
  typeof customToolDefinitionSchema
>;

/**
 * Full custom tool definition with metadata for storage
 */
export type CustomToolDefinition = CustomToolDefinitionGenerated & {
  id: string;
  createdAt: number;
  updatedAt: number;
  isCustom: true;
};

/**
 * Validation result from the validator agent
 */
export const validationResultSchema = z.object({
  valid: z.boolean(),
  issues: z.array(z.string()).describe("List of validation issues found"),
  securityConcerns: z
    .array(z.string())
    .optional()
    .describe("Security-related issues"),
  suggestions: z
    .array(z.string())
    .optional()
    .describe("Improvement suggestions"),
});

export type ValidationResult = z.infer<typeof validationResultSchema>;
