import Fuse from "fuse.js";
import { TOOL_META } from "./manifest";
import type { ToolMeta } from "./manifest-types";

let fuse: Fuse<ToolMeta> | null = null;

function getFuse(): Fuse<ToolMeta> {
  if (!fuse) {
    fuse = new Fuse(TOOL_META, {
      keys: [
        { name: "name", weight: 2 },
        { name: "aliases", weight: 1.5 },
        { name: "description", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }
  return fuse;
}

export const searchTools = (query: string): ToolMeta[] => {
  const normalized = query.trim();
  if (!normalized) return TOOL_META;

  const results = getFuse()
    .search(normalized)
    .map((result) => result.item);
  if (results.length > 0) return results;

  const lowered = normalized.toLowerCase();
  return TOOL_META.filter((tool) => {
    const nameMatch = tool.name.toLowerCase().includes(lowered);
    const descMatch = tool.description?.toLowerCase().includes(lowered);
    const aliasMatch = tool.aliases?.some((alias) =>
      alias.toLowerCase().includes(lowered),
    );
    return nameMatch || descMatch || aliasMatch;
  });
};
