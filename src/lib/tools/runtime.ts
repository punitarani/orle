import { getToolMetaBySlug } from "./manifest";
import type { ToolMeta } from "./manifest-types";
import type { ToolDefinition } from "./types";

function mergeToolMeta(tool: ToolDefinition, meta: ToolMeta): ToolDefinition {
  return {
    ...tool,
    slug: meta.slug,
    name: meta.name,
    description: meta.description,
    section: meta.section,
    aliases: meta.aliases,
    inputType: meta.inputType,
    outputType: meta.outputType as ToolDefinition["outputType"],
    options: meta.options ?? tool.options,
    inputPlaceholder: meta.inputPlaceholder ?? tool.inputPlaceholder,
    outputPlaceholder: meta.outputPlaceholder ?? tool.outputPlaceholder,
    allowSwap: meta.allowSwap ?? tool.allowSwap,
    acceptsFile: meta.acceptsFile ?? tool.acceptsFile,
    fileAccept: meta.fileAccept ?? tool.fileAccept,
    runPolicy: meta.runPolicy ?? tool.runPolicy,
    debounceMs: meta.debounceMs ?? tool.debounceMs,
  };
}

export async function loadToolRuntime(
  slug: string,
): Promise<ToolDefinition | undefined> {
  const meta = getToolMetaBySlug(slug);
  if (!meta) return undefined;
  const runtimeSlug = meta.canonicalSlug ?? slug;

  switch (meta.section) {
    case "encoding": {
      const mod = await import("./sections/encoding");
      const tool = mod.encodingTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "base64": {
      const mod = await import("./sections/base64");
      const tool = mod.base64Tools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "text": {
      const mod = await import("./sections/text");
      const tool = mod.textTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "formats": {
      const mod = await import("./sections/formats");
      const tool = mod.formatTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "diff": {
      const mod = await import("./sections/diff");
      const tool = mod.diffTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "crypto": {
      const mod = await import("./sections/crypto");
      const tool = mod.cryptoTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "ids": {
      const mod = await import("./sections/ids");
      const tool = mod.idTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "datetime": {
      const mod = await import("./sections/datetime");
      const tool = mod.datetimeTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "numbers": {
      const mod = await import("./sections/numbers");
      const tool = mod.numberTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "http": {
      const mod = await import("./sections/http");
      const tool = mod.httpTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "images": {
      const mod = await import("./sections/images");
      const tool = mod.imageTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "colors": {
      const mod = await import("./sections/colors");
      const tool = mod.colorTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "code": {
      const mod = await import("./sections/code");
      const tool = mod.codeTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "regex": {
      const mod = await import("./sections/regex");
      const tool = mod.regexTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "data": {
      const mod = await import("./sections/data");
      const tool = mod.dataTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    case "markdown": {
      const mod = await import("./sections/markdown");
      const tool = mod.markdownTools.find((item) => item.slug === runtimeSlug);
      return tool ? mergeToolMeta(tool, meta) : undefined;
    }
    default:
      return undefined;
  }
}
