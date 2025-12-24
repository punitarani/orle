import * as Diff from "diff";
import type {
  DiffResultData,
  ToolDefinition,
  ToolTransformInput,
} from "../types";

export const diffTools: ToolDefinition[] = [
  {
    slug: "text-diff",
    name: "Text Diff",
    description: "Compare two texts and show differences",
    section: "diff",
    aliases: ["compare", "diff", "changes"],
    inputType: "dual",
    outputType: "diff",
    useWorker: "diff",
    options: [
      {
        id: "mode",
        label: "Diff mode",
        type: "select",
        default: "lines",
        options: [
          { value: "lines", label: "Line by line" },
          { value: "words", label: "Word by word" },
          { value: "chars", label: "Character by character" },
        ],
      },
      {
        id: "ignoreWhitespace",
        label: "Ignore whitespace",
        type: "toggle",
        default: false,
      },
      {
        id: "ignoreCase",
        label: "Ignore case",
        type: "toggle",
        default: false,
      },
    ],
    transform: (input, opts) => {
      const parts = getDualInput(input);
      if (!parts) {
        return {
          type: "error",
          message: "Enter text in both panels to compare",
        };
      }

      let text1 = parts.a.trim();
      let text2 = parts.b.trim();

      if (opts.ignoreCase) {
        text1 = text1.toLowerCase();
        text2 = text2.toLowerCase();
      }

      // Apply whitespace normalization if needed
      if (opts.ignoreWhitespace) {
        text1 = text1.replace(/\s+/g, " ").trim();
        text2 = text2.replace(/\s+/g, " ").trim();
      }

      let diff: Diff.Change[];

      switch (opts.mode) {
        case "words":
          diff = Diff.diffWords(text1, text2);
          break;
        case "chars":
          diff = Diff.diffChars(text1, text2);
          break;
        default:
          diff = Diff.diffLines(text1, text2);
      }

      // Convert to structured format
      const changes = diff.map((part) => ({
        type: (part.added ? "added" : part.removed ? "removed" : "unchanged") as
          | "added"
          | "removed"
          | "unchanged",
        value: part.value.replace(/\n$/, ""),
      }));

      // Calculate stats
      let additions = 0;
      let deletions = 0;
      for (const part of diff) {
        if (part.added) additions += part.value.length;
        if (part.removed) deletions += part.value.length;
      }

      // Generate text output for copy
      const textOutput = diff
        .map((part) => {
          const prefix = part.added ? "+" : part.removed ? "-" : " ";
          const lines = part.value
            .split("\n")
            .filter((l, i, arr) => i < arr.length - 1 || l);
          return lines.map((l) => `${prefix} ${l}`).join("\n");
        })
        .join("\n");

      const result: DiffResultData = {
        type: "diff",
        changes,
        textOutput,
        stats: { additions, deletions },
      };

      return result;
    },
  },
  {
    slug: "unified-diff",
    name: "Unified Diff Generator",
    description: "Generate unified diff (patch format)",
    section: "diff",
    aliases: ["patch", "git-diff"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder:
      "Enter text 1 here...\n---SEPARATOR---\nEnter text 2 here...",
    options: [
      {
        id: "filename1",
        label: "File 1 name",
        type: "text",
        default: "original.txt",
      },
      {
        id: "filename2",
        label: "File 2 name",
        type: "text",
        default: "modified.txt",
      },
      {
        id: "context",
        label: "Context lines",
        type: "number",
        default: 3,
        min: 0,
        max: 10,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n/);
      if (parts.length < 2) {
        return {
          type: "error",
          message: "Use ---SEPARATOR--- to separate two texts",
        };
      }

      const text1 = parts[0].trim();
      const text2 = parts[1].trim();

      return Diff.createPatch(
        String(opts.filename1),
        text1,
        text2,
        String(opts.filename1),
        String(opts.filename2),
        { context: Number(opts.context) },
      );
    },
  },
  {
    slug: "json-diff",
    name: "JSON Diff (Structural)",
    description: "Compare JSON objects structurally with path changes",
    section: "diff",
    aliases: ["compare-json", "json-compare"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: '{"key": "value1"}\n---SEPARATOR---\n{"key": "value2"}',
    options: [
      {
        id: "sortKeys",
        label: "Sort keys first",
        type: "toggle",
        default: true,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n/);
      if (parts.length < 2) {
        return {
          type: "error",
          message: "Use ---SEPARATOR--- to separate two JSON objects",
        };
      }

      try {
        let obj1 = JSON.parse(parts[0].trim());
        let obj2 = JSON.parse(parts[1].trim());

        if (opts.sortKeys) {
          obj1 = sortObjectKeys(obj1);
          obj2 = sortObjectKeys(obj2);
        }

        const changes = compareJson(obj1, obj2, "");
        if (changes.length === 0) {
          return "✓ No differences found";
        }

        return changes
          .map((c) => {
            switch (c.type) {
              case "added":
                return `+ ${c.path}: ${JSON.stringify(c.value)}`;
              case "removed":
                return `- ${c.path}: ${JSON.stringify(c.value)}`;
              case "changed":
                return `~ ${c.path}:\n    - ${JSON.stringify(c.oldValue)}\n    + ${JSON.stringify(c.value)}`;
              default:
                return "";
            }
          })
          .join("\n");
      } catch (e) {
        return {
          type: "error",
          message: `Invalid JSON: ${(e as Error).message}`,
        };
      }
    },
  },
  {
    slug: "yaml-diff",
    name: "YAML Diff",
    description: "Compare YAML documents (converted to JSON internally)",
    section: "diff",
    aliases: ["compare-yaml"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "key: value1\n---SEPARATOR---\nkey: value2",
    transform: async (input) => {
      const yaml = await import("js-yaml");
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n/);
      if (parts.length < 2) {
        return {
          type: "error",
          message: "Use ---SEPARATOR--- to separate two YAML documents",
        };
      }

      try {
        const obj1 = sortObjectKeys(yaml.load(parts[0].trim()));
        const obj2 = sortObjectKeys(yaml.load(parts[1].trim()));

        const changes = compareJson(obj1, obj2, "");
        if (changes.length === 0) {
          return "✓ No differences found";
        }

        return changes
          .map((c) => {
            switch (c.type) {
              case "added":
                return `+ ${c.path}: ${JSON.stringify(c.value)}`;
              case "removed":
                return `- ${c.path}: ${JSON.stringify(c.value)}`;
              case "changed":
                return `~ ${c.path}:\n    - ${JSON.stringify(c.oldValue)}\n    + ${JSON.stringify(c.value)}`;
              default:
                return "";
            }
          })
          .join("\n");
      } catch (e) {
        return {
          type: "error",
          message: `Invalid YAML: ${(e as Error).message}`,
        };
      }
    },
  },
  {
    slug: "csv-diff",
    name: "CSV Diff",
    description: "Compare CSV files row by row",
    section: "diff",
    aliases: ["compare-csv"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "id,name\n1,Alice\n---SEPARATOR---\nid,name\n1,Bob",
    options: [
      {
        id: "keyColumn",
        label: "Key column (0-based)",
        type: "number",
        default: 0,
        min: 0,
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
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n/);
      if (parts.length < 2) {
        return {
          type: "error",
          message: "Use ---SEPARATOR--- to separate two CSVs",
        };
      }

      const delim = String(opts.delimiter);
      const keyCol = Number(opts.keyColumn);

      const parse = (csv: string) => {
        const rows: Map<string, string[]> = new Map();
        for (const line of csv.trim().split("\n")) {
          const cols = line.split(delim);
          rows.set(cols[keyCol] || line, cols);
        }
        return rows;
      };

      const rows1 = parse(parts[0]);
      const rows2 = parse(parts[1]);
      const results: string[] = [];

      // Find removed and changed
      for (const [key, cols1] of rows1) {
        const cols2 = rows2.get(key);
        if (!cols2) {
          results.push(`- [${key}] ${cols1.join(delim)}`);
        } else if (cols1.join(delim) !== cols2.join(delim)) {
          results.push(`~ [${key}]`);
          results.push(`  - ${cols1.join(delim)}`);
          results.push(`  + ${cols2.join(delim)}`);
        }
      }

      // Find added
      for (const [key, cols2] of rows2) {
        if (!rows1.has(key)) {
          results.push(`+ [${key}] ${cols2.join(delim)}`);
        }
      }

      return results.length > 0 ? results.join("\n") : "✓ No differences found";
    },
  },
  {
    slug: "string-similarity",
    name: "String Similarity",
    description: "Calculate Levenshtein distance and similarity percentage",
    section: "diff",
    aliases: ["levenshtein", "edit-distance", "fuzzy-match"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "string1\n---SEPARATOR---\nstring2",
    transform: (input) => {
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n/);
      if (parts.length < 2) {
        return {
          type: "error",
          message: "Use ---SEPARATOR--- to separate two strings",
        };
      }

      const s1 = parts[0].trim();
      const s2 = parts[1].trim();
      const distance = levenshtein(s1, s2);
      const maxLen = Math.max(s1.length, s2.length);
      const similarity =
        maxLen > 0 ? ((1 - distance / maxLen) * 100).toFixed(2) : 100;

      return [
        `String 1 length: ${s1.length}`,
        `String 2 length: ${s2.length}`,
        `Levenshtein distance: ${distance}`,
        `Similarity: ${similarity}%`,
      ].join("\n");
    },
  },
  {
    slug: "hash-compare",
    name: "Hash Compare",
    description: "Compare two hash values for equality",
    section: "diff",
    aliases: ["checksum-compare", "verify-hash"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder: "hash1\n---SEPARATOR---\nhash2",
    options: [
      { id: "ignoreCase", label: "Ignore case", type: "toggle", default: true },
      {
        id: "ignoreSpaces",
        label: "Ignore spaces",
        type: "toggle",
        default: true,
      },
    ],
    transform: (input, opts) => {
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n/);
      if (parts.length < 2) {
        return {
          type: "error",
          message: "Use ---SEPARATOR--- to separate two hashes",
        };
      }

      let hash1 = parts[0].trim();
      let hash2 = parts[1].trim();

      if (opts.ignoreSpaces) {
        hash1 = hash1.replace(/\s/g, "");
        hash2 = hash2.replace(/\s/g, "");
      }
      if (opts.ignoreCase) {
        hash1 = hash1.toLowerCase();
        hash2 = hash2.toLowerCase();
      }

      const match = hash1 === hash2;
      return [
        `Hash 1: ${hash1}`,
        `Hash 2: ${hash2}`,
        "",
        match ? "✓ MATCH - Hashes are identical" : "✗ NO MATCH - Hashes differ",
      ].join("\n");
    },
  },
  {
    slug: "array-diff",
    name: "Array / List Diff",
    description: "Find added, removed, and common items between two lists",
    section: "diff",
    aliases: ["list-compare", "set-diff"],
    inputType: "text",
    outputType: "text",
    inputPlaceholder:
      "item1\nitem2\nitem3\n---SEPARATOR---\nitem2\nitem3\nitem4",
    options: [
      {
        id: "ignoreCase",
        label: "Ignore case",
        type: "toggle",
        default: false,
      },
      { id: "trimLines", label: "Trim lines", type: "toggle", default: true },
    ],
    transform: (input, opts) => {
      const str = String(input);
      const parts = str.split(/---SEPARATOR---|\n---\n/);
      if (parts.length < 2) {
        return {
          type: "error",
          message: "Use ---SEPARATOR--- to separate two lists",
        };
      }

      const normalize = (s: string) => {
        let result = s;
        if (opts.trimLines) result = result.trim();
        if (opts.ignoreCase) result = result.toLowerCase();
        return result;
      };

      const list1 = parts[0].split("\n").map(normalize).filter(Boolean);
      const list2 = parts[1].split("\n").map(normalize).filter(Boolean);

      const set1 = new Set(list1);
      const set2 = new Set(list2);

      const added = list2.filter((x) => !set1.has(x));
      const removed = list1.filter((x) => !set2.has(x));
      const common = list1.filter((x) => set2.has(x));

      const results: string[] = [];
      if (removed.length > 0) {
        results.push("Removed:", ...removed.map((x) => `  - ${x}`), "");
      }
      if (added.length > 0) {
        results.push("Added:", ...added.map((x) => `  + ${x}`), "");
      }
      if (common.length > 0) {
        results.push("Common:", ...common.map((x) => `  = ${x}`));
      }

      return results.length > 0 ? results.join("\n") : "✓ Lists are identical";
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

type JsonChange = {
  type: "added" | "removed" | "changed";
  path: string;
  value: unknown;
  oldValue?: unknown;
};

function compareJson(obj1: unknown, obj2: unknown, path: string): JsonChange[] {
  const changes: JsonChange[] = [];

  if (typeof obj1 !== typeof obj2) {
    changes.push({
      type: "changed",
      path: path || "root",
      value: obj2,
      oldValue: obj1,
    });
    return changes;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`;
      if (i >= obj1.length) {
        changes.push({ type: "added", path: itemPath, value: obj2[i] });
      } else if (i >= obj2.length) {
        changes.push({ type: "removed", path: itemPath, value: obj1[i] });
      } else {
        changes.push(...compareJson(obj1[i], obj2[i], itemPath));
      }
    }
  } else if (
    obj1 !== null &&
    typeof obj1 === "object" &&
    obj2 !== null &&
    typeof obj2 === "object"
  ) {
    const keys1 = Object.keys(obj1 as Record<string, unknown>);
    const keys2 = Object.keys(obj2 as Record<string, unknown>);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key;
      const val1 = (obj1 as Record<string, unknown>)[key];
      const val2 = (obj2 as Record<string, unknown>)[key];

      if (!(key in (obj1 as Record<string, unknown>))) {
        changes.push({ type: "added", path: keyPath, value: val2 });
      } else if (!(key in (obj2 as Record<string, unknown>))) {
        changes.push({ type: "removed", path: keyPath, value: val1 });
      } else {
        changes.push(...compareJson(val1, val2, keyPath));
      }
    }
  } else if (obj1 !== obj2) {
    changes.push({
      type: "changed",
      path: path || "root",
      value: obj2,
      oldValue: obj1,
    });
  }

  return changes;
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function getDualInput(
  input: ToolTransformInput,
): { a: string; b: string } | null {
  if (typeof input === "object" && input && "kind" in input) {
    if (input.kind === "dual") {
      return { a: input.a, b: input.b };
    }
    if (input.kind === "text") {
      return splitDualText(input.text);
    }
  }

  if (typeof input === "string") {
    return splitDualText(input);
  }

  return null;
}

function splitDualText(value: string): { a: string; b: string } | null {
  const parts = value.split(/---SEPARATOR---|\n---\n/);
  if (parts.length < 2) return null;
  return { a: parts[0], b: parts[1] };
}
