import type { LucideIcon } from "lucide-react";
import { z } from "zod";

export type ToolOptionType = "toggle" | "select" | "number" | "text";

export type ToolOptionCondition = {
  optionId: string;
  equals: string | number | boolean | Array<string | number | boolean>;
};

export type ToolOption = {
  id: string;
  label: string;
  type: ToolOptionType;
  default: unknown;
  description?: string;
  options?: { value: string; label: string }[]; // For select type
  min?: number; // For number type
  max?: number;
  step?: number;
  visibleWhen?: ToolOptionCondition;
  enabledWhen?: ToolOptionCondition;
  group?: string;
  advanced?: boolean;
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

export type ToolInput =
  | { kind: "none" }
  | { kind: "text"; text: string }
  | { kind: "dual"; a: string; b: string }
  | { kind: "file"; file: File };

export type ToolTransformInput = string | File | ToolInput;

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

export type DownloadResultData = {
  type: "download";
  data: Uint8Array;
  filename: string;
  mime: string;
};

export type ToolTransformResult =
  | string
  | { type: "image"; data: string }
  | { type: "error"; message: string }
  | DownloadResultData
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
    input: ToolTransformInput,
    options: Record<string, unknown>,
  ) => ToolTransformResult | Promise<ToolTransformResult>;
  examples?: ToolExample[];
  useWorker?: "hash" | "diff" | "image";
  allowSwap?: boolean;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  acceptsFile?: boolean;
  fileAccept?: string;
  runPolicy?: "auto" | "manual";
  debounceMs?: number;
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
  download?: {
    url: string;
    filename: string;
    mime: string;
    size: number;
  };
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

export const toolOptionSchema = z
  .object({
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
        z
          .object({
            value: z.string(),
            label: z.string(),
          })
          .strict(),
      )
      .nullable()
      .describe(
        "For select type: array of {value, label} choices. Set to null if not a select type.",
      ),
    min: z
      .number()
      .nullable()
      .describe(
        "For number type: minimum value. Set to null if not a number type.",
      ),
    max: z
      .number()
      .nullable()
      .describe(
        "For number type: maximum value. Set to null if not a number type.",
      ),
    step: z
      .number()
      .nullable()
      .describe(
        "For number type: step increment. Set to null if not a number type.",
      ),
  })
  .strict();

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

export const toolExampleSchema = z
  .object({
    name: z
      .string()
      .nullable()
      .describe(
        "Name/description for this example. Set to null if not needed.",
      ),
    input: z.string().describe("Example input value"),
    output: z
      .string()
      .nullable()
      .describe("Expected output for this input. Set to null if not provided."),
  })
  .strict();

/**
 * Schema for AI-generated tool definitions.
 * The transform is a string (code) that will be safely executed.
 *
 * Note: We use .nullable() instead of .optional() because OpenAI's structured
 * output strict mode requires all properties to be in the 'required' array.
 * We also use .strict() to add additionalProperties: false.
 */
export const customToolDefinitionSchema = z
  .object({
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
    outputType: toolOutputTypeSchema.describe(
      "Type of output the tool produces",
    ),
    options: z
      .array(toolOptionSchema)
      .max(10)
      .nullable()
      .describe(
        "Configurable options for the tool. Set to null if no options needed.",
      ),
    transformCode: z
      .string()
      .describe(
        "JavaScript function body as string: receives (input, opts) and returns string or {type:'error', message:string}",
      ),
    examples: z
      .array(toolExampleSchema)
      .max(5)
      .nullable()
      .describe(
        "Example inputs/outputs to demonstrate the tool. Set to null if no examples.",
      ),
    allowSwap: z
      .boolean()
      .nullable()
      .describe(
        "Whether to allow swapping input/output (for encode/decode tools). Set to null if not applicable.",
      ),
    inputPlaceholder: z
      .string()
      .nullable()
      .describe(
        "Placeholder text for the input field. Set to null for default.",
      ),
    outputPlaceholder: z
      .string()
      .nullable()
      .describe(
        "Placeholder text for the output field. Set to null for default.",
      ),
  })
  .strict();

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
 *
 * Note: We use .nullable() instead of .optional() because OpenAI's structured
 * output strict mode requires all properties to be in the 'required' array.
 * We also use .strict() to add additionalProperties: false.
 */
export const validationResultSchema = z
  .object({
    valid: z.boolean(),
    issues: z.array(z.string()).describe("List of validation issues found"),
    securityConcerns: z
      .array(z.string())
      .nullable()
      .describe("Security-related issues. Set to null if none."),
    suggestions: z
      .array(z.string())
      .nullable()
      .describe("Improvement suggestions. Set to null if none."),
  })
  .strict();

export type ValidationResult = z.infer<typeof validationResultSchema>;
