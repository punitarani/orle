import { Output, streamText } from "ai";
import { createModel, GENERATOR_MODEL } from "@/lib/ai/model";
import { customToolDefinitionSchema } from "@/lib/tools/types";

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

// Reference examples of well-formed tools to guide generation
const TOOL_EXAMPLES = `
## Example 1: Text Transform Tool (encode/decode pattern)
{
  "slug": "base64-text",
  "name": "Base64 Encode / Decode (Text)",
  "description": "Encode or decode UTF-8 text to/from Base64",
  "section": "custom",
  "aliases": ["base64", "btoa", "atob"],
  "inputType": "text",
  "outputType": "text",
  "allowSwap": true,
  "options": [
    {
      "id": "mode",
      "label": "Mode",
      "type": "select",
      "default": "encode",
      "options": [
        { "value": "encode", "label": "Encode" },
        { "value": "decode", "label": "Decode" }
      ]
    },
    {
      "id": "urlSafe",
      "label": "URL-safe Base64",
      "type": "toggle",
      "default": false
    }
  ],
  "transformCode": "const str = String(input); if (!str) return ''; try { if (opts.mode === 'encode') { let result = btoa(unescape(encodeURIComponent(str))); if (opts.urlSafe) { result = result.replace(/\\\\+/g, '-').replace(/\\\\//g, '_').replace(/=+$/, ''); } return result; } let decoded = str.replace(/\\\\s/g, ''); if (opts.urlSafe) { decoded = decoded.replace(/-/g, '+').replace(/_/g, '/'); while (decoded.length % 4) decoded += '='; } return decodeURIComponent(escape(atob(decoded))); } catch { return { type: 'error', message: 'Invalid Base64 string' }; }",
  "examples": [{ "input": "Hello, World!", "output": "SGVsbG8sIFdvcmxkIQ==" }]
}

## Example 2: Generator Tool (no input)
{
  "slug": "uuid-generator",
  "name": "UUID v4 Generator",
  "description": "Generate random UUID v4 identifiers",
  "section": "custom",
  "aliases": ["uuid", "guid", "uuid4"],
  "inputType": "none",
  "outputType": "text",
  "options": [
    {
      "id": "count",
      "label": "Count",
      "type": "number",
      "default": 1,
      "min": 1,
      "max": 100
    },
    { "id": "uppercase", "label": "Uppercase", "type": "toggle", "default": false }
  ],
  "transformCode": "const count = Math.min(Number(opts.count) || 1, 100); const uuids = []; for (let i = 0; i < count; i++) { let uuid = crypto.randomUUID(); if (opts.uppercase) uuid = uuid.toUpperCase(); uuids.push(uuid); } return uuids.join('\\\\n');",
  "examples": []
}

## Example 3: Text Processing Tool
{
  "slug": "case-converter",
  "name": "Case Converter",
  "description": "Convert text between camelCase, PascalCase, snake_case, kebab-case, and more",
  "section": "custom",
  "aliases": ["camelcase", "snakecase", "pascalcase", "kebabcase"],
  "inputType": "text",
  "outputType": "text",
  "options": [
    {
      "id": "case",
      "label": "Convert to",
      "type": "select",
      "default": "camel",
      "options": [
        { "value": "camel", "label": "camelCase" },
        { "value": "pascal", "label": "PascalCase" },
        { "value": "snake", "label": "snake_case" },
        { "value": "kebab", "label": "kebab-case" },
        { "value": "upper", "label": "UPPERCASE" },
        { "value": "lower", "label": "lowercase" }
      ]
    }
  ],
  "transformCode": "const str = String(input); if (!str) return ''; const words = str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase().split(/\\\\s+/).filter(Boolean); switch (opts.case) { case 'camel': return words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(''); case 'pascal': return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''); case 'snake': return words.join('_'); case 'kebab': return words.join('-'); case 'upper': return str.toUpperCase(); case 'lower': return str.toLowerCase(); default: return str; }",
  "examples": [{ "input": "hello world example", "output": "helloWorldExample" }]
}

## Example 4: Hash/Crypto Tool
{
  "slug": "text-hash",
  "name": "Text Hash Generator",
  "description": "Generate SHA-256 hash of text",
  "section": "custom",
  "aliases": ["sha256", "hash", "checksum"],
  "inputType": "text",
  "outputType": "text",
  "options": [
    { "id": "uppercase", "label": "Uppercase", "type": "toggle", "default": false }
  ],
  "transformCode": "const str = String(input); if (!str) return ''; const encoder = new TextEncoder(); const data = encoder.encode(str); return crypto.subtle.digest('SHA-256', data).then(hashBuffer => { const hashArray = Array.from(new Uint8Array(hashBuffer)); let hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); if (opts.uppercase) hex = hex.toUpperCase(); return hex; });",
  "examples": [{ "input": "hello", "output": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" }]
}
`;

const SYSTEM_PROMPT = `You are an expert developer tool generator. Your task is to create tool definitions that match the orle.dev tool schema.

## Context
orle.dev is a collection of browser-based developer tools. Each tool has:
- A transform function that processes input and returns output
- Optional configurable options (toggles, selects, numbers, text inputs)
- The transform runs entirely in the browser with no server calls

## Transform Function Requirements
The transformCode is a JavaScript function body (NOT a full function declaration).
It receives two parameters:
- \`input\`: string | File - the user's input
- \`opts\`: Record<string, unknown> - option values keyed by option id

It must return one of:
- A string (the result)
- A Promise<string> for async operations like crypto.subtle
- An error object: { type: 'error', message: string }

## Available APIs in Transform
You can ONLY use these browser APIs:
- String, Number, Array, Object, Math, Date, JSON, RegExp
- TextEncoder, TextDecoder
- btoa, atob (base64)
- crypto.randomUUID(), crypto.getRandomValues(array)
- crypto.subtle.digest() for hashing
- encodeURIComponent, decodeURIComponent, escape, unescape
- parseInt, parseFloat, isNaN, isFinite
- Intl.Collator for sorting

## FORBIDDEN in Transform
- fetch, XMLHttpRequest (no network)
- localStorage, sessionStorage, indexedDB (no storage)
- document, window, DOM APIs
- eval, Function constructor
- import, require
- setTimeout, setInterval (no timers)
- console.log (no side effects)

## Tool Categories
Common tool types:
- **Encoders/Decoders**: Base64, URL encoding, hex, binary (use allowSwap: true)
- **Generators**: UUID, passwords, random data (use inputType: "none")
- **Text Transforms**: Case conversion, sorting, filtering, regex
- **Formatters**: JSON, XML, YAML beautify/minify
- **Converters**: Unit conversion, number bases, timestamps
- **Validators/Inspectors**: JSON validator, JWT decoder

${TOOL_EXAMPLES}

## Guidelines
1. Make the slug URL-friendly (lowercase, hyphens only)
2. Write clear, concise descriptions
3. Include 2-5 relevant aliases for searchability
4. Add helpful examples when possible
5. Use appropriate input/output types
6. Keep transform code concise but readable
7. Handle edge cases (empty input, invalid data)
8. Return error objects for invalid input, not throwing exceptions
9. For async operations (like crypto.subtle), return a Promise`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid prompt" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Using Vercel AI Gateway with DevTools middleware for debugging
    // Run `bun run devtools` to view the DevTools dashboard at http://localhost:4983
    const result = streamText({
      model: await createModel(GENERATOR_MODEL),
      output: Output.object({ schema: customToolDefinitionSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Create a developer tool based on this description:\n\n${prompt}\n\nGenerate a complete tool definition with a working transformCode.`,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Tool generation error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate tool" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
