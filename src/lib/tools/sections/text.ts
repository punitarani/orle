import type { ToolDefinition } from "../types";

export const textTools: ToolDefinition[] = [
  {
    slug: "text-suite",
    name: "Text Transform Suite",
    description: "Case conversion, sorting, filtering, regex, and more",
    section: "text",
    aliases: ["case", "lines", "regex", "slug"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "case",
        options: [
          { value: "case", label: "Case convert" },
          { value: "trim", label: "Trim / normalize whitespace" },
          { value: "sort", label: "Sort lines" },
          { value: "unique", label: "Unique lines" },
          { value: "remove-empty", label: "Remove empty lines" },
          { value: "prefix", label: "Add prefix/suffix" },
          { value: "wrap", label: "Wrap lines" },
          { value: "reverse", label: "Reverse text/lines" },
          { value: "extract", label: "Extract lines containing" },
          { value: "regex-replace", label: "Regex replace" },
          { value: "regex-match", label: "Regex match extractor" },
          { value: "slugify", label: "Slugify" },
        ],
      },
      {
        id: "caseStyle",
        label: "Case style",
        type: "select",
        default: "lower",
        options: [
          { value: "lower", label: "lower" },
          { value: "upper", label: "UPPER" },
          { value: "title", label: "Title" },
          { value: "snake", label: "snake_case" },
          { value: "kebab", label: "kebab-case" },
          { value: "camel", label: "camelCase" },
          { value: "pascal", label: "PascalCase" },
        ],
        visibleWhen: { optionId: "mode", equals: "case" },
      },
      {
        id: "sortOrder",
        label: "Sort order",
        type: "select",
        default: "asc",
        options: [
          { value: "asc", label: "Ascending" },
          { value: "desc", label: "Descending" },
        ],
        visibleWhen: { optionId: "mode", equals: "sort" },
      },
      {
        id: "sortNumeric",
        label: "Numeric sort",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "sort" },
      },
      {
        id: "prefixValue",
        label: "Prefix",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "prefix" },
      },
      {
        id: "suffixValue",
        label: "Suffix",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "prefix" },
      },
      {
        id: "wrapWidth",
        label: "Wrap width",
        type: "number",
        default: 80,
        min: 10,
        max: 200,
        visibleWhen: { optionId: "mode", equals: "wrap" },
      },
      {
        id: "reverseMode",
        label: "Reverse",
        type: "select",
        default: "lines",
        options: [
          { value: "lines", label: "Line order" },
          { value: "text", label: "Text characters" },
        ],
        visibleWhen: { optionId: "mode", equals: "reverse" },
      },
      {
        id: "extractNeedle",
        label: "Contains",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "extract" },
      },
      {
        id: "regexPattern",
        label: "Regex pattern",
        type: "text",
        default: "",
        visibleWhen: {
          optionId: "mode",
          equals: ["regex-replace", "regex-match"],
        },
      },
      {
        id: "regexFlags",
        label: "Regex flags",
        type: "text",
        default: "g",
        visibleWhen: {
          optionId: "mode",
          equals: ["regex-replace", "regex-match"],
        },
      },
      {
        id: "regexReplacement",
        label: "Replacement",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "regex-replace" },
      },
      {
        id: "slugifyLower",
        label: "Lowercase",
        type: "toggle",
        default: true,
        visibleWhen: { optionId: "mode", equals: "slugify" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "");
      const mode = String(opts.mode);
      const lines = text.split(/\r?\n/);

      switch (mode) {
        case "case":
          return applyCase(text, String(opts.caseStyle));
        case "trim":
          return text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .join("\n")
            .replace(/\s+/g, " ")
            .trim();
        case "sort": {
          const sorted = [...lines].sort((a, b) => {
            if (opts.sortNumeric) {
              return Number(a) - Number(b);
            }
            return a.localeCompare(b);
          });
          if (opts.sortOrder === "desc") sorted.reverse();
          return sorted.join("\n");
        }
        case "unique": {
          const seen = new Set<string>();
          const unique = lines.filter((line) => {
            if (seen.has(line)) return false;
            seen.add(line);
            return true;
          });
          return unique.join("\n");
        }
        case "remove-empty":
          return lines.filter((line) => line.trim() !== "").join("\n");
        case "prefix": {
          const prefix = String(opts.prefixValue || "");
          const suffix = String(opts.suffixValue || "");
          return lines.map((line) => `${prefix}${line}${suffix}`).join("\n");
        }
        case "wrap": {
          const width = Math.max(10, Number(opts.wrapWidth) || 80);
          return wrapText(text, width);
        }
        case "reverse":
          return opts.reverseMode === "text"
            ? text.split("").reverse().join("")
            : lines.reverse().join("\n");
        case "extract": {
          const needle = String(opts.extractNeedle || "");
          if (!needle) return "";
          return lines.filter((line) => line.includes(needle)).join("\n");
        }
        case "regex-replace": {
          const pattern = String(opts.regexPattern || "");
          if (!pattern) return "";
          const flags = String(opts.regexFlags || "g");
          const regex = new RegExp(pattern, flags);
          return text.replace(regex, String(opts.regexReplacement || ""));
        }
        case "regex-match": {
          const pattern = String(opts.regexPattern || "");
          if (!pattern) return "";
          const flags = String(opts.regexFlags || "g");
          const regex = new RegExp(pattern, flags);
          const matches = Array.from(text.matchAll(regex));
          if (matches.length === 0) return "No matches";
          return matches
            .map((match, index) => {
              const groups = match.slice(1).filter(Boolean).join(" | ");
              return groups
                ? `#${index + 1}: ${match[0]} (groups: ${groups})`
                : `#${index + 1}: ${match[0]}`;
            })
            .join("\n");
        }
        case "slugify":
          return slugify(text, Boolean(opts.slugifyLower));
        default:
          return "";
      }
    },
  },
];

function applyCase(value: string, style: string): string {
  switch (style) {
    case "upper":
      return value.toUpperCase();
    case "title":
      return value.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
      );
    case "snake":
      return value.replace(/\s+/g, "_").replace(/-/g, "_").toLowerCase();
    case "kebab":
      return value.replace(/\s+/g, "-").replace(/_/g, "-").toLowerCase();
    case "camel":
      return value
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
        .replace(/^(.)/, (m) => m.toLowerCase());
    case "pascal":
      return value
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
        .replace(/^(.)/, (m) => m.toUpperCase());
    default:
      return value.toLowerCase();
  }
}

function wrapText(text: string, width: number): string {
  const words = text.split(/\s+/);
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width) {
      lines.push(line.trim());
      line = word;
    } else {
      line += ` ${word}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join("\n");
}

function slugify(text: string, lower: boolean): string {
  const normalized = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
  return lower ? normalized.toLowerCase() : normalized;
}
