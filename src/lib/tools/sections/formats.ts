import toml from "@iarna/toml";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import yaml from "js-yaml";
import { JSONPath } from "jsonpath-plus";
import Papa from "papaparse";
import { executeTransform } from "../safe-executor";
import type {
  JsonNode,
  ToolDefinition,
  ToolTransformInput,
  ToolTransformResult,
} from "../types";

export const formatTools: ToolDefinition[] = [
  {
    slug: "data-format-suite",
    name: "Data Format Suite",
    description: "Format, validate, and convert JSON/YAML/XML/CSV",
    section: "formats",
    aliases: ["json", "yaml", "xml", "csv", "toml"],
    inputType: "text",
    outputType: "text",
    runPolicy: "manual",
    options: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: "json-format",
        options: [
          { value: "json-format", label: "JSON format" },
          { value: "json-minify", label: "JSON minify" },
          { value: "json-validate", label: "JSON validate" },
          { value: "json-to-yaml", label: "JSON → YAML" },
          { value: "yaml-to-json", label: "YAML → JSON" },
          { value: "json-to-toml", label: "JSON → TOML" },
          { value: "toml-to-json", label: "TOML → JSON" },
          { value: "json-to-csv", label: "JSON → CSV" },
          { value: "csv-to-json", label: "CSV → JSON" },
          { value: "json-to-xml", label: "JSON → XML" },
          { value: "xml-to-json", label: "XML → JSON" },
          { value: "json-path", label: "JSONPath query" },
          { value: "json-pointer", label: "JSON Pointer" },
          { value: "sort-keys", label: "Sort JSON keys" },
          { value: "remove-null", label: "Remove null/empty" },
        ],
      },
      {
        id: "indent",
        label: "Indent",
        type: "number",
        default: 2,
        min: 0,
        max: 8,
        visibleWhen: { optionId: "mode", equals: "json-format" },
      },
      {
        id: "csvDelimiter",
        label: "CSV delimiter",
        type: "text",
        default: ",",
        visibleWhen: {
          optionId: "mode",
          equals: ["json-to-csv", "csv-to-json"],
        },
      },
      {
        id: "csvHeader",
        label: "Include header",
        type: "toggle",
        default: true,
        visibleWhen: { optionId: "mode", equals: "json-to-csv" },
      },
      {
        id: "jsonPath",
        label: "JSONPath",
        type: "text",
        default: "$.",
        visibleWhen: { optionId: "mode", equals: "json-path" },
      },
      {
        id: "jsonPointer",
        label: "JSON Pointer",
        type: "text",
        default: "",
        visibleWhen: { optionId: "mode", equals: "json-pointer" },
      },
    ],
    transform: (input, opts) => {
      const text = String(input ?? "");
      const mode = String(opts.mode);

      try {
        switch (mode) {
          case "json-format": {
            const obj = JSON.parse(text);
            return JSON.stringify(obj, null, Number(opts.indent) || 2);
          }
          case "json-minify": {
            const obj = JSON.parse(text);
            return JSON.stringify(obj);
          }
          case "json-validate": {
            JSON.parse(text);
            return "✓ Valid JSON";
          }
          case "json-to-yaml": {
            const obj = JSON.parse(text);
            return yaml.dump(obj, { noRefs: true });
          }
          case "yaml-to-json": {
            const obj = yaml.load(text);
            return JSON.stringify(obj, null, 2);
          }
          case "json-to-toml": {
            const obj = JSON.parse(text);
            return toml.stringify(obj as toml.JsonMap);
          }
          case "toml-to-json": {
            const obj = toml.parse(text);
            return JSON.stringify(obj, null, 2);
          }
          case "json-to-csv": {
            const obj = JSON.parse(text);
            return Papa.unparse(obj, {
              delimiter: String(opts.csvDelimiter || ","),
              header: Boolean(opts.csvHeader),
            });
          }
          case "csv-to-json": {
            const result = Papa.parse(text, {
              header: true,
              delimiter: String(opts.csvDelimiter || ","),
              skipEmptyLines: true,
            });
            if (result.errors.length) {
              return { type: "error", message: result.errors[0].message };
            }
            return JSON.stringify(result.data, null, 2);
          }
          case "json-to-xml": {
            const obj = JSON.parse(text);
            const builder = new XMLBuilder({ ignoreAttributes: false });
            return builder.build(obj);
          }
          case "xml-to-json": {
            const parser = new XMLParser({ ignoreAttributes: false });
            const obj = parser.parse(text);
            return JSON.stringify(obj, null, 2);
          }
          case "json-path": {
            const obj = JSON.parse(text);
            const path = String(opts.jsonPath || "$");
            const result = JSONPath({ path, json: obj });
            return JSON.stringify(result, null, 2);
          }
          case "json-pointer": {
            const obj = JSON.parse(text);
            const pointer = String(opts.jsonPointer || "");
            const result = resolveJsonPointer(obj, pointer);
            return JSON.stringify(result, null, 2);
          }
          case "sort-keys": {
            const obj = JSON.parse(text);
            return JSON.stringify(sortKeys(obj), null, 2);
          }
          case "remove-null": {
            const obj = JSON.parse(text);
            return JSON.stringify(removeNulls(obj), null, 2);
          }
          default:
            return "";
        }
      } catch (error) {
        return { type: "error", message: (error as Error).message };
      }
    },
  },
  {
    slug: "json-explorer",
    name: "JSON Explorer",
    description: "Interactive graph and tree visualization for JSON structure",
    section: "formats",
    aliases: [
      "json graph",
      "json tree",
      "visualizer",
      "json crack",
      "diagram",
      "json viewer",
      "collapse json",
      "expand json",
    ],
    inputType: "text",
    outputType: "preview",
    layout: "stacked",
    outputHeading: "Visualization",
    runPolicy: "manual",
    inputPlaceholder:
      "Paste JSON to explore as an interactive graph or collapsible tree...",
    transform: (input) => buildVisualizerResult(input, "graph"),
    examples: [
      {
        name: "Team with projects",
        input:
          '{\n  "team": {\n    "name": "Orle",\n    "members": [\n      {"id": 1, "name": "Punit", "roles": ["lead", "backend"]},\n      {"id": 2, "name": "Mae", "roles": ["design"]}\n    ]\n  },\n  "projects": [\n    {"name": "Atlas", "status": "active"},\n    {"name": "Harbor", "status": "planning"}\n  ]\n}',
      },
      {
        name: "Nested catalog",
        input:
          '{\n  "catalog": {\n    "title": "Components",\n    "items": [\n      {"name": "Button", "status": "stable", "variants": ["primary", "secondary"]},\n      {"name": "Tooltip", "status": "beta", "props": {"position": "top", "delay": 200}}\n    ]\n  }\n}',
      },
    ],
  },
  {
    slug: "json-script-runner",
    name: "JSON Script Runner",
    description: "Run a safe JavaScript snippet to extract or reshape JSON",
    section: "formats",
    aliases: ["json manipulate", "json extract", "json function"],
    inputType: "dual",
    outputType: "text",
    runPolicy: "manual",
    dualInputConfig: {
      helperText:
        "Left: JSON payload. Right: JavaScript that returns a result.",
      label1: "JSON input",
      label2: "Transform",
      placeholder1: "Paste JSON...",
      placeholder2:
        "// input is already parsed JSON\n// return a new value to display\nreturn input;",
      allowSwap: false,
    },
    outputHeading: "Result",
    options: [
      {
        id: "indent",
        label: "Indent",
        type: "number",
        default: 2,
        min: 0,
        max: 8,
        step: 1,
      },
    ],
    transform: async (input, opts) => runJsonScript(input, opts),
  },
];

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = sortKeys((value as Record<string, unknown>)[key]);
          return acc;
        },
        {} as Record<string, unknown>,
      );
  }
  return value;
}

function removeNulls(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(removeNulls)
      .filter((item) => item !== null && item !== undefined);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, val]) => val !== null && val !== undefined && val !== "")
      .reduce(
        (acc, [key, val]) => {
          acc[key] = removeNulls(val);
          return acc;
        },
        {} as Record<string, unknown>,
      );
  }
  return value;
}

function resolveJsonPointer(value: unknown, pointer: string): unknown {
  if (!pointer || pointer === "/") return value;
  if (!pointer.startsWith("/")) {
    throw new Error("JSON Pointer must start with '/'");
  }
  const parts = pointer
    .split("/")
    .slice(1)
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));

  let current: unknown = value;
  for (const part of parts) {
    if (
      current &&
      typeof current === "object" &&
      part in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[part];
    } else if (Array.isArray(current)) {
      const idx = Number(part);
      if (!Number.isNaN(idx) && current[idx] !== undefined) {
        current = current[idx];
      } else {
        throw new Error("Pointer not found");
      }
    } else {
      throw new Error("Pointer not found");
    }
  }
  return current;
}

function buildVisualizerResult(
  input: ToolTransformInput,
  initialView: "graph" | "tree",
): ToolTransformResult {
  if (input instanceof File) {
    return {
      type: "error",
      message: "File uploads are not supported for JSON visualization",
    };
  }

  const text =
    typeof input === "string"
      ? input
      : typeof input === "object" && input && "kind" in input
        ? ""
        : "";

  if (!text.trim()) {
    return { type: "error", message: "Enter JSON to visualize" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      type: "error",
      message: `Invalid JSON: ${(error as Error).message}`,
    };
  }

  const { node, count, depth } = buildJsonTree(parsed, null, "/");
  if (count > 5000) {
    return {
      type: "error",
      message: "JSON too large to visualize (over 5,000 nodes)",
    };
  }

  return {
    type: "json-visual",
    root: node,
    nodeCount: count,
    depth,
    textOutput: JSON.stringify(parsed, null, 2),
    initialView,
  };
}

function buildJsonTree(
  value: unknown,
  key: string | null,
  path: string,
): { node: JsonNode; count: number; depth: number } {
  if (Array.isArray(value)) {
    const children = value.map((child, index) =>
      buildJsonTree(child, index.toString(), `${path}/${index}`),
    );
    const childCount = children.reduce((acc, child) => acc + child.count, 0);
    const childDepth = Math.max(...children.map((child) => child.depth), 0);
    return {
      node: {
        id: path || "root",
        key,
        path,
        type: "array",
        valueType: "array",
        preview: `${value.length} item${value.length === 1 ? "" : "s"}`,
        children: children.map((child) => child.node),
      },
      count: childCount + 1,
      depth: childDepth + 1,
    };
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const children = entries.map(([childKey, childValue]) =>
      buildJsonTree(
        childValue,
        childKey,
        `${path}/${encodePointerKey(childKey)}`,
      ),
    );
    const childCount = children.reduce((acc, child) => acc + child.count, 0);
    const childDepth = Math.max(...children.map((child) => child.depth), 0);
    return {
      node: {
        id: path || "root",
        key,
        path,
        type: "object",
        valueType: "object",
        preview: `${entries.length} key${entries.length === 1 ? "" : "s"}`,
        children: children.map((child) => child.node),
      },
      count: childCount + 1,
      depth: childDepth + 1,
    };
  }

  const valueType = getValueType(value);
  const preview = formatPreview(value);
  return {
    node: {
      id: path || "root",
      key,
      path,
      type: "value",
      valueType,
      preview,
    },
    count: 1,
    depth: 1,
  };
}

function encodePointerKey(key: string): string {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}

function getValueType(value: unknown): JsonNode["valueType"] {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "object";
}

function formatPreview(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") {
    const str = value.length > 80 ? `${value.slice(0, 77)}...` : value;
    return JSON.stringify(str);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  if (typeof value === "object") {
    const size = Object.keys(value as Record<string, unknown>).length;
    return `${size} key${size === 1 ? "" : "s"}`;
  }
  return "value";
}

async function runJsonScript(
  input: ToolTransformInput,
  opts: Record<string, unknown>,
): Promise<ToolTransformResult> {
  const { json, script } = normalizeScriptInput(input);
  const indent = normalizeIndent(opts.indent);

  if (!json.trim()) {
    return { type: "error", message: "Enter JSON input" };
  }
  if (!script.trim()) {
    return { type: "error", message: "Add a transform script" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return {
      type: "error",
      message: `Invalid JSON: ${(error as Error).message}`,
    };
  }

  try {
    const wrapped = wrapUserScript(script);
    const result = await executeTransform(wrapped, parsed, {
      helpers: {
        jsonPath: (expression: string, target?: unknown) =>
          // biome-ignore lint/suspicious/noExplicitAny: JSONPath expects any
          JSONPath({ path: expression, json: (target ?? parsed) as any }),
      },
    });
    return formatScriptResult(result, indent);
  } catch (error) {
    return {
      type: "error",
      message: (error as Error).message || "Failed to run script",
    };
  }
}

function normalizeScriptInput(input: ToolTransformInput): {
  json: string;
  script: string;
} {
  if (typeof input === "object" && input && "kind" in input) {
    const dualInput = input as { kind: string; a?: string; b?: string };
    if (dualInput.kind === "dual") {
      return {
        json: String(dualInput.a ?? ""),
        script: String(dualInput.b ?? ""),
      };
    }
  }
  if (typeof input === "string") {
    return { json: input, script: "" };
  }
  return { json: "", script: "" };
}

function wrapUserScript(source: string): string {
  return `
const data = input;
const run = async () => {
${source}
};
const __result = await run();
return __result === undefined ? data : __result;
`;
}

function formatScriptResult(
  result: ToolTransformResult,
  indent: number,
): ToolTransformResult {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "type" in result) {
    if (result.type === "error") return result;
  }

  try {
    return JSON.stringify(result, null, indent);
  } catch {
    return { type: "error", message: "Unable to serialize result" };
  }
}

function normalizeIndent(value: unknown): number {
  const num = Number(value);
  if (Number.isFinite(num) && num >= 0 && num <= 8) return num;
  return 2;
}
