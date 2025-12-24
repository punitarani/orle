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
        "Unique identifier for this option, used as key in options object. Use camelCase or kebab-case.",
      ),
    label: z
      .string()
      .describe("Human-readable label shown in UI. Keep it short and clear."),
    type: toolOptionTypeSchema.describe(
      "The type of UI control to render: 'toggle' (boolean), 'select' (dropdown), 'number' (numeric input), or 'text' (text input)",
    ),
    default: z
      .union([z.string(), z.number(), z.boolean()])
      .describe(
        "Default value for this option. Type must match the 'type' field: boolean for toggle, string for select/text, number for number.",
      ),
    options: z
      .array(
        z
          .object({
            value: z.string().describe("The value returned when selected"),
            label: z.string().describe("The text shown to the user"),
          })
          .strict(),
      )
      .nullable()
      .describe(
        "For 'select' type ONLY: array of {value, label} choices. MUST be null for other types (toggle, number, text).",
      ),
    min: z
      .number()
      .nullable()
      .describe(
        "For 'number' type ONLY: minimum value allowed. MUST be null for other types (toggle, select, text).",
      ),
    max: z
      .number()
      .nullable()
      .describe(
        "For 'number' type ONLY: maximum value allowed. MUST be null for other types (toggle, select, text).",
      ),
    step: z
      .number()
      .nullable()
      .describe(
        "For 'number' type ONLY: step increment (e.g., 1, 0.1). MUST be null for other types (toggle, select, text).",
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
        "Optional name/description for this example (e.g., 'Basic usage', 'With special characters'). Use null if not needed.",
      ),
    input: z
      .string()
      .describe(
        "Example input value. Should be representative of typical usage.",
      ),
    output: z
      .string()
      .nullable()
      .describe(
        "Expected output for this input. Use null if you want to omit showing expected output.",
      ),
  })
  .strict();

/**
 * Schema for AI-generated tool definitions.
 * The transform is a string (code) that will be safely executed.
 *
 * IMPORTANT FOR LLM TOOL CALLS:
 * - ALL fields are required in the schema
 * - Use null (not undefined) for optional/nullable fields
 * - Never omit nullable fields - always include them with null value
 * - The .strict() mode enforces no additional properties
 *
 * This is required for OpenAI's structured output mode which demands
 * all properties be in the 'required' array.
 */
export const customToolDefinitionSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
      .describe(
        "URL-friendly unique identifier (lowercase, hyphens only). Example: 'csv-to-json' or 'password-generator'",
      ),
    name: z
      .string()
      .min(3)
      .max(50)
      .describe(
        "Human-readable tool name (3-50 characters). Example: 'CSV to JSON Converter' or 'Password Generator'",
      ),
    description: z
      .string()
      .min(10)
      .max(200)
      .describe(
        "Brief description of what the tool does (10-200 characters). Be clear and concise.",
      ),
    section: z
      .literal("custom")
      .describe(
        "Section identifier - MUST always be exactly 'custom' for generated tools",
      ),
    aliases: z
      .array(z.string())
      .max(10)
      .describe(
        "Alternative search terms for finding this tool (max 10). Example: ['csv', 'json', 'convert', 'parser']",
      ),
    inputType: toolInputTypeSchema.describe(
      "Type of input: 'text' (text input), 'file' (file upload), 'dual' (two text inputs for comparison), 'none' (no input, generator tool)",
    ),
    outputType: toolOutputTypeSchema.describe(
      "Type of output: 'text' (text output), 'image' (image preview), 'download' (file download), 'preview' (formatted preview), 'table' (table view), 'image-result' (image with metadata), 'color' (color picker), 'diff' (side-by-side comparison)",
    ),
    options: z
      .array(toolOptionSchema)
      .max(10)
      .nullable()
      .describe(
        "Configurable options for the tool (max 10). Use null if no options are needed. Each option must have all required fields including null values for unused fields.",
      ),
    transformCode: z
      .string()
      .describe(
        "JavaScript function body as string. Receives (input, opts) parameters. Must return a string, or {type:'error', message:string} for errors. Can be async (return Promise<string>). Use only allowed browser APIs.",
      ),
    examples: z
      .array(toolExampleSchema)
      .max(5)
      .nullable()
      .describe(
        "Example inputs/outputs to demonstrate the tool (max 5). Use null if no examples needed. Each example should show a realistic use case.",
      ),
    allowSwap: z
      .boolean()
      .nullable()
      .describe(
        "Whether to allow swapping input/output - useful for encode/decode tools. Use true for reversible operations (base64, url encoding), false or null otherwise.",
      ),
    inputPlaceholder: z
      .string()
      .nullable()
      .describe(
        "Placeholder text for the input field. Use null to use the default placeholder. Example: 'Enter CSV data...'",
      ),
    outputPlaceholder: z
      .string()
      .nullable()
      .describe(
        "Placeholder text for the output field. Use null to use the default placeholder. Example: 'JSON output will appear here...'",
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
