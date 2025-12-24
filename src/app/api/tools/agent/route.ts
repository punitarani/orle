import {
  createAgentUIStreamResponse,
  ToolLoopAgent,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createModel, GENERATOR_MODEL } from "@/lib/ai/model";
import { executeTransform } from "@/lib/tools/safe-executor";
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

// Prompt injection patterns to detect malicious input
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all|prior)\s+(instructions?|prompts?|rules?)/i,
  /system\s+prompt/i,
  /you\s+are\s+now/i,
  /forget\s+(everything|all|previous)/i,
  /new\s+(role|instructions?|persona)/i,
  /\b(bypass|override|disable)\s+(validation|rules?|restrictions?)/i,
  /\b(admin|root|sudo|superuser)\b/i,
  /execute\s+code/i,
  /run\s+arbitrary/i,
];

// Restricted keywords for tool content
const RESTRICTED_KEYWORDS = [
  "cryptocurrency",
  "blockchain",
  "bitcoin",
  "ethereum",
  "hack",
  "crack",
  "exploit",
  "vulnerability",
  "malware",
  "virus",
  "ransomware",
  "private key",
  "password cracker",
  "bypass validation",
  "ignore rules",
  "sql injection",
  "xss attack",
  "ddos",
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

function detectPromptInjection(input: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

function containsRestrictedContent(
  tool: CustomToolDefinitionGenerated,
): boolean {
  const searchText =
    `${tool.name} ${tool.description} ${tool.transformCode}`.toLowerCase();
  return RESTRICTED_KEYWORDS.some((keyword) =>
    searchText.includes(keyword.toLowerCase()),
  );
}

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

  // Check for restricted content
  if (containsRestrictedContent(tool)) {
    securityConcerns.push(
      "Tool contains restricted keywords related to security, cryptocurrency, or malicious activities",
    );
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

  // Check for code obfuscation attempts
  if (
    /\\x[0-9a-f]{2}/i.test(code) ||
    /\\u[0-9a-f]{4}/i.test(code) ||
    code.includes("fromCharCode")
  ) {
    securityConcerns.push("Potential code obfuscation detected");
  }

  // Check for excessively complex code
  const nestingLevel = (code.match(/\{/g) || []).length;
  if (nestingLevel > 20) {
    issues.push("Code is too complex (excessive nesting)");
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
3. If validation passes, test it with the testToolRuntime tool to ensure it works
4. If either validation or runtime test fails, analyze the errors and regenerate with fixes
5. Continue this generate-validate-test loop until everything works correctly
6. Maximum 5 attempts - if you can't create a valid tool, explain what's wrong

## Restrictions
You MUST NOT create tools that:
- Involve cryptocurrency, blockchain, or financial transactions
- Are designed for hacking, cracking, or exploiting systems
- Generate malware, viruses, or malicious code
- Bypass security measures or validation
- Access private keys, passwords, or sensitive credentials
- Perform SQL injection, XSS attacks, or other security exploits

If a user requests such a tool, politely decline and suggest an alternative legitimate use case.

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
  runtimeTestPassed: boolean;
  attempts: number;
};

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Validate message length
    const userMessages = messages.filter((m) => m.role === "user");
    const lastMessage = userMessages[userMessages.length - 1];
    if (lastMessage?.content && typeof lastMessage.content === "string") {
      if (lastMessage.content.length > 1000) {
        return new Response(
          JSON.stringify({
            error: "Input too long. Maximum 1000 characters.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Check for prompt injection attempts
      if (detectPromptInjection(lastMessage.content)) {
        return new Response(
          JSON.stringify({
            error:
              "Invalid input detected. Please describe your tool request clearly without attempting to modify system behavior.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    const model = await createModel(GENERATOR_MODEL);

    // Create agent context
    const context: AgentContext = {
      lastGeneratedTool: null,
      lastValidation: null,
      runtimeTestPassed: false,
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
        testToolRuntime: tool({
          description:
            "Test the tool with sample input to ensure it works correctly at runtime. Call this after validation passes.",
          inputSchema: z.object({
            toolDefinition: customToolDefinitionSchema.describe(
              "The tool definition to test",
            ),
            testInput: z
              .string()
              .optional()
              .describe("Sample input to test with (optional)"),
          }),
          execute: async ({
            toolDefinition,
            testInput,
          }: {
            toolDefinition: CustomToolDefinitionGenerated;
            testInput?: string;
          }) => {
            try {
              // Determine test input based on tool type
              let input = testInput || "test";
              if (toolDefinition.inputType === "none") {
                input = "";
              }

              // Build default options
              const testOptions: Record<string, unknown> = {};
              if (toolDefinition.options) {
                for (const opt of toolDefinition.options) {
                  testOptions[opt.id] = opt.default;
                }
              }

              // Execute with sample input
              const result = await executeTransform(
                toolDefinition.transformCode,
                input,
                testOptions,
              );

              // Check if result is an error
              if (
                typeof result === "object" &&
                result !== null &&
                "type" in result &&
                result.type === "error"
              ) {
                context.runtimeTestPassed = false;
                return {
                  success: false,
                  error: result.message,
                  message: "Runtime test failed - tool produced an error",
                };
              }

              context.runtimeTestPassed = true;
              return {
                success: true,
                result:
                  typeof result === "string"
                    ? result.substring(0, 100)
                    : "Success",
                message: "Tool executed successfully at runtime!",
              };
            } catch (e) {
              context.runtimeTestPassed = false;
              return {
                success: false,
                error: (e as Error).message,
                message: "Runtime test failed with exception",
              };
            }
          },
        }),
      },
      stopWhen: () => {
        // Stop if validation passed AND runtime test succeeded
        if (
          context.lastValidation?.valid === true &&
          context.runtimeTestPassed === true
        ) {
          return true;
        }
        // Stop if max attempts reached
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
