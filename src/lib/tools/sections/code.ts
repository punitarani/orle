import type { ToolDefinition } from "../types";

export const codeTools: ToolDefinition[] = [
  {
    slug: "json-beautify",
    name: "JSON / CSS / HTML Beautify",
    description: "Format and beautify code",
    section: "code",
    aliases: ["beautify", "format-code", "pretty-print"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "language",
        label: "Language",
        type: "select",
        default: "json",
        options: [
          { value: "json", label: "JSON" },
          { value: "html", label: "HTML" },
          { value: "css", label: "CSS" },
        ],
      },
      {
        id: "indent",
        label: "Indent spaces",
        type: "number",
        default: 2,
        min: 1,
        max: 8,
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      const indent = Number(opts.indent) || 2;

      switch (opts.language) {
        case "json":
          try {
            const obj = JSON.parse(str);
            return JSON.stringify(obj, null, indent);
          } catch (e) {
            return {
              type: "error",
              message: `Invalid JSON: ${(e as Error).message}`,
            };
          }

        case "html":
          return beautifyHtml(str, indent);

        case "css":
          return beautifyCss(str, indent);

        default:
          return str;
      }
    },
  },
  {
    slug: "minify-json",
    name: "Minify JSON",
    description: "Remove whitespace from JSON",
    section: "code",
    aliases: ["compress-json", "compact-json"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";

      try {
        const obj = JSON.parse(str);
        return JSON.stringify(obj);
      } catch (e) {
        return {
          type: "error",
          message: `Invalid JSON: ${(e as Error).message}`,
        };
      }
    },
  },
  {
    slug: "remove-comments",
    name: "Remove Comments",
    description: "Remove comments from JSON-with-comments, JS, or CSS",
    section: "code",
    aliases: ["strip-comments", "clean-code"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "language",
        label: "Language",
        type: "select",
        default: "js",
        options: [
          { value: "js", label: "JavaScript / JSON-C" },
          { value: "css", label: "CSS" },
          { value: "html", label: "HTML" },
        ],
      },
    ],
    transform: (input, opts) => {
      let str = String(input);
      if (!str) return "";

      switch (opts.language) {
        case "js":
          // Remove single-line comments
          str = str.replace(/\/\/[^\n]*/g, "");
          // Remove multi-line comments
          str = str.replace(/\/\*[\s\S]*?\*\//g, "");
          break;

        case "css":
          str = str.replace(/\/\*[\s\S]*?\*\//g, "");
          break;

        case "html":
          str = str.replace(/<!--[\s\S]*?-->/g, "");
          break;
      }

      // Clean up extra blank lines
      str = str.replace(/\n\s*\n\s*\n/g, "\n\n");

      return str.trim();
    },
  },
  {
    slug: "escape-builder",
    name: "Escape Builders",
    description: "Escape strings for JSON, Regex, Bash, SQL",
    section: "code",
    aliases: ["escape", "quote", "literal"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "format",
        label: "Format",
        type: "select",
        default: "json",
        options: [
          { value: "json", label: "JSON string" },
          { value: "regex", label: "Regex literal" },
          { value: "bash", label: "Bash string" },
          { value: "sql", label: "SQL literal" },
          { value: "html", label: "HTML attribute" },
          { value: "url", label: "URL component" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";

      switch (opts.format) {
        case "json":
          return JSON.stringify(str);

        case "regex":
          return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        case "bash":
          // Escape for single quotes
          return `'${str.replace(/'/g, "'\\''")}'`;

        case "sql":
          // Escape single quotes for SQL
          return `'${str.replace(/'/g, "''")}'`;

        case "html":
          return str
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        case "url":
          return encodeURIComponent(str);

        default:
          return str;
      }
    },
    examples: [{ input: 'Hello "World"', output: '"Hello \\"World\\""' }],
  },
  {
    slug: "normalize-code",
    name: "Normalize Newlines & Indentation",
    description: "Fix inconsistent line endings and indentation",
    section: "code",
    aliases: ["fix-whitespace", "normalize"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "lineEnding",
        label: "Line endings",
        type: "select",
        default: "lf",
        options: [
          { value: "lf", label: "LF (Unix/Mac)" },
          { value: "crlf", label: "CRLF (Windows)" },
        ],
      },
      {
        id: "indentation",
        label: "Indentation",
        type: "select",
        default: "spaces",
        options: [
          { value: "keep", label: "Keep as-is" },
          { value: "spaces", label: "Convert to spaces" },
          { value: "tabs", label: "Convert to tabs" },
        ],
      },
      {
        id: "indentSize",
        label: "Indent size",
        type: "number",
        default: 2,
        min: 1,
        max: 8,
      },
      {
        id: "trimTrailing",
        label: "Trim trailing whitespace",
        type: "toggle",
        default: true,
      },
      {
        id: "ensureFinalNewline",
        label: "Ensure final newline",
        type: "toggle",
        default: true,
      },
    ],
    transform: (input, opts) => {
      let str = String(input);
      if (!str) return "";

      // Normalize line endings to LF first
      str = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      // Trim trailing whitespace
      if (opts.trimTrailing) {
        str = str
          .split("\n")
          .map((line) => line.replace(/\s+$/, ""))
          .join("\n");
      }

      // Convert indentation
      if (opts.indentation !== "keep") {
        const size = Number(opts.indentSize);
        const lines = str.split("\n");

        str = lines
          .map((line) => {
            const match = line.match(/^(\s*)/);
            if (!match || !match[1]) return line;

            const leadingSpace = match[1];
            // Count existing indent level
            let level = 0;
            for (const char of leadingSpace) {
              if (char === "\t") level += size;
              else level += 1;
            }
            level = Math.floor(level / size);

            const newIndent =
              opts.indentation === "tabs"
                ? "\t".repeat(level)
                : " ".repeat(level * size);

            return newIndent + line.slice(leadingSpace.length);
          })
          .join("\n");
      }

      // Apply line ending
      if (opts.lineEnding === "crlf") {
        str = str.replace(/\n/g, "\r\n");
      }

      // Ensure final newline
      if (opts.ensureFinalNewline) {
        const eol = opts.lineEnding === "crlf" ? "\r\n" : "\n";
        if (!str.endsWith(eol)) {
          str += eol;
        }
      }

      return str;
    },
  },
];

// Helper functions
function beautifyHtml(html: string, indentSize: number): string {
  const indent = " ".repeat(indentSize);
  let level = 0;
  const lines: string[] = [];

  // Simple HTML formatter
  const tokens = html.replace(/>\s*</g, ">\n<").split("\n");

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    // Decrease indent for closing tags
    if (trimmed.match(/^<\/\w/) && level > 0) {
      level--;
    }

    lines.push(indent.repeat(level) + trimmed);

    // Increase indent for opening tags (not self-closing)
    if (
      trimmed.match(/^<\w[^>]*[^/]>/) &&
      !trimmed.match(/<(br|hr|img|input|meta|link)/i)
    ) {
      level++;
    }
  }

  return lines.join("\n");
}

function beautifyCss(css: string, indentSize: number): string {
  const indent = " ".repeat(indentSize);

  // Add newlines after { and ;
  let result = css
    .replace(/\{/g, " {\n")
    .replace(/\}/g, "\n}\n")
    .replace(/;/g, ";\n");

  // Indent
  const lines = result.split("\n");
  let level = 0;

  result = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      if (trimmed === "}") level--;
      const indented = indent.repeat(Math.max(0, level)) + trimmed;
      if (trimmed.endsWith("{")) level++;

      return indented;
    })
    .filter(Boolean)
    .join("\n");

  return result;
}
