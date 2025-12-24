import {
  createAgentUIStreamResponse,
  ToolLoopAgent,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createModel, GENERATOR_MODEL } from "@/lib/ai/model";
import {
  type CustomToolDefinitionGenerated,
  customToolDefinitionSchema,
  type ValidationResult,
} from "@/lib/tools/types";

export const maxDuration = 300;

// Dangerous patterns to check for in transform code
const DANGEROUS_PATTERNS = [
  { pattern: /\bfetch\s*\(/, name: "fetch() network call" },
  { pattern: /\bXMLHttpRequest\b/, name: "XMLHttpRequest" },
  { pattern: /\blocalStorage\b/, name: "localStorage access" },
  { pattern: /\bsessionStorage\b/, name: "sessionStorage access" },
  { pattern: /\bindexedDB\b/, name: "indexedDB access" },
  { pattern: /\bdocument\b/, name: "document/DOM access" },
  { pattern: /\bwindow\b/, name: "window object access" },
  { pattern: /\beval\s*\(/, name: "eval() call" },
  { pattern: /\bnew\s+Function\s*\(/, name: "Function constructor" },
  { pattern: /\bimport\s*\(/, name: "dynamic import" },
  { pattern: /\brequire\s*\(/, name: "require() call" },
  { pattern: /\bsetTimeout\s*\(/, name: "setTimeout" },
  { pattern: /\bsetInterval\s*\(/, name: "setInterval" },
  { pattern: /\bWebSocket\b/, name: "WebSocket" },
  { pattern: /\bWorker\b/, name: "Web Worker" },
  { pattern: /\bnavigator\b/, name: "navigator access" },
  { pattern: /\b__proto__\b/, name: "prototype pollution" },
];

const VALID_INPUT_TYPES = ["text", "file", "dual", "none"];
const VALID_OUTPUT_TYPES = [
  "text",
  "image",
  "download",
  "preview",
  "table",
  "image-result",
  "color",
  "diff",
];
const VALID_OPTION_TYPES = ["toggle", "select", "number", "text"];

function performStaticAnalysis(
  tool: CustomToolDefinitionGenerated,
): ValidationResult {
  const issues: string[] = [];
  const securityConcerns: string[] = [];
  const code = tool.transformCode;

  // Check for dangerous patterns
  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      securityConcerns.push(`Forbidden pattern detected: ${name}`);
    }
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(tool.slug)) {
    issues.push("Slug must be lowercase alphanumeric with hyphens only");
  }

  // Validate input type
  if (!VALID_INPUT_TYPES.includes(tool.inputType)) {
    issues.push(`Invalid inputType: ${tool.inputType}`);
  }

  // Validate output type
  if (!VALID_OUTPUT_TYPES.includes(tool.outputType)) {
    issues.push(`Invalid outputType: ${tool.outputType}`);
  }

  // Validate options
  if (tool.options) {
    for (const opt of tool.options) {
      if (!VALID_OPTION_TYPES.includes(opt.type)) {
        issues.push(`Invalid option type for "${opt.id}": ${opt.type}`);
      }
      if (opt.type === "select" && (!opt.options || opt.options.length === 0)) {
        issues.push(`Select option "${opt.id}" must have options array`);
      }
      if (
        opt.type === "number" &&
        opt.min != null &&
        opt.max != null &&
        opt.min > opt.max
      ) {
        issues.push(`Option "${opt.id}" has min > max`);
      }
    }
  }

  // Try to parse the transform code as a function body
  try {
    new Function("input", "opts", code);
  } catch (e) {
    issues.push(`Transform code has syntax error: ${(e as Error).message}`);
  }

  // Check for reasonable code length
  if (code.length > 10000) {
    issues.push("Transform code is too long (max 10000 characters)");
  }

  // Check for infinite loops
  if (
    /while\s*\(\s*true\s*\)/.test(code) ||
    /for\s*\(\s*;\s*;\s*\)/.test(code)
  ) {
    securityConcerns.push("Potential infinite loop detected");
  }

  const valid = issues.length === 0 && securityConcerns.length === 0;

  return {
    valid,
    issues,
    securityConcerns: securityConcerns.length > 0 ? securityConcerns : null,
    suggestions: null,
  };
}

// Tool examples for context
const TOOL_EXAMPLES = `
## Example 1: Base64 Encode/Decode
{
  "slug": "base64-text",
  "name": "Base64 Encode / Decode",
  "description": "Encode or decode UTF-8 text to/from Base64",
  "section": "custom",
  "aliases": ["base64", "btoa", "atob"],
  "inputType": "text",
  "outputType": "text",
  "allowSwap": true,
  "options": [
    {"id": "mode", "label": "Mode", "type": "select", "default": "encode", "options": [{"value": "encode", "label": "Encode"}, {"value": "decode", "label": "Decode"}], "min": null, "max": null, "step": null}
  ],
  "transformCode": "const str = String(input); if (!str) return ''; try { if (opts.mode === 'encode') { return btoa(unescape(encodeURIComponent(str))); } return decodeURIComponent(escape(atob(str))); } catch { return { type: 'error', message: 'Invalid input' }; }",
  "examples": [{"name": null, "input": "Hello", "output": "SGVsbG8="}],
  "inputPlaceholder": null,
  "outputPlaceholder": null
}

## Example 2: UUID Generator (no input)
{
  "slug": "uuid-generator",
  "name": "UUID v4 Generator",
  "description": "Generate random UUID v4 identifiers",
  "section": "custom",
  "aliases": ["uuid", "guid"],
  "inputType": "none",
  "outputType": "text",
  "allowSwap": null,
  "options": [
    {"id": "count", "label": "Count", "type": "number", "default": 1, "min": 1, "max": 100, "step": 1, "options": null}
  ],
  "transformCode": "const count = Math.min(Number(opts.count) || 1, 100); const uuids = []; for (let i = 0; i < count; i++) uuids.push(crypto.randomUUID()); return uuids.join('\\\\n');",
  "examples": null,
  "inputPlaceholder": null,
  "outputPlaceholder": null
}
`;

const AGENT_INSTRUCTIONS = `You are an expert developer tool generator for orle.dev. Your job is to create browser-based developer tools that run entirely client-side.

## Your Workflow
1. When the user describes a tool, use the generateToolDefinition tool to create it
2. Always validate your generated tool using the validateToolDefinition tool
3. If validation fails, analyze the errors and regenerate with fixes
4. Continue this generate-validate loop until the tool passes validation
5. Maximum 5 attempts - if you can't create a valid tool, explain what's wrong

## Tool Definition Requirements
- slug: URL-friendly (lowercase, hyphens only)
- name: Clear, concise name (3-50 chars)
- description: What the tool does (10-200 chars)
- section: Always "custom"
- aliases: Search terms (max 10)
- inputType: "text" | "file" | "dual" | "none"
- outputType: "text" | "image" | "download" | "preview" | "table" | "image-result" | "color" | "diff"
- options: Array of {id, label, type, default, options?, min?, max?, step?} or null
- transformCode: JavaScript function body (see below)
- examples: Array of {name?, input, output?} or null
- allowSwap: boolean or null (for encode/decode tools)
- inputPlaceholder, outputPlaceholder: string or null

## Transform Code Rules
The transformCode is a JavaScript function body that receives:
- input: string | File
- opts: Record<string, unknown>

Must return: string | Promise<string> | {type: 'error', message: string}

### ALLOWED APIs:
- String, Number, Array, Object, Math, Date, JSON, RegExp
- TextEncoder, TextDecoder, btoa, atob
- crypto.randomUUID(), crypto.getRandomValues(), crypto.subtle.digest()
- encodeURIComponent, decodeURIComponent, escape, unescape
- parseInt, parseFloat, isNaN, isFinite, Intl

### FORBIDDEN (will fail validation):
- fetch, XMLHttpRequest (no network)
- localStorage, sessionStorage, indexedDB (no storage)
- document, window, DOM APIs
- eval, new Function()
- import, require
- setTimeout, setInterval
- navigator, location, history
- Worker, WebSocket

## Common Validation Errors and Fixes
- "Forbidden pattern: fetch" → Use only local transformations, no API calls
- "Forbidden pattern: document" → Don't use DOM APIs, work with strings only
- "Syntax error" → Check for missing brackets, typos in code
- "Invalid inputType" → Use one of: text, file, dual, none
- "Invalid option type" → Use one of: toggle, select, number, text

${TOOL_EXAMPLES}

## Response Format
After each tool generation or validation, explain what you did:
- When generating: "I've created a [tool name] that [description]..."
- When validation passes: "✓ The tool passed validation and is ready to save."
- When validation fails: "✗ Validation found issues: [list issues]. Let me fix these..."
- After fix attempt: "I've updated the tool to [describe fix]..."`;

// Track validation state across steps
type AgentContext = {
  lastGeneratedTool: CustomToolDefinitionGenerated | null;
  lastValidation: ValidationResult | null;
  attempts: number;
};

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const model = await createModel(GENERATOR_MODEL);

    // Create agent context
    const context: AgentContext = {
      lastGeneratedTool: null,
      lastValidation: null,
      attempts: 0,
    };

    const agent = new ToolLoopAgent({
      model,
      instructions: AGENT_INSTRUCTIONS,
      tools: {
        generateToolDefinition: tool({
          description:
            "Generate a tool definition based on the user description. Use this to create or update a tool.",
          inputSchema: z.object({
            toolDefinition: customToolDefinitionSchema.describe(
              "The complete tool definition following the schema",
            ),
          }),
          execute: async ({
            toolDefinition,
          }: {
            toolDefinition: CustomToolDefinitionGenerated;
          }) => {
            context.lastGeneratedTool = toolDefinition;
            context.attempts++;
            return {
              success: true,
              tool: toolDefinition,
              message: `Generated tool: ${toolDefinition.name}`,
            };
          },
        }),
        validateToolDefinition: tool({
          description:
            "Validate a tool definition for security and correctness. Always call this after generating a tool.",
          inputSchema: z.object({
            toolDefinition: customToolDefinitionSchema.describe(
              "The tool definition to validate",
            ),
          }),
          execute: async ({
            toolDefinition,
          }: {
            toolDefinition: CustomToolDefinitionGenerated;
          }) => {
            const result = performStaticAnalysis(toolDefinition);
            context.lastValidation = result;

            if (result.valid) {
              return {
                valid: true,
                message: "Tool passed all validation checks!",
                tool: toolDefinition,
              };
            }

            return {
              valid: false,
              issues: result.issues,
              securityConcerns: result.securityConcerns,
              message:
                "Validation failed. Please fix the issues and regenerate.",
              suggestions: [
                "Review the FORBIDDEN APIs list and remove any violations",
                "Check for syntax errors in transformCode",
                "Ensure all required fields are present",
              ],
            };
          },
        }),
      },
      stopWhen: () => {
        // Stop if validation passed or max attempts reached
        if (context.lastValidation?.valid === true) {
          return true;
        }
        if (context.attempts >= 5) {
          return true;
        }
        return false;
      },
    });

    return await createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
    });
  } catch (error) {
    console.error("Agent error:", error);
    // Return a more detailed error message for debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
    });

    return new Response(
      JSON.stringify({
        error: "Agent failed",
        message: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorStack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
