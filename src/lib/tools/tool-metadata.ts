/**
 * Shared tool metadata - JSON-serializable format for both web and Raycast
 * This file contains no functions, only data structures
 */

import { TOOL_META } from "./manifest";
import type { ToolMeta } from "./manifest-types";
export { TOOL_META };

import { SECTION_META } from "./section-meta";
export { SECTION_META };

// Tools that work in Node.js (no browser APIs required)
// File-based and canvas-based tools are NOT compatible
const INCOMPATIBLE_SLUGS = new Set(["media-suite"]);

export type ToolMetaWithRaycast = ToolMeta & { raycastCompatible: boolean };

export const TOOL_META_WITH_RAYCAST: ToolMetaWithRaycast[] = TOOL_META.map(
  (tool) => ({
    ...tool,
    raycastCompatible:
      !INCOMPATIBLE_SLUGS.has(tool.slug) &&
      tool.inputType !== "file" &&
      !tool.acceptsFile,
  }),
);

// Get only Raycast-compatible tools
export const RAYCAST_TOOLS = TOOL_META_WITH_RAYCAST.filter(
  (t) => t.raycastCompatible,
);

// Get tools by section
export const getToolMetaBySection = (sectionId: string): ToolMeta[] =>
  TOOL_META.filter((t) => t.section === sectionId);

// Get section by ID
export const getSectionMeta = (id: string) =>
  SECTION_META.find((s) => s.id === id);
