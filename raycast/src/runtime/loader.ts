import sectionsMeta from "../../.generated/sections.meta.json";
import toolsMeta from "../../.generated/tools.meta.json";
import type { ToolMeta } from "./manifest-types";
import type { ToolDefinition } from "./types";

const TOOL_META = toolsMeta as ToolMeta[];
export const SECTION_META = sectionsMeta as Array<{
  id: string;
  name: string;
  description?: string;
  icon: string;
}>;

function mergeToolMeta(tool: ToolDefinition, meta: ToolMeta): ToolDefinition {
  const preset = meta.presetOptions ?? {};
  const baseTransform = tool.transform;
  const sourceOptions = meta.options ?? tool.options ?? [];
  const options =
    preset.mode !== undefined
      ? sourceOptions.filter((opt) => {
          if (opt.id === "mode") return false;
          if (
            opt.visibleWhen &&
            opt.visibleWhen.optionId === "mode" &&
            preset.mode !== undefined
          ) {
            const target = opt.visibleWhen.equals;
            if (Array.isArray(target)) return target.includes(preset.mode);
            return target === preset.mode;
          }
          return true;
        })
      : sourceOptions;

  return {
    ...tool,
    slug: meta.slug,
    name: meta.name,
    description: meta.description,
    section: meta.section,
    aliases: meta.aliases,
    inputType: meta.inputType,
    outputType:
      (meta.outputType as ToolDefinition["outputType"]) ?? tool.outputType,
    options,
    inputPlaceholder: meta.inputPlaceholder ?? tool.inputPlaceholder,
    outputPlaceholder: meta.outputPlaceholder ?? tool.outputPlaceholder,
    allowSwap: meta.allowSwap ?? tool.allowSwap,
    layout: meta.layout ?? tool.layout,
    dualInputConfig: meta.dualInputConfig ?? tool.dualInputConfig,
    outputHeading: meta.outputHeading ?? tool.outputHeading,
    acceptsFile: false, // Raycast does not support File uploads
    fileAccept: undefined,
    runPolicy: meta.runPolicy ?? tool.runPolicy,
    debounceMs: meta.debounceMs ?? tool.debounceMs,
    transform: (input, options) =>
      baseTransform(input, { ...preset, ...options }),
  };
}

function getToolMetaBySlug(slug: string): ToolMeta | undefined {
  return TOOL_META.find((t) => t.slug === slug);
}

async function loadSectionTool(
  section: string,
  slug: string,
): Promise<ToolDefinition | undefined> {
  switch (section) {
    case "encoding": {
      const mod = await import("./sections/encoding");
      return mod.encodingTools.find((item) => item.slug === slug);
    }
    case "base64": {
      const mod = await import("./sections/base64");
      return mod.base64Tools.find((item) => item.slug === slug);
    }
    case "text": {
      const mod = await import("./sections/text");
      return mod.textTools.find((item) => item.slug === slug);
    }
    case "formats": {
      const mod = await import("./sections/formats");
      return mod.formatTools.find((item) => item.slug === slug);
    }
    case "diff": {
      const mod = await import("./sections/diff");
      return mod.diffTools.find((item) => item.slug === slug);
    }
    case "crypto": {
      const mod = await import("./sections/crypto");
      return mod.cryptoTools.find((item) => item.slug === slug);
    }
    case "ids": {
      const mod = await import("./sections/ids");
      return mod.idTools.find((item) => item.slug === slug);
    }
    case "datetime": {
      const mod = await import("./sections/datetime");
      return mod.datetimeTools.find((item) => item.slug === slug);
    }
    case "numbers": {
      const mod = await import("./sections/numbers");
      return mod.numberTools.find((item) => item.slug === slug);
    }
    case "http": {
      const mod = await import("./sections/http");
      return mod.httpTools.find((item) => item.slug === slug);
    }
    case "images": {
      return undefined;
    }
    case "colors": {
      const mod = await import("./sections/colors");
      return mod.colorTools.find((item) => item.slug === slug);
    }
    case "code": {
      const mod = await import("./sections/code");
      return mod.codeTools.find((item) => item.slug === slug);
    }
    case "regex": {
      const mod = await import("./sections/regex");
      return mod.regexTools.find((item) => item.slug === slug);
    }
    case "data": {
      const mod = await import("./sections/data");
      return mod.dataTools.find((item) => item.slug === slug);
    }
    case "markdown": {
      const mod = await import("./sections/markdown");
      return mod.markdownTools.find((item) => item.slug === slug);
    }
    default:
      return undefined;
  }
}

export async function loadToolRuntime(
  slug: string,
): Promise<ToolDefinition | undefined> {
  const meta = getToolMetaBySlug(slug);
  if (!meta) return undefined;
  const runtimeSlug = meta.canonicalSlug ?? meta.slug;
  const tool = await loadSectionTool(meta.section, runtimeSlug);
  if (!tool) return undefined;
  return mergeToolMeta(tool, meta);
}

export function getAllTools(): ToolMeta[] {
  return TOOL_META;
}

export function searchTools(query: string): ToolMeta[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return TOOL_META;
  return TOOL_META.filter(
    (tool) =>
      tool.name.toLowerCase().includes(normalized) ||
      tool.description?.toLowerCase().includes(normalized) ||
      tool.aliases.some((alias) => alias.toLowerCase().includes(normalized)),
  );
}
