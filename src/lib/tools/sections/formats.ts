import yaml from "js-yaml";
import type { ToolDefinition } from "../types";

export const formatTools: ToolDefinition[] = [
  {
    slug: "json-format",
    name: "JSON Formatter / Minifier",
    description: "Pretty print or minify JSON with options",
    section: "formats",
    aliases: ["json-pretty", "json-beautify", "json-minify"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "format",
        options: [
          { value: "format", label: "Format (pretty)" },
          { value: "minify", label: "Minify" },
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
      { id: "sortKeys", label: "Sort keys", type: "toggle", default: false },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        let obj = JSON.parse(str);
        if (opts.sortKeys) {
          obj = sortObjectKeys(obj);
        }
        return opts.mode === "minify"
          ? JSON.stringify(obj)
          : JSON.stringify(obj, null, Number(opts.indent) || 2);
      } catch (e) {
        return {
          type: "error",
          message: `Invalid JSON: ${(e as Error).message}`,
        };
      }
    },
    examples: [{ input: '{"b":2,"a":1}', output: '{\n  "a": 1,\n  "b": 2\n}' }],
  },
  {
    slug: "json-validate",
    name: "JSON Validator",
    description: "Validate JSON and show error location",
    section: "formats",
    aliases: ["json-lint", "json-check"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        JSON.parse(str);
        return "✓ Valid JSON";
      } catch (e) {
        const msg = (e as Error).message;
        const posMatch = msg.match(/position (\d+)/);
        if (posMatch) {
          const pos = Number.parseInt(posMatch[1], 10);
          const lines = str.slice(0, pos).split("\n");
          const line = lines.length;
          const col = lines[lines.length - 1].length + 1;
          return `✗ Invalid JSON at line ${line}, column ${col}\n\n${msg}`;
        }
        return `✗ Invalid JSON\n\n${msg}`;
      }
    },
  },
  {
    slug: "json-sort-keys",
    name: "JSON Key Sorter",
    description: "Sort all keys in JSON alphabetically (stable for diffs)",
    section: "formats",
    aliases: ["sort-json", "stable-json"],
    inputType: "text",
    outputType: "text",
    options: [
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
      try {
        const obj = JSON.parse(str);
        return JSON.stringify(
          sortObjectKeys(obj),
          null,
          Number(opts.indent) || 2,
        );
      } catch {
        return { type: "error", message: "Invalid JSON" };
      }
    },
  },
  {
    slug: "json-path",
    name: "JSON Path Tester",
    description: "Evaluate JSONPath expressions on JSON data",
    section: "formats",
    aliases: ["jsonpath", "jq"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "path",
        label: "Path (e.g. .users[0].name)",
        type: "text",
        default: "",
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      const path = String(opts.path).trim();
      if (!str) return "";
      if (!path) return str;

      try {
        const obj = JSON.parse(str);
        const result = evaluateSimplePath(obj, path);
        return JSON.stringify(result, null, 2);
      } catch (e) {
        return { type: "error", message: (e as Error).message };
      }
    },
  },
  {
    slug: "yaml-json",
    name: "YAML ↔ JSON",
    description: "Convert between YAML and JSON",
    section: "formats",
    aliases: ["yaml", "yml"],
    inputType: "text",
    outputType: "text",
    allowSwap: true,
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "yamlToJson",
        options: [
          { value: "yamlToJson", label: "YAML → JSON" },
          { value: "jsonToYaml", label: "JSON → YAML" },
        ],
      },
      {
        id: "indent",
        label: "Indent",
        type: "number",
        default: 2,
        min: 1,
        max: 8,
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        if (opts.mode === "yamlToJson") {
          const obj = yaml.load(str);
          return JSON.stringify(obj, null, Number(opts.indent) || 2);
        }
        const obj = JSON.parse(str);
        return yaml.dump(obj, { indent: Number(opts.indent) || 2 });
      } catch (e) {
        return { type: "error", message: (e as Error).message };
      }
    },
  },
  {
    slug: "xml-format",
    name: "XML Formatter / Minifier",
    description: "Pretty print or minify XML",
    section: "formats",
    aliases: ["xml-pretty", "xml-beautify"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "format",
        options: [
          { value: "format", label: "Format" },
          { value: "minify", label: "Minify" },
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

      if (opts.mode === "minify") {
        return str.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
      }

      // Simple XML formatter
      const indent = " ".repeat(Number(opts.indent) || 2);
      let level = 0;
      const formatted = str
        .replace(/>\s+</g, "><")
        .replace(/></g, ">\n<")
        .split("\n")
        .map((line) => {
          line = line.trim();
          if (line.match(/^<\/\w/)) level--;
          const indented = indent.repeat(Math.max(0, level)) + line;
          if (line.match(/^<\w[^>]*[^/]>.*$/)) level++;
          return indented;
        })
        .join("\n");
      return formatted;
    },
  },
  {
    slug: "xml-json",
    name: "XML ↔ JSON (Simple)",
    description: "Convert between XML and JSON (basic conversion)",
    section: "formats",
    aliases: ["xml-to-json", "json-to-xml"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "xmlToJson",
        options: [
          { value: "xmlToJson", label: "XML → JSON" },
          { value: "jsonToXml", label: "JSON → XML" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        if (opts.mode === "xmlToJson") {
          const parser = new DOMParser();
          const doc = parser.parseFromString(str, "text/xml");
          if (doc.querySelector("parsererror")) {
            return { type: "error", message: "Invalid XML" };
          }
          return JSON.stringify(xmlToJson(doc), null, 2);
        }
        const obj = JSON.parse(str);
        return jsonToXml(obj);
      } catch (e) {
        return { type: "error", message: (e as Error).message };
      }
    },
  },
  {
    slug: "csv-viewer",
    name: "CSV / TSV Viewer",
    description: "Parse and display CSV/TSV as a table",
    section: "formats",
    aliases: ["csv", "tsv", "spreadsheet"],
    inputType: "text",
    outputType: "table",
    options: [
      {
        id: "delimiter",
        label: "Delimiter",
        type: "select",
        default: ",",
        options: [
          { value: ",", label: "Comma (,)" },
          { value: "\t", label: "Tab" },
          { value: ";", label: "Semicolon (;)" },
          { value: "|", label: "Pipe (|)" },
        ],
      },
      {
        id: "hasHeader",
        label: "First row is header",
        type: "toggle",
        default: true,
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";
      const rows = parseCsv(str, String(opts.delimiter));
      return JSON.stringify({ rows, hasHeader: opts.hasHeader });
    },
  },
  {
    slug: "csv-json",
    name: "CSV ↔ JSON",
    description: "Convert between CSV and JSON array",
    section: "formats",
    aliases: ["csv-to-json", "json-to-csv"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "csvToJson",
        options: [
          { value: "csvToJson", label: "CSV → JSON" },
          { value: "jsonToCsv", label: "JSON → CSV" },
        ],
      },
      {
        id: "delimiter",
        label: "Delimiter",
        type: "select",
        default: ",",
        options: [
          { value: ",", label: "Comma" },
          { value: "\t", label: "Tab" },
          { value: ";", label: "Semicolon" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";
      try {
        if (opts.mode === "csvToJson") {
          const rows = parseCsv(str, String(opts.delimiter));
          if (rows.length < 2) return "[]";
          const headers = rows[0];
          const data = rows
            .slice(1)
            .map((row) =>
              Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])),
            );
          return JSON.stringify(data, null, 2);
        }
        const arr = JSON.parse(str);
        if (!Array.isArray(arr) || arr.length === 0) return "";
        const headers = Object.keys(arr[0]);
        const delim = String(opts.delimiter);
        const rows = [headers.join(delim)];
        for (const obj of arr) {
          rows.push(
            headers
              .map((h) => escapeCsvValue(String(obj[h] ?? ""), delim))
              .join(delim),
          );
        }
        return rows.join("\n");
      } catch (e) {
        return { type: "error", message: (e as Error).message };
      }
    },
  },
  {
    slug: "delimiter-detect",
    name: "Delimiter Detector",
    description: "Detect CSV delimiter (comma, tab, semicolon, pipe)",
    section: "formats",
    aliases: ["csv-detect", "separator-detect"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const str = String(input).trim();
      if (!str) return "";
      const delimiters = [",", "\t", ";", "|"];
      const counts = delimiters.map((d) => ({
        delimiter: d === "\t" ? "Tab" : d,
        count: (str.match(new RegExp(d === "|" ? "\\|" : d, "g")) || []).length,
      }));
      counts.sort((a, b) => b.count - a.count);
      return `Detected delimiter: ${counts[0].delimiter}\n\nCounts:\n${counts.map((c) => `  ${c.delimiter}: ${c.count}`).join("\n")}`;
    },
  },
  {
    slug: "ndjson-tools",
    name: "NDJSON Tools",
    description: "Parse, validate, and convert NDJSON (newline-delimited JSON)",
    section: "formats",
    aliases: ["jsonl", "json-lines", "newline-json"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "validate",
        options: [
          { value: "validate", label: "Validate" },
          { value: "toArray", label: "NDJSON → JSON Array" },
          { value: "toNdjson", label: "JSON Array → NDJSON" },
          { value: "pretty", label: "Pretty print each line" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      if (opts.mode === "toNdjson") {
        try {
          const arr = JSON.parse(str);
          if (!Array.isArray(arr))
            return { type: "error", message: "Input must be a JSON array" };
          return arr.map((item) => JSON.stringify(item)).join("\n");
        } catch {
          return { type: "error", message: "Invalid JSON array" };
        }
      }

      const lines = str.split("\n").filter(Boolean);
      const results: unknown[] = [];
      const errors: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          results.push(JSON.parse(lines[i]));
        } catch {
          errors.push(`Line ${i + 1}: Invalid JSON`);
        }
      }

      if (opts.mode === "validate") {
        if (errors.length === 0) {
          return `✓ Valid NDJSON (${lines.length} lines)`;
        }
        return `✗ Invalid NDJSON\n\n${errors.join("\n")}`;
      }

      if (errors.length > 0) {
        return { type: "error", message: errors.join("\n") };
      }

      if (opts.mode === "toArray") {
        return JSON.stringify(results, null, 2);
      }

      // pretty
      return results.map((r) => JSON.stringify(r, null, 2)).join("\n\n");
    },
  },
  {
    slug: "env-parser",
    name: ".env Parser",
    description: "Parse .env files to JSON and back",
    section: "formats",
    aliases: ["dotenv", "environment-variables"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "toJson",
        options: [
          { value: "toJson", label: ".env → JSON" },
          { value: "toEnv", label: "JSON → .env" },
        ],
      },
      {
        id: "maskSecrets",
        label: "Mask secrets",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      if (opts.mode === "toJson") {
        const result: Record<string, string> = {};
        const secretPatterns = /key|secret|password|token|api|auth/i;

        for (const line of str.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            let value = match[2].trim();
            // Remove quotes
            if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              value = value.slice(1, -1);
            }
            if (opts.maskSecrets && secretPatterns.test(match[1])) {
              value = "***MASKED***";
            }
            result[match[1].trim()] = value;
          }
        }
        return JSON.stringify(result, null, 2);
      }

      try {
        const obj = JSON.parse(str);
        return Object.entries(obj)
          .map(([k, v]) => `${k}=${String(v).includes(" ") ? `"${v}"` : v}`)
          .join("\n");
      } catch {
        return { type: "error", message: "Invalid JSON" };
      }
    },
  },
  {
    slug: "toml-json",
    name: "TOML ↔ JSON",
    description: "Convert between TOML and JSON (basic)",
    section: "formats",
    aliases: ["toml"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "tomlToJson",
        options: [
          { value: "tomlToJson", label: "TOML → JSON" },
          { value: "jsonToToml", label: "JSON → TOML" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      if (opts.mode === "tomlToJson") {
        // Simple TOML parser
        const result: Record<string, unknown> = {};
        let currentSection = result;

        for (const line of str.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
          if (sectionMatch) {
            const path = sectionMatch[1].split(".");
            currentSection = result;
            for (const key of path) {
              if (!(key in currentSection)) {
                (currentSection as Record<string, unknown>)[key] = {};
              }
              currentSection = (currentSection as Record<string, unknown>)[
                key
              ] as Record<string, unknown>;
            }
            continue;
          }

          const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
          if (kvMatch) {
            const key = kvMatch[1].trim();
            let value: unknown = kvMatch[2].trim();
            // Parse value
            if (value === "true") value = true;
            else if (value === "false") value = false;
            else if (/^-?\d+$/.test(value as string))
              value = Number.parseInt(value as string, 10);
            else if (/^-?\d+\.\d+$/.test(value as string))
              value = Number.parseFloat(value as string);
            else if ((value as string).startsWith('"'))
              value = (value as string).slice(1, -1);
            (currentSection as Record<string, unknown>)[key] = value;
          }
        }
        return JSON.stringify(result, null, 2);
      }

      try {
        const obj = JSON.parse(str);
        return jsonToToml(obj);
      } catch {
        return { type: "error", message: "Invalid JSON" };
      }
    },
  },
  {
    slug: "markdown-table",
    name: "Markdown Table Generator",
    description: "Generate Markdown tables from JSON or CSV",
    section: "formats",
    aliases: ["md-table", "table-markdown"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "input",
        label: "Input format",
        type: "select",
        default: "json",
        options: [
          { value: "json", label: "JSON Array" },
          { value: "csv", label: "CSV" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input).trim();
      if (!str) return "";

      try {
        let rows: string[][];
        if (opts.input === "json") {
          const arr = JSON.parse(str);
          if (!Array.isArray(arr) || arr.length === 0) return "";
          const headers = Object.keys(arr[0]);
          rows = [
            headers,
            ...arr.map((obj: Record<string, unknown>) =>
              headers.map((h) => String(obj[h] ?? "")),
            ),
          ];
        } else {
          rows = parseCsv(str, ",");
        }

        if (rows.length < 1) return "";
        const colWidths = rows[0].map((_, i) =>
          Math.max(...rows.map((r) => (r[i] || "").length)),
        );
        const formatRow = (row: string[]) =>
          `| ${row.map((cell, i) => cell.padEnd(colWidths[i])).join(" | ")} |`;
        const separator = `| ${colWidths.map((w) => "-".repeat(w)).join(" | ")} |`;

        return [
          formatRow(rows[0]),
          separator,
          ...rows.slice(1).map(formatRow),
        ].join("\n");
      } catch {
        return { type: "error", message: "Invalid input" };
      }
    },
  },
];

// Helper functions
function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
          return result;
        },
        {} as Record<string, unknown>,
      );
  }
  return obj;
}

function evaluateSimplePath(obj: unknown, path: string): unknown {
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function xmlToJson(node: Node): unknown {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text || null;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const result: Record<string, unknown> = {};

    // Add attributes
    for (const attr of Array.from(element.attributes)) {
      result[`@${attr.name}`] = attr.value;
    }

    // Add children
    const children = Array.from(element.childNodes);
    for (const child of children) {
      const childResult = xmlToJson(child);
      if (childResult === null) continue;

      const childName = child.nodeName;
      if (childName === "#text") {
        if (Object.keys(result).length === 0) return childResult;
        result["#text"] = childResult;
      } else if (childName in result) {
        if (!Array.isArray(result[childName])) {
          result[childName] = [result[childName]];
        }
        (result[childName] as unknown[]).push(childResult);
      } else {
        result[childName] = childResult;
      }
    }

    return result;
  }

  return null;
}

function jsonToXml(obj: unknown, rootName = "root", indent = ""): string {
  if (obj === null || obj === undefined) return "";
  if (typeof obj !== "object")
    return `${indent}<${rootName}>${obj}</${rootName}>`;

  if (Array.isArray(obj)) {
    return obj.map((item) => jsonToXml(item, rootName, indent)).join("\n");
  }

  const entries = Object.entries(obj as Record<string, unknown>);
  const attrs = entries.filter(([k]) => k.startsWith("@"));
  const children = entries.filter(([k]) => !k.startsWith("@"));

  const attrStr = attrs.map(([k, v]) => ` ${k.slice(1)}="${v}"`).join("");

  if (children.length === 0) {
    return `${indent}<${rootName}${attrStr}/>`;
  }

  const childStr = children
    .map(([k, v]) => jsonToXml(v, k, `${indent}  `))
    .join("\n");
  return `${indent}<${rootName}${attrStr}>\n${childStr}\n${indent}</${rootName}>`;
}

function parseCsv(str: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const next = str[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        current.push(cell);
        cell = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        current.push(cell);
        rows.push(current);
        current = [];
        cell = "";
        if (char === "\r") i++;
      } else {
        cell += char;
      }
    }
  }

  if (cell || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }

  return rows;
}

function escapeCsvValue(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function jsonToToml(obj: Record<string, unknown>, prefix = ""): string {
  const lines: string[] = [];
  const nested: [string, Record<string, unknown>][] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      nested.push([key, value as Record<string, unknown>]);
    } else {
      let tomlValue: string;
      if (typeof value === "string") tomlValue = `"${value}"`;
      else if (typeof value === "boolean" || typeof value === "number")
        tomlValue = String(value);
      else if (Array.isArray(value)) tomlValue = JSON.stringify(value);
      else tomlValue = String(value);
      lines.push(`${key} = ${tomlValue}`);
    }
  }

  for (const [key, value] of nested) {
    const section = prefix ? `${prefix}.${key}` : key;
    lines.push("", `[${section}]`, jsonToToml(value, section));
  }

  return lines.join("\n");
}
