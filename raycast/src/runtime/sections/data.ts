import type { ToolDefinition } from "../types";

export const dataTools: ToolDefinition[] = [
  {
    slug: "data-extract-suite",
    name: "Data Extraction Suite",
    description: "Extract emails, URLs, IPs, and key/value pairs",
    section: "data",
    aliases: ["extract", "emails", "urls"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "emails",
        options: [
          { value: "emails", label: "Extract emails" },
          { value: "urls", label: "Extract URLs" },
          { value: "ips", label: "Extract IPs" },
          { value: "keyvalue", label: "Extract key=value" },
          { value: "json", label: "Extract JSON" },
          { value: "grok", label: "Grok-like pattern" },
        ],
      },
      {
        id: "grokPattern",
        label: "Pattern",
        type: "text",
        default: "%{IP:ip} %{WORD:method} %{URIPATHPARAM:path}",
        visibleWhen: { optionId: "mode", equals: "grok" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "");
      const mode = String(opts.mode);

      switch (mode) {
        case "emails":
          return extractMatches(
            text,
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
          );
        case "urls":
          return extractMatches(text, /https?:\/\/[^\s]+/gi);
        case "ips":
          return extractMatches(text, /\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
        case "keyvalue":
          return extractMatches(text, /\b([A-Za-z0-9_-]+)=([^\s]+)/g, true);
        case "json":
          return extractJson(text);
        case "grok": {
          const pattern = String(opts.grokPattern || "");
          if (!pattern) return "";
          return extractGrok(text, pattern);
        }
        default:
          return "";
      }
    },
  },
];

function extractMatches(
  text: string,
  regex: RegExp,
  joinPairs = false,
): string {
  const matches = Array.from(text.matchAll(regex));
  if (matches.length === 0) return "No matches";
  if (joinPairs) {
    return matches.map((m) => `${m[1]}=${m[2]}`).join("\n");
  }
  return matches.map((m) => m[0]).join("\n");
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return "No JSON found";
  }
  const candidate = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return "Invalid JSON block";
  }
}

const GROK_PATTERNS: Record<string, string> = {
  WORD: "\\b\\w+\\b",
  INT: "-?\\d+",
  NUMBER: "-?\\d+(?:\\.\\d+)?",
  BASE10NUM: "-?\\d+(?:\\.\\d+)?",
  DATA: ".*?",
  GREEDYDATA: ".*",
  IP: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
  EMAIL: "[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}",
  URI: "https?:\\/\\/[^\\s]+",
  URIPATHPARAM: "\\/[^\\s]*",
  HOSTNAME: "\\b[a-zA-Z0-9.-]+\\b",
  TIMESTAMP_ISO8601:
    "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:?\\d{2})",
};

function extractGrok(text: string, pattern: string): string {
  let regex: RegExp;
  try {
    regex = compileGrok(pattern);
  } catch (error) {
    return `Invalid pattern: ${(error as Error).message}`;
  }
  const matches = Array.from(text.matchAll(regex));
  if (!matches.length) return "No matches";
  const rows = matches.map((match) => {
    if (match.groups) return match.groups;
    return { match: match[0] };
  });
  return JSON.stringify(rows, null, 2);
}

function compileGrok(pattern: string): RegExp {
  const replaced = pattern.replace(
    /%{([A-Z0-9_]+)(?::([A-Za-z0-9_]+))?}/g,
    (_m, name, field) => {
      const source = GROK_PATTERNS[name] ?? ".*?";
      if (field) return `(?<${field}>${source})`;
      return `(?:${source})`;
    },
  );
  return new RegExp(replaced, "g");
}
