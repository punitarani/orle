#!/usr/bin/env bun

/**
 * Sync Raycast tool metadata from the core web app.
 *
 * This script:
 * - Loads `tools.generated.json` and section metadata from the root project.
 * - Filters/adapts tools for Raycast (drops file-heavy/DOM-heavy modes).
 * - Writes Raycast-ready manifests into `raycast/.generated/`.
 *
 * Usage: `bun run raycast/scripts/sync-tools.ts`
 */

import fs from "node:fs";
import path from "node:path";
import type {
  ToolMeta,
  ToolOptionMeta,
} from "../../src/lib/tools/manifest-types";
import {
  RAYCAST_TOOLS,
  SECTION_META,
  TOOL_META,
} from "../../src/lib/tools/tool-metadata";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const RAYCAST_ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.join(RAYCAST_ROOT, ".generated");
const TOOLS_OUT = path.join(OUT_DIR, "tools.meta.json");
const SECTIONS_OUT = path.join(OUT_DIR, "sections.meta.json");
const REPORT_OUT = path.join(OUT_DIR, "compat-report.md");

const EXCLUDED_SECTIONS = new Set<string>(["images"]);
const EXCLUDED_SLUGS = new Set<string>([
  "media-suite",
  "image-to-ico",
  "image-compress",
  "json-explorer", // Requires DOM/canvas preview
  "json-script-runner", // Uses worker sandbox not available in Raycast
]);

const MODE_REMOVALS: Record<string, string[]> = {
  "bytes-suite": ["file-to-base64"],
  "crypto-suite": ["hash-file"],
};

const MODE_DEFAULTS: Record<string, string> = {
  "bytes-suite": "base64-text",
  "crypto-suite": "hash-text",
};

const INCOMPATIBLE_MODES = new Set<string>([
  "file-to-base64",
  "hash-file",
  "image-preview",
  "qr-generate",
  "qr-read",
]);

type CompatResult = {
  included: ToolMeta[];
  excluded: ToolMeta[];
};

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function adaptTool(tool: ToolMeta): ToolMeta | null {
  if (EXCLUDED_SLUGS.has(tool.slug)) return null;
  if (EXCLUDED_SECTIONS.has(tool.section)) return null;
  if (
    tool.presetOptions?.mode &&
    INCOMPATIBLE_MODES.has(String(tool.presetOptions.mode))
  ) {
    return null;
  }

  const base = clone(tool);

  // Prefer explicit Raycast-compatible list but fall back to filters.
  const raycastCompatible =
    (RAYCAST_TOOLS as ToolMeta[]).some((t) => t.slug === tool.slug) ||
    (!tool.acceptsFile && tool.inputType !== "file");
  if (!raycastCompatible) return null;

  // Drop file acceptance globally for Raycast.
  base.acceptsFile = false;
  base.inputType = base.inputType === "file" ? "text" : base.inputType;

  // Remove unsupported modes for multi-mode tools.
  if (MODE_REMOVALS[tool.slug]) {
    const removed = new Set(MODE_REMOVALS[tool.slug]);
    base.options = (base.options || []).map((opt) =>
      opt.id === "mode"
        ? filterModeOption(opt, removed, MODE_DEFAULTS[tool.slug])
        : opt,
    );
  }

  // If the tool had file-driven capabilities, force output to text to match Raycast renderer.
  if (tool.slug === "bytes-suite") {
    base.outputType = "text";
  }

  return base;
}

function filterModeOption(
  option: ToolOptionMeta,
  removed: Set<string>,
  newDefault?: string,
): ToolOptionMeta {
  const filteredOptions = (option.options || []).filter(
    (opt) => !removed.has(opt.value),
  );
  const nextDefault =
    filteredOptions.find((opt) => opt.value === option.default)?.value ??
    newDefault ??
    filteredOptions[0]?.value ??
    option.default;

  return {
    ...option,
    options: filteredOptions,
    default: nextDefault,
  };
}

function buildCompatibility(): CompatResult {
  const included: ToolMeta[] = [];
  const excluded: ToolMeta[] = [];

  for (const tool of TOOL_META) {
    const adapted = adaptTool(tool);
    if (adapted) {
      included.push(adapted);
    } else {
      excluded.push(tool);
    }
  }

  return { included, excluded };
}

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function writeReport({ included, excluded }: CompatResult) {
  const lines = [
    "# Raycast Tool Compatibility Report",
    "",
    `Included: ${included.length}`,
    `Excluded: ${excluded.length}`,
    "",
    "## Included Slugs",
    included.map((t) => `- ${t.slug} (${t.section})`).join("\n") || "- (none)",
    "",
    "## Excluded Slugs",
    excluded.map((t) => `- ${t.slug} (${t.section})`).join("\n") || "- (none)",
    "",
    "## Notes",
    "- File-based modes are removed.",
    "- DOM/worker dependent tools are excluded.",
    "- bytes-suite outputType forced to text for Raycast renderer.",
  ];
  fs.writeFileSync(REPORT_OUT, lines.join("\n"), "utf8");
}

function main() {
  ensureOutDir();
  const compat = buildCompatibility();
  writeJson(TOOLS_OUT, compat.included);
  writeJson(SECTIONS_OUT, SECTION_META);
  writeReport(compat);
  console.log(
    `Synced ${compat.included.length} tools to ${path.relative(process.cwd(), TOOLS_OUT)}`,
  );
}

main();
