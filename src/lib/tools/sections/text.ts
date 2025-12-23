import type { ToolDefinition } from "../types";

export const textTools: ToolDefinition[] = [
  {
    slug: "case-converter",
    name: "Case Converter",
    description:
      "Convert text between camelCase, PascalCase, snake_case, kebab-case, and more",
    section: "text",
    aliases: [
      "camelcase",
      "snakecase",
      "pascalcase",
      "kebabcase",
      "uppercase",
      "lowercase",
    ],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "case",
        label: "Convert to",
        type: "select",
        default: "camel",
        options: [
          { value: "camel", label: "camelCase" },
          { value: "pascal", label: "PascalCase" },
          { value: "snake", label: "snake_case" },
          { value: "kebab", label: "kebab-case" },
          { value: "constant", label: "CONSTANT_CASE" },
          { value: "title", label: "Title Case" },
          { value: "sentence", label: "Sentence case" },
          { value: "lower", label: "lowercase" },
          { value: "upper", label: "UPPERCASE" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      // Split into words
      const words = str
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      switch (opts.case) {
        case "camel":
          return words
            .map((w, i) =>
              i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1),
            )
            .join("");
        case "pascal":
          return words
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("");
        case "snake":
          return words.join("_");
        case "kebab":
          return words.join("-");
        case "constant":
          return words.join("_").toUpperCase();
        case "title":
          return words
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        case "sentence":
          return words
            .map((w, i) =>
              i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w,
            )
            .join(" ");
        case "lower":
          return str.toLowerCase();
        case "upper":
          return str.toUpperCase();
        default:
          return str;
      }
    },
    examples: [{ input: "hello world example", output: "helloWorldExample" }],
  },
  {
    slug: "slugify",
    name: "Slugify",
    description: "Convert text to URL-friendly slugs",
    section: "text",
    aliases: ["url-slug", "permalink"],
    inputType: "text",
    outputType: "text",
    options: [
      { id: "separator", label: "Separator", type: "text", default: "-" },
      { id: "lowercase", label: "Lowercase", type: "toggle", default: true },
      { id: "asciiOnly", label: "ASCII only", type: "toggle", default: true },
    ],
    transform: (input, opts) => {
      let str = String(input);
      if (!str) return "";
      if (opts.lowercase) str = str.toLowerCase();
      if (opts.asciiOnly) {
        str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }
      return str
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, String(opts.separator))
        .replace(new RegExp(`${opts.separator}+`, "g"), String(opts.separator))
        .replace(new RegExp(`^${opts.separator}|${opts.separator}$`, "g"), "");
    },
    examples: [
      {
        input: "Hello World! This is a Test",
        output: "hello-world-this-is-a-test",
      },
    ],
  },
  {
    slug: "whitespace-normalize",
    name: "Whitespace Normalizer",
    description: "Normalize spaces, tabs, and trim lines",
    section: "text",
    aliases: ["trim", "clean-whitespace", "remove-extra-spaces"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "collapseSpaces",
        label: "Collapse multiple spaces",
        type: "toggle",
        default: true,
      },
      {
        id: "trimLines",
        label: "Trim each line",
        type: "toggle",
        default: true,
      },
      {
        id: "removeBlankLines",
        label: "Remove blank lines",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      let str = String(input);
      if (!str) return "";
      let lines = str.split("\n");
      if (opts.trimLines) lines = lines.map((l) => l.trim());
      if (opts.removeBlankLines) lines = lines.filter((l) => l.length > 0);
      str = lines.join("\n");
      if (opts.collapseSpaces) str = str.replace(/[^\S\n]+/g, " ");
      return str;
    },
  },
  {
    slug: "tabs-spaces",
    name: "Tabs ↔ Spaces",
    description: "Convert between tabs and spaces",
    section: "text",
    aliases: ["indent", "tab-to-space", "space-to-tab"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "tabsToSpaces",
        options: [
          { value: "tabsToSpaces", label: "Tabs → Spaces" },
          { value: "spacesToTabs", label: "Spaces → Tabs" },
        ],
      },
      {
        id: "tabWidth",
        label: "Tab width",
        type: "number",
        default: 2,
        min: 1,
        max: 8,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const width = Number(opts.tabWidth) || 2;
      if (opts.mode === "tabsToSpaces") {
        return str.replace(/\t/g, " ".repeat(width));
      }
      const regex = new RegExp(` {${width}}`, "g");
      return str.replace(regex, "\t");
    },
  },
  {
    slug: "indent",
    name: "Indent / Outdent",
    description: "Add or remove leading indentation",
    section: "text",
    aliases: ["add-indent", "remove-indent"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "indent",
        options: [
          { value: "indent", label: "Indent" },
          { value: "outdent", label: "Outdent" },
        ],
      },
      {
        id: "spaces",
        label: "Spaces",
        type: "number",
        default: 2,
        min: 1,
        max: 8,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const spaces = Number(opts.spaces) || 2;
      const indent = " ".repeat(spaces);

      return str
        .split("\n")
        .map((line) => {
          if (opts.mode === "indent") return indent + line;
          if (line.startsWith(indent)) return line.slice(spaces);
          return line.replace(/^\s+/, "");
        })
        .join("\n");
    },
  },
  {
    slug: "line-endings",
    name: "Line Ending Converter",
    description: "Convert between LF (Unix) and CRLF (Windows) line endings",
    section: "text",
    aliases: ["crlf", "lf", "newline", "eol"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Convert to",
        type: "select",
        default: "lf",
        options: [
          { value: "lf", label: "LF (Unix/Mac)" },
          { value: "crlf", label: "CRLF (Windows)" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const normalized = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      return opts.mode === "crlf"
        ? normalized.replace(/\n/g, "\r\n")
        : normalized;
    },
  },
  {
    slug: "sort-lines",
    name: "Sort Lines",
    description: "Sort lines alphabetically, numerically, or naturally",
    section: "text",
    aliases: ["alphabetize", "order-lines"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "order",
        label: "Order",
        type: "select",
        default: "asc",
        options: [
          { value: "asc", label: "A → Z" },
          { value: "desc", label: "Z → A" },
          { value: "numeric", label: "Numeric" },
          { value: "natural", label: "Natural (a2 < a10)" },
        ],
      },
      {
        id: "caseInsensitive",
        label: "Case insensitive",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const lines = str.split("\n");

      const collator = new Intl.Collator(undefined, {
        numeric: opts.order === "natural" || opts.order === "numeric",
        sensitivity: opts.caseInsensitive ? "base" : "variant",
      });

      lines.sort((a, b) => {
        if (opts.order === "numeric") {
          const numA = Number.parseFloat(a) || 0;
          const numB = Number.parseFloat(b) || 0;
          return numA - numB;
        }
        return collator.compare(a, b);
      });

      if (opts.order === "desc") lines.reverse();
      return lines.join("\n");
    },
  },
  {
    slug: "unique-lines",
    name: "Unique Lines / Remove Duplicates",
    description: "Remove duplicate lines from text",
    section: "text",
    aliases: ["dedupe", "distinct", "remove-duplicates"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "preserveOrder",
        label: "Preserve original order",
        type: "toggle",
        default: true,
      },
      {
        id: "caseInsensitive",
        label: "Case insensitive",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const lines = str.split("\n");
      const seen = new Set<string>();
      const result: string[] = [];

      for (const line of lines) {
        const key = opts.caseInsensitive ? line.toLowerCase() : line;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(line);
        }
      }

      if (!opts.preserveOrder) result.sort();
      return result.join("\n");
    },
  },
  {
    slug: "filter-lines",
    name: "Filter Lines",
    description: "Keep or remove lines matching a pattern",
    section: "text",
    aliases: ["grep", "search-lines"],
    inputType: "text",
    outputType: "text",
    options: [
      { id: "pattern", label: "Pattern", type: "text", default: "" },
      { id: "isRegex", label: "Use regex", type: "toggle", default: false },
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "keep",
        options: [
          { value: "keep", label: "Keep matching" },
          { value: "remove", label: "Remove matching" },
        ],
      },
      {
        id: "caseInsensitive",
        label: "Case insensitive",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      const pattern = String(opts.pattern);
      if (!str || !pattern) return str;

      const lines = str.split("\n");
      let matcher: (line: string) => boolean;

      if (opts.isRegex) {
        try {
          const regex = new RegExp(pattern, opts.caseInsensitive ? "i" : "");
          matcher = (line) => regex.test(line);
        } catch {
          return { type: "error", message: "Invalid regex pattern" };
        }
      } else {
        const search = opts.caseInsensitive ? pattern.toLowerCase() : pattern;
        matcher = (line) => {
          const compare = opts.caseInsensitive ? line.toLowerCase() : line;
          return compare.includes(search);
        };
      }

      const result = lines.filter((line) =>
        opts.mode === "keep" ? matcher(line) : !matcher(line),
      );
      return result.join("\n");
    },
  },
  {
    slug: "prefix-suffix",
    name: "Prefix / Suffix Lines",
    description: "Add prefix or suffix to each line",
    section: "text",
    aliases: ["prepend", "append", "wrap-lines"],
    inputType: "text",
    outputType: "text",
    options: [
      { id: "prefix", label: "Prefix", type: "text", default: "" },
      { id: "suffix", label: "Suffix", type: "text", default: "" },
      {
        id: "skipEmpty",
        label: "Skip empty lines",
        type: "toggle",
        default: true,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const prefix = String(opts.prefix);
      const suffix = String(opts.suffix);

      return str
        .split("\n")
        .map((line) => {
          if (opts.skipEmpty && !line.trim()) return line;
          return prefix + line + suffix;
        })
        .join("\n");
    },
    examples: [
      {
        input: "apple\nbanana\norange",
        output: '"apple",\n"banana",\n"orange",',
      },
    ],
  },
  {
    slug: "join-split",
    name: "Join / Split by Delimiter",
    description: "Join lines into one or split by delimiter",
    section: "text",
    aliases: ["split", "join", "delimiter"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "join",
        options: [
          { value: "join", label: "Join lines" },
          { value: "split", label: "Split by delimiter" },
        ],
      },
      { id: "delimiter", label: "Delimiter", type: "text", default: ", " },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      const delim = String(opts.delimiter)
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t");

      if (opts.mode === "join") {
        return str.split("\n").join(delim);
      }
      return str.split(delim).join("\n");
    },
  },
  {
    slug: "text-stats",
    name: "Text Statistics",
    description: "Count characters, words, lines, and more",
    section: "text",
    aliases: ["word-count", "char-count", "line-count"],
    inputType: "text",
    outputType: "text",
    transform: (input) => {
      const str = String(input);
      if (!str) return "";
      const lines = str.split("\n");
      const words = str.split(/\s+/).filter(Boolean);
      const bytes = new TextEncoder().encode(str).length;
      const longestLine = Math.max(...lines.map((l) => l.length));

      return [
        `Characters: ${str.length}`,
        `Characters (no spaces): ${str.replace(/\s/g, "").length}`,
        `Words: ${words.length}`,
        `Lines: ${lines.length}`,
        `Longest line: ${longestLine} chars`,
        `Bytes (UTF-8): ${bytes}`,
        `Paragraphs: ${str.split(/\n\s*\n/).filter(Boolean).length}`,
      ].join("\n");
    },
  },
  {
    slug: "regex-replace",
    name: "Find & Replace (Regex)",
    description: "Find and replace with regular expression support",
    section: "text",
    aliases: ["regex", "find-replace", "search-replace"],
    inputType: "text",
    outputType: "text",
    options: [
      { id: "find", label: "Find pattern", type: "text", default: "" },
      { id: "replace", label: "Replace with", type: "text", default: "" },
      { id: "isRegex", label: "Use regex", type: "toggle", default: false },
      {
        id: "caseInsensitive",
        label: "Case insensitive",
        type: "toggle",
        default: false,
      },
      { id: "global", label: "Replace all", type: "toggle", default: true },
    ],
    transform: (input, opts) => {
      const str = String(input);
      const find = String(opts.find);
      const replace = String(opts.replace);
      if (!str || !find) return str;

      if (opts.isRegex) {
        try {
          let flags = opts.global ? "g" : "";
          if (opts.caseInsensitive) flags += "i";
          const regex = new RegExp(find, flags);
          return str.replace(regex, replace);
        } catch {
          return { type: "error", message: "Invalid regex pattern" };
        }
      }

      if (opts.global) {
        const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, opts.caseInsensitive ? "gi" : "g");
        return str.replace(regex, replace);
      }
      return str.replace(find, replace);
    },
  },
  {
    slug: "regex-extract",
    name: "Extract Regex Groups",
    description: "Extract captured groups from regex matches",
    section: "text",
    aliases: ["regex-groups", "capture-groups"],
    inputType: "text",
    outputType: "text",
    options: [
      { id: "pattern", label: "Regex pattern", type: "text", default: "" },
      { id: "showGroups", label: "Show groups", type: "toggle", default: true },
    ],
    transform: (input, opts) => {
      const str = String(input);
      const pattern = String(opts.pattern);
      if (!str || !pattern) return "";

      try {
        const regex = new RegExp(pattern, "g");
        const results: string[] = [];
        let match: RegExpExecArray | null;
        let matchNum = 0;

        match = regex.exec(str);
        while (match !== null) {
          matchNum++;
          if (opts.showGroups && match.length > 1) {
            results.push(`Match ${matchNum}: ${match[0]}`);
            for (let i = 1; i < match.length; i++) {
              results.push(`  Group ${i}: ${match[i] ?? "(undefined)"}`);
            }
          } else {
            results.push(match[0]);
          }
          match = regex.exec(str);
        }

        return results.length > 0 ? results.join("\n") : "No matches found";
      } catch {
        return { type: "error", message: "Invalid regex pattern" };
      }
    },
  },
  {
    slug: "reverse-text",
    name: "Reverse Text",
    description: "Reverse characters, words, or lines",
    section: "text",
    aliases: ["mirror", "flip"],
    inputType: "text",
    outputType: "text",
    options: [
      {
        id: "mode",
        label: "Reverse",
        type: "select",
        default: "chars",
        options: [
          { value: "chars", label: "Characters" },
          { value: "words", label: "Words" },
          { value: "lines", label: "Lines" },
        ],
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      if (!str) return "";
      switch (opts.mode) {
        case "chars":
          return [...str].reverse().join("");
        case "words":
          return str.split(/(\s+)/).reverse().join("");
        case "lines":
          return str.split("\n").reverse().join("\n");
        default:
          return str;
      }
    },
  },
];
