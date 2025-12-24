import { generateText, Output } from "ai";
import { createModel, VALIDATOR_MODEL } from "@/lib/ai/model";
import {
  type CustomToolDefinitionGenerated,
  validationResultSchema,
} from "@/lib/tools/types";

// Allow up to 30 seconds for validation
export const maxDuration = 180;

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
  { pattern: /\bEventSource\b/, name: "EventSource" },
  { pattern: /\bWorker\b/, name: "Web Worker" },
  { pattern: /\bnavigator\b/, name: "navigator access" },
  { pattern: /\blocation\b/, name: "location access" },
  { pattern: /\bhistory\b/, name: "history access" },
  { pattern: /\bcookie\b/i, name: "cookie access" },
  { pattern: /\b__proto__\b/, name: "prototype pollution" },
  { pattern: /\bprototype\s*\[/, name: "prototype access" },
  { pattern: /\bconstructor\s*\[/, name: "constructor access" },
];

// Valid input types
const VALID_INPUT_TYPES = ["text", "file", "dual", "none"];

// Valid output types
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

// Valid option types
const VALID_OPTION_TYPES = ["toggle", "select", "number", "text"];

function performStaticAnalysis(tool: CustomToolDefinitionGenerated): {
  issues: string[];
  securityConcerns: string[];
} {
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

      if (opt.type === "number") {
        if (opt.min != null && opt.max != null && opt.min > opt.max) {
          issues.push(`Option "${opt.id}" has min > max`);
        }
      }
    }
  }

  // Try to parse the transform code as a function body
  try {
    // This is a syntax check only - we're not executing it
    new Function("input", "opts", code);
  } catch (e) {
    issues.push(`Transform code has syntax error: ${(e as Error).message}`);
  }

  // Check for reasonable code length
  if (code.length > 10000) {
    issues.push("Transform code is too long (max 10000 characters)");
  }

  // Check for infinite loops (basic heuristic)
  if (
    /while\s*\(\s*true\s*\)/.test(code) ||
    /for\s*\(\s*;\s*;\s*\)/.test(code)
  ) {
    securityConcerns.push("Potential infinite loop detected");
  }

  return { issues, securityConcerns };
}

const VALIDATOR_PROMPT = `You are a security-focused code reviewer for browser-based developer tools.

Your task is to review a generated tool definition and identify any issues with:
1. **Security**: Look for code that could be malicious, access unauthorized resources, or cause harm
2. **Correctness**: Check if the transform logic matches the tool's description
3. **Edge Cases**: Identify potential runtime errors or unhandled cases
4. **Quality**: Suggest improvements for clarity and robustness

The transform code runs in a sandboxed environment with ONLY these APIs available:
- String, Number, Array, Object, Math, Date, JSON, RegExp
- TextEncoder, TextDecoder, btoa, atob
- crypto.randomUUID(), crypto.getRandomValues(), crypto.subtle.digest()
- encodeURIComponent, decodeURIComponent, escape, unescape
- parseInt, parseFloat, isNaN, isFinite, Intl.Collator

Any use of fetch, localStorage, document, window, eval, setTimeout, etc. is FORBIDDEN.

Review the tool and report any issues. Be concise and specific.`;

export async function POST(req: Request) {
  try {
    const { tool } = (await req.json()) as {
      tool: CustomToolDefinitionGenerated;
    };

    if (!tool || !tool.transformCode) {
      return new Response(
        JSON.stringify({ error: "Missing tool definition" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Perform static analysis first
    const staticAnalysis = performStaticAnalysis(tool);

    // If there are critical security concerns, reject immediately
    if (staticAnalysis.securityConcerns.length > 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          issues: staticAnalysis.issues,
          securityConcerns: staticAnalysis.securityConcerns,
          suggestions: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // If there are syntax errors, reject immediately
    if (staticAnalysis.issues.some((i) => i.includes("syntax error"))) {
      return new Response(
        JSON.stringify({
          valid: false,
          issues: staticAnalysis.issues,
          securityConcerns: [],
          suggestions: ["Fix the syntax error in the transform code"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Use AI to do deeper review via Vercel AI Gateway with DevTools middleware
    // Run `bun run devtools` to view the DevTools dashboard at http://localhost:4983
    const { output } = await generateText({
      model: await createModel(VALIDATOR_MODEL),
      output: Output.object({ schema: validationResultSchema }),
      system: VALIDATOR_PROMPT,
      prompt: `Review this tool definition:

Name: ${tool.name}
Description: ${tool.description}
Input Type: ${tool.inputType}
Output Type: ${tool.outputType}

Transform Code:
\`\`\`javascript
${tool.transformCode}
\`\`\`

Options: ${JSON.stringify(tool.options || [], null, 2)}

Static analysis found these issues: ${
        staticAnalysis.issues.length > 0
          ? staticAnalysis.issues.join(", ")
          : "None"
      }

Provide your validation result.`,
    });

    // Merge static analysis with AI review
    const result = {
      valid: output?.valid ?? staticAnalysis.issues.length === 0,
      issues: [...staticAnalysis.issues, ...(output?.issues || [])],
      securityConcerns: [
        ...staticAnalysis.securityConcerns,
        ...(output?.securityConcerns || []),
      ],
      suggestions: output?.suggestions || [],
    };

    // If there are any issues or security concerns, mark as invalid
    if (result.issues.length > 0 || result.securityConcerns.length > 0) {
      result.valid = false;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(JSON.stringify({ error: "Failed to validate tool" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
