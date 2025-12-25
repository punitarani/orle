import toml from "@iarna/toml";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import yaml from "js-yaml";
import { JSONPath } from "jsonpath-plus";
import Papa from "papaparse";
const papa = () =>
  Papa as {
    parse: (
      input: string,
      config?: {
        header?: boolean;
        delimiter?: string;
        skipEmptyLines?: boolean;
      },
    ) => { data: unknown; errors: Array<{ message: string }> };
    unparse: (
      input: unknown,
      config?: { delimiter?: string; header?: boolean },
    ) => string;
  };
import type { ToolDefinition } from "../types";

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
            return papa().unparse(obj, {
              delimiter: String(opts.csvDelimiter || ","),
              header: Boolean(opts.csvHeader),
            });
          }
          case "csv-to-json": {
            const result = papa().parse(text, {
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
