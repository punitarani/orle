import { getToolMetaBySlug } from "./manifest";
import type { ToolDefinition } from "./types";

export async function loadToolRuntime(
  slug: string,
): Promise<ToolDefinition | undefined> {
  const meta = getToolMetaBySlug(slug);
  if (!meta) return undefined;

  switch (meta.section) {
    case "encoding": {
      const mod = await import("./sections/encoding");
      return mod.encodingTools.find((tool) => tool.slug === slug);
    }
    case "base64": {
      const mod = await import("./sections/base64");
      return mod.base64Tools.find((tool) => tool.slug === slug);
    }
    case "text": {
      const mod = await import("./sections/text");
      return mod.textTools.find((tool) => tool.slug === slug);
    }
    case "formats": {
      const mod = await import("./sections/formats");
      return mod.formatTools.find((tool) => tool.slug === slug);
    }
    case "diff": {
      const mod = await import("./sections/diff");
      return mod.diffTools.find((tool) => tool.slug === slug);
    }
    case "crypto": {
      const mod = await import("./sections/crypto");
      return mod.cryptoTools.find((tool) => tool.slug === slug);
    }
    case "ids": {
      const mod = await import("./sections/ids");
      return mod.idTools.find((tool) => tool.slug === slug);
    }
    case "datetime": {
      const mod = await import("./sections/datetime");
      return mod.datetimeTools.find((tool) => tool.slug === slug);
    }
    case "numbers": {
      const mod = await import("./sections/numbers");
      return mod.numberTools.find((tool) => tool.slug === slug);
    }
    case "http": {
      const mod = await import("./sections/http");
      return mod.httpTools.find((tool) => tool.slug === slug);
    }
    case "images": {
      const mod = await import("./sections/images");
      return mod.imageTools.find((tool) => tool.slug === slug);
    }
    case "colors": {
      const mod = await import("./sections/colors");
      return mod.colorTools.find((tool) => tool.slug === slug);
    }
    case "code": {
      const mod = await import("./sections/code");
      return mod.codeTools.find((tool) => tool.slug === slug);
    }
    default:
      return undefined;
  }
}
