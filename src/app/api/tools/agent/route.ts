import {
  createAgentUIStreamResponse,
  ToolLoopAgent,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createModel, GENERATOR_MODEL } from "@/lib/ai/model";
import { executeTransform } from "@/lib/tools/safe-executor";
import toolsData from "@/lib/tools/tools.generated.json";
import {
  type CustomToolDefinitionGenerated,
  customToolDefinitionSchema,
  type ValidationResult,
} from "@/lib/tools/types";

export const maxDuration = 300;

// Search and score tools based on query relevance
function searchToolsByQuery(query: string, limit = 5) {
  const normalized = query.toLowerCase().trim();

  interface ScoredTool {
    tool: (typeof toolsData)[0];
    score: number;
  }

  const scored: ScoredTool[] = toolsData.map((tool) => {
    let score = 0;
    const toolName = tool.name.toLowerCase();
    const toolDesc = tool.description.toLowerCase();
    const toolAliases = tool.aliases?.map((a) => a.toLowerCase()) || [];

    // Exact name match (highest priority)
    if (toolName === normalized) score += 100;
    else if (toolName.includes(normalized)) score += 50;
    else if (normalized.includes(toolName)) score += 30;

    // Description match
    if (toolDesc.includes(normalized)) score += 40;
    else if (
      normalized
        .split(" ")
        .some((word) => word.length > 3 && toolDesc.includes(word))
    )
      score += 20;

    // Alias match (high priority)
    if (toolAliases.some((alias) => alias === normalized)) score += 90;
    else if (
      toolAliases.some(
        (alias) => alias.includes(normalized) || normalized.includes(alias),
      )
    )
      score += 45;

    // Query words match
    const queryWords = normalized.split(/\s+/).filter((w) => w.length > 2);
    queryWords.forEach((word) => {
      if (toolName.includes(word)) score += 10;
      if (toolDesc.includes(word)) score += 8;
      if (toolAliases.some((alias) => alias.includes(word))) score += 12;
    });

    return { tool, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({
      ...s.tool,
      matchScore: s.score,
    }));
}

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
1. FIRST: Call searchExistingTools to check if a similar tool already exists
2. Analyze the search results:
   - If you find a 1:1 or very close match (score > 80): Call suggestExistingTool to redirect the user
   - If you find similar tools (score 40-80): Use their patterns as reference when generating (no need to narrate this)
   - If no relevant matches (score < 40): Generate from scratch
3. When generating: Use the generateToolDefinition tool to create it
4. Always validate your generated tool using the validateToolDefinition tool
5. If validation passes, test it with the testToolRuntime tool to ensure it works
6. If either validation or runtime test fails, analyze the errors and regenerate with fixes
7. Continue this generate-validate-test loop until everything works correctly
8. Maximum 5 attempts - if you can't create a valid tool, explain what's wrong

## Response Format
- Use tools to perform actions (searchExistingTools, generateToolDefinition, validateToolDefinition, testToolRuntime)
- The tool executions will show visually in the UI with their status and results
- DO NOT narrate what you're doing (e.g., "I'm searching existing tools...") - the tool UI shows this
- Only provide text when:
  * You need to explain a choice or decision
  * There's an issue that requires explanation
  * You're declining a restricted request
- After tools complete successfully, DO NOT provide a summary or closing remarks

Examples:
✅ Good: Just call searchExistingTools tool → it shows "Searching existing tools..." status automatically
❌ Bad: "I'm searching existing tools..." (redundant with tool UI)

✅ Good: Call suggestExistingTool for redirect → UI shows existing tool card automatically  
❌ Bad: "The base64-text tool already does exactly this!" (redundant with redirect card)

✅ Good: After successful test, stop → UI shows "Testing ✓" status
❌ Bad: "✓ Tool ready to save" (redundant with tool status)

Note: DO NOT provide a summary or conversational closing remarks at the end of the stream.

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

## CRITICAL: JSON Schema Format Rules
When calling generateToolDefinition, you MUST follow these rules to avoid errors:

1. **ALL fields are required** - Do not omit any field from the schema
2. **Use null for optional fields** - Never use undefined or omit the field
3. **Nullable fields must be explicitly set**:
   - options: null (if no options) or [{id, label, type, default, options: null, min: null, max: null, step: null}]
   - examples: null (if no examples) or [{name: "...", input: "...", output: "..."}]
   - allowSwap: null (if not applicable) or true/false
   - inputPlaceholder: null (for default) or "string"
   - outputPlaceholder: null (for default) or "string"

4. **Options array structure** (when not null):
   - ALWAYS include: id, label, type, default
   - Set options: null (unless type is "select", then provide array)
   - Set min: null, max: null, step: null (unless type is "number", then provide values)

5. **Examples structure** (when not null):
   - name: string or null (not undefined)
   - input: string (required)
   - output: string or null (not undefined)

### Common Mistakes to AVOID:
❌ Omitting nullable fields entirely
❌ Using undefined instead of null
❌ For options: forgetting to set options/min/max/step to null
❌ For select type: forgetting to provide options array
❌ For number type: forgetting to set min/max/step values

✅ Correct option structure (toggle):
{
  "id": "uppercase",
  "label": "Convert to uppercase",
  "type": "toggle",
  "default": false,
  "options": null,
  "min": null,
  "max": null,
  "step": null
}

✅ Correct option structure (select):
{
  "id": "format",
  "label": "Output format",
  "type": "select",
  "default": "json",
  "options": [{"value": "json", "label": "JSON"}, {"value": "xml", "label": "XML"}],
  "min": null,
  "max": null,
  "step": null
}

✅ Correct option structure (number):
{
  "id": "length",
  "label": "Password length",
  "type": "number",
  "default": 16,
  "options": null,
  "min": 8,
  "max": 128,
  "step": 1
}

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
Provide ONLY brief progress updates. Do NOT explain what the tool does after completion.

Examples of correct responses:
- "Searching existing tools..."
- "Generating tool definition..."
- "Validating tool..."
- "Testing runtime..."
- "✓ Tool ready to save"

FORBIDDEN: Do NOT write summaries, feature lists, or explanations after the tool is complete. Stop immediately after "✓ Tool ready to save".`;

// Track validation state across steps
type AgentContext = {
  lastGeneratedTool: CustomToolDefinitionGenerated | null;
  lastValidation: ValidationResult | null;
  runtimeTestPassed: boolean;
  attempts: number;
  redirectSuggested: boolean;
  redirectSlug: string | null;
};

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Validate message length
    const userMessages = messages.filter((m) => m.role === "user");
    const lastMessage = userMessages[userMessages.length - 1];
    if (lastMessage?.parts) {
      // Extract text from message parts
      const textContent = lastMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join(" ");

      if (textContent.length > 1000) {
        return new Response(
          JSON.stringify({
            error: "Input too long. Maximum 1000 characters.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Check for prompt injection attempts
      if (detectPromptInjection(textContent)) {
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
      redirectSuggested: false,
      redirectSlug: null,
    };

    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/0b10539f-e181-467f-85ee-b4017e072901", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "route.ts:POST",
        message: "Agent instructions",
        data: {
          instructionsLength: AGENT_INSTRUCTIONS.length,
          instructionsPreview: AGENT_INSTRUCTIONS.substring(
            AGENT_INSTRUCTIONS.length - 300,
          ),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "A,B",
      }),
    }).catch(() => {});
    // #endregion

    const agent = new ToolLoopAgent({
      model,
      instructions: AGENT_INSTRUCTIONS,
      tools: {
        searchExistingTools: tool({
          description:
            "Search existing tools in orle.dev to check if a similar tool already exists. ALWAYS call this FIRST before generating a new tool.",
          inputSchema: z.object({
            query: z
              .string()
              .describe(
                "Description of what the user wants to do (e.g., 'convert text to base64', 'generate uuid')",
              ),
          }),
          execute: async ({ query }: { query: string }) => {
            const results = searchToolsByQuery(query, 5);

            if (results.length === 0) {
              return {
                found: false,
                message: "No similar existing tools found.",
                results: [],
              };
            }

            return {
              found: true,
              message: `Found ${results.length} similar tool(s).`,
              results: results.map((tool) => ({
                slug: tool.slug,
                name: tool.name,
                description: tool.description,
                aliases: tool.aliases,
                inputType: tool.inputType,
                outputType: tool.outputType,
                matchScore: tool.matchScore,
                section: tool.section,
                canonicalSlug: tool.canonicalSlug,
                options: tool.options,
              })),
            };
          },
        }),
        suggestExistingTool: tool({
          description:
            "When an existing tool matches the user's request very closely (match score > 80), suggest using it instead of generating a new one. This will redirect the user to the existing tool.",
          inputSchema: z.object({
            slug: z
              .string()
              .describe("The slug of the existing tool to suggest"),
            reason: z
              .string()
              .describe(
                "Brief explanation of why this tool matches the request",
              ),
            relatedTools: z
              .array(z.string())
              .optional()
              .describe(
                "Slugs of other related tools the user might find useful",
              ),
          }),
          execute: async ({
            slug,
            reason,
            relatedTools,
          }: {
            slug: string;
            reason: string;
            relatedTools?: string[];
          }) => {
            context.redirectSuggested = true;
            context.redirectSlug = slug;
            return {
              type: "redirect",
              slug,
              reason,
              relatedTools: relatedTools || [],
              message: `I found an existing tool that matches your request!`,
            };
          },
        }),
        generateToolDefinition: tool({
          description:
            "Generate a tool definition based on the user description. IMPORTANT: Ensure all nullable fields (options, examples, allowSwap, inputPlaceholder, outputPlaceholder) are set to null if not needed, NOT undefined or omitted. Follow the exact schema structure.",
          inputSchema: z.object({
            toolDefinition: customToolDefinitionSchema.describe(
              "The complete tool definition following the schema. REQUIRED: All fields must be present. Use null for optional fields, not undefined.",
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
              // #region agent log
              fetch(
                "http://127.0.0.1:7243/ingest/0b10539f-e181-467f-85ee-b4017e072901",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    location: "route.ts:validateTool",
                    message: "Validation passed",
                    data: { valid: true },
                    timestamp: Date.now(),
                    sessionId: "debug-session",
                    hypothesisId: "D",
                  }),
                },
              ).catch(() => {});
              // #endregion

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
              // #region agent log
              fetch(
                "http://127.0.0.1:7243/ingest/0b10539f-e181-467f-85ee-b4017e072901",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    location: "route.ts:testToolRuntime",
                    message: "Runtime test passed",
                    data: { runtimeTestPassed: true },
                    timestamp: Date.now(),
                    sessionId: "debug-session",
                    hypothesisId: "D",
                  }),
                },
              ).catch(() => {});
              // #endregion
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
        // #region agent log
        const shouldStop =
          context.redirectSuggested ||
          (context.lastValidation?.valid === true &&
            context.runtimeTestPassed === true) ||
          context.attempts >= 5;
        fetch(
          "http://127.0.0.1:7243/ingest/0b10539f-e181-467f-85ee-b4017e072901",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "route.ts:stopWhen",
              message: "stopWhen called",
              data: {
                redirectSuggested: context.redirectSuggested,
                validationValid: context.lastValidation?.valid,
                runtimePassed: context.runtimeTestPassed,
                attempts: context.attempts,
                shouldStop,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              hypothesisId: "C,E",
            }),
          },
        ).catch(() => {});
        // #endregion

        // Stop if redirect was suggested
        if (context.redirectSuggested) {
          return true;
        }

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

    // Wrap the stream response with error handling
    try {
      const response = await createAgentUIStreamResponse({
        agent,
        uiMessages: messages,
      });

      return response;
    } catch (streamError) {
      // Detect tool call format errors
      const errorMessage =
        streamError instanceof Error ? streamError.message : "Unknown error";

      // Check if this is a recoverable tool call error
      const isToolCallError =
        errorMessage.includes("toolUse.input") ||
        errorMessage.includes("invalid tool call") ||
        errorMessage.includes("format of the value");

      // If it's a tool call error and we haven't exceeded retries, we could retry
      // However, the AI SDK handles streaming errors internally, so we'll let the
      // frontend handle retries for better UX control

      // Return a structured error response
      return new Response(
          JSON.stringify({
            error: "stream_error",
            message: isToolCallError
              ? "The model returned an invalid tool call format. Please retry."
              : errorMessage,
            isRetryable: isToolCallError,
            details:
              process.env.NODE_ENV === "development"
                ? {
                    originalError: errorMessage,
                    isToolCallError,
                  }
                : undefined,
          }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return new Response(
      JSON.stringify({
        error: "agent_failed",
        message: errorMessage,
        isRetryable: false,
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
