import * as Diff from "diff";
import type {
  DiffResultData,
  ToolDefinition,
  ToolTransformInput,
} from "../types";

export const diffTools: ToolDefinition[] = [
  {
    slug: "diff-suite",
    name: "Diff & Compare Suite",
    description: "Text, JSON, and structural diffs",
    section: "diff",
    aliases: ["diff", "compare", "patch"],
    inputType: "dual",
    outputType: "diff",
    useWorker: "diff",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "text-diff",
        options: [
          { value: "text-diff", label: "Text diff" },
          { value: "unified-diff", label: "Unified diff" },
          { value: "apply-patch", label: "Apply unified patch" },
          { value: "json-diff", label: "JSON diff" },
          { value: "string-similarity", label: "String similarity" },
        ],
      },
      {
        id: "diffMode",
        label: "Text diff mode",
        type: "select",
        default: "lines",
        options: [
          { value: "lines", label: "Line by line" },
          { value: "words", label: "Word by word" },
          { value: "chars", label: "Character by character" },
        ],
        visibleWhen: { optionId: "mode", equals: "text-diff" },
      },
      {
        id: "ignoreWhitespace",
        label: "Ignore whitespace",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "text-diff" },
      },
      {
        id: "ignoreCase",
        label: "Ignore case",
        type: "toggle",
        default: false,
        visibleWhen: { optionId: "mode", equals: "text-diff" },
      },
      {
        id: "filename1",
        label: "File 1 name",
        type: "text",
        default: "original.txt",
        visibleWhen: { optionId: "mode", equals: "unified-diff" },
      },
      {
        id: "filename2",
        label: "File 2 name",
        type: "text",
        default: "modified.txt",
        visibleWhen: { optionId: "mode", equals: "unified-diff" },
      },
      {
        id: "context",
        label: "Context lines",
        type: "number",
        default: 3,
        min: 0,
        max: 10,
        visibleWhen: { optionId: "mode", equals: "unified-diff" },
      },
    ],
    transform: (input, opts) => {
      const parts = getDualInput(input);
      if (!parts) {
        return { type: "error", message: "Enter text in both panels" };
      }
      const mode = String(opts.mode);

      if (mode === "unified-diff") {
        return Diff.createPatch(
          String(opts.filename1 || "original"),
          parts.a,
          parts.b,
          String(opts.filename1 || "original"),
          String(opts.filename2 || "modified"),
          { context: Number(opts.context) || 3 },
        );
      }

      if (mode === "apply-patch") {
        try {
          const patched = Diff.applyPatch(parts.a, parts.b);
          if (patched === false) {
            return { type: "error", message: "Patch could not be applied" };
          }
          return patched;
        } catch (error) {
          return { type: "error", message: (error as Error).message };
        }
      }

      if (mode === "json-diff") {
        try {
          const obj1 = JSON.parse(parts.a);
          const obj2 = JSON.parse(parts.b);
          const changes = compareJson(obj1, obj2, "");
          if (changes.length === 0) return "✓ No differences found";
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
        } catch (error) {
          return { type: "error", message: (error as Error).message };
        }
      }

      if (mode === "string-similarity") {
        const distance = levenshtein(parts.a, parts.b);
        const maxLen = Math.max(parts.a.length, parts.b.length);
        const similarity =
          maxLen > 0 ? ((1 - distance / maxLen) * 100).toFixed(2) : "100";
        return [
          `String 1 length: ${parts.a.length}`,
          `String 2 length: ${parts.b.length}`,
          `Levenshtein distance: ${distance}`,
          `Similarity: ${similarity}%`,
        ].join("\n");
      }

      let text1 = parts.a;
      let text2 = parts.b;
      if (opts.ignoreCase) {
        text1 = text1.toLowerCase();
        text2 = text2.toLowerCase();
      }
      if (opts.ignoreWhitespace) {
        text1 = text1.replace(/\s+/g, " ").trim();
        text2 = text2.replace(/\s+/g, " ").trim();
      }
      const diffMode = String(opts.diffMode || "lines");
      const diff =
        diffMode === "words"
          ? Diff.diffWords(text1, text2)
          : diffMode === "chars"
            ? Diff.diffChars(text1, text2)
            : Diff.diffLines(text1, text2);

      const changes = diff.map((part) => ({
        type: (part.added ? "added" : part.removed ? "removed" : "unchanged") as
          | "added"
          | "removed"
          | "unchanged",
        value: part.value.replace(/\n$/, ""),
      }));

      let additions = 0;
      let deletions = 0;
      for (const part of diff) {
        if (part.added) additions += part.value.length;
        if (part.removed) deletions += part.value.length;
      }

      const textOutput = diff
        .map((part) => {
          const prefix = part.added ? "+" : part.removed ? "-" : " ";
          const lines = part.value
            .split("\n")
            .filter((line, i, arr) => i < arr.length - 1 || line);
          return lines.map((line) => `${prefix} ${line}`).join("\n");
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
];

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
    if (input.kind === "dual") return { a: input.a, b: input.b };
    if (input.kind === "text") return splitDualText(input.text);
  }
  if (typeof input === "string") return splitDualText(input);
  return null;
}

function splitDualText(value: string): { a: string; b: string } | null {
  const parts = value.split(/---SEPARATOR---|\n---\n/);
  if (parts.length < 2) return null;
  return { a: parts[0], b: parts[1] };
}
